Admin setup (simple checklist)

- Purpose: Ensure admin can add/delete turfs. Firestore rules only allow writes for the admin email configured in rules.

Steps:

1. Decide admin email (e.g. admin@example.com).

2. Update local environment: create a `.env` file in the project root with:

   REACT_APP_ADMIN_EMAIL=your-admin-email@example.com

   (Then restart the dev server if running.)

3. Update Firestore rules to match the same email. Open `firestore.rules` and replace the hardcoded email `admin@example.com` with your admin email (or deploy new rules using `scripts/deployFirestoreRules.js`).

4. Deploy rules (one option):

   - Ensure `seed/serviceAccountKey.json` is present and valid for your project.
   - Run: `node scripts/deployFirestoreRules.js`

   Or, use the Firebase CLI:

   - `firebase deploy --only firestore:rules`

5. Verify:

   - Login in the app with the admin email.
   - Open Admin page and try adding/deleting turf.

Troubleshooting:
- If you see a "permission" error in Admin page toasts, it means Firestore rejected the write; re-check steps 2-4.
- Make sure the authenticated user is actually logged in as the admin email shown on the Admin page.

(Short note: agar aap Hindi mein chahte hain, bataiye; main steps Hindi mein bhi de dunga.)