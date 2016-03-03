#!/usr/bin/env python3

# Pandas cleaning up of GABF_winners_v2.csv

import csv
import json

import geocoder

def get_lat_long(brewery_name, city_state):
    ''' Return lat long from Google Geocode API.'''
    key = ""
    brewery = brewery_name.split(',', maxsplit=1)[0]
    search_query = brewery + city_state
    try:
        g = geocoder.google(address_string, key = key)
    except:
        return None
    return g.latlng

def make_location_table(data):
    location_table = {}
    for row in data:
        brewery, city, state = 'brewery', 'city', 'state'
        for medal_ in ['gold_', 'silver_', 'bronze_']:
            medal_brewery = medal_ + brewery
            medal_city = medal_ + city
            medal_state = medal_ + state
            c, s  = row[medal_city], row[medal_state]
            b = row[medal_brewery] + ', ' + c
            if b not in location_table:
                location_table[b] = c + ', ' + s
            elif b in location_table \
                and location_table[b] != c + ', ' + s:
                print('Conflicting locations for %s.' % b)
    return location_table

def write_csv_as_json(csv_dict, fp):
    counter = 0
    for row in csv_dict:
        year = row['year']
        style = row['cat_name']
        b, br, c, s = 'beer', 'brewery', 'city', 'state'
        for medal in ['gold_', 'silver_', 'bronze_']:
            mb, mbr, mc, ms = medal + b, medal + br, medal + c, medal + s
            beer, brewery, city, state = row[mb], row[mbr], row[mc], row[ms]
            json.dump({'year': year,
                       'style': style,
                       'beer': beer,
                       'brewery': brewery,
                       'city': city,
                       'state':state}, fp)
            counter += 1
    return "Wrote %i items to json file." % counter


def write_csv_rows_as_separate_items(csv_dict, fp):
    counter = 0
    fieldnames = ['year', 'style', 'medal', 'beer', 'brewery', 'city', 'state']
    dict_writer = csv.DictWriter(fp, fieldnames=fieldnames)
    dict_writer.writeheader()
    for row in csv_dict:
        year = row['year']
        style = row['cat_name']
        b, br, c, s = '_beer', '_brewery', '_city', '_state'
        for medal in ['gold', 'silver', 'bronze']:
            mb, mbr, mc, ms = medal + b, medal + br, medal + c, medal + s
            beer, brewery, city, state = row[mb], row[mbr], row[mc], row[ms]
            dict_writer.writerow({'year': year,
                                  'style': style,
                                  'medal': medal,
                                  'beer': beer,
                                  'brewery': brewery,
                                  'city': city,
                                  'state':state})
            counter += 1
    return "Wrote %i items to csv file." % counter

# For trying to geolocate breweries in a more refined way than by city and
# state. This didn't work it turns out with the Google API.
#
# with open('b_c_s.csv', 'r') as inp, open('b_c_l_l.csv', 'w') as outp:
#     fieldnames = ['location', 'lat', 'long']
#     lats = []
#     b_c_s = csv.DictReader(inp)
#     output = csv.DictWriter(outp, fieldnames=fieldnames)
#     output.writeheader()
#     lat, lon = 0, 1
#     for row in b_c_s:
#         # lat, lon = get_lat_long(row['brewery'], row['city_state'])
#         output.writerow({'location': row['brewery'], 'lat':lat, 'long': lon})
#         lat += 1 
#         lon += 1

# This code extracts breweries and cities from CSV
# 
# with open('GABF_winners.csv', 'r') as f, open('b_c_s.csv', 'w') as out:
#     GABF_winners_table  = csv.DictReader(f, delimiter = ',')
#     output = csv.DictWriter(out, fieldnames=['brewery', 'city_state'])
#     output.writeheader()
#     brewery_city_state = make_location_table(GABF_winners_table)
#     for k,v in brewery_city_state.items():
#         output.writerow({'brewery': k, 'city_state': v})

# For making a JSON of all the brewery data
#

with open('GABF_winners.csv', 'r') as f, open('awards.csv', 'w+') as out:
     GABF_winners_table  = csv.DictReader(f)
     print(write_csv_rows_as_separate_items(GABF_winners_table, out))


