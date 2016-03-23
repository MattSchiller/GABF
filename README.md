# GABF AWARD WINNERS SINCE 1999

This webapp maps the breweries that have won gold, silver, and bronze medals at the Great American Beer Festival since 1999 and displays a "family tree" of how competition categories (for example, Classic Dry Irish Stout) have evolved over time. Data on winners was scraped from PDFs available at the GABF [festival website](http://www.greatamericanbeerfestival.com/the-competition/winners/). The PDFs had varying formats; the data was dirty. If you see something is missing or wrong, it is likely a data cleaning error--and we thank you in advance for bringing it to our attention.

##About Us
We're two aspiring programmers at New York City's Recurse Center, Jake Davis and Matt Schiller. Jake has a background in Philosophy, Editing, and Appreciation-for-Good-Beer, while Matt's background is in Data Analytics, Origami, and Growing-a-Wildman-Beard. The idea for this project and all data-munging (done in Python) can be credited to Jake, while the web app itself was Matt's concern and done in JavaScript.

## Cleaning the Data
### Brewery Locations
To get latitude and longitude for each winner, we wrote a series of scripts that made calls to Google's Geocoding API (first, to get coordinates for the cities winners listed as their home) and to Google Places (second, to attempt to get more refined coordinates of winners' actual location). There are some hitches in this approach: `Lakewood, WA` apparently is more likely to signify a town in Western Australia than in Washington, and some breweries disappeared before Google indexed them as a place. In the latter case, winners are mapped according to their hometown.

Certain outlying winners listed multiple locations for their hometown and state. In the interest of SCIENCE and OBJECTIVITY, in those cases we just chose one.

### Deriving Style Trees
The Style Trees tab shows how categories have developed over the last two decades ('99-'15); we normalized style names in certain instances. (If you are interested in full, unmodified style names, check the PDFs.) Where the inheritence of styles was not patently obvious (English and American IPAs split from one general IPA category in 2000), we inferred it (Imperial IPAs split from American IPAs in 2003). If you think we made an error, let us know.

We wrote a script that looked for similar category names to fill out the table of inheritance. Being a computerized script, it was dumb. Most errors (we hope) have been caught. If not, you know the drill.

##To Front-end
###Site Structure
We knew we wanted to have a site design that was fluid and _reactive_ so we built with the React framework. This was minorly cumbersome to do with all of the ad-hoc filtering and re-defining of data subsets ('show me only Texas breweries', 'show me only gold medalists'), but the data structure we used (nested arrays) worked well for what we had in mind. And the state-based model kept everything in lock-step, data-wise.

###The Visualizations
For our initial build we decided to build out a geographic visualization of where the medalists were (Oregon and Pennsylvania's high concentrations were no surprise) and a tree that would show the transformation of how the different beer styles were approached year over year. We explored the Google Maps library, and got it working just fine, but we found the rigidity of markers and zoom levels restrictive. So we explored the use of d3, which we'd heard was perfect for this type of thing. It _was_ perfect! And soon we'd built out the tree diagram and linked in the map via click-throughs.

###Areas to Improve
React is state-based and d3 is vehemently not, which led their interaction to start off as a minor tiff and balloon into data warfare. In the interest of just getting things working, many hacks were thrown together, obfuscating much of the code, and throwing side-effects like nobody's business. If this project proves popular, and there is demand, more visualizations will be built out, and the current codebase will be heavily refactored. As well, there are minor areas of polish for the UX, like tooltips, better CSS for the filters, a robust 'About' page, and other such features that we're looking to include in the near future.