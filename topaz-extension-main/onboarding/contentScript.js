// Onboarding content script: injects the onboarding UI on YouTube when `?doomGuide=1` is present
// and loads an iframe pointing to our web-accessible onboarding page.
// Shows only ONCE per user using Chrome storage to track completion.

(() => {
  try {
    const url = new URL(window.location.href);
    const enable = url.searchParams.get("doomGuide") || (url.hash && new URLSearchParams(url.hash.slice(1)).get("doomGuide"));
    if (enable !== "1") return; // Only run tour when explicitly requested

    // Check if user has already seen onboarding
    chrome.storage.local.get(['onboardingCompleted'], (result) => {
      if (result.onboardingCompleted) {
        console.log("🎯 [Onboarding] User has already completed onboarding, skipping...");
        return;
      }

      // Avoid duplicate injections
      if (document.getElementById("topaz-onboarding-overlay")) return;

      console.log("🎯 [Onboarding] First time visit detected, showing onboarding...");
      showOnboardingOverlay();
    });

    function showOnboardingOverlay() {
      const overlay = document.createElement("div");
      overlay.id = "topaz-onboarding-overlay";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.zIndex = "2147483647";
      overlay.style.background = "rgba(0,0,0,0.5)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";

      const iframe = document.createElement("iframe");
      iframe.src = chrome.runtime.getURL("onboarding/popup.html");
      iframe.style.width = "min(600px, 95vw)";
      iframe.style.height = "min(700px, 90vh)";
      iframe.style.border = "0";
      iframe.style.borderRadius = "12px";
      iframe.style.boxShadow = "0 10px 40px rgba(0,0,0,0.35)";
      iframe.allow = "autoplay; clipboard-write";

      // Function to mark onboarding as completed and close overlay
      function completeOnboarding() {
        console.log("🎯 [Onboarding] Marking onboarding as completed");
        chrome.storage.local.set({ onboardingCompleted: true });
        overlay.remove();
      }

      // Close handler via click outside - marks as completed
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          completeOnboarding();
        }
      });

      overlay.appendChild(iframe);
      document.documentElement.appendChild(overlay);

      // Allow iframe to request closing the overlay - marks as completed
      window.addEventListener("message", (e) => {
        if (e?.data?.type === "TOPAZ_ONBOARDING_CLOSE") {
          completeOnboarding();
        }
      });
    }
  } catch (err) {
    // Fail silently to avoid impacting YouTube or existing extension logic
    console.warn("[Topaz Onboarding] failed to inject:", err);
  }
})();
