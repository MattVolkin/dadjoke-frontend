// Config (API_BASE_URL) lives in config.js; joke/favorites logic lives in
// favorites.js. Both are loaded as classic scripts before this one.
const { API_BASE_URL } = window.APP_CONFIG;
const { jokeKey, getFavorites, isJokeFavorited, toggleFavorite, escapeHtml } = window.Favorites;

window.addEventListener('DOMContentLoaded', () => {
  const jokeDisplay = document.getElementById('joke-display');
  const randomJokeBtn = document.getElementById('random-joke-btn');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchSection = document.getElementById('search-section');
  const jokeSection = document.getElementById('joke-section');
  const showMoreBtn = document.getElementById('show-more-btn');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const favoritesToggle = document.getElementById('favorites-toggle');
  const favoritesSidebar = document.getElementById('favorites-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const closeSidebarBtn = document.getElementById('close-sidebar');
  const favoritesSidebarList = document.getElementById('favorites-sidebar-list');

  let searchResultsData = [];
  let visibleCount = 0;
  const RESULTS_PER_BATCH = 5;

  // localStorage is the single source of truth for favorites; every heart in
  // the DOM derives its state from it. A joke can be shown in several places at
  // once (main display, search results, sidebar), so toggling one heart must
  // re-sync all hearts that share the same joke key.
  function applyFavoritedState(heart, favorited) {
    heart.classList.toggle('favorited', favorited);
    heart.setAttribute('aria-pressed', String(favorited));
  }

  function syncHeartsForKey(key) {
    const favorited = getFavorites().some((fav) => jokeKey(fav) === key);
    document.querySelectorAll('.joke-heart').forEach((heart) => {
      if (heart.dataset.jokeKey === key) {
        applyFavoritedState(heart, favorited);
      }
    });
  }

  // A real <button> is focusable and activatable by keyboard (Enter/Space)
  // out of the box, so no manual tabindex/keydown handling is needed. In the
  // sidebar every heart is already a saved favorite, so its only action is
  // removal — label it accordingly for screen readers and hover tooltips.
  function createHeart(joke, context) {
    const key = jokeKey(joke);
    const heart = document.createElement('button');
    heart.type = 'button';
    heart.textContent = '♥';
    heart.className = 'joke-heart';
    heart.dataset.jokeKey = key;
    const label = context === 'sidebar' ? 'Remove from favorites' : 'Toggle favorite';
    heart.setAttribute('aria-label', label);
    heart.title = label;
    applyFavoritedState(heart, isJokeFavorited(joke));
    heart.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(joke);
      updateFavoritesUI();
      syncHeartsForKey(key);
    });
    return heart;
  }

  function createMediaContainer(joke) {
    const container = document.createElement('div');
    container.className = 'media-container';

    const audio = document.createElement('audio');
    audio.src = `${API_BASE_URL}${joke.audio_file_path}`;
    audio.controls = true;
    audio.className = 'audio-player';

    container.appendChild(audio);
    container.appendChild(createHeart(joke));
    return container;
  }

  function populateJokeContents(el, joke) {
    el.innerHTML = '';
    const jokeText = document.createElement('p');
    jokeText.innerHTML = escapeHtml(joke.joke_text || 'No joke found.').replace(/\n/g, '<br>');
    el.appendChild(jokeText);
    if (joke.audio_file_path) {
      el.appendChild(createMediaContainer(joke));
    }
  }

  function displayJoke(joke) {
    populateJokeContents(jokeDisplay, joke);
  }

  function createJokeCard(joke) {
    const card = document.createElement('div');
    card.className = 'search-result';
    populateJokeContents(card, joke);
    return card;
  }

  function renderFavoritesSidebar(favorites) {
    favoritesSidebarList.innerHTML = '';
    if (favorites.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = '💛 No favorites yet — tap the heart on a joke to save it.';
      favoritesSidebarList.appendChild(empty);
      return;
    }
    favorites.forEach((joke) => {
      const item = document.createElement('div');
      item.className = 'favorite-item';

      const textEl = document.createElement('span');
      textEl.textContent = joke.joke_text;
      textEl.className = 'favorite-item-text';
      textEl.addEventListener('click', () => displayJoke(joke));

      item.appendChild(textEl);
      item.appendChild(createHeart(joke, 'sidebar'));
      favoritesSidebarList.appendChild(item);
    });
  }

  function updateFavoritesUI() {
    renderFavoritesSidebar(getFavorites());
  }

  function renderSearchBatch() {
    const end = Math.min(visibleCount + RESULTS_PER_BATCH, searchResultsData.length);
    for (let i = visibleCount; i < end; i++) {
      searchResults.appendChild(createJokeCard(searchResultsData[i]));
    }
    visibleCount = end;
    showMoreBtn.style.display = visibleCount < searchResultsData.length ? 'block' : 'none';
  }

  // On wide screens the favorites panel is docked and always visible; below
  // this width it collapses into the slide-out drawer. Only in drawer mode do
  // the backdrop, `inert`, and focus trap apply.
  const dockQuery = window.matchMedia('(min-width: 1100px)');

  function syncSidebarMode() {
    if (dockQuery.matches) {
      // Docked: always visible and interactive, no drawer chrome.
      favoritesSidebar.classList.remove('open');
      favoritesSidebar.removeAttribute('inert');
      favoritesSidebar.setAttribute('aria-hidden', 'false');
      sidebarBackdrop.classList.remove('open');
      sidebarBackdrop.hidden = true;
      favoritesToggle.setAttribute('aria-expanded', 'false');
    } else if (!favoritesSidebar.classList.contains('open')) {
      // Collapsed and closed: skip it in the Tab order and for assistive tech.
      favoritesSidebar.setAttribute('inert', '');
      favoritesSidebar.setAttribute('aria-hidden', 'true');
    }
  }

  // --- Sidebar open/close with focus management (drawer mode only) ---
  // While closed, the drawer is `inert` + aria-hidden so it is skipped by both
  // the Tab order and assistive tech. While open, Tab is trapped inside it.
  function showSidebar() {
    favoritesSidebar.classList.add('open');
    sidebarBackdrop.hidden = false;
    // Let the element paint before starting the opacity transition.
    requestAnimationFrame(() => sidebarBackdrop.classList.add('open'));
    favoritesSidebar.removeAttribute('inert');
    favoritesSidebar.setAttribute('aria-hidden', 'false');
    favoritesToggle.setAttribute('aria-expanded', 'true');
    closeSidebarBtn.focus();
  }

  function hideSidebar() {
    favoritesSidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('open');
    sidebarBackdrop.hidden = true;
    favoritesSidebar.setAttribute('inert', '');
    favoritesSidebar.setAttribute('aria-hidden', 'true');
    favoritesToggle.setAttribute('aria-expanded', 'false');
    favoritesToggle.focus();
  }

  // Keep focus inside the open drawer: wrap Tab / Shift+Tab at the ends.
  function trapSidebarFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = favoritesSidebar.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  favoritesToggle.addEventListener('click', showSidebar);
  closeSidebarBtn.addEventListener('click', hideSidebar);
  sidebarBackdrop.addEventListener('click', hideSidebar);
  dockQuery.addEventListener('change', syncSidebarMode);
  syncSidebarMode(); // set correct initial state (HTML defaults to drawer-closed)

  document.addEventListener('keydown', (e) => {
    if (!favoritesSidebar.classList.contains('open')) return;
    if (e.key === 'Escape') {
      hideSidebar();
    } else {
      trapSidebarFocus(e);
    }
  });

  clearSearchBtn.addEventListener('click', () => {
    searchSection.style.display = 'none';
    // Restore the focused-away Random Joke section.
    jokeSection.style.display = '';
    searchResults.innerHTML = '';
    searchInput.value = '';
    searchResultsData = [];
    visibleCount = 0;
  });

  updateFavoritesUI();

  randomJokeBtn.addEventListener('click', async () => {
    jokeDisplay.textContent = 'Loading...';
    try {
      const response = await fetch(`${API_BASE_URL}/random`);
      if (!response.ok) {
        jokeDisplay.textContent = `Error: ${response.status} ${response.statusText}`;
        return;
      }
      const data = await response.json();
      if (data.error) {
        jokeDisplay.textContent = 'Error: ' + data.error;
      } else {
        displayJoke(data);
      }
    } catch (err) {
      jokeDisplay.textContent = 'Failed to fetch joke. Is the backend running?';
      console.error(err);
    }
  });

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const term = searchInput.value.trim();
    if (!term) return;

    searchResults.innerHTML = 'Searching...';
    searchSection.style.display = 'block';
    // Focused search view: hide the Random Joke section until the search is cleared.
    jokeSection.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE_URL}/search?term=${encodeURIComponent(term)}`);
      if (!response.ok) {
        searchResults.textContent = `Error: ${response.status} ${response.statusText}`;
        showMoreBtn.style.display = 'none';
        return;
      }
      const data = await response.json();
      if (data.error) {
        searchResults.textContent = 'Error: ' + data.error;
        showMoreBtn.style.display = 'none';
      } else if (data.jokes && data.jokes.length > 0) {
        searchResultsData = data.jokes;
        visibleCount = 0;
        searchResults.innerHTML = '';
        renderSearchBatch();
      } else {
        searchResults.textContent = 'No jokes found.';
        showMoreBtn.style.display = 'none';
      }
    } catch (err) {
      searchResults.textContent = 'Failed to fetch search results.';
      showMoreBtn.style.display = 'none';
      console.error(err);
    }
  });

  showMoreBtn.addEventListener('click', renderSearchBatch);
});
