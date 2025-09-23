// popup.js
// Minimal popup UI with a tiny 2-step guide when armed by background.

(function () {
  const filtersEl = document.getElementById("filters");
  const applyBtn = document.getElementById("apply");

  applyBtn?.addEventListener("click", async () => {
    const value = (filtersEl?.value || "").trim();
    try {
      await chrome.storage.local.set({ doomFilters: value });
      // Optional: close popup after apply
      window.close();
    } catch (e) {
      console.warn("Failed to save filters:", e);
    }
  });

  // Ask background if we should run the tiny tour
  chrome.runtime.sendMessage({ type: "SHOULD_RUN_POPUP_TOUR" }, (resp) => {
    const err = chrome.runtime.lastError;
    if (err) return;
    if (!resp || !resp.run) return;
    runPopupTour();
  });

  function runPopupTour() {
    const overlay = document.getElementById("popup-tour-overlay");
    const card = document.getElementById("popup-tour-card");
    const title = document.getElementById("tour-title");
    const body = document.getElementById("tour-body");
    const actions = document.getElementById("popup-tour-actions");

    let step = 1;

    function render() {
      actions.innerHTML = "";
      if (step === 1) {
        title.textContent = "Type filters here";
        body.textContent =
          'Enter words like "shorts" or "recommendations" in the box.';
        const next = smBtn("Next", true);
        next.onclick = () => {
          step = 2;
          render();
        };
        actions.append(next);
      } else {
        title.textContent = "Click Apply filters";
        body.textContent = "This will save them.";
        const done = smBtn("Done", true);
        done.onclick = () => {
          overlay.style.display = "none";
        };
        actions.append(done);
      }
    }

    function smBtn(text, primary = false) {
      const b = document.createElement("button");
      b.className = "sm-btn" + (primary ? " primary" : "");
      b.textContent = text;
      return b;
    }

    overlay.style.display = "block";
    render();
  }
})();
