https://asheville-open-data-example.herokuapp.com/

## Overview
The asheville-open-data application is a simple interactive map displaying a few economic indicators over the City of Asheville parks and greenways. The idea behind this was to see if there is any correlation between housing costs/income/poverty and proxity to green spaces.

## Food for thought
I thought it may be interesting to use this data to answer a few questions:

1. Do residents in lower-income areas have equal access to public green spaces as residents in higher-income areas?
1. Do housing costs increase as proximity to public green spaces decreases?
1. Over time, is there a correlation between new parks opening and the economic indicators nearby.

## Shortcomings
While this is a nice start, there are a few shortcomings to this initial version:

1. The economic data is all at the census tract level. Block level data would provide more insight to the above questions.
1. The park data is limited to the City of Asheville parks. Including county and state parks may paint a more complete picture.
1. The data is limited to a shapshot in time. Ideally, with longitudinal data we may be able to see what sort of impact parks may have over time

## Technical Information
* This application was developed using React and Leaflet.
* The app is currently hosted on Heroku
