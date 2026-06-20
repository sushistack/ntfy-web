/**
 * Flip a flag to `true` to enable the new implementation for that area.
 * Leave all flags `false` until a feature area is complete and tested.
 * This is the runtime rollback switch — no build step required to recover.
 */
export const NEW = {
  shell: false,
  feed: false,
  detail: false,
  dialogs: false,
  settings: false,
  auth: false,
};
