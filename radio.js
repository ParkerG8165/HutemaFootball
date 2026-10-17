(() => {
  const frame = document.getElementById("site-frame");
  const playButton = document.getElementById("radio-play");
  const nextButton = document.getElementById("radio-next");
  const status = document.getElementById("radio-status");
  const title = document.getElementById("track-title");
  const artist = document.getElementById("track-artist");

  function pageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("page") || "index.html";
    // Only allow simple local HTML filenames, not arbitrary external URLs.
    return /^[a-zA-Z0-9_-]+\.html$/.test(requested) ? requested : "index.html";
  }

  function setPage(page, push = true) {
    const safePage = /^[a-zA-Z0-9_-]+\.html$/.test(page) ? page : "index.html";
    frame.src = safePage;
    if (push) {
      const url = new URL(window.location.href);
      url.search = "?page=" + encodeURIComponent(safePage);
      history.pushState({ page: safePage }, "", url);
    }
  }

  window.hutemaNavigate = setPage;
  frame.src = pageFromUrl();

  // Intercept same-site links inside the frame so the outer player remains alive.
  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      doc.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
            link.target === "_blank" || link.hasAttribute("download")) return;
        const destination = new URL(link.href, frame.contentWindow.location.href);
        if (destination.origin !== location.origin) return;
        const page = destination.pathname.split("/").pop() || "index.html";
        if (!/^[a-zA-Z0-9_-]+\.html$/.test(page)) return;
        event.preventDefault();
        setPage(page);
      });
    } catch (error) {
      console.warn("HUTEMA Radio navigation could not attach to this page.", error);
    }
  });

  window.addEventListener("popstate", () => {
    frame.src = pageFromUrl();
  });

  // The interface is ready now; audio tracks will be connected in the playlist step.
  let requestedPlay = false;
  playButton.addEventListener("click", () => {
    requestedPlay = !requestedPlay;
    playButton.textContent = requestedPlay ? "Ⅱ" : "▶";
    playButton.setAttribute("aria-label", requestedPlay ? "Pause" : "Play");
    status.textContent = requestedPlay ? "READY FOR THE PLAYLIST" : "YOUR FOOTBALL SOUNDTRACK";
    title.textContent = requestedPlay ? "Playlist not connected yet" : "The playlist is coming soon";
    artist.textContent = "FIFA soundtracks • World Cup anthems";
  });
  nextButton.addEventListener("click", () => {
    status.textContent = "PLAYLIST NOT CONNECTED";
    title.textContent = "No tracks loaded yet";
    artist.textContent = "The Next button will work when the playlist is added";
  });
})();
