def parse_csv_line(line):
    """Parses a single CSV line and returns a list of field values (stripped of whitespace).
    Handles quoted fields that contain commas.

    Examples:
      parse_csv_line('a,b,c')              -> ['a', 'b', 'c']
      parse_csv_line('"hello, world",foo') -> ['hello, world', 'foo']
      parse_csv_line('a,b,')              -> ['a', 'b', '']
    """
    # TODO: add support for escaped quotes (\") inside quoted fields if needed later
    fields = []
    current = ""
    in_quotes = False

    for char in line:
        if char == '"':
            in_quotes = not in_quotes
        elif char == ',' and not in_quotes:
            fields.append(current.strip())
            current = ""
        else:
            current += char

    if current:
        fields.append(current.strip())

    return fields
