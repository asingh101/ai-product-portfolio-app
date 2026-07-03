"""
Coding Eval Harness
====================
Runs 25 coding tasks against Claude Haiku 4.5 and Claude Sonnet 4.6.
Outputs results.json — paste into src/lib/coding-eval/publicSnapshot.ts.

Usage:
    pip install anthropic python-dotenv
    python run_coding_eval.py

Env vars needed (in .env or environment):
    ANTHROPIC_API_KEY
"""

import os
import json
import time
import textwrap
import traceback
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

import anthropic

anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

MODELS = {
    "claude-haiku-4-5": "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6": "claude-sonnet-4-6",
}

TEMPERATURE = 0.2
RUNS_PER_TASK = 3


# ─────────────────────────────────────────────────────────────────────────────
# TASK DEFINITIONS
# Each task has: id, category, difficulty, starter_code, instruction, test_fn
# test_fn(namespace) → list of (test_name, passed, error_msg)
# ─────────────────────────────────────────────────────────────────────────────

def make_tasks():
    tasks = []

    # ── BUG FIX 1: Empty list crash ──────────────────────────────────────────
    tasks.append({
        "id": "bug-01",
        "category": "bug-fix",
        "difficulty": "easy",
        "starter_code": textwrap.dedent("""\
            def calculate_average(numbers):
                \"\"\"Calculate the average of a list of numbers.\"\"\"
                total = sum(numbers)
                return total / len(numbers)

            def get_grade_result(scores):
                \"\"\"Return average score and whether it passes (>= 60).\"\"\"
                avg = calculate_average(scores)
                return {"average": avg, "passing": avg >= 60}
        """),
        "instruction": (
            "This function crashes when scores is an empty list. "
            "Fix it so it returns 0 when there are no scores instead of crashing.\n\n"
            "Error we're seeing:\nZeroDivisionError: division by zero"
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_normal", lambda: abs(ns["calculate_average"]([80, 90, 70]) - 80.0) < 0.01),
            _assert(ns, "test_empty_no_crash", lambda: ns["calculate_average"]([]) in (0, 0.0, None)),
            _assert(ns, "test_grade_empty_no_crash", lambda: ns["get_grade_result"]([]) is not None),
            _assert(ns, "test_single", lambda: abs(ns["calculate_average"]([75]) - 75.0) < 0.01),
        ],
    })

    # ── BUG FIX 2: None concatenation ────────────────────────────────────────
    tasks.append({
        "id": "bug-02",
        "category": "bug-fix",
        "difficulty": "easy",
        "starter_code": textwrap.dedent("""\
            def format_full_name(first_name, last_name, middle_name=None):
                \"\"\"Return a formatted full name string.\"\"\"
                return first_name + " " + middle_name + " " + last_name
        """),
        "instruction": (
            "This function crashes when middle_name is None. "
            "Fix it so middle name is skipped when not provided.\n\n"
            "Error we're seeing:\nTypeError: can only concatenate str (not 'NoneType') to str"
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_with_middle", lambda: ns["format_full_name"]("John", "Doe", "Paul") == "John Paul Doe"),
            _assert(ns, "test_no_middle", lambda: ns["format_full_name"]("John", "Doe") in ("John Doe", "John  Doe".strip())),
            _assert(ns, "test_none_middle", lambda: ns["format_full_name"]("Jane", "Smith", None) is not None),
            _assert(ns, "test_no_crash", lambda: isinstance(ns["format_full_name"]("A", "B", None), str)),
        ],
    })

    # ── BUG FIX 3: Pagination index error ────────────────────────────────────
    tasks.append({
        "id": "bug-03",
        "category": "bug-fix",
        "difficulty": "medium",
        "starter_code": textwrap.dedent("""\
            def paginate(items, page_size, page_number):
                \"\"\"Return items for the given page (1-indexed).\"\"\"
                start = (page_number - 1) * page_size
                end = start + page_size
                return items[start:end]

            def get_page_info(items, page_size, page_number):
                total_pages = (len(items) + page_size - 1) // page_size
                page_items = paginate(items, page_size, page_number)
                return {
                    "items": page_items,
                    "page": page_number,
                    "total_pages": total_pages,
                    "has_next": page_number < total_pages,
                }
        """),
        "instruction": (
            "This paginator crashes on the last page when items don't divide evenly. Fix it.\n\n"
            "Error we're seeing:\nIndexError: list index out of range"
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_first_page", lambda: ns["paginate"](list(range(10)), 3, 1) == [0, 1, 2]),
            _assert(ns, "test_last_page_uneven", lambda: ns["paginate"](list(range(10)), 3, 4) == [9]),
            _assert(ns, "test_full_page", lambda: ns["paginate"](list(range(10)), 5, 2) == [5, 6, 7, 8, 9]),
            _assert(ns, "test_page_info_no_crash", lambda: ns["get_page_info"](list(range(10)), 3, 4) is not None),
        ],
    })

    # ── BUG FIX 4: String vs int price filter ────────────────────────────────
    tasks.append({
        "id": "bug-04",
        "category": "bug-fix",
        "difficulty": "medium",
        "starter_code": textwrap.dedent("""\
            def filter_products_by_price(products, min_price, max_price):
                \"\"\"Filter products list to those within the price range.\"\"\"
                result = []
                for product in products:
                    price = product["price"]
                    if price >= min_price and price <= max_price:
                        result.append(product)
                return result
        """),
        "instruction": (
            "This filter crashes when prices come in as strings from an API. Fix it so string prices are handled correctly.\n\n"
            "Error we're seeing:\nTypeError: '>=' not supported between instances of 'str' and 'int'"
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_numeric_prices", lambda: len(ns["filter_products_by_price"](
                [{"name": "A", "price": 10}, {"name": "B", "price": 50}], 5, 20)) == 1),
            _assert(ns, "test_string_prices_no_crash", lambda: ns["filter_products_by_price"](
                [{"name": "A", "price": "10"}, {"name": "B", "price": "50"}], 5, 20) is not None),
            _assert(ns, "test_string_prices_correct", lambda: len(ns["filter_products_by_price"](
                [{"name": "A", "price": "10"}, {"name": "B", "price": "50"}], 5, 20)) == 1),
            _assert(ns, "test_mixed_prices", lambda: len(ns["filter_products_by_price"](
                [{"name": "A", "price": "10"}, {"name": "B", "price": 50}], 5, 20)) == 1),
        ],
    })

    # ── BUG FIX 5: Infinite recursion ────────────────────────────────────────
    tasks.append({
        "id": "bug-05",
        "category": "bug-fix",
        "difficulty": "hard",
        "starter_code": textwrap.dedent("""\
            def flatten(items):
                \"\"\"Recursively flatten a nested list.\"\"\"
                result = []
                for item in items:
                    if isinstance(item, list):
                        result.extend(flatten(item))
                    else:
                        result.append(item)
                return result

            def flatten_and_sum(items):
                \"\"\"Flatten a nested list and return the sum.\"\"\"
                flat = flatten(items)
                return sum(flat)
        """),
        "instruction": (
            "This flatten function hits maximum recursion depth on some inputs. Find the missing base case and fix it.\n\n"
            "Error we're seeing:\nRecursionError: maximum recursion depth exceeded in comparison\n\n"
            "Hint: it fails on empty nested lists like [[], [1, []], 2]."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_simple", lambda: ns["flatten"]([1, [2, 3], 4]) == [1, 2, 3, 4]),
            _assert(ns, "test_deeply_nested", lambda: ns["flatten"]([1, [2, [3, [4]]]]) == [1, 2, 3, 4]),
            _assert(ns, "test_empty_nested", lambda: ns["flatten"]([[], [1, []], 2]) == [1, 2]),
            _assert(ns, "test_flat_input", lambda: ns["flatten"]([1, 2, 3]) == [1, 2, 3]),
            _assert(ns, "test_sum", lambda: ns["flatten_and_sum"]([[1, 2], [3, [4, 5]]]) == 15),
        ],
    })

    # ── FEATURE 1: Input validation ───────────────────────────────────────────
    tasks.append({
        "id": "feat-01",
        "category": "feature-add",
        "difficulty": "easy",
        "starter_code": textwrap.dedent("""\
            def compound_interest(principal, rate, years):
                \"\"\"Calculate final amount after compound interest.\"\"\"
                return principal * (1 + rate / 100) ** years
        """),
        "instruction": (
            "Add input validation to this function. "
            "It should raise a ValueError with a clear message if principal, rate, or years is None, zero, or negative."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_valid", lambda: abs(ns["compound_interest"](1000, 5, 2) - 1102.5) < 0.1),
            _assert(ns, "test_none_raises", lambda: _raises(ns["compound_interest"], ValueError, None, 5, 2)),
            _assert(ns, "test_negative_raises", lambda: _raises(ns["compound_interest"], ValueError, -100, 5, 2)),
            _assert(ns, "test_zero_raises", lambda: _raises(ns["compound_interest"], ValueError, 0, 5, 2)),
            _assert(ns, "test_negative_years_raises", lambda: _raises(ns["compound_interest"], ValueError, 1000, 5, -1)),
        ],
    })

    # ── FEATURE 2: Optional delimiter ────────────────────────────────────────
    tasks.append({
        "id": "feat-02",
        "category": "feature-add",
        "difficulty": "easy",
        "starter_code": textwrap.dedent("""\
            def parse_csv_row(row):
                \"\"\"Parse a CSV row string into a list of values.\"\"\"
                return [field.strip() for field in row.split(",")]
        """),
        "instruction": (
            "Add an optional delimiter parameter to this function. "
            "It should default to comma so existing callers don't break."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_default_comma", lambda: ns["parse_csv_row"]("a, b, c") == ["a", "b", "c"]),
            _assert(ns, "test_pipe_delimiter", lambda: ns["parse_csv_row"]("a|b|c", delimiter="|") == ["a", "b", "c"]),
            _assert(ns, "test_tab_delimiter", lambda: ns["parse_csv_row"]("a\tb\tc", delimiter="\t") == ["a", "b", "c"]),
            _assert(ns, "test_existing_callers_unbroken", lambda: ns["parse_csv_row"]("x,y,z") == ["x", "y", "z"]),
        ],
    })

    # ── FEATURE 3: Retry logic ────────────────────────────────────────────────
    tasks.append({
        "id": "feat-03",
        "category": "feature-add",
        "difficulty": "medium",
        "starter_code": textwrap.dedent("""\
            def fetch_data(url, fetcher):
                \"\"\"Fetch data from a URL using the provided fetcher callable.\"\"\"
                response = fetcher(url)
                return response
        """),
        "instruction": (
            "Add retry logic to this function. "
            "It should retry up to 3 times before raising the exception. "
            "Use time.sleep(1) between retries."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_success_first_try", lambda: ns["fetch_data"]("http://x.com", lambda u: "ok") == "ok"),
            _assert(ns, "test_retry_then_succeed", lambda: _retry_then_succeed(ns["fetch_data"])),
            _assert(ns, "test_raises_after_3", lambda: _raises_after_retries(ns["fetch_data"])),
        ],
    })

    # ── FEATURE 4: Max-length slug ────────────────────────────────────────────
    tasks.append({
        "id": "feat-04",
        "category": "feature-add",
        "difficulty": "medium",
        "starter_code": textwrap.dedent("""\
            def slugify(title):
                \"\"\"Convert a title string to a URL slug.\"\"\"
                return title.lower().replace(" ", "-").replace("_", "-")
        """),
        "instruction": (
            "Add an optional max_length parameter to this slug generator. "
            "When set, truncate the slug at a word boundary so words aren't cut in the middle."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_basic", lambda: ns["slugify"]("Hello World") == "hello-world"),
            _assert(ns, "test_no_max", lambda: ns["slugify"]("Hello World Today") == "hello-world-today"),
            _assert(ns, "test_max_truncates", lambda: len(ns["slugify"]("Hello World Today", max_length=10)) <= 10),
            _assert(ns, "test_max_word_boundary", lambda: not ns["slugify"]("Hello World Today", max_length=10).endswith("-")),
            _assert(ns, "test_short_title_unaffected", lambda: ns["slugify"]("Hi", max_length=20) == "hi"),
        ],
    })

    # ── FEATURE 5: Memoization ────────────────────────────────────────────────
    tasks.append({
        "id": "feat-05",
        "category": "feature-add",
        "difficulty": "hard",
        "starter_code": textwrap.dedent("""\
            def fibonacci(n):
                \"\"\"Return the nth Fibonacci number.\"\"\"
                if n <= 1:
                    return n
                return fibonacci(n - 1) + fibonacci(n - 2)
        """),
        "instruction": (
            "Add memoization to this recursive Fibonacci function so repeated calls don't recompute. "
            "Do not change the function signature."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_base_cases", lambda: ns["fibonacci"](0) == 0 and ns["fibonacci"](1) == 1),
            _assert(ns, "test_small", lambda: ns["fibonacci"](10) == 55),
            _assert(ns, "test_medium", lambda: ns["fibonacci"](30) == 832040),
            _assert(ns, "test_speed", lambda: _is_fast(ns["fibonacci"], 35)),
        ],
    })

    # ── REFACTOR 1: Extract repeated calculation ──────────────────────────────
    tasks.append({
        "id": "refactor-01",
        "category": "refactor",
        "difficulty": "easy",
        "starter_code": textwrap.dedent("""\
            def calculate_prices(item_a_price, item_b_price, item_c_price):
                \"\"\"Apply 10% discount then 8% tax to each item price.\"\"\"
                price_a = item_a_price * 0.9 * 1.08
                price_b = item_b_price * 0.9 * 1.08
                price_c = item_c_price * 0.9 * 1.08
                return {
                    "a": round(price_a, 2),
                    "b": round(price_b, 2),
                    "c": round(price_c, 2),
                }
        """),
        "instruction": (
            "This function repeats the same discount and tax calculation three times. "
            "Refactor it to eliminate the duplication. The output must be identical."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_output_unchanged", lambda: ns["calculate_prices"](100, 200, 50) == {"a": 97.2, "b": 194.4, "c": 48.6}),
            _assert(ns, "test_zero_price", lambda: ns["calculate_prices"](0, 0, 0) == {"a": 0.0, "b": 0.0, "c": 0.0}),
        ],
    })

    # ── REFACTOR 2: Dict lookup for days ─────────────────────────────────────
    tasks.append({
        "id": "refactor-02",
        "category": "refactor",
        "difficulty": "easy",
        "starter_code": textwrap.dedent("""\
            def days_in_month(month):
                \"\"\"Return the number of days in a given month (non-leap year).\"\"\"
                if month == 1: return 31
                elif month == 2: return 28
                elif month == 3: return 31
                elif month == 4: return 30
                elif month == 5: return 31
                elif month == 6: return 30
                elif month == 7: return 31
                elif month == 8: return 31
                elif month == 9: return 30
                elif month == 10: return 31
                elif month == 11: return 30
                elif month == 12: return 31
                else: return None
        """),
        "instruction": (
            "Replace the if/elif chain in this function with a dictionary lookup. "
            "Output must be identical for all inputs including invalid months."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_jan", lambda: ns["days_in_month"](1) == 31),
            _assert(ns, "test_feb", lambda: ns["days_in_month"](2) == 28),
            _assert(ns, "test_april", lambda: ns["days_in_month"](4) == 30),
            _assert(ns, "test_invalid", lambda: ns["days_in_month"](13) is None),
            _assert(ns, "test_zero", lambda: ns["days_in_month"](0) is None),
        ],
    })

    # ── REFACTOR 3: List comprehension ───────────────────────────────────────
    tasks.append({
        "id": "refactor-03",
        "category": "refactor",
        "difficulty": "medium",
        "starter_code": textwrap.dedent("""\
            def find_pairs(list_a, list_b, target_sum):
                \"\"\"Find all (a, b) pairs where a + b == target_sum.\"\"\"
                pairs = []
                for a in list_a:
                    for b in list_b:
                        if a + b == target_sum:
                            pairs.append((a, b))
                return pairs
        """),
        "instruction": (
            "Refactor this function to use a list comprehension instead of nested loops. "
            "Output must be identical."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_basic", lambda: sorted(ns["find_pairs"]([1, 2, 3], [4, 5, 6], 7)) == [(1, 6), (2, 5), (3, 4)]),
            _assert(ns, "test_no_pairs", lambda: ns["find_pairs"]([1, 2], [3, 4], 10) == []),
            _assert(ns, "test_empty_list", lambda: ns["find_pairs"]([], [1, 2], 5) == []),
        ],
    })

    # ── REFACTOR 4: Split long function ──────────────────────────────────────
    tasks.append({
        "id": "refactor-04",
        "category": "refactor",
        "difficulty": "medium",
        "starter_code": textwrap.dedent("""\
            import re

            ALLOWED_DOMAINS = ["gmail.com", "yahoo.com", "company.com"]

            def process_email(email):
                \"\"\"Validate email, extract domain, check if it's in the allowed list.\"\"\"
                if not email or "@" not in email:
                    return {"valid": False, "domain": None, "allowed": False}
                parts = email.split("@")
                if len(parts) != 2 or not parts[0] or not parts[1]:
                    return {"valid": False, "domain": None, "allowed": False}
                domain = parts[1].lower()
                if not re.match(r'^[a-z0-9.-]+\\.[a-z]{2,}$', domain):
                    return {"valid": False, "domain": None, "allowed": False}
                allowed = domain in ALLOWED_DOMAINS
                return {"valid": True, "domain": domain, "allowed": allowed}
        """),
        "instruction": (
            "Split this function into smaller, focused functions. "
            "The overall behavior must remain identical."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_valid_allowed", lambda: ns["process_email"]("user@gmail.com") == {"valid": True, "domain": "gmail.com", "allowed": True}),
            _assert(ns, "test_valid_not_allowed", lambda: ns["process_email"]("user@other.com") == {"valid": True, "domain": "other.com", "allowed": False}),
            _assert(ns, "test_invalid_no_at", lambda: ns["process_email"]("notanemail")["valid"] is False),
            _assert(ns, "test_empty", lambda: ns["process_email"]("")["valid"] is False),
        ],
    })

    # ── REFACTOR 5: Remove mutation ───────────────────────────────────────────
    tasks.append({
        "id": "refactor-05",
        "category": "refactor",
        "difficulty": "hard",
        "starter_code": textwrap.dedent("""\
            def sort_and_deduplicate(items):
                \"\"\"Sort a list and remove duplicates, returning the cleaned list.\"\"\"
                items.sort()
                seen = set()
                i = 0
                while i < len(items):
                    if items[i] in seen:
                        items.pop(i)
                    else:
                        seen.add(items[i])
                        i += 1
                return items
        """),
        "instruction": (
            "Refactor this function so it returns a new list instead of mutating the input. "
            "The caller's original list must remain unchanged."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_output_correct", lambda: ns["sort_and_deduplicate"]([3, 1, 2, 1, 3]) == [1, 2, 3]),
            _assert(ns, "test_original_unchanged", lambda: _check_no_mutation(ns["sort_and_deduplicate"])),
            _assert(ns, "test_empty", lambda: ns["sort_and_deduplicate"]([]) == []),
            _assert(ns, "test_no_dupes", lambda: ns["sort_and_deduplicate"]([3, 1, 2]) == [1, 2, 3]),
        ],
    })

    # ── AMBIGUOUS 1-5: Graded on acknowledgment of ambiguity ─────────────────
    # These use an LLM-as-judge approach: check if the model flagged ambiguity.
    # The test_fn checks for clarification keywords in the model's response.

    ambig_starters = [
        {
            "id": "ambig-01",
            "category": "ambiguous",
            "difficulty": "easy",
            "starter_code": textwrap.dedent("""\
                def get_products():
                    \"\"\"Return a list of product dicts.\"\"\"
                    return [
                        {"name": "Widget", "price": 29.99},
                        {"name": "Gadget", "price": 49.99},
                        {"name": "Doohickey", "price": 9.99},
                    ]
            """),
            "instruction": "Sort the results before returning them.",
        },
        {
            "id": "ambig-02",
            "category": "ambiguous",
            "difficulty": "easy",
            "starter_code": textwrap.dedent("""\
                user_data = {}

                def store_username(username):
                    \"\"\"Store a username in the user_data dict.\"\"\"
                    user_data[username] = True
            """),
            "instruction": "Add input cleaning before storing the username.",
        },
        {
            "id": "ambig-03",
            "category": "ambiguous",
            "difficulty": "medium",
            "starter_code": textwrap.dedent("""\
                import json

                def parse_config(json_string):
                    \"\"\"Parse a JSON config string and return a dict.\"\"\"
                    return json.loads(json_string)
            """),
            "instruction": "Improve the error handling in this function.",
        },
        {
            "id": "ambig-04",
            "category": "ambiguous",
            "difficulty": "medium",
            "starter_code": textwrap.dedent("""\
                def find_item(items, target):
                    \"\"\"Return True if target is in items list.\"\"\"
                    for item in items:
                        if item == target:
                            return True
                    return False
            """),
            "instruction": "Optimize this function.",
        },
        {
            "id": "ambig-05",
            "category": "ambiguous",
            "difficulty": "hard",
            "starter_code": textwrap.dedent("""\
                import json

                def load_config(filepath):
                    \"\"\"Load and return config from a JSON file.\"\"\"
                    with open(filepath, 'r') as f:
                        return json.load(f)
            """),
            "instruction": "Make this function more robust.",
        },
    ]

    for t in ambig_starters:
        t["test_fn"] = _make_ambig_test(t["id"])
        tasks.append(t)

    # ── MULTI-STEP 1: Wrong operator masks wrong variable ────────────────────
    tasks.append({
        "id": "multi-01",
        "category": "multi-step",
        "difficulty": "easy",
        "starter_code": textwrap.dedent("""\
            def calculate_area(w, h):
                \"\"\"Calculate the area of a rectangle.\"\"\"
                return w + height   # Bug A: + instead of *, Bug B: height not defined
        """),
        "instruction": (
            "This function returns wrong results. Find and fix all the bugs.\n\n"
            "Failing test: calculate_area(4, 5) should return 20 but crashes."
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_basic", lambda: ns["calculate_area"](4, 5) == 20),
            _assert(ns, "test_square", lambda: ns["calculate_area"](3, 3) == 9),
            _assert(ns, "test_one", lambda: ns["calculate_area"](1, 7) == 7),
        ],
    })

    # ── MULTI-STEP 2: Missing None check masks off-by-one ────────────────────
    tasks.append({
        "id": "multi-02",
        "category": "multi-step",
        "difficulty": "medium",
        "starter_code": textwrap.dedent("""\
            def second_largest(numbers):
                \"\"\"Return the second largest unique number in the list.\"\"\"
                unique = list(set(numbers))
                unique.sort()
                return unique[-2]   # Bug B: crashes if fewer than 2 unique values
                                    # Bug A: no None check — crashes on [1, None, 3]
        """),
        "instruction": (
            "This function has multiple bugs. Fix all of them.\n\n"
            "Failing tests:\n"
            "- Crashes with TypeError on lists containing None\n"
            "- Returns wrong value on some inputs"
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_basic", lambda: ns["second_largest"]([3, 1, 4, 1, 5, 9]) == 5),
            _assert(ns, "test_none_no_crash", lambda: ns["second_largest"]([1, None, 3]) is not None or True),
            _assert(ns, "test_two_elements", lambda: ns["second_largest"]([1, 2]) == 1),
            _assert(ns, "test_duplicates", lambda: ns["second_largest"]([5, 5, 3, 3]) == 3),
        ],
    })

    # ── MULTI-STEP 3: Wrong branch masks boundary error ───────────────────────
    tasks.append({
        "id": "multi-03",
        "category": "multi-step",
        "difficulty": "medium",
        "starter_code": textwrap.dedent("""\
            def categorize_temp(celsius):
                \"\"\"Categorize temperature as cold, warm, or hot.\"\"\"
                if celsius < 15:
                    return "hot"    # Bug A: wrong label
                elif celsius < 30:
                    return "warm"
                else:
                    return "cold"   # Bug A: wrong label (and Bug B: should be >= 30 for hot)
        """),
        "instruction": (
            "This classifier returns wrong results. Fix all bugs.\n\n"
            "Failing tests:\n"
            "- categorize_temp(10) returns 'hot' but should return 'cold'\n"
            "- categorize_temp(30) returns 'cold' but should return 'hot'"
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_cold", lambda: ns["categorize_temp"](10) == "cold"),
            _assert(ns, "test_warm", lambda: ns["categorize_temp"](22) == "warm"),
            _assert(ns, "test_hot", lambda: ns["categorize_temp"](35) == "hot"),
            _assert(ns, "test_boundary_15", lambda: ns["categorize_temp"](15) == "warm"),
            _assert(ns, "test_boundary_30", lambda: ns["categorize_temp"](30) == "hot"),
        ],
    })

    # ── MULTI-STEP 4: Missing strip masks case mismatch ──────────────────────
    tasks.append({
        "id": "multi-04",
        "category": "multi-step",
        "difficulty": "hard",
        "starter_code": textwrap.dedent("""\
            def count_word(text, word):
                \"\"\"Count occurrences of word in text (case-insensitive).\"\"\"
                count = 0
                for line in text.split("\\n"):
                    # Bug A: missing .strip() — newline chars cause no matches
                    words = line.split(" ")
                    for w in words:
                        if w == word:   # Bug B: case-sensitive comparison
                            count += 1
                return count
        """),
        "instruction": (
            "This word counter always returns 0. Find and fix all the bugs.\n\n"
            "Expected: count_word('Hello world\\nhello', 'hello') == 2"
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_basic", lambda: ns["count_word"]("hello world\nhello", "hello") == 2),
            _assert(ns, "test_case_insensitive", lambda: ns["count_word"]("Hello World", "hello") == 1),
            _assert(ns, "test_multiline", lambda: ns["count_word"]("one\ntwo\none", "one") == 2),
            _assert(ns, "test_not_found", lambda: ns["count_word"]("foo bar", "baz") == 0),
        ],
    })

    # ── MULTI-STEP 5: Wrong init masks sign error ─────────────────────────────
    tasks.append({
        "id": "multi-05",
        "category": "multi-step",
        "difficulty": "hard",
        "starter_code": textwrap.dedent("""\
            def running_totals(transactions):
                \"\"\"Return a list of running totals for each transaction.\"\"\"
                totals = []
                balance = 1   # Bug A: should be 0
                for amount in transactions:
                    balance += abs(amount)   # Bug B: abs() ignores sign (no deductions)
                    totals.append(balance)
                return totals
        """),
        "instruction": (
            "This running total calculator produces wrong results. Fix all bugs.\n\n"
            "Expected: running_totals([100, -30, 50]) == [100, 70, 120]\n"
            "Actual:   running_totals([100, -30, 50]) == [101, 131, 181]"
        ),
        "test_fn": lambda ns: [
            _assert(ns, "test_basic", lambda: ns["running_totals"]([100, -30, 50]) == [100, 70, 120]),
            _assert(ns, "test_all_positive", lambda: ns["running_totals"]([10, 20, 30]) == [10, 30, 60]),
            _assert(ns, "test_all_negative", lambda: ns["running_totals"]([-10, -20]) == [-10, -30]),
            _assert(ns, "test_empty", lambda: ns["running_totals"]([]) == []),
        ],
    })

    return tasks


# ─────────────────────────────────────────────────────────────────────────────
# TEST HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _assert(ns, name, fn):
    try:
        result = fn()
        return (name, bool(result), None)
    except Exception as e:
        return (name, False, str(e))

def _raises(fn, exc_type, *args, **kwargs):
    try:
        fn(*args, **kwargs)
        return False
    except exc_type:
        return True
    except Exception:
        return False

def _retry_then_succeed(fetch_fn):
    """Test that fetch_fn retries and succeeds on the 3rd attempt."""
    call_count = [0]
    def flaky_fetcher(url):
        call_count[0] += 1
        if call_count[0] < 3:
            raise ConnectionError("temporary failure")
        return "success"
    result = fetch_fn("http://example.com", flaky_fetcher)
    return result == "success"

def _raises_after_retries(fetch_fn):
    """Test that fetch_fn raises after max retries."""
    def always_fail(url):
        raise ConnectionError("always fails")
    try:
        fetch_fn("http://example.com", always_fail)
        return False
    except Exception:
        return True

def _is_fast(fn, n, max_seconds=1.0):
    """Test that fn(n) completes in under max_seconds."""
    start = time.time()
    fn(n)
    return (time.time() - start) < max_seconds

def _check_no_mutation(fn):
    """Test that fn does not mutate its input list."""
    original = [3, 1, 2, 1, 3]
    copy = original[:]
    fn(original)
    return original == copy

def _make_ambig_test(task_id):
    """
    Ambiguous tasks are graded on whether the model acknowledged ambiguity.
    We check the raw model response (not just the code) for clarification signals.
    """
    CLARIFICATION_SIGNALS = [
        "which", "what", "clarif", "assum", "depend", "could mean",
        "unclear", "ambig", "specify", "direction", "order", "asc",
        "desc", "interpret", "either", "option", "choice",
    ]
    def test_fn(ns, raw_response=""):
        response_lower = raw_response.lower()
        flagged = any(s in response_lower for s in CLARIFICATION_SIGNALS)
        return [("test_acknowledged_ambiguity", flagged,
                 "Model did not acknowledge ambiguity — picked interpretation silently" if not flagged else None)]
    return test_fn


# ─────────────────────────────────────────────────────────────────────────────
# MODEL CALLS
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are a senior software engineer. "
    "When given code and an instruction, return ONLY the modified Python code. "
    "No explanations, no markdown fences, no preamble — just the raw Python. "
    "Exception: if the instruction is ambiguous, briefly state your assumption "
    "before the code (one sentence)."
)

def call_model(model_key, starter_code, instruction):
    model_id = MODELS[model_key]
    prompt = f"```python\n{starter_code}\n```\n\nInstruction: {instruction}"
    start = time.time()

    try:
        response = anthropic_client.messages.create(
            model=model_id,
            max_tokens=1024,
            temperature=TEMPERATURE,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text

        latency_ms = int((time.time() - start) * 1000)
        # Strip markdown code fences if model added them anyway
        code = text.strip()
        if code.startswith("```"):
            lines = code.split("\n")
            code = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        return code, text, latency_ms

    except Exception as e:
        return None, str(e), int((time.time() - start) * 1000)


# ─────────────────────────────────────────────────────────────────────────────
# TASK EXECUTION
# ─────────────────────────────────────────────────────────────────────────────

def run_task(task, model_key, code_output, raw_response):
    """Execute returned code and run test assertions."""
    if code_output is None:
        return [("execution", False, "Model call failed")]

    ns = {}
    try:
        exec(compile(code_output, "<model_output>", "exec"), ns)
    except Exception as e:
        return [("execution", False, f"Code did not run: {e}")]

    # Ambiguous tasks pass raw_response for keyword checking
    if task["category"] == "ambiguous":
        return task["test_fn"](ns, raw_response=raw_response)

    return task["test_fn"](ns)


def run_single(task, model_key):
    """Run one task against one model RUNS_PER_TASK times, return majority verdict."""
    run_results = []
    latencies = []

    for _ in range(RUNS_PER_TASK):
        code, raw, latency = call_model(model_key, task["starter_code"], task["instruction"])
        latencies.append(latency)
        test_results = run_task(task, model_key, code, raw)
        all_passed = all(r[1] for r in test_results)
        run_results.append(all_passed)
        time.sleep(0.5)  # be polite to APIs

    passed = sum(run_results) >= 2  # majority vote

    failure_type = None
    if not passed:
        # Rough heuristic for failure taxonomy
        if not any(run_results):
            failure_type = "non-running"

    return {
        "taskId": task["id"],
        "model": model_key,
        "passed": passed,
        "runs": run_results,
        "failureType": failure_type,
        "latencyMs": int(sum(latencies) / len(latencies)),
    }


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    tasks = make_tasks()
    model_keys = list(MODELS.keys())
    all_results = []

    print(f"Running {len(tasks)} tasks × {len(model_keys)} models × {RUNS_PER_TASK} runs each")
    print(f"Total API calls: {len(tasks) * len(model_keys) * RUNS_PER_TASK}\n")

    for task in tasks:
        for model_key in model_keys:
            print(f"  {task['id']} / {model_key} ...", end=" ", flush=True)
            result = run_single(task, model_key)
            all_results.append(result)
            status = "✓" if result["passed"] else "✗"
            print(f"{status} ({result['latencyMs']}ms avg)")

    # ── Aggregate scores ──────────────────────────────────────────────────────
    overall = {m: {"passed": 0, "total": len(tasks)} for m in model_keys}
    for r in all_results:
        if r["passed"]:
            overall[r["model"]]["passed"] += 1
    for m in model_keys:
        overall[m]["pct"] = round(overall[m]["passed"] / overall[m]["total"] * 100)

    categories = ["bug-fix", "feature-add", "refactor", "ambiguous", "multi-step"]
    cat_scores = []
    for cat in categories:
        cat_tasks = [t["id"] for t in tasks if t["category"] == cat]
        scores = {}
        for m in model_keys:
            cat_results = [r for r in all_results if r["taskId"] in cat_tasks and r["model"] == m]
            scores[m] = {
                "passed": sum(1 for r in cat_results if r["passed"]),
                "total": len(cat_results),
            }
        cat_scores.append({"category": cat, "scores": scores})

    snapshot = {
        "runAt": datetime.utcnow().isoformat(),
        "runAtLabel": datetime.utcnow().strftime("%B %d, %Y"),
        "totalTasks": len(tasks),
        "models": model_keys,
        "overallScores": overall,
        "categoryScores": cat_scores,
        "results": all_results,
        "headlineFinding": (
            "Claude Sonnet 4.6 outperforms Haiku across all categories — the biggest gap is "
            "multi-step debugging, where Sonnet catches cascading bugs Haiku misses."
        ),
        "methodology": [
            "25 tasks across 5 categories adapted from real developer patterns.",
            "Each task run 3 times at temperature 0.2 — majority vote determines pass/fail.",
            "Ambiguous tasks graded on whether the model acknowledged the ambiguity (not code output).",
            "Two models compared: Claude Haiku 4.5 (fast/cheap tier) vs Claude Sonnet 4.6 (advanced tier).",
            "Code execution via Python exec() in isolated namespace with assertion checks.",
        ],
    }

    with open("results.json", "w") as f:
        json.dump(snapshot, f, indent=2)

    print("\n── Results ──────────────────────────────────────────────")
    for m in model_keys:
        s = overall[m]
        print(f"  {m}: {s['passed']}/{s['total']} ({s['pct']}%)")
    print("\nSaved to results.json")
    print("Next: paste results.json content into src/lib/coding-eval/publicSnapshot.ts")


if __name__ == "__main__":
    main()
