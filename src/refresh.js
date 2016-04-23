require('nomoreunhandledrejections')();

const moviedb = require('moviedb')(process.env.TMDB_API_KEY);
const mongodb = require('mongodb').MongoClient;
const sleep = require('es6-sleep').promise;
const slug = require('slug');
const throttleInterval = 1000;

// we don't like (too many) callbacks, so let's wrap them in a promise
// also, we don't like lots of wrappers, so let's make it generic
const performAsyncRequest = (method, filter) =>
  new Promise((resolve, reject) => {
    moviedb[method](filter, (error, data) => {
      if (error) reject(error);
      resolve(data);
    });
  });

// we only have access to immediate popularity data, so using this
// we can mock generate a mock value that is close to the original
const generateMockPopularity = (popularity) => {
  const modifier = (Math.random() < 0.5) ? -Math.random() : Math.random();
  return popularity + (popularity * (modifier / 2));
};

// themoviedb doesn't provide film length so we'll mock it
const generateMockFilmLength = () => {
  const minutes = 30 + Math.round(Math.random() * 30, 0);
  return `1h ${minutes}m`;
};

const updateGenres = async (db) => {
  const genreList = await performAsyncRequest('genreList');
  const genres = genreList.genres;

  // It would be nice to be able to do a single mass upsert concisely, alas, seems not
  // http://stackoverflow.com/questions/36773765/how-can-i-upsert-multiple-objects-with-mongodb-node-js/36773919
  for (let i = 0; i < genres.length; i++) {
    await db.collection('genres').update(
      { _id: genres[i].id },
      { name: genres[i].name },
      { upsert: true }
    );
  }

  console.log(`Updated ${genres.length} genres, now waiting ${throttleInterval} ms...\n`);
  await sleep(throttleInterval);
};

// our data source doesn't provide views or popularity of reviews
// so we're going to mock that data too from a few constants
const updateReviews = async (db, film) => {
  const reviews = await performAsyncRequest('movieReviews', { id: film._id });
  console.log(`Retrieved ${reviews.results.length} reviews...`);

  for (let i = 0; i < reviews.results.length; i++) {
    const original = reviews.results[i];
    const modified = Object.assign({}, original, {
      _id: original.id,
      filmSlug: film.slug,
      filmTitle: film.title,
      popularity_last_week: generateMockPopularity(50),
      popularity_last_month: generateMockPopularity(50),
      popularity_last_year: generateMockPopularity(50),
      popularity_all_time: generateMockPopularity(50)
    });

    delete modified.id;

    await db.collection('reviews').update(
      { _id: modified._id },
      modified,
      { upsert: true }
    );
  }

  console.log(`Done updating ${reviews.results.length} reviews`);
};

const updateFilms = async (db) => {
  const popularFilms = await performAsyncRequest('miscPopularMovies', {});
  console.log(`Retrieved ${popularFilms.results.length} films...\n`);

  for (let i = 0; i < popularFilms.results.length; i++) {
    const original = popularFilms.results[i];
    const filmSlug = slug(original.title).toLowerCase();

    console.log(`> Updating ${filmSlug} (${i}/${popularFilms.results.length})`);

    // grab the director (and any other cast/crew we want?)
    const credits = await performAsyncRequest('movieCredits', { id: original.id, append_to_response: 'director' });
    const director = credits.crew.filter((member) => member.job === 'Director')[0];
    const directorName = director && director.name || 'Unknown';

    const modified = Object.assign({}, original, {
      _id: original.id,
      slug: filmSlug,
      director: directorName,
      length: generateMockFilmLength(),
      popularity_last_week: original.popularity,
      popularity_last_month: generateMockPopularity(original.popularity),
      popularity_last_year: generateMockPopularity(original.popularity),
      popularity_all_time: generateMockPopularity(original.popularity)
    });

    delete modified.id;
    delete modified.popularity;

    await db.collection('films').update(
      { _id: modified._id },
      modified,
      { upsert: true }
    );

    await updateReviews(db, modified);

    console.log(`Updated ${filmSlug}, now waiting ${throttleInterval} ms...\n`);
    await sleep(throttleInterval);
  }

  console.log(`Done updating ${popularFilms.results.length} films`);
};

// our main refresh cycle, each run of this will do one single atomic refresh
// of our data store, including films, their reviews, and any other misc data
const main = async () => {
  const db = await mongodb.connect(process.env.MONGODB_URI);
  await updateGenres(db);
  await updateFilms(db);
  db.close();
};

module.exports = exports = main;
