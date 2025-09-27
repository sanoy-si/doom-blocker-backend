/**
 * Manages toast notifications for blocked content
 */
class NotificationManager {
  constructor() {
    this.notificationElement = null;
    this.notificationTimeout = null;
    this.fadeTimeout = null;
    this.blockedCount = 0;
    this.counterAnimationFrame = null;
    this.enabled = true;
    this.loadingElement = null;
    this.isShowingLoading = false;
  }

  show(count, startValue = null) {
    if (!this.enabled) return;
    
    if (this.notificationElement && document.contains(this.notificationElement)) {
      this.update(count);
      return;
    }

    this.notificationElement = this.createNotificationElement();
    document.body.appendChild(this.notificationElement);

    // Trigger animation after DOM insertion
    setTimeout(() => {
      this.notificationElement.classList.add(CSS_CLASSES.NOTIFICATION_VISIBLE);

      const counterElement = this.notificationElement.querySelector('.topaz-notification-counter');
      if (counterElement) {
        // Ensure values are valid and non-negative
        const animateFrom = Math.max(0, startValue !== null ? startValue : 0);
        const animateTo = Math.max(0, this.blockedCount);
        this.animateCounter(
          counterElement,
          animateFrom,
          animateTo
        );
      }
    }, 10);

    this.resetNotificationTimeout();
  }

  /**
   * Update notification with additional blocked count
   * @param {number} additionalCount - Additional items blocked
   */
  update(additionalCount) {
    if (!this.notificationElement) return;

    const counterElement = this.notificationElement.querySelector('.topaz-notification-counter');
    if (counterElement) {
      const currentDisplayValue = Math.max(0, parseInt(counterElement.textContent) || 0);
      let targetValue = Math.max(0, this.blockedCount);
      // Guard against reverse animations (e.g., if internal count was reset)
      if (targetValue < currentDisplayValue) {
        targetValue = currentDisplayValue;
      }
      this.animateCounter(counterElement, currentDisplayValue, targetValue);
    }

    this.notificationElement.classList.add(CSS_CLASSES.NOTIFICATION_VISIBLE);
    this.resetNotificationTimeout();
    this.resetFadeTimeout();
  }

  /**
   * Hide the notification
   */
  hide() {
    if (!this.notificationElement) return;

    this.notificationElement.classList.add(CSS_CLASSES.NOTIFICATION_HIDING);
    this.notificationElement.classList.remove(CSS_CLASSES.NOTIFICATION_VISIBLE);

    setTimeout(() => {
      if (this.notificationElement && this.notificationElement.parentNode) {
        this.notificationElement.parentNode.removeChild(this.notificationElement);
      }
      this.notificationElement = null;

      if (this.counterAnimationFrame) {
        cancelAnimationFrame(this.counterAnimationFrame);
        this.counterAnimationFrame = null;
      }
    }, 500);

    this.clearTimeouts();
  }

  /**
   * Update blocked count and show notification
   * @param {number} delta - Number to add to blocked count
   */
  incrementBlockedCount(delta) {
    // Validate delta is a positive integer
    const validDelta = Math.max(0, Math.floor(delta) || 0);
    if (validDelta === 0) return;
    
    const oldCount = this.blockedCount;
    this.blockedCount = Math.max(0, this.blockedCount + validDelta);
    if (this.enabled) {
      this.show(validDelta, oldCount);
    }
  }

  /**
   * Create notification DOM element
   * @returns {HTMLElement} Notification element
   */
  createNotificationElement() {
    const notification = document.createElement('div');
    notification.className = CSS_CLASSES.NOTIFICATION;

    notification.addEventListener('click', () => this.hide());
    notification.addEventListener('mouseover', () => this.hide());

    const content = document.createElement('div');
    content.className = 'topaz-notification-content';

    const title = document.createElement('div');
    title.className = 'topaz-notification-title';
    title.innerHTML = '<span class="topaz-notification-counter">0</span> items removed';

    content.appendChild(title);
    notification.appendChild(content);

    return notification;
  }

  /**
   * Animate counter from start to end value
   * @param {HTMLElement} element - Counter element
   * @param {number} startValue - Starting value
   * @param {number} endValue - Ending value
   */
  animateCounter(element, startValue, endValue) {
    if (this.counterAnimationFrame) {
      cancelAnimationFrame(this.counterAnimationFrame);
      this.counterAnimationFrame = null;
    }

    if (startValue === endValue) {
      element.textContent = endValue;
      return;
    }

    const incrementSize = Math.abs(endValue - startValue);
    const duration = incrementSize <= 3 ? TIMINGS.COUNTER_ANIMATION_SHORT : TIMINGS.COUNTER_ANIMATION_LONG;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = incrementSize <= 3
        ? 1 - Math.pow(1 - progress, 2)
        : 1 - Math.pow(1 - progress, 3);

      const prevValue = parseInt(element.textContent) || 0;
      const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);

      if (currentValue !== prevValue && currentValue !== startValue) {
        element.classList.remove(CSS_CLASSES.NOTIFICATION_COUNTER_POP);
        element.style.transform = 'scale(1.4)';
        element.style.color = '#ffb74d';

        void element.offsetWidth;
        element.classList.add(CSS_CLASSES.NOTIFICATION_COUNTER_POP);

        setTimeout(() => {
          if (element && document.contains(element)) {
            element.style.transform = '';
            element.style.color = '';
          }
        }, 600);
      }

      element.textContent = currentValue;

      if (progress < 1) {
        this.counterAnimationFrame = requestAnimationFrame(updateCounter);
      } else {
        element.textContent = endValue;
        this.counterAnimationFrame = null;
      }
    };

    this.counterAnimationFrame = requestAnimationFrame(updateCounter);
  }

  /**
   * Reset notification display timeout
   */
  resetNotificationTimeout() {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }

    this.notificationTimeout = setTimeout(() => {
      this.hide();
      // Do NOT reset blockedCount here; allow next update to continue upwards
      // This prevents downward animation artifacts after popup/icon interactions
    }, TIMINGS.NOTIFICATION_DISPLAY);

    this.resetFadeTimeout();

    if (this.notificationElement && 
        this.notificationElement.classList.contains(CSS_CLASSES.NOTIFICATION_FADED)) {
      this.notificationElement.classList.remove(CSS_CLASSES.NOTIFICATION_FADED);
    }
  }

  /**
   * Reset fade timeout
   */
  resetFadeTimeout() {
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    if (this.notificationElement && 
        this.notificationElement.classList.contains(CSS_CLASSES.NOTIFICATION_FADED)) {
      this.notificationElement.classList.remove(CSS_CLASSES.NOTIFICATION_FADED);
    }

    this.fadeTimeout = setTimeout(() => {
      if (this.notificationElement) {
        this.notificationElement.classList.add(CSS_CLASSES.NOTIFICATION_FADED);
      }
    }, TIMINGS.NOTIFICATION_FADE);
  }

  /**
   * Show error notification with message
   * @param {string} errorMessage - Error message to display
   * @param {string} errorType - Type of error for styling
   */
  showError(errorMessage, errorType = 'general') {
    if (!this.enabled) return;
    
    // Hide any existing notification first
    this.hide();

    // Create error notification element
    this.notificationElement = this.createErrorNotificationElement(errorMessage, errorType);
    document.body.appendChild(this.notificationElement);

    // Trigger animation after DOM insertion
    setTimeout(() => {
      this.notificationElement.classList.add(CSS_CLASSES.NOTIFICATION_VISIBLE);
    }, 10);

    // Set longer timeout for error messages
    this.notificationTimeout = setTimeout(() => {
      this.hide();
    }, TIMINGS.NOTIFICATION_DISPLAY * 2); // Double the normal display time for errors

    this.resetFadeTimeout();
  }

  createErrorNotificationElement(errorMessage, errorType) {
    const notification = document.createElement('div');
    notification.className = `${CSS_CLASSES.NOTIFICATION} ${CSS_CLASSES.NOTIFICATION_ERROR}`;

    notification.addEventListener('click', () => this.hide());
    notification.addEventListener('mouseover', () => this.hide());

    const content = document.createElement('div');
    content.className = 'topaz-notification-content';

    const title = document.createElement('div');
    title.className = `topaz-notification-title ${CSS_CLASSES.NOTIFICATION_ERROR_TITLE}`;
    title.textContent = 'Doom Blocker Error';

    const message = document.createElement('div');
    message.className = CSS_CLASSES.NOTIFICATION_ERROR_MESSAGE;
    message.textContent = errorMessage;
    
    content.appendChild(title);
    content.appendChild(message);
    notification.appendChild(content);

    return notification;
  }

  /**
   * Clear all timeouts
   */
  clearTimeouts() {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }

    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
  }

  /**
   * Set whether notifications are enabled
   * @param {boolean} enabled - Whether to show notifications
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.hide();
    }
  }

  /**
   * Show loading indicator for AI analysis
   * @param {string} message - Loading message to display
   */
  showLoading(message = "Analyzing content...") {
    if (this.isShowingLoading) return;

    // Hide existing notification first
    this.hide();

    this.isShowingLoading = true;
    this.loadingElement = this.createLoadingElement(message);
    document.body.appendChild(this.loadingElement);

    // Trigger animation after DOM insertion
    setTimeout(() => {
      this.loadingElement.classList.add(CSS_CLASSES.NOTIFICATION_VISIBLE);
    }, 10);
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (!this.loadingElement || !this.isShowingLoading) return;

    this.loadingElement.classList.remove(CSS_CLASSES.NOTIFICATION_VISIBLE);
    this.loadingElement.classList.add(CSS_CLASSES.NOTIFICATION_HIDING);

    setTimeout(() => {
      if (this.loadingElement && document.contains(this.loadingElement)) {
        document.body.removeChild(this.loadingElement);
      }
      this.loadingElement = null;
      this.isShowingLoading = false;
    }, 200);
  }

  /**
   * Create loading notification element
   * @param {string} message - Loading message
   * @returns {HTMLElement} Loading element
   */
  createLoadingElement(message) {
    const notification = document.createElement('div');
    notification.className = `${CSS_CLASSES.NOTIFICATION} topaz-loading-notification`;
    notification.style.backgroundColor = '#4A90E2';
    notification.style.color = 'white';

    const content = document.createElement('div');
    content.className = 'topaz-notification-content';
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.gap = '12px';

    // Loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'topaz-loading-spinner';
    spinner.style.cssText = `
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: topaz-spin 1s linear infinite;
    `;

    // Loading text
    const text = document.createElement('div');
    text.textContent = message;
    text.style.fontSize = '14px';
    text.style.fontWeight = '500';

    content.appendChild(spinner);
    content.appendChild(text);
    notification.appendChild(content);

    return notification;
  }

  /**
   * Destroy notification manager
   */
  destroy() {
    this.hide();
    this.hideLoading();
    this.clearTimeouts();
  }
} // Make NotificationManager available globally for content script
window.NotificationManager = NotificationManager;
