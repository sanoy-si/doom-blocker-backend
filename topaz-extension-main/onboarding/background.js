// background.js (service worker)
// Handles one-time popup tour arming and opening the action popup.

let armPopupTour = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message && message.type === "ARM_POPUP_TOUR") {
        armPopupTour = true;
        sendResponse({ ok: true });
        return; // Important: return after sendResponse
      }
      if (message && message.type === "OPEN_POPUP") {
        // Must be triggered from a user gesture (button click in content script)
        try {
          await chrome.action.openPopup();
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, error: String(e) });
        }
        return;
      }
      if (message && message.type === "SHOULD_RUN_POPUP_TOUR") {
        const run = armPopupTour;
        armPopupTour = false; // one-time
        sendResponse({ run });
        return;
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true; // keep message channel open for async
});
