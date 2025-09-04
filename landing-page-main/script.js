// Topaz Landing Page JavaScript
// This file will contain all JavaScript functionality

// Removed Supabase and waitlist functionality - now using direct download

// Browser detection and download link setup
function detectBrowserAndSetDownloadLink() {
  const heroDownloadBtn = document.getElementById("heroDownloadBtn");
  const navDownloadBtn = document.querySelector(".nav-cta");
  const userAgent = navigator.userAgent.toLowerCase();

  let downloadUrl;
  if (userAgent.indexOf("firefox") > -1) {
    // Firefox browser
    downloadUrl = "https://addons.mozilla.org/en-GB/firefox/addon/topazblock/";
  } else if (
    userAgent.indexOf("chrome") > -1 ||
    userAgent.indexOf("chromium") > -1 ||
    userAgent.indexOf("edge") > -1
  ) {
    // Chrome/Chromium/Edge browsers
    downloadUrl =
      "https://chromewebstore.google.com/detail/topazblock/oaafbjfeogmdgdeacfajepfdengcjaoc";
  } else {
    // Other browsers - default to Chrome Web Store
    downloadUrl =
      "https://chromewebstore.google.com/detail/topazblock/oaafbjfeogmdgdeacfajepfdengcjaoc";
  }

  // Update both buttons if they exist
  if (heroDownloadBtn) {
    heroDownloadBtn.href = downloadUrl;
  }
  if (navDownloadBtn) {
    navDownloadBtn.href = downloadUrl;
  }
}

// Removed email validation function - no longer needed without email input

// Function to create pastel confetti
function createConfetti() {
  const colors = [
    "255, 182, 193", // Light pink
    "173, 216, 230", // Light blue
    "255, 218, 185", // Peach
    "221, 160, 221", // Plum
    "152, 251, 152", // Pale green
    "255, 255, 224", // Light yellow
    "230, 230, 250", // Lavender
    "255, 228, 196", // Bisque
    "176, 196, 222", // Light steel blue
    "255, 240, 245", // Lavender blush
  ];

  // Create confetti pieces
  for (let i = 0; i < 50; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const confetti = {
      x: Math.random() * window.innerWidth,
      y: -10,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      size: Math.random() * 8 + 4,
      color: color,
      life: 200,
      maxLife: 200,
      gravity: 0.1,
      shape: Math.random() > 0.5 ? "square" : "circle",
    };

    particles.push(confetti);
  }
}

// Removed waitlist submission handling - now using direct download

// Website completion status
const SITE_COMPLETE = false;

// Function to disable incomplete navbar links
function disableIncompleteLinks() {
  const navLinks = document.querySelectorAll(".nav-link:not(.nav-cta)");
  navLinks.forEach((link) => {
    // Skip the about, team, and contact links since they point to valid sections
    if (
      link.getAttribute("href") === "#demo-videos" ||
      link.getAttribute("href") === "#team" ||
      link.getAttribute("href") === "#socials"
    ) {
      return;
    }
    link.style.opacity = "0.4";
    link.style.pointerEvents = "none";
    link.style.cursor = "default";
  });
}

// DOM Content Loaded Event
document.addEventListener("DOMContentLoaded", function () {
  console.log("Topaz landing page loaded successfully!");

  // Disable incomplete navbar links
  if (!SITE_COMPLETE) {
    disableIncompleteLinks();
  }

  // Set up browser-specific download link for hero button
  detectBrowserAndSetDownloadLink();

  // Initialize falling images animation
  initFall();

  // Initialize demo videos with progressive loading
  initDemoVideos();

  // Initialize scroll-triggered animations for demo items
  setupDemoItemAnimations();

  // Initialize scroll-triggered animations for team members
  setupTeamAnimations();

  // Initialize scroll-triggered animations for socials links
  setupSocialsAnimations();

  // Initialize scroll-triggered animations for footer
  setupFooterAnimations();

  // Navbar download button now links directly to download.html
});

// Utility function for future use
function showNotification(message, type = "info") {
  console.log(`${type.toUpperCase()}: ${message}`);
  // This can be expanded later to show actual notifications
}

// Falling images animation
const imgs = [
  "brainrot1.jpg",
  "brainrot2.jpg",
  "brainrot3.jpg",
  "brainrot4.jpg",
  "brainrot5.jpg",
  "brainrot6.jpg",
  "brainrot7.jpg",
  "brainrot8.jpg",
  "elonpolitics1.jpg",
  "elonpolitics2.jpg",
  "elonpolitics3.jpg",
  "elonpolitics4.jpg",
  "elonpolitics5.jpg",
  "sport1.jpg",
  "sport2.jpg",
  "sport3.jpg",
  "sport4.jpg",
  "sport5.jpg",
  "other1.jpg",
  "other2.jpg",
  "other3.jpg",
  "other4.jpg",
  "other5.jpg",
  "other6.jpg",
  "other7.jpg",
  "egg.png",
];

let falls = [];
let hero;
let used = {};
let canvas;
let ctx;
let particles = [];
let activeFilters = new Set(["brainrot"]);
let spawnCount = 0;
let firstImageExploded = false;
let spawnInterval = null;
let animationId = null;
let isPageVisible = true;

function initFall() {
  // Skip animation on mobile devices
  if (window.innerWidth <= 768) {
    initToggles();
    return;
  }

  hero = document.getElementById("hero");
  canvas = document.getElementById("particle-canvas");
  ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = hero.clientWidth;
    canvas.height = hero.clientHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  // Wait 2 seconds before starting the falling animation
  setTimeout(() => {
    spawn(); // First spawn after 2 seconds
    spawnInterval = setInterval(spawn, 1000); // Then continue every second
  }, 2000);

  // Handle page visibility changes to prevent image buildup and improve performance
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      // Page is hidden, stop everything
      isPageVisible = false;

      // Stop spawning new images
      if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
      }

      // Cancel animation frame to stop all processing
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      // Page is visible again, resume everything
      isPageVisible = true;

      // Resume spawning if not already running
      if (!spawnInterval) {
        spawnInterval = setInterval(spawn, 1000);
      }

      // Resume animation
      if (!animationId) {
        animationId = requestAnimationFrame(animate);
      }
    }
  });

  animate();
  initToggles();
}

function spawn() {
  spawnCount++;
  const now = Date.now();

  let avail;

  // Force brainrot images for first and third spawns
  if (spawnCount === 1 || spawnCount === 3) {
    const brainrotImages = [
      "brainrot1.jpg",
      "brainrot2.jpg",
      "brainrot3.jpg",
      "brainrot4.jpg",
      "brainrot5.jpg",
      "brainrot6.jpg",
      "brainrot7.jpg",
      "brainrot8.jpg",
      "egg.png",
    ];
    avail = brainrotImages.filter(
      (img) => !used[img] || now - used[img] > 2000,
    );
  } else {
    avail = imgs.filter((img) => !used[img] || now - used[img] > 2000);
  }

  if (avail.length === 0) return;

  const img = document.createElement("img");
  const src = avail[Math.floor(Math.random() * avail.length)];
  used[src] = now;

  img.src = `media/${src}`;
  img.className = "fall-img";

  // Easter egg functionality
  /*
  if (src === "egg.png") {
    img.style.pointerEvents = "auto";
    img.style.cursor = "default";
    img.onclick = () => {
      window.open("https://google.com", "_blank");
    };
  }
  */

  const x = Math.random() * (hero.clientWidth - 104);
  const y = -104;

  // Mark first image for auto-explosion
  const isFirstImage = spawnCount === 1;

  img.style.left = x + "px";
  img.style.top = y + "px";

  hero.appendChild(img);

  let category = null;
  if (src.includes("brainrot")) category = "brainrot";
  else if (src.includes("elonpolitics")) category = "elonpolitics";
  else if (src.includes("sport")) category = "sport";

  // Generate explosion location if this image has a category
  let explodeY = null;
  if (category) {
    explodeY = generateExplosionLocation(x);
  }

  falls.push({
    el: img,
    x: x,
    y: y,
    speed: 0.5 + Math.random() * 1.5,
    category: category,
    exploded: false,
    aboutToExplode: false,
    explodeY: explodeY,
    isFirstImage: isFirstImage,
  });
}

function animate() {
  // Only animate if page is visible
  if (!isPageVisible) {
    return;
  }

  falls.forEach((fall, i) => {
    // Only update position if not about to explode
    if (!fall.aboutToExplode) {
      fall.y += fall.speed;
      fall.el.style.top = fall.y + "px";
    }

    // Check for first image auto-explosion (deterministic)
    if (
      fall.isFirstImage &&
      !fall.exploded &&
      !fall.aboutToExplode &&
      !firstImageExploded
    ) {
      if (fall.y >= 200) {
        // Explode when first image reaches 200px from top
        firstImageExploded = true;

        // Move to exact explosion location
        fall.y = 200;
        fall.el.style.top = fall.y + "px";

        fall.aboutToExplode = true;
        fall.el.classList.add("about-to-explode");

        // Wait 200ms for opacity transition + 500ms pause, then explode
        setTimeout(() => {
          explode(fall);
          fall.exploded = true;
        }, 700);
      }
    }
    // Check for normal explosion
    else if (
      fall.category &&
      activeFilters.has(fall.category) &&
      !fall.exploded &&
      !fall.aboutToExplode &&
      fall.explodeY
    ) {
      if (fall.y >= fall.explodeY) {
        // Don't move the image - let it explode at its current position
        fall.aboutToExplode = true;
        fall.el.classList.add("about-to-explode");

        // Wait 200ms for opacity transition + 500ms pause, then explode
        setTimeout(() => {
          explode(fall);
          fall.exploded = true;
        }, 700);
      }
    }

    if (fall.y > hero.clientHeight) {
      hero.removeChild(fall.el);
      falls.splice(i, 1);
    }
  });

  // Update particles
  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;

    // Apply gravity if it's confetti
    if (p.gravity) {
      p.vy += p.gravity;
    } else {
      p.vy += 0.05;
    }

    // Update rotation for confetti
    if (p.rotationSpeed) {
      p.rotation += p.rotationSpeed;
    }

    p.life--;
    return p.life > 0;
  });

  // Draw particles
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    const opacity = p.life / p.maxLife;
    ctx.fillStyle = `rgba(${p.color},${opacity})`;

    // Draw different shapes for confetti
    if (p.shape && p.size) {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.rotation) {
        ctx.rotate((p.rotation * Math.PI) / 180);
      }

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      ctx.restore();
    } else {
      // Default small square for explosion particles
      ctx.fillRect(p.x, p.y, 2, 2);
    }
  });

  animationId = requestAnimationFrame(animate);
}

function explode(fall) {
  const img = fall.el;
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = 104;
  tempCanvas.height = 104;

  img.onload = function () {
    tempCtx.drawImage(img, 0, 0, 104, 104);
    const imgData = tempCtx.getImageData(0, 0, 104, 104);
    const data = imgData.data;

    // Create exactly 200 particles
    for (let i = 0; i < 200; i++) {
      const pixelIndex = Math.floor(Math.random() * (104 * 104));
      const dataIndex = pixelIndex * 4;

      const r = data[dataIndex];
      const g = data[dataIndex + 1];
      const b = data[dataIndex + 2];
      const a = data[dataIndex + 3];

      if (a > 50) {
        const x = pixelIndex % 104;
        const y = Math.floor(pixelIndex / 104);

        // Calculate direction from center
        const centerX = 52;
        const centerY = 52;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Normalize and add random speed
        const speed = 2 + Math.random() * 4;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        particles.push({
          x: fall.x + x,
          y: fall.y + y,
          vx: vx,
          vy: vy,
          color: `${r},${g},${b}`,
          life: 180,
          maxLife: 180,
        });
      }
    }

    // Remove original image
    hero.removeChild(img);
    falls.splice(falls.indexOf(fall), 1);
  };

  if (img.complete) {
    img.onload();
  }
}

function generateExplosionLocation(x) {
  const minY = hero.clientHeight * 0.1;
  const maxY = hero.clientHeight * 0.8;

  // Get hero-content bounding box (excluding padding)
  const heroContent = document.querySelector(".hero-content");
  const contentRect = heroContent.getBoundingClientRect();
  const heroRect = hero.getBoundingClientRect();
  const contentStyle = getComputedStyle(heroContent);

  // Calculate content area relative to hero section
  const contentLeft =
    contentRect.left - heroRect.left + parseFloat(contentStyle.paddingLeft);
  const contentRight =
    contentRect.right - heroRect.left - parseFloat(contentStyle.paddingRight);
  const contentTop =
    contentRect.top - heroRect.top + parseFloat(contentStyle.paddingTop);
  const contentBottom =
    contentRect.bottom - heroRect.top - parseFloat(contentStyle.paddingBottom);

  // Check if image x position overlaps with content area
  const imgRight = x + 104;
  const xOverlaps = x < contentRight && imgRight > contentLeft;

  if (!xOverlaps) {
    // Image doesn't overlap horizontally, can explode anywhere in Y range
    return minY + Math.random() * (maxY - minY);
  }

  // X overlaps, so we need to avoid the content area vertically
  const validZones = [];

  // Zone above content
  if (contentTop > minY) {
    validZones.push({ start: minY, end: Math.min(contentTop - 104, maxY) });
  }

  // Zone below content
  if (contentBottom < maxY) {
    validZones.push({ start: Math.max(contentBottom, minY), end: maxY });
  }

  // Filter out invalid zones
  const validZonesFiltered = validZones.filter((zone) => zone.end > zone.start);

  if (validZonesFiltered.length === 0) {
    // No valid zones, return a safe position
    return maxY - 50;
  }

  // Pick a random valid zone
  const zone =
    validZonesFiltered[Math.floor(Math.random() * validZonesFiltered.length)];
  return zone.start + Math.random() * (zone.end - zone.start);
}

function initToggles() {
  const pills = document.querySelectorAll(".toggle-pill");

  pills.forEach((pill) => {
    pill.onclick = () => {
      const category = pill.dataset.category;

      if (activeFilters.has(category)) {
        activeFilters.delete(category);
        pill.classList.remove("active");
      } else {
        activeFilters.add(category);
        pill.classList.add("active");
      }
    };
  });
}

// Demo videos with progressive loading
function initDemoVideos() {
  const videos = document.querySelectorAll("#demo-videos video");
  if (videos.length === 0) return;

  console.log(`Initializing ${videos.length} demo videos`);

  // Load videos sequentially to avoid browser limits
  loadVideosSequentially(videos, 0);

  // Set up intersection observer for performance
  setupVideoIntersectionObserver();
}

function loadVideosSequentially(videos, index) {
  if (index >= videos.length) return;

  const video = videos[index];
  console.log(`Loading video ${index + 1}: ${video.src}`);

  // Set up event listeners for this video
  setupVideoEventListeners(video, index + 1);

  // Preload metadata first
  video.preload = "metadata";
  video.load();

  // Wait for metadata to load before starting next video
  video.addEventListener("loadedmetadata", () => {
    console.log(`Video ${index + 1} metadata loaded, starting next...`);
    // Load next video after a short delay
    setTimeout(() => loadVideosSequentially(videos, index + 1), 200);
  });

  // Fallback to continue loading even if this video fails
  video.addEventListener("error", () => {
    console.error(`Video ${index + 1} failed to load, continuing...`);
    setTimeout(() => loadVideosSequentially(videos, index + 1), 100);
  });
}

function setupVideoEventListeners(video, videoNumber) {
  video.addEventListener("loadeddata", () => {
    console.log(`Video ${videoNumber} data loaded`);
    video.preload = "auto"; // Upgrade to full preload
  });

  video.addEventListener("canplay", () => {
    console.log(`Video ${videoNumber} can play`);
  });

  video.addEventListener("error", (e) => {
    console.error(`Video ${videoNumber} error:`, e);
    // Add error message overlay
    addVideoErrorOverlay(video, videoNumber);
  });

  video.addEventListener("stalled", () => {
    console.warn(`Video ${videoNumber} stalled`);
  });

  // Try to play when ready
  video.addEventListener("canplaythrough", () => {
    if (video.paused) {
      video.play().catch((error) => {
        console.log(`Video ${videoNumber} autoplay prevented:`, error);
        addClickToPlayOverlay(video, videoNumber);
      });
    }
  });
}

function addVideoErrorOverlay(video, videoNumber) {
  const wrapper = video.parentElement;
  if (wrapper.querySelector(".video-error-overlay")) return; // Already added

  const overlay = document.createElement("div");
  overlay.className = "video-error-overlay";
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    z-index: 10;
  `;
  overlay.innerHTML = `
    <div style="color: var(--text-muted); text-align: center; padding: 1rem;">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠</div>
      <div>Video unavailable</div>
    </div>
  `;

  wrapper.style.position = "relative";
  wrapper.appendChild(overlay);
}

function addClickToPlayOverlay(video, videoNumber) {
  const wrapper = video.parentElement;
  if (wrapper.querySelector(".click-to-play-overlay")) return; // Already added

  const overlay = document.createElement("div");
  overlay.className = "click-to-play-overlay";
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: var(--border-radius);
    z-index: 10;
  `;
  overlay.innerHTML = `
    <div style="color: white; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">▶</div>
      <div>Click to play</div>
    </div>
  `;

  wrapper.style.position = "relative";
  wrapper.appendChild(overlay);

  overlay.addEventListener("click", () => {
    video
      .play()
      .then(() => {
        overlay.remove();
        console.log(`Video ${videoNumber} started after click`);
      })
      .catch((error) => {
        console.error(
          `Video ${videoNumber} failed to play after click:`,
          error,
        );
      });
  });
}

function setupVideoIntersectionObserver() {
  if (!("IntersectionObserver" in window)) return;

  let focusedVideo = null;

  // Observer for general visibility (play/pause when in/out of viewport)
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          // Video is visible, try to play if no video is focused or this is the focused one
          if (
            video.paused &&
            video.readyState >= 3 &&
            (!focusedVideo || focusedVideo === video)
          ) {
            video.play().catch((error) => {
              console.log("Autoplay prevented for visible video:", video.src);
            });
          }
        } else {
          // Video is not visible, pause to save resources
          if (!video.paused) {
            video.pause();
          }
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: "50px",
    },
  );

  // Observer for focus area (central 60% of viewport)
  const focusObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          // Video entered focus area
          if (focusedVideo !== video) {
            // Pause all other videos
            document.querySelectorAll("#demo-videos video").forEach((v) => {
              if (v !== video && !v.paused) {
                v.pause();
                v.classList.add("paused");
              }
            });

            // Set this as focused video and play it
            focusedVideo = video;
            if (video.paused && video.readyState >= 3) {
              video.play().catch((error) => {
                console.log("Autoplay prevented for focused video:", video.src);
              });
            }
            video.classList.remove("paused");
          }
        } else {
          // Video left focus area
          if (focusedVideo === video) {
            focusedVideo = null;
            // Resume all visible videos after a short delay
            setTimeout(() => {
              if (!focusedVideo) {
                // Only if no other video took focus
                document.querySelectorAll("#demo-videos video").forEach((v) => {
                  if (v.paused && v.readyState >= 3) {
                    // Check if video is still visible before playing
                    const rect = v.getBoundingClientRect();
                    const isVisible =
                      rect.top < window.innerHeight && rect.bottom > 0;
                    if (isVisible) {
                      v.play().catch((error) => {
                        console.log(
                          "Autoplay prevented for resumed video:",
                          v.src,
                        );
                      });
                      v.classList.remove("paused");
                    }
                  }
                });
              }
            }, 100);
          }
        }
      });
    },
    {
      threshold: 0.5,
      rootMargin: "-20% 0px -20% 0px", // Central 60% of viewport
    },
  );

  document.querySelectorAll("#demo-videos video").forEach((video) => {
    visibilityObserver.observe(video);
    focusObserver.observe(video);
  });
}

function setupDemoItemAnimations() {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  document.querySelectorAll(".demo-item").forEach((item) => {
    observer.observe(item);
  });
}

function setupTeamAnimations() {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  document.querySelectorAll(".team-member").forEach((member) => {
    observer.observe(member);
  });
}

function setupSocialsAnimations() {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  document.querySelectorAll(".social-main-link").forEach((link) => {
    observer.observe(link);
  });
}

function setupFooterAnimations() {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  document
    .querySelectorAll(".footer-brand, .footer-updates, .footer-video")
    .forEach((element) => {
      observer.observe(element);
    });
}
