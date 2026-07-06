# Task 09: Parse CSV Line

## What the code should do

`parse_csv_line(line)` parses a single comma-separated line and returns a list of field values.
Fields are stripped of leading/trailing whitespace.
Quoted fields (surrounded by `"`) may contain commas and are treated as a single field.
Empty fields (two consecutive commas, or a trailing comma) produce an empty string `""` in the output.

- `parse_csv_line("a,b,c")` → `["a", "b", "c"]`
- `parse_csv_line('"hello, world",foo')` → `["hello, world", "foo"]`
- `parse_csv_line("a,b,")` → `["a", "b", ""]`

## What's wrong

The tests are failing. Fix the code so all tests pass.

## File to fix

`starter/module.py`

## Category

Red Herring (something in the code may look like the problem — read the failing tests carefully before deciding what to change)
