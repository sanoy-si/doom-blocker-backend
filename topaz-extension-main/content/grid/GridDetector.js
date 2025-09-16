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

  findAllGridContainers() {
    // Clear caches at the start of each run to ensure data is not stale
    this.signatureCache.clear();
    this.ancestorCache.clear();

    const foundGrids = new Set();
    const allElements = Array.from(document.querySelectorAll("body *"));

    // Merge hardcoded tags with user-defined selectors
    const allSelectorsToIgnore = [
      ...HARDCODED_TAGS_TO_IGNORE,
      ...this.tagsToIgnore
    ];
    for (const element of allElements) {
      // Skip offscreen elements to reduce work
      if (!this.isElementInViewport(element)) continue;
      // Check if element matches any CSS selector to ignore
      if (this.matchesAnySelector(element, allSelectorsToIgnore)) {
        continue;
      }

      let isProcessed = false;
      for (const grid of foundGrids) {
        if (grid.contains(element)) {
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

    const gridsArray = Array.from(foundGrids);
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

      // Skip children that are not currently visible in or near the viewport
      if (!this.isElementInViewport(child)) {
        continue;
      }

      validChildren.push(child);
    }

    return validChildren;
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