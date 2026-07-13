// Shared joke/favorites logic.
//
// Written as a classic browser script: it defines an IIFE that attaches a
// `Favorites` namespace to the global object (window in the browser). Loading
// it via <script src="favorites.js"> before app.js exposes window.Favorites;
// importing it in a Node test (with a DOM + localStorage in scope) runs the
// same IIFE and exposes globalThis.Favorites, so the exact browser code is
// what gets unit-tested.
(function (root) {
  'use strict';

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

  root.Favorites = {
    FAVORITES_KEY,
    jokeKey,
    getFavorites,
    setFavorites,
    isJokeFavorited,
    toggleFavorite,
    escapeHtml,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
