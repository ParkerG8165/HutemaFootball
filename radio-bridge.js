(() => {
  // Only redirect top-level page visits. Pages loaded inside radio.html's iframe stay put.
  if (window.top !== window.self) return;
  const file = window.location.pathname.split("/").pop() || "index.html";
  if (!/^[a-zA-Z0-9_-]+\.html$/.test(file) || file === "radio.html") return;
  const destination = new URL("radio.html", window.location.href);
  destination.searchParams.set("page", file);
  if (window.location.search) destination.searchParams.set("originalQuery", window.location.search);
  if (window.location.hash) destination.hash = window.location.hash;
  window.location.replace(destination.toString());
})();