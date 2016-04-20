# worker

Queries [TMDB](https://www.themoviedb.org) for movie data, and stores it in mongodb ready for consumption.

## Todo

* Collect information on movies, such as director, etc.
* Change all references of movie to film because we're British.
* Decide on shape of data for reviews
* Using /review/id, get the full details of a review by id and store in mongodb

## Environment variables

`TMDB_API_KEY` - API key for themoviedb.org
`MONGODB_URI` - Connect to mongo with just a URI? No Auth?

## Third-party Libraries

### moviedb

I'll be using the node package `moviedb`, as it supports TMDB API v3, and will save me some time (I hope).

### mongodb

As I'm not too experienced with mongodb, I'm going to stick with vanilla and not use any abstractions like mongoose. I'll keep it basic so that I don't break anything.

## Why TMDB?

Because IMDb make it incredibly hard for you to get at their data. They give you data dumps, but then this would be a dump parsing application and I don't really like that. I'll save data mining for another day.

## Limitations

TMDB, along with most other data sources I found, only offer immediate statistics. This means we don't have easy access to real data for things like the most popular movies in "the last week", "the last month", "the last year" etc. We only have access to the most popular movies "right now".

What we can do, for the sake of the demo, is Cornelius Fudge the numbers to make it look like we have historical data.
