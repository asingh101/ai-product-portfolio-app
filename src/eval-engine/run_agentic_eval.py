#!/usr/bin/env python3
"""
Agent-Gate: Agentic Eval Harness
Runs 10 tasks with a Haiku → Sonnet cascade agent loop.
Outputs: eval-engine/results.json

Usage:
    cd portfolio-app
    python src/eval-engine/run_agentic_eval.py

Requirements:
    pip install anthropic python-dotenv pytest
    ANTHROPIC_API_KEY in .env at project root
"""

import os
import sys
import json
import time
import shutil
import tempfile
import subprocess
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
import anthropic

load_dotenv()

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).parent
TASKS_DIR    = SCRIPT_DIR / "tasks"
RESULTS_FILE = SCRIPT_DIR / "results.json"

# ── Models ────────────────────────────────────────────────────────────────────

HAIKU_MODEL  = "claude-haiku-4-5-20251001"
SONNET_MODEL = "claude-sonnet-4-6"

HAIKU_MAX_TURNS  = 4   # Haiku gets 4 turns before escalation check
SONNET_MAX_TURNS = 6   # Sonnet gets 6 turns if escalated

# ── Token pricing (per million tokens) ───────────────────────────────────────

HAIKU_INPUT_PRICE   = 0.80
HAIKU_OUTPUT_PRICE  = 4.00
SONNET_INPUT_PRICE  = 3.00
SONNET_OUTPUT_PRICE = 15.00

# ── Output truncation ─────────────────────────────────────────────────────────

MAX_TOOL_OUTPUT_LINES = 50   # Keep last 50 lines in conversation history

# ── Task metadata ─────────────────────────────────────────────────────────────

TASK_META = {
    "task_01_single_bug_obvious":  {"category": "single_bug_obvious",  "difficulty": "easy"},
    "task_02_single_bug_obvious":  {"category": "single_bug_obvious",  "difficulty": "easy"},
    "task_03_single_bug_hidden":   {"category": "single_bug_hidden",   "difficulty": "medium"},
    "task_04_single_bug_hidden":   {"category": "single_bug_hidden",   "difficulty": "medium"},
    "task_05_two_bugs_sequential": {"category": "two_bugs_sequential", "difficulty": "medium"},
    "task_06_two_bugs_sequential": {"category": "two_bugs_sequential", "difficulty": "medium"},
    "task_07_test_understanding":  {"category": "test_understanding",  "difficulty": "hard"},
    "task_08_test_understanding":  {"category": "test_understanding",  "difficulty": "hard"},
    "task_09_red_herring":         {"category": "red_herring",         "difficulty": "hard"},
    "task_10_red_herring":         {"category": "red_herring",         "difficulty": "hard"},
}

# ── System prompts ────────────────────────────────────────────────────────────

HAIKU_SYSTEM = (
    "You are an expert Python developer. You have been given a broken Python codebase. "
    "The tests are failing. Your job is to fix the code so all tests pass. "
    "Use read_file to explore the code, write_file to apply fixes, and run_tests to verify. "
    "Only modify files inside the starter/ directory — never touch the tests/ directory. "
    "Do not ask clarifying questions. Explore, diagnose, and fix."
)

SONNET_SYSTEM = (
    "You are an expert Python developer. A previous model attempted to fix this codebase and got stuck. "
    "You will receive a summary of what was tried and failed. "
    "Do not repeat the same approaches. Think carefully before acting — read the code first, "
    "trace the logic, then fix. Only modify files inside the starter/ directory."
)

# ── Tool definitions ──────────────────────────────────────────────────────────

TOOLS = [
    {
        "name": "read_file",
        "description": "Read the contents of a file in the task workspace.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Relative path to the file (e.g. 'starter/module.py' or 'tests/test_task.py')."
                }
            },
            "required": ["path"]
        }
    },
    {
        "name": "write_file",
        "description": "Overwrite a file in the starter/ directory with new content. Only starter/ files may be modified.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Relative path to the file to write (must be inside starter/)."
                },
                "content": {
                    "type": "string",
                    "description": "The complete new file content."
                }
            },
            "required": ["path", "content"]
        }
    },
    {
        "name": "run_tests",
        "description": "Run the pytest test suite for this task. Returns stdout, stderr, and exit code. Exit code 0 means all tests passed.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "give_up",
        "description": "Signal that you cannot solve this task after exhausting all reasonable approaches.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Brief explanation of why you are giving up."
                }
            },
            "required": ["reason"]
        }
    }
]


# ── Tool executor ─────────────────────────────────────────────────────────────

def execute_tool(tool_name: str, tool_input: dict, workspace: Path) -> tuple[str, bool]:
    """Execute a tool call. Returns (result_str, succeeded)."""

    if tool_name == "read_file":
        rel_path = tool_input.get("path", "")
        full_path = workspace / rel_path
        try:
            content = full_path.read_text()
            return f"=== {rel_path} ===\n{content}", True
        except FileNotFoundError:
            return f"Error: file not found: {rel_path}", False
        except Exception as e:
            return f"Error reading {rel_path}: {e}", False

    elif tool_name == "write_file":
        rel_path = tool_input.get("path", "")
        content  = tool_input.get("content", "")
        # Safety: only allow writes inside starter/
        if not rel_path.startswith("starter/"):
            return f"Error: write_file may only write inside starter/. Got: {rel_path}", False
        full_path = workspace / rel_path
        try:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content)
            return f"Wrote {len(content)} characters to {rel_path}.", True
        except Exception as e:
            return f"Error writing {rel_path}: {e}", False

    elif tool_name == "run_tests":
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pytest", "tests/", "--tb=short", "-q"],
                cwd=workspace,
                capture_output=True,
                text=True,
                timeout=30
            )
            raw_output = (result.stdout + result.stderr).strip()
            exit_code  = result.returncode
            # Truncate to last MAX_TOOL_OUTPUT_LINES lines for history
            lines = raw_output.split("\n")
            if len(lines) > MAX_TOOL_OUTPUT_LINES:
                lines = [f"[... {len(lines) - MAX_TOOL_OUTPUT_LINES} lines omitted ...]"] + lines[-MAX_TOOL_OUTPUT_LINES:]
            truncated = "\n".join(lines)
            return f"Exit code: {exit_code}\n\n{truncated}", exit_code == 0
        except subprocess.TimeoutExpired:
            return "Error: tests timed out after 30 seconds.", False
        except Exception as e:
            return f"Error running tests: {e}", False

    elif tool_name == "give_up":
        reason = tool_input.get("reason", "no reason given")
        return f"Agent gave up: {reason}", False

    return f"Unknown tool: {tool_name}", False


# ── Cost helpers ──────────────────────────────────────────────────────────────

def calc_cost(model: str, input_tok: int, output_tok: int) -> float:
    if model == HAIKU_MODEL:
        return (input_tok * HAIKU_INPUT_PRICE + output_tok * HAIKU_OUTPUT_PRICE) / 1_000_000
    return (input_tok * SONNET_INPUT_PRICE + output_tok * SONNET_OUTPUT_PRICE) / 1_000_000


# ── Cascade handoff builder ───────────────────────────────────────────────────

def build_handoff_messages(task_md: str, trace: list, trigger_reason: str) -> list:
    """Build compact Sonnet messages. Fresh start — no raw Haiku history."""
    files_read    = list(dict.fromkeys(
        s["tool_args"].get("path", "") for s in trace if s["tool_called"] == "read_file"
    ))
    files_written = list(dict.fromkeys(
        s["tool_args"].get("path", "") for s in trace if s["tool_called"] == "write_file"
    ))
    last_test = next(
        (s["tool_result_full"] for s in reversed(trace) if s["tool_called"] == "run_tests"),
        "Tests were not run."
    )

    summary = (
        f"The previous model (Haiku) attempted this task and got stuck ({trigger_reason}).\n\n"
        f"Files it read:    {files_read or 'none'}\n"
        f"Files it wrote:   {files_written or 'none'}\n\n"
        f"Last test output:\n{last_test}\n\n"
        f"Do NOT repeat the same approach. Read the code carefully and try something different.\n\n"
        f"--- Original task ---\n{task_md}"
    )
    return [{"role": "user", "content": summary}]


# ── Main agent loop ───────────────────────────────────────────────────────────

def run_task(task_dir: Path, client: anthropic.Anthropic) -> dict:
    """Run a single task through the cascade agent loop. Returns result dict."""

    task_id  = task_dir.name
    task_md  = (task_dir / "task.md").read_text()
    meta     = TASK_META.get(task_id, {"category": "unknown", "difficulty": "medium"})

    print(f"\n{'─'*60}")
    print(f"  {task_id}")
    print(f"  category={meta['category']}  difficulty={meta['difficulty']}")
    print(f"{'─'*60}")

    with tempfile.TemporaryDirectory() as tmpdir:
        workspace = Path(tmpdir)

        # Copy task files into isolated workspace
        shutil.copytree(task_dir / "starter", workspace / "starter")
        shutil.copytree(task_dir / "tests",   workspace / "tests")

        result = _agent_loop(task_id, task_md, workspace, client)

    result.update({"task_id": task_id, **meta})
    status = "SOLVED" if result["solved"] else f"FAILED ({result['failure_type']})"
    print(f"  → {status} | turns={result['haiku_turns']}H+{result['sonnet_turns']}S"
          f" | cascade={'yes' if result['cascade_triggered'] else 'no'}"
          f" | cost=${result['cost_actual_usd']:.4f}")
    return result


def _agent_loop(task_id: str, task_md: str, workspace: Path, client: anthropic.Anthropic) -> dict:
    """Inner loop. Returns metrics + trace."""

    trace: list[dict] = []

    # ── State ─────────────────────────────────────────────────────────────────
    current_model  = HAIKU_MODEL
    current_system = HAIKU_SYSTEM
    turns_left     = HAIKU_MAX_TURNS

    solved              = False
    failure_type        = None
    cascade_triggered   = False
    cascade_trigger_rsn = None
    cascade_rescued     = False
    haiku_turns         = 0
    sonnet_turns        = 0
    self_corrections    = 0
    first_attempt_passed = None   # result of very first run_tests after a write_file

    # For cascade trigger detection
    last_test_output            = None
    consecutive_same_failures   = 0
    last_tool_sig               = None    # (name, args_json) for loop detection
    wrote_since_last_run        = False   # track write → run_tests self-correction

    # Token accumulators
    haiku_in = haiku_out = sonnet_in = sonnet_out = 0

    # File content history optimization:
    # After a file is read into history, replace older copies with placeholder.
    # Maps rel_path → index in `messages` where the tool_result lives.
    file_history_idx: dict[str, int] = {}

    # Initial message
    user_prompt = (
        "The tests in this codebase are failing. "
        "Fix the code so all tests pass.\n\n" + task_md
    )
    messages = [{"role": "user", "content": user_prompt}]

    # ── Loop ──────────────────────────────────────────────────────────────────
    while turns_left > 0:
        is_haiku    = (current_model == HAIKU_MODEL)
        step_number = len(trace) + 1
        turn_start  = time.time()

        # Choose max_tokens per turn type (detected after response, but API needs it upfront)
        # Use 1024 — enough for tool selection; write_file content is in tool INPUT not output
        try:
            response = client.messages.create(
                model=current_model,
                max_tokens=1024,
                temperature=0.0,
                system=current_system,
                tools=TOOLS,
                messages=messages,
            )
        except Exception as e:
            print(f"    API error on step {step_number}: {e}")
            failure_type = "api_error"
            break

        latency_ms  = int((time.time() - turn_start) * 1000)
        in_tok      = response.usage.input_tokens
        out_tok     = response.usage.output_tokens
        turn_cost   = calc_cost(current_model, in_tok, out_tok)

        if is_haiku:
            haiku_in  += in_tok;  haiku_out  += out_tok;  haiku_turns  += 1
        else:
            sonnet_in += in_tok;  sonnet_out += out_tok;  sonnet_turns += 1

        # ── Extract tool call ─────────────────────────────────────────────────
        tool_block = next(
            (b for b in response.content if b.type == "tool_use"), None
        )

        if tool_block is None:
            # Model returned text with no tool call — treat as implicit give_up
            step = _make_step(
                step_number, is_haiku, "none", {}, "Model returned no tool call.",
                in_tok, out_tok, turn_cost, latency_ms, "not_run"
            )
            trace.append(step)
            failure_type = "gave_up"
            break

        tool_name    = tool_block.name
        tool_input   = tool_block.input
        tool_use_id  = tool_block.id
        tool_sig     = (tool_name, json.dumps(tool_input, sort_keys=True))

        # Loop detection (same tool + same args twice in a row)
        is_loop = (tool_sig == last_tool_sig)
        last_tool_sig = tool_sig

        # ── Execute tool ──────────────────────────────────────────────────────
        tool_result_full, tool_ok = execute_tool(tool_name, tool_input, workspace)

        # ── Determine test_status ─────────────────────────────────────────────
        test_status = "not_run"
        if tool_name == "run_tests":
            test_status = "pass" if tool_ok else "fail"
            # Self-correction: wrote something, then ran tests and failed, now wrote again
            if wrote_since_last_run:
                if not tool_ok:
                    self_corrections += 1
                elif first_attempt_passed is None:
                    first_attempt_passed = True
                wrote_since_last_run = False

            if first_attempt_passed is None and tool_ok:
                first_attempt_passed = True

            # Consecutive-same-failure tracking (for cascade trigger)
            if not tool_ok:
                if tool_result_full == last_test_output:
                    consecutive_same_failures += 1
                else:
                    consecutive_same_failures = 1
                last_test_output = tool_result_full
            else:
                consecutive_same_failures = 0

        if tool_name == "write_file" and tool_ok:
            wrote_since_last_run = True

        # ── Record step ───────────────────────────────────────────────────────
        step = _make_step(
            step_number, is_haiku, tool_name, tool_input, tool_result_full,
            in_tok, out_tok, turn_cost, latency_ms, test_status
        )
        trace.append(step)

        print(f"    step {step_number:02d} [{('H' if is_haiku else 'S')}] "
              f"{tool_name:<12} | {('✓' if tool_ok else '✗')} | {latency_ms}ms | ${turn_cost:.5f}")

        # ── Check termination ─────────────────────────────────────────────────
        if tool_name == "run_tests" and tool_ok:
            solved = True
            break

        if tool_name == "give_up":
            failure_type = "gave_up"
            break

        # ── Update conversation history ───────────────────────────────────────
        # Build assistant message with only the ONE tool_use we're handling.
        # The model may return multiple tool_use blocks in one response;
        # including all of them without matching tool_results causes a 400 error.
        assistant_content = []
        for block in response.content:
            if block.type == "text":
                assistant_content.append({"type": "text", "text": block.text})
            elif block.type == "tool_use" and block.id == tool_use_id:
                assistant_content.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })
        messages.append({"role": "assistant", "content": assistant_content})

        # History optimization: strip older read_file contents with placeholder
        result_for_history = tool_result_full
        if tool_name == "read_file":
            rel = tool_input.get("path", "")
            if rel in file_history_idx:
                # Replace the previous tool_result content with placeholder
                old_idx = file_history_idx[rel]
                _replace_tool_result(messages, old_idx, f"[{rel} already read — content omitted]")
            file_history_idx[rel] = len(messages)  # upcoming tool_result index

        messages.append({
            "role": "user",
            "content": [{"type": "tool_result", "tool_use_id": tool_use_id, "content": result_for_history}]
        })

        turns_left -= 1

        # ── Cascade check (Haiku phase only) ──────────────────────────────────
        if not is_haiku or solved:
            continue

        should_escalate = False
        if tool_name == "give_up":
            should_escalate = True;  cascade_trigger_rsn = "gave_up"
        elif is_loop:
            should_escalate = True;  cascade_trigger_rsn = "loop_detected"
        elif consecutive_same_failures >= 3:
            should_escalate = True;  cascade_trigger_rsn = "repeated_failures"
        elif turns_left == 0:
            should_escalate = True;  cascade_trigger_rsn = "haiku_turn_limit"

        if should_escalate:
            cascade_triggered = True
            # Mark the last step as the cascade handoff point
            trace[-1]["is_cascade_handoff"] = True

            print(f"    ↑ CASCADE → Sonnet  (reason: {cascade_trigger_rsn})")

            # Switch to Sonnet with compact handoff (not raw history)
            current_model  = SONNET_MODEL
            current_system = SONNET_SYSTEM
            turns_left     = SONNET_MAX_TURNS
            messages       = build_handoff_messages(task_md, trace, cascade_trigger_rsn)

            # Reset loop/failure detection for Sonnet phase
            last_tool_sig            = None
            consecutive_same_failures = 0
            last_test_output          = None

    # ── Post-loop ─────────────────────────────────────────────────────────────
    if not solved and failure_type is None:
        failure_type = "hit_turn_limit"

    if cascade_triggered and solved and sonnet_turns > 0:
        cascade_rescued = True

    if first_attempt_passed is None:
        first_attempt_passed = False

    # ── Costs ─────────────────────────────────────────────────────────────────
    haiku_cost  = calc_cost(HAIKU_MODEL,  haiku_in,  haiku_out)
    sonnet_cost = calc_cost(SONNET_MODEL, sonnet_in, sonnet_out)
    actual_cost = haiku_cost + sonnet_cost

    total_in    = haiku_in  + sonnet_in
    total_out   = haiku_out + sonnet_out
    haiku_only_cost  = calc_cost(HAIKU_MODEL,  total_in, total_out)
    sonnet_only_cost = calc_cost(SONNET_MODEL, total_in, total_out)

    # ── Latency ───────────────────────────────────────────────────────────────
    all_latencies    = [s["latency_ms"] for s in trace]
    haiku_latencies  = [s["latency_ms"] for s in trace if s["model"] == "haiku"]
    sonnet_latencies = [s["latency_ms"] for s in trace if s["model"] == "sonnet"]

    avg_latency   = int(sum(all_latencies)    / len(all_latencies))    if all_latencies    else 0
    h_avg_latency = int(sum(haiku_latencies)  / len(haiku_latencies))  if haiku_latencies  else 0
    s_avg_latency = int(sum(sonnet_latencies) / len(sonnet_latencies)) if sonnet_latencies else 0

    return {
        "solved":                      solved,
        "failure_type":                failure_type,
        "turns_to_solve":              (haiku_turns + sonnet_turns) if solved else None,
        "haiku_turns":                 haiku_turns,
        "sonnet_turns":                sonnet_turns,
        "cascade_triggered":           cascade_triggered,
        "cascade_trigger_reason":      cascade_trigger_rsn,
        "cascade_rescued":             cascade_rescued,
        "self_corrections":            self_corrections,
        "first_attempt_passed":        first_attempt_passed,
        "cost_haiku_usd":              round(haiku_cost,       6),
        "cost_sonnet_usd":             round(sonnet_cost,      6),
        "cost_actual_usd":             round(actual_cost,      6),
        "cost_haiku_only_estimate_usd":  round(haiku_only_cost,  6),
        "cost_sonnet_only_estimate_usd": round(sonnet_only_cost, 6),
        "latency_ms_avg":              avg_latency,
        "latency_haiku_avg_ms":        h_avg_latency,
        "latency_sonnet_avg_ms":       s_avg_latency,
        "trace":                       trace,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_step(
    step_number, is_haiku, tool_name, tool_input, tool_result_full,
    in_tok, out_tok, cost_usd, latency_ms, test_status
) -> dict:
    return {
        "step_number":       step_number,
        "model":             "haiku" if is_haiku else "sonnet",
        "tool_called":       tool_name,
        "tool_args":         tool_input,
        "tool_result":       tool_result_full[:3000] if len(tool_result_full) > 3000 else tool_result_full,
        "tool_result_full":  tool_result_full,
        "tokens_in":         in_tok,
        "tokens_out":        out_tok,
        "cost_usd":          round(cost_usd, 6),
        "latency_ms":        latency_ms,
        "is_cascade_handoff": False,
        "test_status":       test_status,
    }


def _replace_tool_result(messages: list, target_idx: int, placeholder: str):
    """Replace the content of a tool_result message at target_idx with a placeholder."""
    if target_idx >= len(messages):
        return
    msg = messages[target_idx]
    if isinstance(msg.get("content"), list):
        for item in msg["content"]:
            if isinstance(item, dict) and item.get("type") == "tool_result":
                item["content"] = placeholder


# ── Aggregates ────────────────────────────────────────────────────────────────

def compute_aggregates(task_results: list) -> dict:
    n = len(task_results)
    if n == 0:
        return {}

    solved_tasks   = [r for r in task_results if r["solved"]]
    cascade_tasks  = [r for r in task_results if r["cascade_triggered"]]
    rescued_tasks  = [r for r in task_results if r["cascade_rescued"]]

    total_actual      = sum(r["cost_actual_usd"]              for r in task_results)
    total_haiku_only  = sum(r["cost_haiku_only_estimate_usd"] for r in task_results)
    total_sonnet_only = sum(r["cost_sonnet_only_estimate_usd"] for r in task_results)

    savings_vs_sonnet = (
        (total_sonnet_only - total_actual) / total_sonnet_only * 100
        if total_sonnet_only > 0 else 0
    )

    avg_turns = (
        sum(r["turns_to_solve"] for r in solved_tasks) / len(solved_tasks)
        if solved_tasks else None
    )

    all_latencies = [s["latency_ms"] for r in task_results for s in r["trace"]]
    avg_turn_latency = int(sum(all_latencies) / len(all_latencies)) if all_latencies else 0

    avg_self_corrections = sum(r["self_corrections"] for r in task_results) / n

    return {
        "overall_pass_rate":          len(solved_tasks) / n,
        "tasks_solved":               len(solved_tasks),
        "tasks_total":                n,
        "cascade_rate":               len(cascade_tasks) / n,
        "cascade_rescue_rate":        (len(rescued_tasks) / len(cascade_tasks)) if cascade_tasks else 0,
        "avg_turns_to_solve":         round(avg_turns, 2) if avg_turns else None,
        "total_cost_actual_usd":      round(total_actual,      4),
        "total_cost_haiku_only_usd":  round(total_haiku_only,  4),
        "total_cost_sonnet_only_usd": round(total_sonnet_only, 4),
        "cost_savings_vs_sonnet_pct": round(savings_vs_sonnet, 1),
        "self_correction_rate":       round(avg_self_corrections, 2),
        "avg_latency_per_turn_ms":    avg_turn_latency,
    }


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise SystemExit("ANTHROPIC_API_KEY not set. Add it to .env at project root.")

    client = anthropic.Anthropic(api_key=api_key)

    task_dirs = sorted(TASKS_DIR.iterdir())
    task_dirs = [d for d in task_dirs if d.is_dir() and d.name.startswith("task_")]

    if not task_dirs:
        raise SystemExit(f"No task directories found in {TASKS_DIR}")

    print(f"\nAgent-Gate Eval — {len(task_dirs)} tasks")
    print(f"Models: {HAIKU_MODEL} (up to {HAIKU_MAX_TURNS} turns) → {SONNET_MODEL} (up to {SONNET_MAX_TURNS} turns)")
    print(f"Results will be saved to: {RESULTS_FILE}\n")

    task_results = []
    run_start = time.time()

    for task_dir in task_dirs:
        result = run_task(task_dir, client)
        task_results.append(result)

    total_elapsed = int(time.time() - run_start)
    aggregates    = compute_aggregates(task_results)

    output = {
        "run_at":        datetime.now(timezone.utc).isoformat(),
        "run_at_label":  datetime.now().strftime("%B %-d, %Y"),
        "elapsed_sec":   total_elapsed,
        "models": {
            "haiku":  HAIKU_MODEL,
            "sonnet": SONNET_MODEL,
        },
        "config": {
            "haiku_max_turns":  HAIKU_MAX_TURNS,
            "sonnet_max_turns": SONNET_MAX_TURNS,
            "temperature":      0.0,
            "tool_output_max_lines": MAX_TOOL_OUTPUT_LINES,
        },
        "aggregates":   aggregates,
        "task_results": task_results,
    }

    RESULTS_FILE.write_text(json.dumps(output, indent=2))

    print(f"\n{'═'*60}")
    print(f"  Done in {total_elapsed}s")
    print(f"  Solved:    {aggregates['tasks_solved']}/{aggregates['tasks_total']}")
    print(f"  Cascade:   {aggregates['cascade_rate']*100:.0f}% of tasks escalated")
    print(f"  Cost:      ${aggregates['total_cost_actual_usd']:.4f} actual"
          f" vs ${aggregates['total_cost_sonnet_only_usd']:.4f} Sonnet-only"
          f" ({aggregates['cost_savings_vs_sonnet_pct']:.1f}% saved)")
    print(f"  Results:   {RESULTS_FILE}")
    print(f"{'═'*60}\n")


if __name__ == "__main__":
    main()
