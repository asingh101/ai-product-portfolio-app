import type { CodingEvalSnapshot } from "./types";

/**
 * Pre-computed eval results for public portfolio display.
 *
 * TO UPDATE: Run `python src/scripts/run_coding_eval.py` locally,
 * then regenerate this file from results.json.
 */
export const IS_PLACEHOLDER = false;

export const CODING_EVAL_SNAPSHOT = {
  "runAt": "2026-07-03T11:16:42.570973",
  "runAtLabel": "July 3, 2026",
  "totalTasks": 25,
  "models": [
    "claude-haiku-4-5",
    "claude-sonnet-4-6"
  ],
  "overallScores": {
    "claude-haiku-4-5": {
      "passed": 19,
      "total": 25,
      "pct": 76
    },
    "claude-sonnet-4-6": {
      "passed": 18,
      "total": 25,
      "pct": 72
    }
  },
  "categoryScores": [
    {
      "category": "bug-fix",
      "scores": {
        "claude-haiku-4-5": {
          "passed": 4,
          "total": 5
        },
        "claude-sonnet-4-6": {
          "passed": 3,
          "total": 5
        }
      },
      "label": "Bug Fixing"
    },
    {
      "category": "feature-add",
      "scores": {
        "claude-haiku-4-5": {
          "passed": 5,
          "total": 5
        },
        "claude-sonnet-4-6": {
          "passed": 5,
          "total": 5
        }
      },
      "label": "Feature Addition"
    },
    {
      "category": "refactor",
      "scores": {
        "claude-haiku-4-5": {
          "passed": 5,
          "total": 5
        },
        "claude-sonnet-4-6": {
          "passed": 5,
          "total": 5
        }
      },
      "label": "Refactor"
    },
    {
      "category": "ambiguous",
      "scores": {
        "claude-haiku-4-5": {
          "passed": 0,
          "total": 5
        },
        "claude-sonnet-4-6": {
          "passed": 0,
          "total": 5
        }
      },
      "label": "Ambiguous Instructions"
    },
    {
      "category": "multi-step",
      "scores": {
        "claude-haiku-4-5": {
          "passed": 5,
          "total": 5
        },
        "claude-sonnet-4-6": {
          "passed": 5,
          "total": 5
        }
      },
      "label": "Multi-step Debug"
    }
  ],
  "results": [
    {
      "taskId": "bug-01",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1237
    },
    {
      "taskId": "bug-01",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 3098
    },
    {
      "taskId": "bug-02",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1063
    },
    {
      "taskId": "bug-02",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1712
    },
    {
      "taskId": "bug-03",
      "model": "claude-haiku-4-5",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 3290
    },
    {
      "taskId": "bug-03",
      "model": "claude-sonnet-4-6",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 6485
    },
    {
      "taskId": "bug-04",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 998
    },
    {
      "taskId": "bug-04",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1910
    },
    {
      "taskId": "bug-05",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1553
    },
    {
      "taskId": "bug-05",
      "model": "claude-sonnet-4-6",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 9330
    },
    {
      "taskId": "feat-01",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1256
    },
    {
      "taskId": "feat-01",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 2681
    },
    {
      "taskId": "feat-02",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 987
    },
    {
      "taskId": "feat-02",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1412
    },
    {
      "taskId": "feat-03",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1190
    },
    {
      "taskId": "feat-03",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 2084
    },
    {
      "taskId": "feat-04",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1200
    },
    {
      "taskId": "feat-04",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 2445
    },
    {
      "taskId": "feat-05",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1362
    },
    {
      "taskId": "feat-05",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1907
    },
    {
      "taskId": "refactor-01",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1157
    },
    {
      "taskId": "refactor-01",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 2553
    },
    {
      "taskId": "refactor-02",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1169
    },
    {
      "taskId": "refactor-02",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 2214
    },
    {
      "taskId": "refactor-03",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1009
    },
    {
      "taskId": "refactor-03",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1628
    },
    {
      "taskId": "refactor-04",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 2034
    },
    {
      "taskId": "refactor-04",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 4217
    },
    {
      "taskId": "refactor-05",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1052
    },
    {
      "taskId": "refactor-05",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1735
    },
    {
      "taskId": "ambig-01",
      "model": "claude-haiku-4-5",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 1268
    },
    {
      "taskId": "ambig-01",
      "model": "claude-sonnet-4-6",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 2570
    },
    {
      "taskId": "ambig-02",
      "model": "claude-haiku-4-5",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 729
    },
    {
      "taskId": "ambig-02",
      "model": "claude-sonnet-4-6",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 1932
    },
    {
      "taskId": "ambig-03",
      "model": "claude-haiku-4-5",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 1383
    },
    {
      "taskId": "ambig-03",
      "model": "claude-sonnet-4-6",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 3228
    },
    {
      "taskId": "ambig-04",
      "model": "claude-haiku-4-5",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 590
    },
    {
      "taskId": "ambig-04",
      "model": "claude-sonnet-4-6",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 1525
    },
    {
      "taskId": "ambig-05",
      "model": "claude-haiku-4-5",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 1587
    },
    {
      "taskId": "ambig-05",
      "model": "claude-sonnet-4-6",
      "passed": false,
      "runs": [
        false,
        false,
        false
      ],
      "failureType": "non-running",
      "latencyMs": 4837
    },
    {
      "taskId": "multi-01",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 817
    },
    {
      "taskId": "multi-01",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1162
    },
    {
      "taskId": "multi-02",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1178
    },
    {
      "taskId": "multi-02",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1652
    },
    {
      "taskId": "multi-03",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 907
    },
    {
      "taskId": "multi-03",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1574
    },
    {
      "taskId": "multi-04",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1631
    },
    {
      "taskId": "multi-04",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1769
    },
    {
      "taskId": "multi-05",
      "model": "claude-haiku-4-5",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1011
    },
    {
      "taskId": "multi-05",
      "model": "claude-sonnet-4-6",
      "passed": true,
      "runs": [
        true,
        true,
        true
      ],
      "latencyMs": 1552
    }
  ],
  "headlineFinding": "Haiku 4.5 outscored Sonnet 4.6 on these tasks, 76% to 72%. Both models aced feature addition and refactoring. The sharpest finding was ambiguity handling: neither model asked a single clarifying question across all 5 ambiguous tasks. Both picked an interpretation and ran with it, every time.",
  "methodology": [
    "25 tasks across 5 categories, adapted from real developer patterns rather than contest puzzles.",
    "Each task was run 3 times at temperature 0.2. A task is marked passed only if 2 out of 3 runs succeed.",
    "Ambiguous tasks are graded on whether the model acknowledged the ambiguity, not on code output.",
    "Two models compared: Claude Haiku 4.5 (fast and cheap tier) vs Claude Sonnet 4.6 (advanced tier).",
    "Code is graded by running it against hidden test assertions using Python exec() in an isolated namespace."
  ]
} as CodingEvalSnapshot;

export const MODEL_LABELS: Record<string, string> = {
  "claude-haiku-4-5":  "Claude Haiku 4.5",
  "claude-sonnet-4-6": "Claude Sonnet 4.6",
};

export const MODEL_SHORT: Record<string, string> = {
  "claude-haiku-4-5":  "Haiku",
  "claude-sonnet-4-6": "Sonnet 4.6",
};
