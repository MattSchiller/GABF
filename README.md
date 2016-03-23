# GABF AWARD WINNERS SINCE 1999

This site maps the breweries that have won gold, silver, and bronze medals at the Great American Beer Festival since 1999 and displays a "family tree" of how competition categories (for example, Classic Dry Irish Stout) have evolved over time. Data on winners was scraped from PDFs available at the GABF [festival website](http://www.greatamericanbeerfestival.com/the-competition/winners/). The PDFs had varying formats; the data was dirty. If you see something is missing or wrong, it is likely a data cleaning error--and we thank you in advance for bringing it to our attention.

## Cleaning the Data
### Brewery Locations
To get latitude and longitude for each winner, we wrote a series of scripts that made calls to Google's Geocoding API (first, to get coordinates for the cities winners listed as their home) and to Google Places (second, to attempt to get more refined coordinates of winners' actual location). There are some hitches in this approach: `Lakewood, WA` apparently is more likely to signify a town in Western Australia than in Washington, and some breweries disappeared before Google indexed them as a place. In the latter case, winners are mapped according to their hometown. 

Certain outlying winners listed multiple locations for their hometown and state. In the interest of science and objectivity, in those cases we just chose one. 

### Deriving Style Trees
The Style Trees tab shows how categories have developed over the last two decades; we normalized style names in certain instances. (If you are interested in full, unmodified style names, check the PDFs.) Where the inheritence of styles was not patently obvious (English and American IPAs split from one general IPA category in 2000), we inferred it (Imperial IPAs split from American IPAs in 2003). If you think we made an error, let us know.

We wrote a script that looked for similar category names to fill out the table of inheritance. Being a computerized script, it was dumb. Most errors (we hope) have been caught. If not, you know the drill.

