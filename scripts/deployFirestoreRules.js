const {JWT} = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  try {
    const keyPath = path.join(__dirname, '..', 'seed', 'serviceAccountKey.json');
    if (!fs.existsSync(keyPath)) {
      console.error('serviceAccountKey.json not found at', keyPath);
      process.exit(1);
    }
    const key = require(keyPath);
    const projectId = key.project_id;

    const rulesPath = path.join(__dirname, '..', 'firestore.rules');
    if (!fs.existsSync(rulesPath)) {
      console.error('firestore.rules not found at', rulesPath);
      process.exit(1);
    }
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    const client = new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const tokenRes = await client.authorize();
    const token = tokenRes.access_token;
    if (!token) throw new Error('Failed to obtain access token');

    console.log('Creating ruleset...');
    const createRes = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: {
          files: [
            { name: 'firestore.rules', content: rulesContent }
          ]
        }
      })
    });

    if (!createRes.ok) {
      const t = await createRes.text();
      throw new Error('Create ruleset failed: ' + createRes.status + ' ' + t);
    }
    const createJson = await createRes.json();
    const rulesetName = createJson.name; // projects/{project}/rulesets/{id}
    console.log('Created ruleset:', rulesetName);

    console.log('Updating Firestore release to use new ruleset...');
    const releaseName = `projects/${projectId}/releases/cloud.firestore`;
    const updateRes = await fetch(`https://firebaserules.googleapis.com/v1/${releaseName}?updateMask=rulesetName`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Try wrapping in a `release` object as some API endpoints expect the resource wrapper
      body: JSON.stringify({ release: { name: releaseName, rulesetName } })
    });

    if (!updateRes.ok) {
      const t = await updateRes.text();
      throw new Error('Update release failed: ' + updateRes.status + ' ' + t);
    }
    const updateJson = await updateRes.json();
    console.log('Updated release:', updateJson.name);
    console.log('Firestore rules deployed successfully.');
  } catch (err) {
    console.error('Error deploying rules:', err);
    process.exit(1);
  }
}

main();
