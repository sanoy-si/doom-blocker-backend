class GridManager {
  constructor() {
    this.grids = [];
    this.gridIndex = 0;
    this.gridDetector = new GridDetector();
  }

  setTagsToIgnore(tags) {
    this.gridDetector.setTagsToIgnore(tags);
  }


  findAllGridContainers() {
    const gridElements = this.gridDetector.findAllGridContainers();
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
          text: child.innerText
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
        gridText: grid.element.innerText,
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
} 