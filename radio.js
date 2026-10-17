/*
  HUTEMA Radio compact player
  Add licensed audio files to assets/radio/ and list them below.
  Example path: assets/radio/song-name.mp3
*/
(() => {
  const frame = document.getElementById("site-frame");
  const audio = document.getElementById("radio-audio");
  const playButton = document.getElementById("play-button");
  const playLabel = document.getElementById("play-label");
  const previousButton = document.getElementById("previous-button");
  const nextButton = document.getElementById("next-button");
  const titleNode = document.getElementById("track-title");
  const artistNode = document.getElementById("track-artist");
  const currentTimeNode = document.getElementById("current-time");
  const durationNode = document.getElementById("duration");
  const progress = document.getElementById("progress");
  const volume = document.getElementById("volume");
  const playlistToggle = document.getElementById("playlist-toggle");
  const playlistPanel = document.getElementById("playlist-panel");
  const playlistClose = document.getElementById("playlist-close");
  const playlistList = document.getElementById("playlist-list");
  const playlistNote = document.getElementById("playlist-note");
  const statusNode = document.getElementById("radio-status");
  const tabs = [...document.querySelectorAll(".playlist-tab")];

  // Replace these sample paths with MP3 files you have permission to use.
  // Category must be "fifa" or "worldcup".
  const tracks = [
    { title: "Add your first FIFA soundtrack", artist: "Put an MP3 in assets/radio", category: "fifa", src: "" },
    { title: "Add your first World Cup song", artist: "Put an MP3 in assets/radio", category: "worldcup", src: "" }
  ];

  let currentIndex = 0;
  let activeCategory = "all";
  let isLoadingTrack = false;

  function announce(message) {
    statusNode.textContent = message;
  }

  function formatTime(value) {
    if (!Number.isFinite(value) || value < 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function availableTracks() {
    return tracks.filter(track => track.src && track.src.trim());
  }

  function updatePlayState(playing) {
    playButton.classList.toggle("is-playing", playing);
    playButton.setAttribute("aria-label", playing ? "Pause" : "Play");
    playButton.title = playing ? "Pause" : "Play";
    playLabel.textContent = playing ? "Pause" : "Play";
  }

  function renderTrack() {
    const track = tracks[currentIndex];
    if (!track) return;
    titleNode.textContent = track.title;
    artistNode.textContent = track.artist;
    currentTimeNode.textContent = "0:00";
    durationNode.textContent = "0:00";
    progress.value = 0;
    [...playlistList.querySelectorAll(".playlist-song")].forEach(button => {
      const selected = Number(button.dataset.index) === currentIndex;
      button.classList.toggle("current", selected);
      button.setAttribute("aria-current", selected ? "true" : "false");
    });
  }

  function renderPlaylist() {
    playlistList.replaceChildren();
    const shown = tracks.map((track, index) => ({ ...track, index }))
      .filter(track => activeCategory === "all" || track.category === activeCategory);
    shown.forEach((track, shownIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "playlist-song" + (track.index === currentIndex ? " current" : "");
      button.dataset.index = String(track.index);
      button.innerHTML = `<span class="song-number">${String(shownIndex + 1).padStart(2, "0")}</span><span class="song-copy"><strong></strong><small></small></span>`;
      button.querySelector("strong").textContent = track.title;
      button.querySelector("small").textContent = track.artist;
      button.setAttribute("aria-label", `Play ${track.title} by ${track.artist}`);
      button.addEventListener("click", () => playTrack(track.index));
      playlistList.appendChild(button);
    });
    const hasFiles = availableTracks().length > 0;
    playlistNote.textContent = hasFiles
      ? "Select a song to play it. Playback stays in this bottom bar as you move around HUTEMA."
      : "The player design is ready. Add your licensed MP3 files in assets/radio and update the track list in radio.js to enable music.";
  }

  function playTrack(index) {
    if (!tracks.length) return;
    currentIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentIndex];
    renderTrack();
    if (!track.src) {
      updatePlayState(false);
      announce("Add an audio file for this track in assets/radio to enable playback.");
      renderPlaylist();
      return;
    }
    isLoadingTrack = true;
    audio.src = track.src;
    audio.load();
    audio.play().then(() => {
      isLoadingTrack = false;
      updatePlayState(true);
      announce(`Now playing ${track.title} by ${track.artist}`);
    }).catch(() => {
      isLoadingTrack = false;
      updatePlayState(false);
      announce("Playback could not start. Check the audio file path and try again.");
    });
    renderPlaylist();
  }

  playButton.addEventListener("click", () => {
    if (audio.paused) {
      if (audio.src) {
        audio.play().then(() => {
          updatePlayState(true);
          announce("Music playing");
        }).catch(() => {
          updatePlayState(false);
          announce("Playback could not start. Check the audio file path.");
        });
      } else {
        playTrack(currentIndex);
      }
    } else {
      audio.pause();
      updatePlayState(false);
      announce("Music paused");
    }
  });

  previousButton.addEventListener("click", () => playTrack(currentIndex - 1));
  nextButton.addEventListener("click", () => playTrack(currentIndex + 1));
  audio.addEventListener("play", () => updatePlayState(true));
  audio.addEventListener("pause", () => { if (!isLoadingTrack) updatePlayState(false); });
  audio.addEventListener("ended", () => playTrack(currentIndex + 1));
  audio.addEventListener("loadedmetadata", () => {
    durationNode.textContent = formatTime(audio.duration);
  });
  audio.addEventListener("timeupdate", () => {
    currentTimeNode.textContent = formatTime(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      progress.value = String(Math.round(audio.currentTime / audio.duration * 1000));
    }
  });
  audio.addEventListener("error", () => {
    if (audio.src) {
      updatePlayState(false);
      announce("This audio file could not be loaded. Check the filename and location.");
    }
  });
  progress.addEventListener("input", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Number(progress.value) / 1000 * audio.duration;
    }
  });
  volume.addEventListener("input", () => { audio.volume = Number(volume.value); });
  audio.volume = Number(volume.value);

  playlistToggle.addEventListener("click", () => {
    const opening = playlistPanel.hidden;
    playlistPanel.hidden = !opening;
    playlistToggle.setAttribute("aria-expanded", String(opening));
    if (opening) playlistList.querySelector("button")?.focus();
  });
  playlistClose.addEventListener("click", () => {
    playlistPanel.hidden = true;
    playlistToggle.setAttribute("aria-expanded", "false");
    playlistToggle.focus();
  });
  tabs.forEach(tab => tab.addEventListener("click", () => {
    activeCategory = tab.dataset.category;
    tabs.forEach(item => item.classList.toggle("active", item === tab));
    renderPlaylist();
  }));

  // Keep the site in the iframe while the player stays alive in this parent page.
  function getPageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("page") || "index.html";
  }
  function safeLocalPage(href) {
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return null;
      if (url.pathname.endsWith("/radio.html")) return null;
      if (!/\.(html?)$/i.test(url.pathname)) return null;
      return url.pathname.split("/").pop() + url.search + url.hash;
    } catch { return null; }
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
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank" || link.hasAttribute("download")) return;
        const page = safeLocalPage(link.href);
        if (!page) return;
        event.preventDefault();
        navigateInsideShell(page);
      });
      doc.querySelectorAll('form').forEach(form => {
        form.addEventListener("submit", event => {
          const action = form.getAttribute("action");
          if (action && !action.endsWith(".html")) return;
          event.preventDefault();
          announce("This form stays on the HUTEMA page.");
        });
      });
    } catch { /* Cross-origin pages are intentionally left alone. */ }
  });
  window.addEventListener("popstate", event => {
    const page = event.state?.page || getPageFromUrl();
    frame.src = page;
  });

  // A direct visit to radio.html?page=about.html opens the correct page in the shell.
  frame.src = getPageFromUrl();
  renderPlaylist();
  renderTrack();
  updatePlayState(false);
})();
