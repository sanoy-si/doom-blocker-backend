// contentScript.js
// Shows an onboarding overlay on YouTube when URL contains doomGuide=1.
// Keeps it one-time per tab via sessionStorage.

(function () {
  const url = new URL(location.href);
  if (url.hostname !== "www.youtube.com") return;
  if (url.searchParams.get("doomGuide") !== "1") return;

  const SESSION_KEY = "doom_onboard_done";
  if (sessionStorage.getItem(SESSION_KEY) === "1") return;

  // Create overlay UI
  const overlay = document.createElement("div");
  overlay.id = "doom-onboard-overlay";

  const card = document.createElement("div");
  card.id = "doom-onboard-card";

  const cornerTip = document.createElement("div");
  cornerTip.id = "doom-onboard-corner-tip";
  cornerTip.innerHTML =
    '<span class="hint">Extensions ▸ Pin Doom Blocker</span><span class="arrow">⬇</span>';

  let step = "A";

  function renderStep() {
    card.innerHTML = "";

    const title = document.createElement("h2");
    const body = document.createElement("p");
    const actions = document.createElement("div");
    actions.id = "doom-onboard-actions";
    let demoVid = null;

    if (step === "A") {
      title.textContent = "Pin Doom Blocker";
      body.textContent =
        "Click the Extensions (puzzle) button in the Chrome toolbar, then click the pin next to Doom Blocker.";

      // Optional short demo video (appended after the text)
      try {
        const src = chrome.runtime.getURL("assets/pin.mp4");
        const vid = document.createElement("video");
        vid.className = "doom-demo";
        // Ensure autoplay on Chrome: set muted/inline before setting src
        vid.muted = true;
        vid.setAttribute("muted", "");
        vid.autoplay = true;
        vid.setAttribute("autoplay", "");
        vid.loop = true;
        vid.setAttribute("loop", "");
        vid.playsInline = true;
        vid.setAttribute("playsinline", "");
        vid.preload = "auto";
        vid.setAttribute("preload", "auto");
        vid.controls = false;
        // Prefer <source> child with explicit type
        const source = document.createElement("source");
        source.src = src;
        source.type = "video/mp4";
        vid.appendChild(source);
        // Playback helpers
        const tryPlay = () => {
          vid.play().catch(() => showVideoFallback(src));
        };
        vid.addEventListener("canplay", tryPlay, { once: true });
        vid.addEventListener("error", () => showVideoFallback(src), {
          once: true,
        });
        demoVid = vid;
      } catch (_) {
        // If asset missing or blocked, silently ignore
      }

      const skip = btn("Skip");
      skip.onclick = completeAndClose;
      const pinned = btn("I pinned it", true);
      pinned.onclick = () => {
        step = "B";
        renderStep();
      };

      actions.append(skip, pinned);
    } else {
      title.textContent = "Open Doom Blocker";
      body.textContent =
        "you can open the extesnion by clicking the pined extesion icon . to see how the extension work  click open extesnion button below ";

      // Optional short demo video (second clip for opening the extension)
      try {
        const src = chrome.runtime.getURL("assets/pin2.mp4");
        const vid = document.createElement("video");
        vid.className = "doom-demo";
        vid.muted = true;
        vid.setAttribute("muted", "");
        vid.autoplay = true;
        vid.setAttribute("autoplay", "");
        vid.loop = true;
        vid.setAttribute("loop", "");
        vid.playsInline = true;
        vid.setAttribute("playsinline", "");
        vid.preload = "auto";
        vid.setAttribute("preload", "auto");
        vid.controls = false;
        const source = document.createElement("source");
        source.src = src;
        source.type = "video/mp4";
        vid.appendChild(source);
        // Playback helpers
        const tryPlay = () => {
          vid.play().catch(() => showVideoFallback(src));
        };
        vid.addEventListener("canplay", tryPlay, { once: true });
        vid.addEventListener("error", () => showVideoFallback(src), {
          once: true,
        });
        demoVid = vid;
      } catch (_) {
        // ignore
      }

      const manual = btn("I clicked the toolbar icon");
      manual.onclick = completeAndClose;

      const autoOpen = btn("Open extension", true);
      autoOpen.onclick = async () => {
        try {
          // Arm the popup tour, then try to open the popup.
          await sendMessage({ type: "ARM_POPUP_TOUR" });
          await sendMessage({ type: "OPEN_POPUP" });
        } catch (e) {
          // If it fails, user can still open manually.
          console.warn("openPopup failed (expected if no user gesture?):", e);
        } finally {
          completeAndClose();
        }
      };

      actions.append(manual, autoOpen);
    }

    card.append(title, body);
    if (demoVid) {
      card.appendChild(demoVid);
      // Kickstart autoplay quickly; CSS ensures it fills card width
      setTimeout(() => {
        demoVid.play().catch(() => {});
      }, 0);
    }
    function showVideoFallback(srcUrl) {
      // If playback fails (codec, policy, or resource), show a small link
      const note = document.createElement("div");
      note.className = "doom-demo-fallback";
      const a = document.createElement("a");
      a.href = srcUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Open short clip";
      note.textContent = "Preview: ";
      note.appendChild(a);
      card.appendChild(note);
    }
    card.append(actions);
  }

  function btn(text, primary = false) {
    const b = document.createElement("button");
    b.className = "doom-btn" + (primary ? " primary" : "");
    b.textContent = text;
    return b;
  }

  function completeAndClose() {
    sessionStorage.setItem(SESSION_KEY, "1");
    overlay.style.display = "none";
    cornerTip.remove();
    overlay.remove();
  }

  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (resp) => {
          const err = chrome.runtime.lastError;
          if (err) return reject(err);
          resolve(resp);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // Mount overlay
  overlay.appendChild(card);
  document.documentElement.appendChild(overlay);
  document.documentElement.appendChild(cornerTip);

  // Show overlay and step A
  overlay.style.display = "block";
  renderStep();
})();
