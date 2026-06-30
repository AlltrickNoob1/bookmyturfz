const {JWT} = require('google-auth-library');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const key = require('../seed/serviceAccountKey.json');
(async()=>{
  const client = new JWT({email: key.client_email, key: key.private_key, scopes: ['https://www.googleapis.com/auth/cloud-platform']});
  const t = await client.authorize();
  const token = t.access_token;
  const projectId = key.project_id;
  const url = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`;
  console.log('GET', url);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  console.log('status', res.status);
  const body = await res.text();
  console.log('body:', body);
})();
