const API_BASE_URL = 'https://jokegen-backend.onrender.com';

const FAVORITES_KEY = 'favorites';

// Stable identity for a joke: prefer the backend id, fall back to text.
function jokeKey(joke) {
  return joke.id != null ? `id:${joke.id}` : `text:${joke.joke_text}`;
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function setFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isJokeFavorited(joke) {
  const key = jokeKey(joke);
  return getFavorites().some((fav) => jokeKey(fav) === key);
}

function toggleFavorite(joke) {
  const key = jokeKey(joke);
  let favorites = getFavorites();
  if (favorites.some((fav) => jokeKey(fav) === key)) {
    favorites = favorites.filter((fav) => jokeKey(fav) !== key);
  } else {
    favorites.push(joke);
  }
  setFavorites(favorites);
}

function escapeHtml(text) {
  const el = document.createElement('div');
  el.textContent = text;
  return el.innerHTML;
}

window.addEventListener('DOMContentLoaded', () => {
  const jokeDisplay = document.getElementById('joke-display');
  const randomJokeBtn = document.getElementById('random-joke-btn');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchSection = document.getElementById('search-section');
  const showMoreBtn = document.getElementById('show-more-btn');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const favoritesSidebar = document.getElementById('favorites-sidebar');
  const closeSidebarBtn = document.getElementById('close-sidebar');
  const favoritesSidebarList = document.getElementById('favorites-sidebar-list');

  let searchResultsData = [];
  let visibleCount = 0;
  const RESULTS_PER_BATCH = 5;

  // The favorited state is driven entirely by the `.favorited` CSS class.
  function createHeart(joke) {
    const heart = document.createElement('span');
    heart.textContent = '♥';
    heart.className = 'joke-heart';
    heart.setAttribute('role', 'button');
    heart.setAttribute('aria-label', 'Toggle favorite');
    heart.classList.toggle('favorited', isJokeFavorited(joke));
    heart.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(joke);
      updateFavoritesUI();
      heart.classList.toggle('favorited', isJokeFavorited(joke));
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
      empty.textContent = 'No favorites yet.';
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
      item.appendChild(createHeart(joke));
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

  // --- Sidebar open/close with focus management ---
  function showSidebar() {
    favoritesSidebar.classList.add('open');
    hamburgerMenu.setAttribute('aria-expanded', 'true');
    closeSidebarBtn.focus();
  }

  function hideSidebar() {
    favoritesSidebar.classList.remove('open');
    hamburgerMenu.setAttribute('aria-expanded', 'false');
    hamburgerMenu.focus();
  }

  hamburgerMenu.addEventListener('click', showSidebar);
  closeSidebarBtn.addEventListener('click', hideSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && favoritesSidebar.classList.contains('open')) {
      hideSidebar();
    }
  });

  clearSearchBtn.addEventListener('click', () => {
    searchSection.style.display = 'none';
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
