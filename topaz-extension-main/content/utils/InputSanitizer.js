/**
 * Input Sanitization Utilities
 * Provides secure input validation and sanitization for the extension
 */

class InputSanitizer {
  static sanitizeText(text, maxLength = 1000) {
    if (typeof text !== 'string') {
      return '';
    }
    
    // Remove potentially dangerous characters and limit length
    return text
      .replace(/[<>\"'&]/g, '') // Remove basic XSS characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .substring(0, maxLength)
      .trim();
  }

  static sanitizeUrl(url) {
    if (typeof url !== 'string') {
      return '';
    }

    try {
      const parsedUrl = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        console.warn('🔒 Invalid URL protocol blocked:', parsedUrl.protocol);
        return '';
      }

      return parsedUrl.href;
    } catch (error) {
      console.warn('🔒 Invalid URL format blocked:', url);
      return '';
    }
  }

  static sanitizeArray(arr, maxItems = 100, maxItemLength = 100) {
    if (!Array.isArray(arr)) {
      return [];
    }

    return arr
      .slice(0, maxItems) // Limit array size
      .map(item => this.sanitizeText(item, maxItemLength))
      .filter(item => item.length > 0); // Remove empty strings
  }

  static validateGridStructure(gridStructure) {
    if (!gridStructure || typeof gridStructure !== 'object') {
      throw new Error('Invalid grid structure');
    }

    if (!Array.isArray(gridStructure.grids)) {
      throw new Error('Grid structure must contain grids array');
    }

    if (gridStructure.grids.length > 50) {
      throw new Error('Too many grids (max 50)');
    }

    // Validate each grid
    for (const grid of gridStructure.grids) {
      if (!grid.id || typeof grid.id !== 'string') {
        throw new Error('Grid must have valid id');
      }

      if (grid.children && Array.isArray(grid.children)) {
        if (grid.children.length > 200) {
          throw new Error('Too many children in grid (max 200)');
        }

        // Validate children
        for (const child of grid.children) {
          if (!child.id || typeof child.id !== 'string') {
            throw new Error('Child must have valid id');
          }
          
          if (child.text && typeof child.text === 'string' && child.text.length > 500) {
            // Truncate long text to prevent abuse
            child.text = child.text.substring(0, 500);
          }
        }
      }
    }

    return gridStructure;
  }

  static sanitizeAnalysisRequest(request) {
    return {
      gridStructure: this.validateGridStructure(request.gridStructure),
      currentUrl: this.sanitizeUrl(request.currentUrl),
      whitelist: this.sanitizeArray(request.whitelist || []),
      blacklist: this.sanitizeArray(request.blacklist || []),
      visitorId: this.sanitizeText(request.visitorId || '', 100)
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputSanitizer;
} else if (typeof window !== 'undefined') {
  window.InputSanitizer = InputSanitizer;
}
// Make InputSanitizer available globally for content script
window.InputSanitizer = InputSanitizer;
