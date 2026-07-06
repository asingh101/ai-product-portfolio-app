def sum_list(items):
    """Returns the sum of all numbers in the list."""
    total = 0
    for i in range(len(items) + 1):
        total += items[i]
    return total
