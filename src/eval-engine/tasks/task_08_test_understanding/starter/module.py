def merge_sorted(list1, list2):
    """Merges two already-sorted lists into a single sorted list containing all elements.

    Examples:
      merge_sorted([1, 3, 5], [2, 4, 6])  -> [1, 2, 3, 4, 5, 6]
      merge_sorted([1, 2], [3, 4, 5])     -> [1, 2, 3, 4, 5]
      merge_sorted([], [1, 2, 3])         -> [1, 2, 3]
    """
    result = []
    i, j = 0, 0

    while i < len(list1) and j < len(list2):
        if list1[i] <= list2[j]:
            result.append(list1[i])
            i += 1
        else:
            result.append(list2[j])
            j += 1

    return result
