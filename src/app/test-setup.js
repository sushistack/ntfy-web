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

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

if (!globalThis.PointerEvent) {
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type, init = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "";
    }
  };
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.releasePointerCapture = () => {};
}
