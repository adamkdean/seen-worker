require('nomoreunhandledrejections')();

const moviedb = require('moviedb')(process.env.TMDB_API_KEY);
const mongodb = require('mongodb').MongoClient;
const sleep = require('es6-sleep').promise;
const throttleInterval = 1000;

// we don't like callbacks, so let's wrap them in a promise
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

const updateFilms = async (db) => {
  const popularFilms = await performAsyncRequest('miscPopularMovies', {});
  console.log(`Retrieved ${popularFilms.results.length} films...`);

  for (let i = 0; i < popularFilms.results.length; i++) {
    const original = popularFilms.results[i];
    const modified = Object.assign({}, original, {
      _id: original.id,
      popularity_last_week: generateMockPopularity(original.popularity),
      popularity_last_month: generateMockPopularity(original.popularity),
      popularity_last_year: generateMockPopularity(original.popularity),
      popularity_all_time: generateMockPopularity(original.popularity)
    });

    await db.collection('films').update(
      { _id: modified._id },
      modified,
      { upsert: true }
    );

    updateReviews(db, original.id);

    console.log(`Updated ${popularFilms.results[i].title}, now waiting ${throttleInterval} ms...`);
    await sleep(throttleInterval);
  }

  console.log(`Done updating ${popularFilms.results.length} films`);
};

// our data source doesn't provide views or popularity of reviews
// so we're going to mock that data too from a few constants
const updateReviews = async (db, filmId) => {
  const reviews = await performAsyncRequest('movieReviews', { id: filmId });
  console.log(`Retrieved ${reviews.results.length} reviews...`);

  for (let i = 0; i < reviews.results.length; i++) {
    const original = reviews.results[i];
    const modified = Object.assign({}, original, {
      _id: original.id,
      filmId: filmId,
      popularity_last_week: generateMockPopularity(500),
      popularity_last_month: generateMockPopularity(2000),
      popularity_last_year: generateMockPopularity(20000),
      popularity_all_time: generateMockPopularity(50000)
    });

    await db.collection('reviews').update(
      { _id: modified._id },
      modified,
      { upsert: true }
    );
  }

  console.log(`Done updating ${reviews.results.length} reviews`);
};

// our main refresh cycle, each run of this will do one single atomic refresh
// of our data store, including films, their reviews, and any other misc data
const main = async () => {
  const db = await mongodb.connect(process.env.MONGODB_URI);
  await updateFilms(db);
  db.close();
};

module.exports = exports = main;
