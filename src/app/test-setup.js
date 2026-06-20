// Polyfill window.config for tests — production apps get this from public/config.js (server-generated).
// Without this, config.js throws on module load (accesses window.config.base_url at import time).
globalThis.config = {
  base_url: "http://localhost",
  app_root: "/",
  enable_login: false,
  enable_signup: false,
  enable_payments: false,
  enable_web_push: false,
  require_login: false,
  disallowed_topics: [],
};
