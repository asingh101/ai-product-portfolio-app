def count_vowels(text):
    """Returns the number of vowels (a, e, i, o, u) in text. Case-insensitive."""
    vowels = 'aeiou'
    count = 0
    for char in text:
        if char in vowels:
            count += 1
    return count
