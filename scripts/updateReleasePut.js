const {JWT} = require('google-auth-library');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const key = require('../seed/serviceAccountKey.json');
(async()=>{
  try{
    const client = new JWT({email: key.client_email, key: key.private_key, scopes: ['https://www.googleapis.com/auth/cloud-platform']});
    const t = await client.authorize();
    const token = t.access_token;
    const projectId = key.project_id;
    const ruleset = 'projects/turf-1c32c/rulesets/8bbecd27-687a-440d-833b-b8235dba3147';
    const url = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`;
    console.log('PUT', url);
    const res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `projects/${projectId}/releases/cloud.firestore`, rulesetName: ruleset })
    });
    console.log('status', res.status);
    console.log(await res.text());
  } catch (err) { console.error(err); process.exit(1); }
})();
