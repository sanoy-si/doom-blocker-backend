// Onboarding two-step UI logic and "Open Extension" action

(function () {
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");
  const next = document.getElementById("next-step");
  const close1 = document.getElementById("close-1");
  const close2 = document.getElementById("close-2");
  const openExtension = document.getElementById("open-extension");

  next?.addEventListener("click", () => {
    step1?.classList.remove("active");
    step2?.classList.add("active");
  });

  function closeOverlay() {
    try {
      parent.postMessage({ type: "TOPAZ_ONBOARDING_CLOSE" }, "*");
    } catch {}
    if (window.top === window.self) window.close();
  }
  close1?.addEventListener("click", closeOverlay);
  close2?.addEventListener("click", closeOverlay);

  async function openLikeUserClick() {
    try {
      // Best-effort: open the action popup like a real click (MV3 Chrome-only API)
      if (chrome.action && chrome.action.openPopup) {
        await chrome.action.openPopup();
        closeOverlay();
        return;
      }
    } catch (e) {
      // fall through to tab open
    }
    try {
      const url = chrome.runtime.getURL("popup/popup.html");
      chrome.tabs ? chrome.tabs.create({ url }) : window.open(url, "_blank");
      closeOverlay();
    } catch (e) {
      console.warn("[Onboarding] Failed to open extension page:", e);
    }
  }

  openExtension?.addEventListener("click", openLikeUserClick);
})();
