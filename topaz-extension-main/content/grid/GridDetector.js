class GridDetector {
  constructor() {
    this.tagsToIgnore = [];
    this.signatureCache = new Map();
    this.ancestorCache = new Map();
  }

  // Check if element is within viewport (with margin for prefetch)
  isElementInViewport(element, margin = 200) {
    try {
      if (!element || typeof element.getBoundingClientRect !== 'function') return false;
      const rect = element.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return (
        rect.bottom >= -margin &&
        rect.top <= vh + margin &&
        rect.right >= -margin &&
        rect.left <= vw + margin
      );
    } catch (_) {
      return false;
    }
  }

  setTagsToIgnore(tags) {
    this.tagsToIgnore = tags || [];
  }

  findAllGridContainers(forceComprehensive = false) {
    // Clear caches at the start of each run to ensure data is not stale
    this.signatureCache.clear();
    this.ancestorCache.clear();

    const foundGrids = new Set();

    // 🚀 INSTANT FILTER FIX: Use comprehensive scan when explicitly requested
    if (forceComprehensive) {
      console.log('🔄 Using comprehensive scan for instant filtering...');
      return this.findAllGridContainersComprehensive();
    }

    // 🚀 PERFORMANCE FIX: Use targeted selectors instead of scanning all elements
    // Focus on common container patterns that are likely to be grids
    const gridCandidateSelectors = [
      // YouTube specific containers
      'ytd-rich-grid-renderer',
      'ytd-expanded-shelf-contents-renderer',
      'ytd-shelf-renderer',
      'ytd-horizontal-list-renderer',
      'ytd-grid-renderer',
      'ytd-video-renderer',
      'ytd-compact-video-renderer',

      // Generic grid patterns
      '[class*="grid"]',
      '[class*="container"]',
      '[class*="list"]',
      '[class*="feed"]',
      '[class*="content"]',
      '[id*="content"]',

      // Social media patterns
      '[data-testid*="stream"]',
      '[data-testid*="feed"]',
      '[data-testid*="timeline"]',
      '[role="main"]',
      '[role="feed"]',

      // Common layout containers
      'main',
      'section',
      'article',
      'aside'
    ];

    // Merge hardcoded tags with user-defined selectors
    const allSelectorsToIgnore = [
      ...HARDCODED_TAGS_TO_IGNORE,
      ...this.tagsToIgnore
    ];

    // Process each selector type
    for (const selector of gridCandidateSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          // Skip offscreen elements to reduce work
          if (!this.isElementInViewport(element)) continue;

          // Check if element matches any CSS selector to ignore
          if (this.matchesAnySelector(element, allSelectorsToIgnore)) {
            continue;
          }

          let isProcessed = false;
          for (const grid of foundGrids) {
            if (grid.contains(element) || element.contains(grid)) {
              isProcessed = true;
              break;
            }
          }
          if (isProcessed) continue;

          // Find, validate, and add the grid
          const gridContainer = this.findGridContainer(element);
          if (
            gridContainer &&
            !foundGrids.has(gridContainer) &&
            this.isGridValid(gridContainer)
          ) {
            // Check if grid container matches any CSS selector to ignore
            if (this.matchesAnySelector(gridContainer, allSelectorsToIgnore)) {
              continue;
            }

            foundGrids.add(gridContainer);
          }
        }
      } catch (e) {
        // Skip invalid selectors
        console.warn(`Skipping invalid selector: ${selector}`, e);
        continue;
      }
    }

    const gridsArray = Array.from(foundGrids);
    console.log(`🎯 Performance optimization: Found ${gridsArray.length} grids using targeted selectors`);
    return gridsArray;
  }

  // 🚀 INSTANT FILTER FIX: Comprehensive method for re-analysis after filtering
  findAllGridContainersComprehensive() {
    console.log('🔍 Running comprehensive grid scan for instant filtering...');
    this._isComprehensiveMode = true; // Set flag to skip viewport checks
    const foundGrids = new Set();

    // Use a more comprehensive approach that checks more element types
    const comprehensiveSelectors = [
      // YouTube specific (more comprehensive)
      'ytd-rich-grid-renderer',
      'ytd-expanded-shelf-contents-renderer',
      'ytd-shelf-renderer',
      'ytd-horizontal-list-renderer',
      'ytd-grid-renderer',
      'ytd-video-renderer',
      'ytd-compact-video-renderer',
      'ytd-rich-item-renderer',
      'ytd-video-meta-block',
      'ytd-browse',
      'ytd-two-column-browse-results-renderer',

      // Generic patterns (more comprehensive)
      '[class*="grid"]',
      '[class*="container"]',
      '[class*="list"]',
      '[class*="feed"]',
      '[class*="content"]',
      '[class*="items"]',
      '[class*="stream"]',
      '[class*="posts"]',
      '[class*="videos"]',
      '[class*="results"]',
      '[id*="content"]',
      '[id*="feed"]',
      '[id*="main"]',

      // Social media patterns - Enhanced Twitter/X support
      '[data-testid*="stream"]',
      '[data-testid*="feed"]',
      '[data-testid*="timeline"]',
      '[data-testid*="cellInnerDiv"]',
      '[data-testid*="tweet"]',
      '[data-testid="tweetText"]',
      '[data-testid="UserCell"]',
      '[data-testid="placementTracking"]',
      'article[data-testid="tweet"]',
      'div[data-testid="cellInnerDiv"]',
      '[role="main"]',
      '[role="feed"]',
      '[role="list"]',
      '[role="region"]',

      // Common layout containers
      'main',
      'section',
      'article',
      'aside',
      '.content',
      '.main',
      '.primary',
      '.feed',
      '.stream',

      // Fallback: check divs with multiple children
      'div[class]:has(> div:nth-child(3))',  // Divs with at least 3 child divs
    ];

    // Merge hardcoded tags with user-defined selectors
    const allSelectorsToIgnore = [
      ...HARDCODED_TAGS_TO_IGNORE,
      ...this.tagsToIgnore
    ];

    // Process each selector type
    for (const selector of comprehensiveSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        console.log(`🔍 Selector "${selector}" found ${elements.length} elements`);

        for (const element of elements) {
          // Skip if element matches any CSS selector to ignore
          if (this.matchesAnySelector(element, allSelectorsToIgnore)) {
            continue;
          }

          let isProcessed = false;
          for (const grid of foundGrids) {
            if (grid.contains(element) || element.contains(grid)) {
              isProcessed = true;
              break;
            }
          }
          if (isProcessed) continue;

          // Find, validate, and add the grid
          const gridContainer = this.findGridContainer(element);
          if (
            gridContainer &&
            !foundGrids.has(gridContainer) &&
            this.isGridValid(gridContainer)
          ) {
            // Check if grid container matches any CSS selector to ignore
            if (this.matchesAnySelector(gridContainer, allSelectorsToIgnore)) {
              continue;
            }

            foundGrids.add(gridContainer);
            console.log(`✅ Found valid grid container: ${gridContainer.tagName} (${gridContainer.children.length} children)`);
          }
        }
      } catch (e) {
        // Skip invalid selectors (like :has() on older browsers)
        console.warn(`Skipping selector: ${selector}`, e.message);
        continue;
      }
    }

    const gridsArray = Array.from(foundGrids);
    this._isComprehensiveMode = false; // Reset flag
    console.log(`🔍 Comprehensive scan found ${gridsArray.length} total grids`);
    return gridsArray;
  }

  findGridContainer(startElement) {
    const cardElement = this.findCardAncestor(startElement);
    return cardElement && cardElement.parentElement
      ? cardElement.parentElement
      : null;
  }

  findCardAncestor(anchorElement) {
    if (this.ancestorCache.has(anchorElement)) {
      return this.ancestorCache.get(anchorElement);
    }

    let currentNode = anchorElement;
    let bestCandidate = null;
    let highestScore = 0;

    const maxDepth = 15;
    const viewportWidth = document.documentElement.clientWidth;
    const MIN_SIMILAR_ITEMS = 3;

    for (
      let i = 0;
      i < maxDepth && currentNode && currentNode.parentElement;
      i++
    ) {
      currentNode = currentNode.parentElement;
      if (currentNode.tagName === "BODY" || currentNode.tagName === "HTML") break;
      const elementWidth = currentNode.getBoundingClientRect().width;
      if (elementWidth / viewportWidth > 0.9) continue;
      const parent = currentNode.parentElement;
      if (!parent) continue;

      // --- Scoring Logic ---

      // 1. Cluster Score: How many siblings have the same structure?
      const siblings = Array.from(parent.children);
      const ourSignature = this.generateDeepSignature(currentNode);
      const matchCount = siblings.filter(
        (s) => this.generateDeepSignature(s) === ourSignature,
      ).length;

      if (matchCount < MIN_SIMILAR_ITEMS) continue;
      const CLUSTER_SCORE_CAP = 10;
      const clusterStrengthScore =
        Math.min(matchCount, CLUSTER_SCORE_CAP) / CLUSTER_SCORE_CAP;

      // 2. Containment Score: Does this element look like a container?
      const children = Array.from(currentNode.children);
      let containmentScore = 0.5; // Default score
      if (children.length > 0) {
        const simpleChildrenCount = children.filter((c) =>
          SIMPLE_CONTENT_TAGS.has(c.tagName),
        ).length;
        const simplicityRatio = simpleChildrenCount / children.length;
        containmentScore = 1 - simplicityRatio;
      }

      // Combine scores (cluster strength is more important)
      const finalScore = clusterStrengthScore * 0.6 + containmentScore * 0.4;

      if (finalScore > highestScore) {
        highestScore = finalScore;
        bestCandidate = currentNode;
      }
    }

    this.ancestorCache.set(anchorElement, bestCandidate);
    return bestCandidate;
  }

  generateDeepSignature(el) {
    if (!el) return "";
    if (this.signatureCache.has(el)) {
      return this.signatureCache.get(el);
    }

    const signatureParts = [el.tagName];
    const maxDepth = 3;

    function traverse(node, depth, counts) {
      if (depth > maxDepth) return;
      for (const child of node.children) {
        const key = `d${depth}_${child.tagName}`;
        counts[key] = (counts[key] || 0) + 1;
        traverse(child, depth + 1, counts);
      }
    }

    const counts = {};
    traverse(el, 1, counts);
    const sortedKeys = Object.keys(counts).sort();
    const structure = sortedKeys.map((key) => `${key}:${counts[key]}`).join(",");

    signatureParts.push(structure);
    const result = signatureParts.join("|");

    this.signatureCache.set(el, result);
    return result;
  }

  isGridValid(gridElement) {
    if (!gridElement || gridElement.children.length < 2) return false;

    // Merge hardcoded tags with user-defined selectors
    const allSelectorsToIgnore = [
      ...HARDCODED_TAGS_TO_IGNORE,
      ...this.tagsToIgnore
    ];

    // Check if grid element matches any CSS selector to ignore
    if (this.matchesAnySelector(gridElement, allSelectorsToIgnore)) {
      return false;
    }

    const childrenWithText = Array.from(gridElement.children).filter(
      (child) => child.innerText && child.innerText.trim().length > 10,
    );
    const MIN_VALID_CHILDREN = 2;
    return childrenWithText.length >= MIN_VALID_CHILDREN;
  }

  getValidGridChildren(gridElement) {
    if (!gridElement || !document.contains(gridElement)) {
      return [];
    }
    const children = Array.from(gridElement.children);

    // Merge hardcoded tags with user-defined selectors
    const allSelectorsToIgnore = [
      ...HARDCODED_TAGS_TO_IGNORE,
      ...this.tagsToIgnore
    ];

    const validChildren = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      // Check if child matches any CSS selector to ignore
      if (this.matchesAnySelector(child, allSelectorsToIgnore)) {
        continue;
      }

      // 🚀 PERFORMANCE FIX: Only check viewport for initial load, not mutations or comprehensive scans
      // For mutation processing and instant filtering, we want to catch all content
      const isInitialLoad = !this._isMutationProcessing && !this._isComprehensiveMode;
      if (isInitialLoad && !this.isElementInViewport(child)) {
        continue;
      }

      validChildren.push(child);
    }

    return validChildren;
  }

  // Add method to process only new nodes from mutations
  findGridContainersFromNodes(nodes) {
    if (!nodes || nodes.length === 0) return [];

    this._isMutationProcessing = true;
    const foundGrids = new Set();

    // Merge hardcoded tags with user-defined selectors
    const allSelectorsToIgnore = [
      ...HARDCODED_TAGS_TO_IGNORE,
      ...this.tagsToIgnore
    ];

    for (const node of nodes) {
      if (!node || node.nodeType !== 1) continue; // Only process element nodes

      // Check the node itself and its descendants for grid containers
      const elementsToCheck = [node];
      if (node.querySelectorAll) {
        // Add descendants that match our grid candidate patterns
        const gridCandidateSelectors = [
          'ytd-rich-grid-renderer',
          'ytd-expanded-shelf-contents-renderer',
          'ytd-shelf-renderer',
          'ytd-horizontal-list-renderer',
          'ytd-grid-renderer',
          '[class*="grid"]',
          '[class*="container"]',
          '[class*="list"]',
          '[class*="feed"]'
        ];

        for (const selector of gridCandidateSelectors) {
          try {
            elementsToCheck.push(...node.querySelectorAll(selector));
          } catch (e) {
            // Skip invalid selectors
          }
        }
      }

      for (const element of elementsToCheck) {
        // Skip if element matches selectors to ignore
        if (this.matchesAnySelector(element, allSelectorsToIgnore)) {
          continue;
        }

        // Skip if already processed
        let isProcessed = false;
        for (const grid of foundGrids) {
          if (grid.contains(element) || element.contains(grid)) {
            isProcessed = true;
            break;
          }
        }
        if (isProcessed) continue;

        // Find and validate grid container
        const gridContainer = this.findGridContainer(element);
        if (
          gridContainer &&
          !foundGrids.has(gridContainer) &&
          this.isGridValid(gridContainer)
        ) {
          foundGrids.add(gridContainer);
        }
      }
    }

    this._isMutationProcessing = false;
    const gridsArray = Array.from(foundGrids);
    console.log(`⚡ Mutation processing: Found ${gridsArray.length} new grids from ${nodes.length} nodes`);
    return gridsArray;
  }

  /**
   * Check if an element matches any of the provided CSS selectors
   * @param {Element} element - The element to check
   * @param {Array} selectors - Array of CSS selectors to test against
   * @returns {boolean} - True if element matches any selector
   */
  matchesAnySelector(element, selectors) {
    if (!element || !selectors || selectors.length === 0) {
      return false;
    }

    for (const selector of selectors) {
      try {
        if (element.matches(selector)) {
          return true;
        }
      } catch (e) {
        // Invalid selector, skip it
        console.warn(`Invalid CSS selector: ${selector}`, e);
      }
    }

    return false;
  }
}