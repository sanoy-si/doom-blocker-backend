class GridManager {
  constructor() {
    this.grids = [];
    this.gridIndex = 0;
    this.gridDetector = new GridDetector();
  }

  setTagsToIgnore(tags) {
    this.gridDetector.setTagsToIgnore(tags);
  }


  findAllGridContainers(forceComprehensive = false) {
    const gridElements = this.gridDetector.findAllGridContainers(forceComprehensive);
    const newGrids = [];
    for (const gridElement of gridElements) {
      let existingGrid = this.getGridByElement(gridElement);
      if (existingGrid) {
        this.updateGridChildren(existingGrid);
      } else {
        const newGrid = this.addGrid(gridElement);
        if (newGrid) {
          newGrids.push(newGrid);
        }
      }
    }
    return newGrids;
  }
  
  addGrid(gridElement) {
    if (!gridElement || !gridElement.nodeType) {
      return null;
    }

    const existingGrid = this.grids.find(g => g.element === gridElement);
    if (existingGrid) {
      return existingGrid;
    }

    const gridId = `g${++this.gridIndex}`;
    const gridObject = {
      id: gridId,
      element: gridElement,
      children: []
    };

    this.updateGridChildren(gridObject);
    this.grids.push(gridObject);

    return gridObject;
  }

  updateGridChildren(gridObject) {
    if (!gridObject || !gridObject.element || !document.contains(gridObject.element)) {
      return false;
    }

    const validChildren = this.gridDetector.getValidGridChildren(gridObject.element);

    if (!gridObject.children) {
      gridObject.children = [];
    }

    let maxIndex = -1;
    gridObject.children.forEach(child => {
      const indexMatch = child.id.match(/c(\d+)$/);
      if (indexMatch) {
        const index = parseInt(indexMatch[1]);
        if (index > maxIndex) maxIndex = index;
      }
    });
    let nextIndex = maxIndex + 1;
  
    validChildren.forEach(child => {
      const isAlreadyTracked = gridObject.children.some(c => c.element === child);
      if (!isAlreadyTracked) {
        const childId = `${gridObject.id}c${nextIndex++}`;
        const childObject = {
          id: childId,
          element: child,
          text: child.textContent
        };
        gridObject.children.push(childObject);
      }
    });

    return true;
  }

  getGridByElement(element) {
    return this.grids.find(g => g.element === element);
  }

  getGridById(id) {
    return this.grids.find(g => g.id === id);
  }

  getAllGrids() {
    return this.grids;
  }

  /**
   * 🚀 PERFORMANCE FIX: Incrementally update grids based on DOM added nodes.
   * Uses the new efficient method to only process relevant nodes.
   * Returns an array of grid objects that were newly added or updated.
   */
  updateGridsNearNodes(addedNodes) {
    if (!addedNodes || addedNodes.length === 0) return [];

    console.time('🔧 GridManager.updateGridsNearNodes');

    // Use the new efficient method from GridDetector
    const newGridContainers = this.gridDetector.findGridContainersFromNodes(addedNodes);
    const updated = new Set();

    // Process found grid containers
    for (const gridContainer of newGridContainers) {
      let grid = this.getGridByElement(gridContainer);
      if (!grid) {
        grid = this.addGrid(gridContainer);
        if (grid) {
          console.log(`➕ Added new grid: ${grid.id} with ${grid.children.length} children`);
        }
      } else {
        const oldChildCount = grid.children.length;
        this.updateGridChildren(grid);
        const newChildCount = grid.children.length;
        if (newChildCount > oldChildCount) {
          console.log(`🔄 Updated existing grid: ${grid.id} (${oldChildCount} → ${newChildCount} children)`);
        }
      }
      if (grid) updated.add(grid);
    }

    // Also check for new children in existing grids near the added nodes
    for (const node of addedNodes) {
      if (!node || node.nodeType !== 1) continue;

      // Find existing grids that might contain this new node
      let ancestor = node.parentElement;
      let depth = 0;
      while (ancestor && depth < 5) { // Check up to 5 levels up
        const existingGrid = this.getGridByElement(ancestor);
        if (existingGrid) {
          const oldChildCount = existingGrid.children.length;
          this.updateGridChildren(existingGrid);
          const newChildCount = existingGrid.children.length;
          if (newChildCount > oldChildCount) {
            console.log(`🔄 Found new children in existing grid: ${existingGrid.id} (${oldChildCount} → ${newChildCount} children)`);
            updated.add(existingGrid);
          }
          break; // Found a grid container, no need to go further up
        }
        ancestor = ancestor.parentElement;
        depth++;
      }
    }

    console.timeEnd('🔧 GridManager.updateGridsNearNodes');
    console.log(`⚡ Processed ${addedNodes.length} added nodes, updated ${updated.size} grids`);

    return Array.from(updated);
  }

  getGridJSON() {
    const gridStructure = {
      timestamp: new Date().toISOString(),
      totalGrids: this.grids.length,
      grids: []
    };

    for (const grid of this.grids) {
      const gridData = {
        id: grid.id,
        totalChildren: grid.children.length,
        gridText: grid.element.textContent,
        children: grid.children.map(child => ({
          id: child.id,
          text: child.text
        }))
      };
      gridStructure.grids.push(gridData);
    }

    return gridStructure;
  }

  getElementsToBlur() {
    const elements = [];
    
    for (const grid of this.grids) {
      for (const child of grid.children) {
        if (!child.isHidden && child.element && document.contains(child.element)) {
          elements.push({
            id: child.id,
            element: child.element
          });
        }
      }
    }
    
    return elements;
  }

  getElementsToHide(gridInstructions) {
    const elements = [];
    
    for (const instructionObj of gridInstructions) {
      for (const [gridId, childIdsToHide] of Object.entries(instructionObj)) {
        const grid = this.getGridById(gridId);
        if (!grid) continue;

        for (const childId of childIdsToHide) {
          const child = grid.children.find(c => c.id === childId);
          if (child && child.element && document.contains(child.element)) {
            elements.push({
              id: child.id,
              element: child.element
            });
            child.isHidden = true;
          }
        }
      }
    }
    
    return elements;
  }

  getHiddenElements() {
    const hiddenElements = [];

    for (const grid of this.grids) {
      const hiddenChildren = grid.children.filter(child => child.isHidden);
      hiddenElements.push(...hiddenChildren.map(child => ({
        id: child.id,
        text: child.text
      })));
    }

    return hiddenElements;
  }

  findChildById(elementId) {
    for (const grid of this.grids) {
      const child = grid.children.find(c => c.id === elementId);
      if (child) {
        return { grid, child };
      }
    }
    return null;
  }

  reset() {
    this.grids = [];
    this.gridIndex = 0;
  }

  destroy() {
    this.reset();
  }
} // Make GridManager available globally for content script
window.GridManager = GridManager;
