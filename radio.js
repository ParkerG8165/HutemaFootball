(() => {
  const frame = document.getElementById("site-frame");

  function getPageFromUrl() {
    return new URLSearchParams(window.location.search).get("page") || "index.html";
  }

  function safeLocalPage(href) {
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return null;
      if (url.pathname.endsWith("/radio.html")) return null;
      if (!/\.(html?)$/i.test(url.pathname)) return null;
      return url.pathname.split("/").pop() + url.search + url.hash;
    } catch {
      return null;
    }
  }

  function navigateInsideShell(page, push = true) {
    const cleanPage = page || "index.html";
    frame.src = cleanPage;
    if (push) {
      const url = new URL(window.location.href);
      url.searchParams.set("page", cleanPage);
      history.pushState({ page: cleanPage }, "", url);
    }
  }

  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument;
      if (!doc || doc.documentElement.dataset.radioBound === "yes") return;
      doc.documentElement.dataset.radioBound = "yes";
      doc.addEventListener("click", event => {
        const link = event.target.closest("a[href]");
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
            link.target === "_blank" || link.hasAttribute("download")) return;
        const page = safeLocalPage(link.href);
        if (!page) return;
        event.preventDefault();
        navigateInsideShell(page);
      });
    } catch {
      // External/cross-origin pages are not intercepted.
    }
  });

  window.addEventListener("popstate", event => {
    frame.src = event.state?.page || getPageFromUrl();
  });

  frame.src = getPageFromUrl();
})();
