def get_max(numbers):
    """Returns the largest number in the list. Returns None if the list is empty."""
    if not numbers:
        return None
    max_val = numbers[0]
    for n in numbers[1:]:
        if n > max_val:
            max_val = n
