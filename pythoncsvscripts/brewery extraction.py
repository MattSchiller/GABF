# scripts for cleaning dirty data

import csv
import re

# generalize this so that it takes column titles

with open('GABF_winners_v2.csv', 'r') as inp, open('breweries1.txt', 'w') as out:
    breweries_list = []
    all_winners = csv.DictReader(inp)
    for row in all_winners:
        if row['gold_brewery'] not in breweries_list:
            breweries_list.append(row['gold_brewery'])
        if row['silver_brewery'] not in breweries_list:
            breweries_list.append(row['silver_brewery'])
        if row['bronze_brewery'] not in breweries_list:
            breweries_list.append(row['bronze_brewery'])
    breweries_list.sort()
    for brewery in breweries_list:
        print(brewery, file=out)


def find_unique_strings(csv_dict, cols=[]):
    ''' Return alphabetized list of unique strings in columns of csv_dict.'''
    unique_strings = []
    for row in csv_dict:
        for col in cols:
            if row[col] not in unique_strings:
                unique_strings.append(row[col])
    unique_strings.sort()
    return unique_strings


def dict_strings(list_of_strings):
    ''' Create dict of similar string values.'''
    similar_strings = {}
    for item in list_of_strings:
        if item[:10] not in similar_strings:
            similar_strings[item[:10]] = [item]
        else: 
            similar_strings[item[:10]].append(item)
    return similar_strings

def get_input():
    ''' Get and confirm user input for replacement string.'''
    replacement = input('Enter replacement string: ')
    check = input('You entered {}. Is this correct? Y/n> '.format(replacement))
    if check.lower() == 'y':
        return replacement
    else:
        return get_input()


def query_repl(key_value_pair, possible):
    ''' Prompt user for input on replacement string mapping.'''
    print('Similar strings: \n')
    print(key_value_pair)
    query = input('Use "{}" as replacement string? Y/n> '.format(possible))
    if query.lower() == 'y':
        return possible
    else:
        return get_input()


def make_possible_replacement(string):
    p = re.compile(r'(^[A-Z]+ [A-Z\s]*?Brew[^\s]+)', re.IGNORECASE)
    if p.match(string):
        return p.match(string).group()
    else:
        return "PLEASE SET STRING"


def map_replacements(a_dict):
    ''' Create replacement mapping from dict of similar strings.'''
    repl_strs = {}
    for key in a_dict.keys():
        if len(a_dict[key]) == 1:
            continue
        else:
            possible = make_possible_replacement(a_dict[key][0])
            repl_strs[key] = query_repl(a_dict[key], possible)
    return repl_strs



def replace_items(in_dict, out_dict, cols, replacement_csv):
    ''' Take input CSV dict and replace vals in supplied cols
        as mapped in replacement_csv, then write each row to out_dict.'''
    for row in in_dict:
        for col in cols:
            print(row[col])
            token = row[col][:10]
            print('TOKEN:', token)
            try:
                possible = replacement_csv[token]
            except KeyError:
                continue
            print('POSSIBLE:', possible)
            if possible != 'SKIPSKIP':
                if possible != 'PLEASE SET STRING':
                    if len(possible) > 1:
                        row[col] = possible
            print(row[col])
        out_dict.writerow(row)
    print('Done writing output rows.')



p = re.compile(r'([A-Z]+ [A-Z\s]*?Brew[^\s]+)', re.IGNORECASE)

with open('GABF_winners.csv', 'r') as inp, open('brewery_name_map.csv', 'r') as name_map:
    all_winners = csv.DictReader(inp)
    names = csv.DictReader(name_map)
    replacements = {row['token']: row['replacement'] for row in names}
    with open('GABF_winners_v2.csv', 'w') as out:
        fieldnames = all_winners.fieldnames
        target_cols = ['gold_brewery', 'silver_brewery', 'bronze_brewery']
        new_csv = csv.DictWriter(out, fieldnames=fieldnames)
        new_csv.writeheader()
        replace_items(all_winners, new_csv, target_cols, replacements)