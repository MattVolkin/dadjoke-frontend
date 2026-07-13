import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// favorites.js is a classic browser script that reads `document` and
// `localStorage` and attaches a `Favorites` namespace to the global object.
// Provide a real DOM + localStorage in Node globals BEFORE importing it, so the
// exact browser code runs under test.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;

await import('../favorites.js');
const { jokeKey, escapeHtml, isJokeFavorited, toggleFavorite, getFavorites } = globalThis.Favorites;

beforeEach(() => {
  globalThis.localStorage.clear();
});

test('jokeKey prefers the backend id', () => {
  assert.equal(jokeKey({ id: 42, joke_text: 'anything' }), 'id:42');
  assert.equal(jokeKey({ id: 0, joke_text: 'zero is a real id' }), 'id:0');
});

test('jokeKey falls back to text when id is missing', () => {
  assert.equal(jokeKey({ joke_text: 'no id here' }), 'text:no id here');
  assert.equal(jokeKey({ id: null, joke_text: 'null id' }), 'text:null id');
  assert.equal(jokeKey({ id: undefined, joke_text: 'undef id' }), 'text:undef id');
});

test('escapeHtml neutralizes HTML special characters', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
  assert.equal(escapeHtml('plain text'), 'plain text');
});

test('favorites toggle/isJokeFavorited round-trip', () => {
  const joke = { id: 7, joke_text: 'Why did the chicken...' };

  assert.equal(isJokeFavorited(joke), false);

  toggleFavorite(joke);
  assert.equal(isJokeFavorited(joke), true);
  assert.equal(getFavorites().length, 1);

  toggleFavorite(joke);
  assert.equal(isJokeFavorited(joke), false);
  assert.equal(getFavorites().length, 0);
});

test('favorited state is keyed by id, not object identity', () => {
  const fromSearch = { id: 7, joke_text: 'Why did the chicken...' };
  const fromRandom = { id: 7, joke_text: 'Why did the chicken...' };

  toggleFavorite(fromSearch);
  // A different object with the same id is recognized as the same favorite.
  assert.equal(isJokeFavorited(fromRandom), true);
});

test('id-less jokes are keyed by their text', () => {
  const a = { joke_text: 'unique joke A' };
  const b = { joke_text: 'unique joke B' };

  toggleFavorite(a);
  assert.equal(isJokeFavorited(a), true);
  assert.equal(isJokeFavorited(b), false);
});
