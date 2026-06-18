// Applies the saved theme before first paint to avoid a light-mode flash.
// Kept external (not inline) so it complies with a strict script-src CSP.
(function () {
  try {
    var t = localStorage.getItem("askbob.theme.v1") || "system";
    var dark =
      t === "dark" ||
      (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {
    /* ignore */
  }
})();
