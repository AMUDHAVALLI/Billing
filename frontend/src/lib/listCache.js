// A tiny in-memory cache for list pages (Cash Bills, Invoices, Products,
// Customers). Lives for as long as the browser tab does — Next's App Router
// keeps this module's state across client-side navigations, so coming back
// to a page you already visited shows the old data instantly instead of a
// blank spinner, while a fresh fetch quietly runs behind it and replaces
// the view once it lands. Lost on a full page reload, same as any other
// module-level state — that's fine, a first visit is supposed to wait.
const cache = new Map();

export function getCached(key) {
  return cache.get(key);
}

export function setCached(key, data) {
  cache.set(key, data);
}
