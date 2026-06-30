Welcome to the Online Turf Booking App repository! This project allows users to book sports turfs online. It's built using React.js for the frontend and Firebase for the backend. With this project, you can learn how to create a dynamic web application for managing turf bookings.

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Screenshots](#screenshots)
- [Contributing](#contributing)

## Demo

Check out the live demo of the Online Turf Booking App: https://turfz-5834b.web.app/

## Features


<!--
## Admin Panel

An admin panel is available at `/admin` to add and delete turfs from your Firestore collections (cricket, football, basketball, badminton).

Setup steps:

- Set the admin email in your React env: create a `.env.local` with `REACT_APP_ADMIN_EMAIL=youremail@example.com`.
- Update `firestore.rules` to replace the placeholder `admin@example.com` with your admin email and deploy the rules (see `scripts/deployFirestoreRules.js`).
- Sign in to the app with the admin email; the `Admin Panel` link appears in the footer. You can also visit `/admin` directly while signed in.

When signed in as the admin, the panel allows adding a turf (choose sport + details) and deleting turfs. If you run into permission errors, check your Firestore rules and that your user email matches the configured admin email.
-->
## Admin Panel

An admin panel is available at `/admin` to add and delete turfs from your Firestore collections (cricket, football, basketball, badminton).

Setup steps:

- Set the admin email in your React env: create a `.env.local` with `REACT_APP_ADMIN_EMAIL=youremail@example.com`.
- Update `firestore.rules` to replace the placeholder `admin@example.com` with your admin email and deploy the rules (see `scripts/deployFirestoreRules.js`).
- Sign in to the app with the admin email; the `Admin Panel` link appears in the footer. You can also visit `/admin` directly while signed in.

When signed in as the admin, the panel allows adding a turf (choose sport + details) and deleting turfs. If you run into permission errors, check your Firestore rules and that your user email matches the configured admin email.
## Installation

Follow these steps to set up the project on your local machine:

1. Clone this repository: `https://github.com/Joel-K-James/Turfz.git`
2. Navigate to the project directory: `cd Turfz`
3. Install dependencies: `npm install`

## Usage

1. Set up your Firebase project and update the Firebase configuration in `src/firebase.js`.
2. Run the development server: `npm start`
3. Open your web browser and go to `http://localhost:3000`

## Technologies Used

- React.js - A JavaScript library for building user interfaces.
- Firebase - A platform for building web and mobile applications.

## Screenshots
## Front Page
<img width="1265" alt="Screenshot 2023-08-30 221735" src="https://github.com/Joel-K-James/Turfz/assets/85893912/973b227a-e6bd-47f3-b2f9-12098905c05c">

## Login
<img width="1118" alt="Screenshot 2023-08-30 221759" src="https://github.com/Joel-K-James/Turfz/assets/85893912/d4a83865-d5b1-4040-adb8-b2c7f6515dab">

## Interface
<img width="1261" alt="Screenshot 2023-08-30 221825" src="https://github.com/Joel-K-James/Turfz/assets/85893912/5ecc9d6e-2e99-4ce5-a4a1-7c1648970121">

## Booking
<img width="1265" alt="Screenshot 2023-08-30 221918" src="https://github.com/Joel-K-James/Turfz/assets/85893912/93725dea-28d8-4fd4-aea6-06c74a86d502">

## Confirmation received
<img width="1278" alt="Screenshot 2023-08-30 221940" src="https://github.com/Joel-K-James/Turfz/assets/85893912/b61b59ec-e348-489b-aa92-d062cc386db4">

See ADMIN_SETUP.md for admin troubleshooting.

## Contributing

Contributions are welcome! If you find any issues or want to enhance the project, feel free to create a pull request.
