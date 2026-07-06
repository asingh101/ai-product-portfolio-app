def calculate_grade(scores):
    """Given a list of test scores (0-100), returns the letter grade based on the average.

    Grade scale:
      A: average >= 90
      B: average >= 80
      C: average >= 70
      D: average >= 60
      F: average < 60

    Returns 'F' for an empty list.
    """
    total = 0
    for score in scores:
        total += score

    average = total / len(scores)

    if average >= 90:
        return 'A'
    elif average >= 80:
        return 'B'
    elif average >= 70:
        return 'C'
    elif average > 60:
        return 'D'
    else:
        return 'F'
