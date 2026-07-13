# Dad Joke Player

Dad Joke Player is a lightweight frontend for browsing, searching, and saving jokes with audio playback support. It is built as a static site with plain HTML, CSS, and JavaScript, and it talks to a backend API for joke data.

## Project URL

[https://www.nachoaveragedadjoke.com/](https://www.nachoaveragedadjoke.com/)

## Features

- Fetch a random joke from the API with one click.
- Search jokes by keyword and load results in batches.
- Play audio when a joke includes an `audio_file_path`.
- Save and remove favorites in the browser using localStorage.
- Open the favorites sidebar from the hamburger menu.
- Responsive layout for desktop and mobile screens.

## Project Structure

- `index.html` - App shell and UI layout.
- `style.css` - Visual design, responsive rules, and sidebar styles.
- `app.js` - API calls, rendering logic, search, and favorites handling.
- `favicon.svg` - Site favicon.
- `CNAME` - Custom domain configuration for GitHub Pages.

## How It Works

The frontend expects a backend that exposes joke endpoints. In `app.js`, the API base URL is configured with `API_BASE_URL`, and the app uses that value to fetch jokes and resolve audio file paths.

Current behavior includes:

- `GET /random` to load a random joke.
- `GET /search?term=...` to search jokes.
- Favorites are persisted in `localStorage` under the key `favorites`.

## Running Locally

Because this is a static frontend that uses `fetch()`, it is best to serve it through a local web server instead of opening `index.html` directly.

1. Open the project folder in VS Code or your editor.
2. Start a simple static server, such as Live Server or any local HTTP server.
3. Open the site in your browser.
4. Make sure the backend URL in `app.js` points to a running API.

Example backend URLs used by the app:

- `https://jokegen-backend.onrender.com/random`
- `https://jokegen-backend.onrender.com/search?term=keyword`

## Configuration

If you want to point the frontend at a different backend, update `API_BASE_URL` in `app.js`.

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
