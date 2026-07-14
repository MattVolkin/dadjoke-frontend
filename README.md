# Nacho Average Dad Jokes

Nacho Average Dad Jokes is a lightweight frontend for browsing, searching, and saving jokes with audio playback support. It is built as a static site with plain HTML, CSS, and JavaScript, and it talks to a backend API for joke data.

## Project URL

URL: [https://www.nachoaveragedadjoke.com/](https://www.nachoaveragedadjoke.com/)

The backend API that serves the jokes lives in a separate repo:
[MattVolkin/dadjoke-backend](https://github.com/MattVolkin/dadjoke-backend).

## Features

- Fetch a random joke from the API with one click.
- Search jokes by keyword and load results in batches.
- Play audio when a joke includes an `audio_file_path`.
- Save and remove favorites in the browser using localStorage.
- Favorites panel that docks beside the joke player on wide screens and collapses
  into a slide-out drawer (opened by the **Favorites** button) when space is tight.
- Responsive layout for desktop and mobile screens, with light and dark themes.

## Project Structure

- `index.html` - App shell and UI layout.
- `style.css` - Visual design, responsive rules, and sidebar styles.
- `config.js` - Deployment config (currently just `API_BASE_URL`); the one place to point the frontend at a different backend.
- `favorites.js` - Pure joke/favorites logic (`jokeKey`, `escapeHtml`, favorites storage), unit-tested in `test/`.
- `app.js` - API calls, rendering logic, search, and favorites handling.
- `favicon.svg` - Site favicon.
- `CNAME` - Custom domain configuration for GitHub Pages.

## How It Works

The frontend expects a backend that exposes joke endpoints (see the
[dadjoke-backend](https://github.com/MattVolkin/dadjoke-backend) repo). The API base URL is configured in `config.js` as `window.APP_CONFIG.API_BASE_URL`, and the app uses that value to fetch jokes and resolve audio file paths.

Current behavior includes:

- `GET /random` to load a random joke.
- `GET /search?term=...` to search jokes.
- Favorites are persisted in `localStorage` under the key `favorites`.

## Running Locally

Because this is a static frontend that uses `fetch()`, it is best to serve it through a local web server instead of opening `index.html` directly.

1. Open the project folder in VS Code or your editor.
2. Start a simple static server, such as Live Server or any local HTTP server.
3. Open the site in your browser.
4. Make sure `config.js` (or a local override, see "Configuration") points at a running API.

Example backend URLs used by the app:

- `https://jokegen-backend.onrender.com/random`
- `https://jokegen-backend.onrender.com/search?term=keyword`

## Configuration

The backend URL is set once, in `config.js`:

```js
window.APP_CONFIG = {
  API_BASE_URL: 'https://jokegen-backend.onrender.com',
};
```

To point at a different backend for local development, create `config.local.js`
(gitignored, so it never gets committed) with the same shape, and uncomment the
`config.local.js` `<script>` tag in `index.html`:

```js
// config.local.js
window.APP_CONFIG = {
  API_BASE_URL: 'http://localhost:5000',
};
```

It loads after `config.js` and overwrites `window.APP_CONFIG`, so nothing else
needs to change. Remember to re-comment the tag (or just delete `config.local.js`)
before committing.

## Development

The app ships as plain HTML/CSS/JS with no build step. Prettier and ESLint are
included only as a lightweight quality gate.

1. Install the dev tooling:
   ```bash
   npm install
   ```
2. Format all files:
   ```bash
   npm run format
   ```
   Or check formatting without writing changes with `npm run format:check`.
3. Lint the JavaScript:
   ```bash
   npm run lint
   ```

## Notes

- Search results are rendered in batches of 5 and can be expanded with the Show More Results button.
- Jokes with audio show an inline audio player.
- Favorites are stored per browser using `localStorage`. Clearing cookies has no effect on saved favorites.
