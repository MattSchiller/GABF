#!/usr/bin/env

# Compiling CSVs of GABF winners

import csv
import geocoder


def get_lat_long(address_string):
    ''' Return lat long from Google Geocode API.'''
    key = ""
    g = geocoder.google(address_string, key = key)
    return g.latlng


def make_location_dict(list_of_locations):
    ''' Return dictionary of lat longs from list of locations.'''
    dict_data = []
    for location in list_of_locations:
        if '/' in location or ',' not in location:
            continue
        try:
            lat, lon = get_lat_long(location)
        except ValueError:
            continue
        dict_data.append({'location': location, 'lat': lat, 'long': lon})
    return dict_data

locations = []
with open('GABF_winners.csv') as f:
    # dialect = csv.Sniffer().sniff(f.read(1024))
    ci = csv.DictReader(f, delimiter = ',')
    for row in ci:
        concats = []
        concats.append(row['gold_city'] + ', ' + row['gold_state'])
        concats.append(row['silver_city']+ ', ' + row['silver_state'])
        concats.append(row['bronze_city']+ ', ' + row['bronze_state'])
        for citystate in concats:
            if citystate not in locations:
                locations.append(citystate)


fieldnames=['location', 'lat', 'long']
with open('lat_lon_dict.csv', 'r') as f:
    geolocated = csv.DictReader(f, fieldnames=fieldnames)
    geolocated_cities = [row['location'] for row in geolocated]



with open('missing_cities.txt', 'w') as f:
    for citystate in locations:
        if citystate not in geolocated_cities:
            f.write(citystate + '\n')
