// App configuration. Loaded before favorites.js/app.js so window.APP_CONFIG is
// available to them. This is the one place to point the frontend at a
// different backend — no need to edit app.js.
//
// For local development against a different backend, create config.local.js
// (gitignored) with the same shape and load it after this file in index.html;
// it will overwrite window.APP_CONFIG.
window.APP_CONFIG = {
  API_BASE_URL: 'https://jokegen-backend.onrender.com',
};
