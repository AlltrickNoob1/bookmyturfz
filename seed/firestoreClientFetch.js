const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_KEY = 'Enter_Your_API_KEY';
const projectId = 'turf-1c32c';
const collection = 'cricket';

const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?key=${API_KEY}`;

(async () => {
  try {
    console.log('Request URL:', url);
    const res = await fetch(url);
    console.log('HTTP status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('Fetch error:', err);
  }
})();
