// Topaz Landing Page JavaScript
// This file will contain all JavaScript functionality

// Supabase configuration
const SUPABASE_URL = 'https://cggutxamswgyexlsdrkn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZ3V0eGFtc3dneWV4bHNkcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMzQ5NjksImV4cCI6MjA2NjkxMDk2OX0.9ip0kvupJ9pALYHlH5TAOrUrfYMQm4qIjHKcteCE-Nk';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);



// Function to add email to waitlist
async function addToWaitlist(email) {
    try {
        console.log('Adding email to waitlist:', email);
        
        const { data, error } = await supabase
            .from('waitlist')
            .insert([{ email: email }]);
        
        console.log('Insert result:', { data, error });
        
        if (error) {
            // Check if it's a duplicate email error
            if (error.code === '23505') {
                throw new Error('This email is already on the waitlist!');
            }
            throw new Error(error.message);
        }
        
        console.log('Successfully added to waitlist');
        return true;
    } catch (error) {
        console.error('Error adding to waitlist:', error);
        throw error;
    }
}

// Function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to show feedback to user
function showFeedback(message, isSuccess = true) {
    const button = document.getElementById('waitlistBtn');
    const originalText = button.innerHTML;
    
    button.innerHTML = message;
    button.style.background = isSuccess ? '#4CAF50' : '#f44336';
    button.disabled = true;
    
    // Trigger confetti on success
    if (isSuccess) {
        createConfetti();
    }
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = 'var(--primary-color)';
        button.disabled = false;
    }, 3000);
}

// Function to show feedback with explicit original text
function showFeedbackWithOriginal(message, isSuccess = true, originalText) {
    const button = document.getElementById('waitlistBtn');
    
    button.innerHTML = message;
    button.style.background = isSuccess ? '#4CAF50' : '#f44336';
    button.disabled = true;
    
    // Trigger confetti on success
    if (isSuccess) {
        createConfetti();
    }
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = 'var(--primary-color)';
        button.disabled = false;
    }, 3000);
}

// Function to validate email in real-time
function validateEmailInput() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();
    
    // Reset to default state if empty
    if (!email) {
        emailInput.style.borderColor = 'var(--border-color)';
        return;
    }
    
    // Check if email is valid
    if (isValidEmail(email)) {
        emailInput.style.borderColor = '#4CAF50'; // Green for valid
    } else {
        emailInput.style.borderColor = '#f44336'; // Red for invalid
    }
}

// Function to create pastel confetti
function createConfetti() {
    const colors = [
        '255, 182, 193', // Light pink
        '173, 216, 230', // Light blue
        '255, 218, 185', // Peach
        '221, 160, 221', // Plum
        '152, 251, 152', // Pale green
        '255, 255, 224', // Light yellow
        '230, 230, 250', // Lavender
        '255, 228, 196', // Bisque
        '176, 196, 222', // Light steel blue
        '255, 240, 245'  // Lavender blush
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
            shape: Math.random() > 0.5 ? 'square' : 'circle'
        };
        
        particles.push(confetti);
    }
}

// Function to handle waitlist form submission
async function handleWaitlistSubmit() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();
    
    // Only proceed if email is valid (visual feedback already shown)
    if (!email || !isValidEmail(email)) {
        return;
    }
    
    // Show loading state
    const button = document.getElementById('waitlistBtn');
    const originalText = button.innerHTML; // Store original before changing
    button.innerHTML = 'joining...';
    button.disabled = true;
    
    try {
        await addToWaitlist(email);
        
        // Clear input and reset border
        emailInput.value = '';
        emailInput.style.borderColor = 'var(--border-color)';
        
        // Show success message with original text
        showFeedbackWithOriginal('✓ joined waitlist!', true, originalText);
        
    } catch (error) {
        console.error('Waitlist submission error:', error);
        showFeedbackWithOriginal(error.message || 'Something went wrong', false, originalText);
    }
}

// Website completion status
const SITE_COMPLETE = false;

// Function to disable incomplete navbar links
function disableIncompleteLinks() {
    const navLinks = document.querySelectorAll('.nav-link:not(.nav-cta)');
    navLinks.forEach(link => {
        link.style.opacity = '0.4';
        link.style.pointerEvents = 'none';
        link.style.cursor = 'default';
    });
}

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('Topaz landing page loaded successfully!');
    
    // Check if Supabase is loaded
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase client not loaded! Check if the CDN script is working.');
        return;
    }
    
    // Disable incomplete navbar links
    if (!SITE_COMPLETE) {
        disableIncompleteLinks();
    }
    
    // Add event listener to waitlist button
    const waitlistBtn = document.getElementById('waitlistBtn');
    if (waitlistBtn) {
        waitlistBtn.addEventListener('click', handleWaitlistSubmit);
    }
    
    // Add event listener for Enter key on email input
    const emailInput = document.getElementById('emailInput');
    if (emailInput) {
        // Real-time validation as user types
        emailInput.addEventListener('input', validateEmailInput);
        
        // Submit on Enter key
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleWaitlistSubmit();
            }
        });
    }
    
    // Initialize falling images animation
    initFall();
});



// Utility function for future use
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // This can be expanded later to show actual notifications
}

// Falling images animation
const imgs = [
    'brainrot1.jpg', 'brainrot2.jpg', 'brainrot3.jpg', 'brainrot4.jpg', 'brainrot5.jpg', 'brainrot6.jpg', 'brainrot7.jpg', 'brainrot8.jpg',
    'elonpolitics1.jpg', 'elonpolitics2.jpg', 'elonpolitics3.jpg', 'elonpolitics4.jpg', 'elonpolitics5.jpg',
    'sport1.jpg', 'sport2.jpg', 'sport3.jpg', 'sport4.jpg', 'sport5.jpg',
    'other1.jpg', 'other2.jpg', 'other3.jpg', 'other4.jpg', 'other5.jpg', 'other6.jpg', 'other7.jpg',
    'egg.png'
];

let falls = [];
let hero;
let used = {};
let canvas;
let ctx;
let particles = [];
let activeFilters = new Set(['brainrot']);
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
    
    hero = document.getElementById('hero');
    canvas = document.getElementById('particle-canvas');
    ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = hero.clientWidth;
        canvas.height = hero.clientHeight;
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    // Wait 2 seconds before starting the falling animation
    setTimeout(() => {
        spawn(); // First spawn after 2 seconds
        spawnInterval = setInterval(spawn, 1000); // Then continue every second
    }, 2000);
    
    // Handle page visibility changes to prevent image buildup and improve performance
    document.addEventListener('visibilitychange', function() {
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
            'brainrot1.jpg', 'brainrot2.jpg', 'brainrot3.jpg', 'brainrot4.jpg', 
            'brainrot5.jpg', 'brainrot6.jpg', 'brainrot7.jpg', 'brainrot8.jpg'
        ];
        avail = brainrotImages.filter(img => !used[img] || now - used[img] > 2000);
    } else {
        avail = imgs.filter(img => !used[img] || now - used[img] > 2000);
    }
    
    if (avail.length === 0) return;
    
    const img = document.createElement('img');
    const src = avail[Math.floor(Math.random() * avail.length)];
    used[src] = now;
    
    img.src = `media/${src}`;
    img.className = 'fall-img';
    
    // Easter egg functionality
    if (src === 'egg.png') {
        img.style.pointerEvents = 'auto';
        img.style.cursor = 'default';
        img.onclick = () => {
            window.open('https://google.com', '_blank');
        };
    }
    
    const x = Math.random() * (hero.clientWidth - 104);
    const y = -104;
    
    // Mark first image for auto-explosion
    const isFirstImage = spawnCount === 1;
    
    img.style.left = x + 'px';
    img.style.top = y + 'px';
    
    hero.appendChild(img);
    
    let category = null;
    if (src.includes('brainrot')) category = 'brainrot';
    else if (src.includes('elonpolitics')) category = 'elonpolitics';
    else if (src.includes('sport')) category = 'sport';
    
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
        isFirstImage: isFirstImage
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
            fall.el.style.top = fall.y + 'px';
        }
        
        // Check for first image auto-explosion (deterministic)
        if (fall.isFirstImage && !fall.exploded && !fall.aboutToExplode && !firstImageExploded) {
            if (fall.y >= 200) { // Explode when first image reaches 200px from top
                firstImageExploded = true;
                
                // Move to exact explosion location
                fall.y = 200;
                fall.el.style.top = fall.y + 'px';
                
                fall.aboutToExplode = true;
                fall.el.classList.add('about-to-explode');
                
                // Wait 200ms for opacity transition + 500ms pause, then explode
                setTimeout(() => {
                    explode(fall);
                    fall.exploded = true;
                }, 700);
            }
        }
        // Check for normal explosion
        else if (fall.category && activeFilters.has(fall.category) && !fall.exploded && !fall.aboutToExplode && fall.explodeY) {
            if (fall.y >= fall.explodeY) {
                // Don't move the image - let it explode at its current position
                fall.aboutToExplode = true;
                fall.el.classList.add('about-to-explode');
                
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
    particles = particles.filter(p => {
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
    particles.forEach(p => {
        const opacity = p.life / p.maxLife;
        ctx.fillStyle = `rgba(${p.color},${opacity})`;
        
        // Draw different shapes for confetti
        if (p.shape && p.size) {
            ctx.save();
            ctx.translate(p.x, p.y);
            
            if (p.rotation) {
                ctx.rotate((p.rotation * Math.PI) / 180);
            }
            
            if (p.shape === 'circle') {
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
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = 104;
    tempCanvas.height = 104;
    
    img.onload = function() {
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
                    maxLife: 180
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
    const heroContent = document.querySelector('.hero-content');
    const contentRect = heroContent.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const contentStyle = getComputedStyle(heroContent);
    
    // Calculate content area relative to hero section
    const contentLeft = contentRect.left - heroRect.left + parseFloat(contentStyle.paddingLeft);
    const contentRight = contentRect.right - heroRect.left - parseFloat(contentStyle.paddingRight);
    const contentTop = contentRect.top - heroRect.top + parseFloat(contentStyle.paddingTop);
    const contentBottom = contentRect.bottom - heroRect.top - parseFloat(contentStyle.paddingBottom);
    
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
    const validZonesFiltered = validZones.filter(zone => zone.end > zone.start);
    
    if (validZonesFiltered.length === 0) {
        // No valid zones, return a safe position
        return maxY - 50;
    }
    
    // Pick a random valid zone
    const zone = validZonesFiltered[Math.floor(Math.random() * validZonesFiltered.length)];
    return zone.start + Math.random() * (zone.end - zone.start);
}

function initToggles() {
    const pills = document.querySelectorAll('.toggle-pill');
    
    pills.forEach(pill => {
        pill.onclick = () => {
            const category = pill.dataset.category;
            
            if (activeFilters.has(category)) {
                activeFilters.delete(category);
                pill.classList.remove('active');
            } else {
                activeFilters.add(category);
                pill.classList.add('active');
            }
        };
    });
} 