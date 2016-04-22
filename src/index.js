const refresh = require('./refresh');
const interval = 3600000; // hourly ~ 60*60*1000 ms

const tick = async () => {
  console.log('Refreshing data store with fresh data');
  await refresh(); 
  setTimeout(tick, interval);
};

(() => {
  if (!process.env.TMDB_API_KEY) {
    console.error('TMDB_API_KEY is not set!');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set!');
    process.exit(1);
  }

  tick();
})();
