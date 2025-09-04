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
      const targetValue = Math.max(0, this.blockedCount);
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
      // Reset the counter after auto-hide so next notification starts fresh
      this.blockedCount = 0;
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
    title.textContent = 'Topaz Error';

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
   * Destroy notification manager
   */
  destroy() {
    this.hide();
    this.clearTimeouts();
  }
} 