def find_second_largest(numbers):
    """Returns the second largest unique value in the list.
    Returns None if there are fewer than 2 unique values.

    Examples:
      find_second_largest([3, 1, 4, 1, 5]) -> 4
      find_second_largest([5, 5, 5])       -> None
      find_second_largest([10, 20])        -> 10
    """
    if len(numbers) < 2:
        return None

    unique = list(set(numbers))
    unique.sort()

    return unique[1]
