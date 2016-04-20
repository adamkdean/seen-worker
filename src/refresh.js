require('nomoreunhandledrejections')();

const moviedb = require('moviedb')(process.env.TMDB_API_KEY);
const mongodb = require('mongodb').MongoClient;

const performAsyncRequest = (method, filter) =>
  new Promise((resolve, reject) => {
    moviedb[method](filter, (error, data) => {
      if (error) reject(error);
      resolve(data);
    });
  });

const generateMockPopularity = (popularity) => {
  const modifier = (Math.random() < 0.5) ? -Math.random() : Math.random();
  return popularity + (popularity * (modifier / 2));
};

const main = async () => {
  const db = await mongodb.connect(process.env.MONGODB_URI);
  const popularMovies = await performAsyncRequest('miscPopularMovies', {});
  console.log(`Retrieved ${popularMovies.results.length} movies`);

  // loop through all retrieved movies, mock a bit of data, save to mongo
  for (let i = 0; i < popularMovies.results.length; i++) {
    const original = popularMovies.results[i];
    const modified = Object.assign({}, original, {
      _id: original.id,
      popularity_last_week: generateMockPopularity(original.popularity),
      popularity_last_month: generateMockPopularity(original.popularity),
      popularity_last_year: generateMockPopularity(original.popularity),
      popularity_all_time: generateMockPopularity(original.popularity)
    });

    await db.collection('movies').update(
      { _id: modified._id },
      modified,
      { upsert: true }
    );
  }

  console.log(`Done updating ${popularMovies.results.length} movies`);
  db.close();
};

module.exports = exports = main;
