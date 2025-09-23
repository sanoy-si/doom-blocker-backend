// Onboarding content script: injects the onboarding UI on YouTube when `?doomGuide=1` is present
// and loads an iframe pointing to our web-accessible onboarding page.

(() => {
  try {
    const url = new URL(window.location.href);
    const enable = url.searchParams.get("doomGuide");
    if (enable !== "1") return; // Only run tour when explicitly requested

    // Avoid duplicate injections
    if (document.getElementById("topaz-onboarding-overlay")) return;

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

    // Close handler via click outside
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    overlay.appendChild(iframe);
    document.documentElement.appendChild(overlay);

    // Allow iframe to request closing the overlay
    window.addEventListener("message", (e) => {
      if (e?.data?.type === "TOPAZ_ONBOARDING_CLOSE") {
        overlay.remove();
      }
    });
  } catch (err) {
    // Fail silently to avoid impacting YouTube or existing extension logic
    console.warn("[Topaz Onboarding] failed to inject:", err);
  }
})();
