import csv

with open('brewery_name_map.csv', 'r') as inp:
    names = csv.DictReader(inp)
    replacements = {row['token']: row['replacement'] for row in names}
    print(replacements)
