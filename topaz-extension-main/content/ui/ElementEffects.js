/**
 * Handles all visual effects and DOM manipulations for elements
 */
class ElementEffects {
  constructor() {
    // Use WeakMap to track element states without polluting DOM
    this.elementStates = new WeakMap();
  }

  /**
   * Blur elements
   * @param {Array<{id: string, element: HTMLElement}>} elements - Elements to blur
   * @returns {number} Number of successfully blurred elements
   */
  blurElements(elements) {
    if (!Array.isArray(elements)) {
      return 0;
    }

    let successCount = 0;

    elements.forEach(({ id, element }) => {
      if (!element || !document.contains(element)) {
        return;
      }

      // Skip if element already has blur class
      if (element.classList.contains(CSS_CLASSES.BLURRED)) {
        return;
      }

      element.classList.add(CSS_CLASSES.BLURRED);
      element.setAttribute(DATA_ATTRIBUTES.BLUR_ID.replace("data-", ""), id);

      // Update state in WeakMap
      const state = this.getElementState(element);
      state.blurred = true;
      state.blurId = id;
      this.setElementState(element, state);

      successCount++;
    });

    return successCount;
  }

  /**
   * Remove blur from element by ID
   * @param {string} id - Element ID
   * @returns {boolean} Success status
   */
  removeBlurById(id) {
    const element = document.querySelector(
      `[${DATA_ATTRIBUTES.BLUR_ID}="${id}"]`,
    );
    if (!element) {
      return false;
    }

    element.classList.remove(CSS_CLASSES.BLURRED);
    element.removeAttribute(DATA_ATTRIBUTES.BLUR_ID.replace("data-", ""));

    // Update state
    const state = this.getElementState(element);
    delete state.blurred;
    delete state.blurId;
    this.setElementState(element, state);

    return true;
  }

  /**
   * Clear all blur effects
   * @returns {number} Number of elements cleared
   */
  clearAllBlurs() {
    // Try attribute selector first
    let blurredElements = document.querySelectorAll(
      `[${DATA_ATTRIBUTES.BLUR_ID}]`,
    );

    // If no elements found with attribute, try class selector as fallback
    if (blurredElements.length === 0) {
      blurredElements = document.querySelectorAll(`.${CSS_CLASSES.BLURRED}`);
    }

    const count = blurredElements.length;

    blurredElements.forEach((element) => {
      element.classList.remove(CSS_CLASSES.BLURRED);
      element.removeAttribute(DATA_ATTRIBUTES.BLUR_ID);
    });

    return count;
  }

  /**
   * Check if element contains video content
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element contains video
   */
  isVideoElement(element) {
    if (!element) return false;
    
    // Check if element itself is a video
    if (element.tagName === 'VIDEO' || element.tagName === 'IFRAME') {
      console.log('🎥 Found video element (direct):', element.tagName, element);
      return true;
    }
    
    // Check if element contains video or iframe
    const hasVideo = element.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="twitch"], iframe[src*="tiktok"], iframe[src*="dailymotion"]');
    if (hasVideo) {
      console.log('🎥 Found video element (nested):', hasVideo.tagName, hasVideo);
      return true;
    }
    
    // Check for common video container classes/attributes
    const videoIndicators = [
      '[data-testid*="video"]',
      '[class*="video"]',
      '[class*="player"]',
      '[id*="video"]',
      '[id*="player"]'
    ];
    
    for (const selector of videoIndicators) {
      if (element.matches && element.matches(selector)) {
        const nestedVideo = element.querySelector('video, iframe');
        if (nestedVideo) {
          console.log('🎥 Found video container with nested video:', element);
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Apply video light trace effect
   * @param {HTMLElement} element - Element to apply effect to
   * @param {string} id - Element ID
   * @returns {boolean} Success status
   */
  applyVideoLightTraceEffect(element, id) {
    if (!element || !document.contains(element)) {
      console.log('🎥 Video light trace effect: Element not found or not in DOM');
      return false;
    }

    console.log('🎥 Applying video light trace effect to element:', element);

    // Remove any blur effect first
    this.removeBlurById(id);

    // Add light trace class
    element.classList.add('topaz-video-rotating');
    element.setAttribute(
      DATA_ATTRIBUTES.STATE.replace("data-", ""),
      ELEMENT_STATES.HIDDEN,
    );

    const state = this.getElementState(element);
    state.hidden = true;
    state.hidingMethod = 'video-light-trace';
    state.elementId = id;
    this.setElementState(element, state);

    console.log('🎥 Video light trace effect applied, will hide in 0.5s');

    // After light trace completes, hide the element instantly
    setTimeout(() => {
      if (document.contains(element)) {
        element.classList.remove('topaz-video-rotating');
        element.classList.add('topaz-video-hidden');
        console.log('🎥 Video light trace completed, element hidden instantly');
      }
    }, 500); // Light trace duration is 0.5s

    return true;
  }

  /**
   * Hide elements using specified method
   * @param {Array<{id: string, element: HTMLElement}>} elements - Elements to hide
   * @param {string} method - Hiding method (display, height, highlighting)
   * @returns {number} Number of successfully hidden elements
   */
  hideElements(elements, method = HIDING_METHODS.DISPLAY) {
    if (!Array.isArray(elements)) {
      return 0;
    }

    let successCount = 0;

    elements.forEach(({ id, element }) => {
      if (!element || !document.contains(element)) {
        return;
      }

      // Check if this is a video element and apply light trace effect
      if (this.isVideoElement(element)) {
        if (this.applyVideoLightTraceEffect(element, id)) {
          successCount++;
        }
        return;
      }

      // Remove any blur effect first
      this.removeBlurById(id);

      const state = this.getElementState(element);

      switch (method) {
        case HIDING_METHODS.HEIGHT:
          element.classList.add(CSS_CLASSES.COLLAPSED);
          element.setAttribute(
            DATA_ATTRIBUTES.STATE.replace("data-", ""),
            ELEMENT_STATES.HIDDEN,
          );
          state.hidden = true;
          state.hidingMethod = HIDING_METHODS.HEIGHT;
          break;

        case HIDING_METHODS.DISPLAY:
          element.style.display = "none";
          element.setAttribute(
            DATA_ATTRIBUTES.STATE.replace("data-", ""),
            ELEMENT_STATES.HIDDEN,
          );
          state.hidden = true;
          state.hidingMethod = HIDING_METHODS.DISPLAY;
          break;

        case HIDING_METHODS.HIGHLIGHTING:
          element.style.outline = "3px solid #ff6b6b";
          element.style.outlineOffset = "2px";
          element.style.boxShadow = "0 0 10px rgba(255, 107, 107, 0.3)";
          element.setAttribute(
            DATA_ATTRIBUTES.STATE.replace("data-", ""),
            ELEMENT_STATES.FLAGGED,
          );
          state.flagged = true;
          state.hidingMethod = HIDING_METHODS.HIGHLIGHTING;
          break;

        default:
          return;
      }

      state.elementId = id;
      this.setElementState(element, state);
      successCount++;
    });

    return successCount;
  }

  /**
   * Hide elements matching the given CSS selectors using specified method
   * @param {string[]} selectors - Array of CSS selectors
   * @param {string} method - Hiding method (display, height, highlighting)
   * @returns {number} Number of successfully hidden elements
   */
  hideElementsBySelectors(selectors, method = HIDING_METHODS.DISPLAY) {
    if (!Array.isArray(selectors)) {
      return 0;
    }
    let elementsToHide = [];
    selectors.forEach(selector => {
      const matchedElements = document.querySelectorAll(selector);
      matchedElements.forEach(element => {
        // Generate a unique ID if not already present
        let id = element.getAttribute('data-topaz-id');
        if (!id) {
          id = 'topaz-' + Math.random().toString(36).substr(2, 9);
          element.setAttribute('data-topaz-id', id);
        }
        elementsToHide.push({ id, element });
      });
    });

    return this.hideElements(elementsToHide, method);
  }

  /**
   * Unhide elements by ID
   * @param {Array<{id: string, element?: HTMLElement}>} elements - Elements to unhide (element is optional)
   * @returns {number} Number of successfully unhidden elements
   */
  unhideElements(elements) {
    if (!Array.isArray(elements)) {
      return 0;
    }

    let successCount = 0;

    elements.forEach(({ id, element = null }) => {
      // Find element if not provided
      if (!element) {
        // Search by state attribute
        const hiddenElements = document.querySelectorAll(
          `[${DATA_ATTRIBUTES.STATE}]`,
        );
        element = Array.from(hiddenElements).find((el) => {
          const state = this.getElementState(el);
          return state.elementId === id;
        });
      }

      if (!element || !document.contains(element)) {
        return;
      }

      // Restore element based on hiding method
      const state = this.getElementState(element);

      if (state.hidingMethod === 'video-light-trace') {
        element.classList.remove('topaz-video-rotating', 'topaz-video-hidden');
      }

      if (
        state.hidingMethod === HIDING_METHODS.HEIGHT ||
        element.classList.contains(CSS_CLASSES.COLLAPSED)
      ) {
        element.classList.remove(CSS_CLASSES.COLLAPSED);
      }

      if (
        state.hidingMethod === HIDING_METHODS.DISPLAY ||
        element.style.display === "none"
      ) {
        element.style.removeProperty("display");
      }

      if (state.hidingMethod === HIDING_METHODS.HIGHLIGHTING || state.flagged) {
        // Remove highlighting from individual element
        element.style.removeProperty("outline");
        element.style.removeProperty("outline-offset");
        element.style.removeProperty("box-shadow");
      }

      // Clear attributes
      element.removeAttribute(DATA_ATTRIBUTES.STATE.replace("data-", ""));

      // Clear state
      delete state.hidden;
      delete state.flagged;
      delete state.hidingMethod;
      this.setElementState(element, state);

      successCount++;
    });

    return successCount;
  }

  /**
   * Get all hidden elements
   * @returns {Array<{id: string, element: HTMLElement, text: string}>} Hidden elements
   */
  getHiddenElements() {
    const hiddenElements = [];
    const elements = document.querySelectorAll(
      `[${DATA_ATTRIBUTES.STATE.replace("data-", "")}="${ELEMENT_STATES.HIDDEN}"]`,
    );

    elements.forEach((element) => {
      const state = this.getElementState(element);
      if (state.hidden && state.elementId) {
        hiddenElements.push({
          id: state.elementId,
          element: element,
          text: element.innerText || "",
        });
      }
    });
    return hiddenElements;
  }

  /**
   * Restore elements that were hidden by hideElements method
   * @param {Array<HTMLElement>} elements - Elements to restore (optional - if not provided, restores all hidden elements)
   * @returns {number} Number of restored elements
   */
  async restoreElements(elements = null) {
    let elementsToRestore = [];

    if (elements && Array.isArray(elements)) {
      elementsToRestore = elements;
    } else {
      const hiddenElements = document.querySelectorAll(
        `[${DATA_ATTRIBUTES.STATE.replace("data-", "")}="${ELEMENT_STATES.HIDDEN}"]`,
      );
      const flaggedElements = document.querySelectorAll(
        `[${DATA_ATTRIBUTES.STATE.replace("data-", "")}="${ELEMENT_STATES.FLAGGED}"]`,
      );
      
      elementsToRestore = [...hiddenElements, ...flaggedElements];
      
      console.log(
        "%c🔧 TOPAZ RESTORE: Found elements to restore",
        "color: white; background: #059669; padding: 4px 8px; border-radius: 4px; font-weight: bold;",
        {
          hiddenElements: hiddenElements.length,
          flaggedElements: flaggedElements.length,
          totalToRestore: elementsToRestore.length
        }
      );
    }

    let restoredCount = 0;

    elementsToRestore.forEach((element) => {
      if (!element || !document.contains(element)) {
        return;
      }

      // Get the element's state to determine how it was hidden
      const state = this.getElementState(element);
      let wasRestored = false;

      // Restore based on hiding method used
      if (state.hidingMethod === 'video-light-trace') {
        element.classList.remove('topaz-video-rotating', 'topaz-video-hidden');
        wasRestored = true;
      }

      if (state.hidingMethod === HIDING_METHODS.HEIGHT || element.classList.contains(CSS_CLASSES.COLLAPSED)) {
        element.classList.remove(CSS_CLASSES.COLLAPSED);
        wasRestored = true;
      }

      if (state.hidingMethod === HIDING_METHODS.DISPLAY || element.style.display === "none") {
        element.style.removeProperty("display");
        wasRestored = true;
      }

      if (state.hidingMethod === HIDING_METHODS.HIGHLIGHTING || state.flagged) {
        // Remove highlighting from individual element
        element.style.removeProperty("outline");
        element.style.removeProperty("outline-offset");
        element.style.removeProperty("box-shadow");
        wasRestored = true;
      }

      // Clear state attributes
      if (element.hasAttribute(DATA_ATTRIBUTES.STATE.replace("data-", ""))) {
        element.removeAttribute(DATA_ATTRIBUTES.STATE.replace("data-", ""));
        wasRestored = true;
      }

      // Clear state from WeakMap
      if (state.hidden || state.flagged) {
        delete state.hidden;
        delete state.flagged;
        delete state.hidingMethod;
        delete state.elementId;
        this.setElementState(element, state);
        wasRestored = true;
      }

      if (wasRestored) {
        restoredCount++;
      }
    });

    return restoredCount;
  }

  /**
   * Restore all elements that were hidden by hideElements method (convenience method)
   * @returns {number} Number of restored elements
   */
  async restoreAllElements() {
    console.log(
      "%c🔧 TOPAZ RESTORE: Starting restoreAllElements",
      "color: white; background: #10b981; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
    );
    const restoredCount = await this.restoreElements();
    console.log(
      "%c🔧 TOPAZ RESTORE: Completed restoreAllElements",
      "color: white; background: #10b981; padding: 4px 8px; border-radius: 4px; font-weight: bold;",
      { restoredCount }
    );
    
    return restoredCount;
  }

  /**
   * Get element state from WeakMap
   * @param {HTMLElement} element - Element to get state for
   * @returns {Object} Element state
   */
  getElementState(element) {
    return this.elementStates.get(element) || {};
  }

  /**
   * Set element state in WeakMap
   * @param {HTMLElement} element - Element to set state for
   * @param {Object} state - State object
   */
  setElementState(element, state) {
    this.elementStates.set(element, state);
  }

  /**
   * Destroy effects manager
   */
  destroy() {
    this.restoreAllElements();
    this.elementStates = new WeakMap();
  }
}
