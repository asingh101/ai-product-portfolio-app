def filter_and_double(items, threshold):
    """Returns items that are >= threshold, each multiplied by 2.
    Order is preserved from the input list.

    Examples:
      filter_and_double([1, 5, 3, 5, 2], 5) -> [10, 10]
      filter_and_double([1, 2, 3], 4)        -> []
      filter_and_double([4, 5, 6], 4)        -> [8, 10, 12]
    """
    result = []
    for item in items:
        if item > threshold:
            result.append(item * 2)
    return result
