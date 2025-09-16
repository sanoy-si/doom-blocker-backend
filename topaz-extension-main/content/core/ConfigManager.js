class ConfigManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.config = this.getDefaultConfig();
  }

  /**
   * Get default configuration
   * @returns {Object} Default config
   */
  getDefaultConfig() {
    return {
      tagsToIgnore: [],
      skipExtraction: false,  // Changed from true to false - this was preventing extraction!
      hidingMethod: HIDING_METHODS.DISPLAY,
      showBlockCounter: true
    };
  }

  async setConfigFromUrl(url) {
    console.log("🔍 [TOPAZ DEBUG] ConfigManager.setConfigFromUrl called with:", url);
    try {
      await this.loadConfig();
      console.log("🔍 [TOPAZ DEBUG] Config loaded successfully, site configs:", Object.keys(this.siteConfigs));
      
      let matchedConfig = null;
      let matchedSiteName = null;
      
      for (const [siteName, siteConfig] of Object.entries(this.siteConfigs)) {
        console.log("🔍 [TOPAZ DEBUG] Checking site:", siteName, "with pattern:", siteConfig.urlPattern);
        if (siteConfig.urlPattern) {
          try {
            const pattern = new RegExp(siteConfig.urlPattern);
            const matches = pattern.test(url);
            console.log("🔍 [TOPAZ DEBUG] Pattern test result for", siteName, ":", matches);
            if (matches) {
              matchedConfig = siteConfig;
              matchedSiteName = siteName;
              console.log("🔍 [TOPAZ DEBUG] Found matching config for site:", siteName);
              break;
            }
          } catch (regexError) {
            console.error('🔍 [TOPAZ DEBUG] Invalid regex pattern for', siteName, ':', siteConfig.urlPattern, regexError);
          }
        }
      }
      
      if (matchedConfig) {
        console.log("🔍 [TOPAZ DEBUG] Applying matched config for site:", matchedSiteName, matchedConfig);
        this.applyConfig(matchedConfig);
        return;
      }
      
      // No specific config found, use defaults
      console.log("🔍 [TOPAZ DEBUG] No matching config found, using defaults");
      this.resetToDefaults();
    } catch (error) {
      console.error('🔍 [TOPAZ DEBUG] Error loading config for URL:', url, error);
      this.resetToDefaults();
      throw error;
    }
  }

  /**
   * Apply configuration
   * @param {Object} config - Configuration object
   * @returns {boolean} Success status
   */
  applyConfig(config) {
    if (!config || typeof config !== 'object') {
      return;
    }
    
    this.config = { ...this.config, ...config };
    this.eventBus.emit(EVENTS.CONFIG_UPDATED, this.config);
  }

  resetConfig() {
    console.log("🔍 [TOPAZ DEBUG] ConfigManager.resetConfig called");
    const oldConfig = { ...this.config };
    this.config = this.getDefaultConfig();
    console.log("🔍 [TOPAZ DEBUG] Config reset to defaults:", this.config);
    
    if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
      this.eventBus.emit(EVENTS.CONFIG_RESET, this.config);
    }
  }

  getConfig() {
    return { ...this.config };
  }

  /**
   * Get tags to ignore
   * @returns {Array<string>} Tags to ignore
   */
  getTagsToIgnore() {
    return [...this.config.tagsToIgnore];
  }

  /**
   * Get tags to collapse
   * @returns {Array<string>} Tags to collapse
   */
  getTagsToCollapse() {
    return Array.isArray(this.config.tagsToCollapse) ? [...this.config.tagsToCollapse] : [];
  }


  /**
   * Check if extraction should be skipped
   * @returns {boolean} Skip extraction flag
   */
  shouldSkipExtraction() {
    const result = this.config.skipExtraction;
    console.log("🔍 [TOPAZ DEBUG] shouldSkipExtraction called, result:", result, "current config:", this.config);
    return result;
  }

  /**
   * Get hiding method
   * @returns {string} Hiding method
   */
  getHidingMethod() {
    return this.config.hidingMethod;
  }

  /**
   * Check if block counter should be shown
   * @returns {boolean} Show block counter flag
   */
  getShowBlockCounter() {
    return this.config.showBlockCounter !== false;
  }

  /**
   * Update specific config property
   * @param {string} key - Config key
   * @param {any} value - Config value
   */
  updateConfigProperty(key, value) {
    if (key in this.config) {
      const oldValue = this.config[key];
      this.config[key] = value;
      
      if (oldValue !== value) {
        this.eventBus.emit(EVENTS.CONFIG_UPDATED, this.config);
      }
    }
  }

  destroy() {
    this.resetConfig();
  }

  async loadConfig() {
    console.log("🔍 [TOPAZ DEBUG] ConfigManager.loadConfig called - attempting to load config.json");
    
    try {
      const configUrl = chrome.runtime.getURL('content/config.json');
      console.log("🔍 [TOPAZ DEBUG] Config URL resolved to:", configUrl);
      
      const response = await fetch(configUrl);
      console.log("🔍 [TOPAZ DEBUG] Fetch response received:", response.status, response.statusText);
      
      if (!response.ok) {
        console.error("🔍 [TOPAZ DEBUG] Config fetch failed with status:", response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const config = await response.json();
      console.log("🔍 [TOPAZ DEBUG] Config JSON parsed successfully:", Object.keys(config).length, "site configs found");
      console.log("🔍 [TOPAZ DEBUG] Site config keys:", Object.keys(config));
      
      this.siteConfigs = config; // The config.json has site configs at root level
      console.log("🔍 [TOPAZ DEBUG] Config loaded and stored successfully");
      
      return config;
    } catch (error) {
      console.error("🔍 [TOPAZ DEBUG] Config loading failed:", error.message, error);
      this.siteConfigs = {};
      throw error;
    }
  }

  resetToDefaults() {
    console.log("🔍 [TOPAZ DEBUG] ConfigManager.resetToDefaults called");
    this.resetConfig();
  }
} 