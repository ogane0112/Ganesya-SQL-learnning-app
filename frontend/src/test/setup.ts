import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrollIntoView; ProblemSolve calls it after each run
// to bring the result pane into view on mobile (要件9.7).
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom's default navigator.language ("en-US") would otherwise make i18n's
// browser-language detection pick English, breaking the Japanese-text
// assertions tests rely on. Pin the persisted locale before i18n initializes.
// A dynamic import is required here (rather than a static one) because
// static imports are hoisted above this statement, which would read
// localStorage before it's been seeded.
window.localStorage.setItem("sql-app:locale", "ja");
await import("../i18n");
