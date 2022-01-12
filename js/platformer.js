// Grid cell, can have a wall on the left and a ceiling on top
function PlatformerGridCell() {
  this.wall = false;
  this.ceiling = false;
}

// Platformer node, a dynamic object in the grid
function PlatformerNode(x, y, width, height, color) {
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.width = width;
  this.height = height;
  this.onGround = false;
  this.color = color;

  this.right = false;
  this.left = false;
  this.jump = false;
}

PlatformerNode.prototype = {
  setvx(vx) {
    this.vx = vx;
  },

  setvy(vy) {
    this.vy = vy;

    if(vy != 0)
      this.onGround = false;
  },

  getXCells(resolution) {
    return {
      start: Math.floor((this.x + PlatformerGrid.prototype.EPSILON) / resolution),
      end: Math.floor((this.x + this.width - PlatformerGrid.prototype.EPSILON) / resolution)
    };
  },

  getYCells(resolution) {
    return {
      start: Math.floor((this.y + PlatformerGrid.prototype.EPSILON) / resolution),
      end: Math.floor((this.y + this.height - PlatformerGrid.prototype.EPSILON) / resolution)
    };
  },

  getCellBottom(y, resolution) {
     return Math.floor((y + this.height - PlatformerGrid.prototype.EPSILON) / resolution);
  },

  getCellTop(y, resolution) {
    return Math.floor((y + PlatformerGrid.prototype.EPSILON) / resolution);
  },

  getCellRight(x, resolution) {
    return Math.floor((x + this.width - PlatformerGrid.prototype.EPSILON) / resolution);
  },

  getCellLeft(x, resolution) {
    return Math.floor((x + PlatformerGrid.prototype.EPSILON) / resolution);
  },

  collideCellBottom(resolution) {
    //if (this.onGround == false) {
      var audio = new Audio('ground.wav');
      audio.play();
    //}
    this.onGround = true;

    this.vy = 0;
    this.y = this.getCellBottom(this.y, resolution) * resolution - this.height;
  },

  collideCellTop(resolution) {
    this.vy = 0;
    this.y = this.getCellTop(this.yp, resolution) * resolution;
    var audio = new Audio('top.wav');
    audio.play();    
  },

  collideCellRight(resolution) {
    this.vx = 0;
    this.x = this.getCellRight(this.x, resolution) * resolution - this.width;
    var audio = new Audio('side.wav');
    audio.play();
  },

  collideCellLeft(resolution) {
    this.vx = 0;
    this.x = this.getCellLeft(this.xp, resolution) * resolution;
    var audio = new Audio('side.wav');
    audio.play();
  },

  limitXSpeed(timeStep) {
    if(this.vx * timeStep < -this.width + PlatformerGrid.prototype.EPSILON)
      this.vx = (-this.width + PlatformerGrid.prototype.EPSILON) / timeStep;

    if(this.vx * timeStep > this.width - PlatformerGrid.prototype.EPSILON)
      this.vx = (this.width - PlatformerGrid.prototype.EPSILON) / timeStep;
  },

  limitYSpeed(timeStep) {
    if(this.vy * timeStep < -this.height + PlatformerGrid.prototype.EPSILON)
      this.vy = (-this.height + PlatformerGrid.prototype.EPSILON) / timeStep;

    if(this.vy * timeStep > this.height - PlatformerGrid.prototype.EPSILON)
      this.vy = (this.height - PlatformerGrid.prototype.EPSILON) / timeStep;
  }
};

// The grid, containing cells and nodes colliding with cell walls
function PlatformerGrid(width, height, resolution, gravity = 2500, friction = 1700) {
  this.width = width + 1;
  this.height = height + 1;
  this.resolution = resolution;
  this.gravity = gravity;
  this.friction = friction;
  this.cells = [];
  this.nodes = [];

  for(var i = 0; i < this.width * this.height; ++i)
    this.cells.push(new PlatformerGridCell());
}

PlatformerGrid.prototype = {
  EDGE_STROKE_STYLE: "blue",
  EDGE_LINE_WIDTH: 4,
  GRID_STROKE_STYLE: "grey",
  GRID_LINE_WIDTH: 0.5,
  EPSILON: 0.0000001,

  validateCoordinates(x, y) {
    if(x < 0 || y < 0 || x >= this.width || y >= this.height)
      return false;

    return true;
  },

  getCell(x, y) {
    return this.cells[x + y * this.width];
  },

  getWall(x, y) {
    if(!this.validateCoordinates(x, y))
      return false;

    return this.getCell(x, y).wall;
  },

  getCeiling(x, y) {
    if(!this.validateCoordinates(x, y))
      return false;

    return this.getCell(x, y).ceiling;
  },

  setWall(x, y, wall) {
    if(this.validateCoordinates(x, y))
      this.getCell(x, y).wall = wall;
  },

  setCeiling(x, y, ceiling) {
    if(this.validateCoordinates(x, y))
      this.getCell(x, y).ceiling = ceiling;
  },

  addNode(node) {
    this.nodes.push(node);
  },

  removeNode(node) {
    const nodeIndex = this.nodes.indexOf(node);

    if(nodeIndex != -1)
      this.nodes.splice(nodeIndex, 1);
  },

  moveHorizontally(timeStep, node) {

    node.limitXSpeed(timeStep);

    var vx = node.vx * timeStep;
    node.xp = node.x;
    node.x += vx;

    if(node.vx > 0) {
      this.checkRightWallCollision(node);
    }
    else {
      this.checkLeftWallCollision(node);
    }

    this.checkNodeIsStillOnGround(node);

    this.applyFrictionIfOnGround(node, timeStep);
  },

  checkRightWallCollision(node) {

    if(node.getCellRight(node.x, this.resolution) != node.getCellRight(node.xp, this.resolution)) {
      const yCells = node.getYCells(this.resolution);

      for(var y = yCells.start; y <= yCells.end; ++y) {
        if(this.getWall(node.getCellRight(node.x, this.resolution), y) ||
          (y != yCells.start && this.getCeiling(node.getCellRight(node.x, this.resolution), y))) {
          node.collideCellRight(this.resolution);

          break;
        }
      }
    }    
  },

  checkLeftWallCollision(node) {

    if(node.getCellLeft(node.x, this.resolution) != node.getCellLeft(node.xp, this.resolution)) {
      const yCells = node.getYCells(this.resolution);

      for(var y = yCells.start; y<= yCells.end; ++y) {
        if(this.getWall(node.getCellLeft(node.xp, this.resolution), y) ||
          (y != yCells.start && this.getCeiling(node.getCellLeft(node.x, this.resolution), y))) {
          node.collideCellLeft(this.resolution);

          break;
        }
      }
    }    
  },

  checkNodeIsStillOnGround(node) {

    if (node.onGround) {
      const xCells = node.getXCells(this.resolution);

      for(var x = xCells.start; x <= xCells.end; ++x) {
        node.onGround = false;

        if(this.getCeiling(x, node.getCellBottom(node.y, this.resolution) + 1) ||
          (x != xCells.start && this.getWall(x, node.getCellBottom(node.y, this.resolution) + 1))) {
          node.onGround = true;
          break;
        }
      }
    }
  },
  
  applyFrictionIfOnGround(node, timeStep) {

    if(node.onGround) {
      if(node.vx > 0) {
        node.vx -= this.friction * timeStep;

        if(node.vx < 0)
          node.vx = 0;
      }
      else if(node.vx < 0) {
        node.vx += this.friction * timeStep;

        if(node.vx > 0)
          node.vx = 0;
      }
    }
  },

  moveVertically(timeStep, node) {

    node.limitYSpeed(timeStep);

    var vy = node.vy * timeStep;
    node.yp = node.y;
    node.y += vy;

    // Collide vertically
    if(node.vy > 0) {
      this.checkBottomCollision(node);
    }
    else {
      this.checkTopCollision(node);
    }
  },

  checkBottomCollision(node) {

    if(node.getCellBottom(node.y, this.resolution) != node.getCellBottom(node.yp, this.resolution)) {
      const xCells = node.getXCells(this.resolution);

      for(var x = xCells.start; x <= xCells.end; ++x) {
        if(this.getCeiling(x, node.getCellBottom(node.y, this.resolution)) ||
          (x != xCells.start && this.getWall(x, node.getCellBottom(node.y, this.resolution)))) {
          node.collideCellBottom(this.resolution);

          break;
        }
      }
    }
  },

  checkTopCollision(node) {

    if(node.getCellTop(node.y, this.resolution) != node.getCellTop(node.yp, this.resolution)) {
      const xCells = node.getXCells(this.resolution);

      for(var x = xCells.start; x <= xCells.end; ++x) {
        if(this.getCeiling(x, node.getCellTop(node.yp, this.resolution)) ||
          (x != xCells.start && this.getWall(x, node.getCellTop(node.y, this.resolution)))) {
          node.collideCellTop(this.resolution);

          break;
        }
      }
    }    
  },

  update(timeStep) {

    for(var i = 0; i < this.nodes.length; ++i) {
      const node = this.nodes[i];

      if(node.vx != 0) {
        this.moveHorizontally(timeStep, node);
      }

      // Add gravity
      if(!node.onGround) {
        node.vy += this.gravity * timeStep;
      }

      if(node.vy != 0) {
        this.moveVertically(timeStep, node);
      }
    }
  },

  drawGrid(context) {
    context.strokeStyle = this.GRID_STROKE_STYLE;
    context.lineWidth = this.GRID_LINE_WIDTH;

    for(var y = 0; y < this.height; ++y) {
      context.beginPath();
      context.moveTo(0, y * this.resolution);
      context.lineTo(this.width * this.resolution, y * this.resolution);
      context.stroke();
    }

    for(var x = 0; x < this.width; ++x) {
      context.beginPath();
      context.moveTo(x * this.resolution, 0);
      context.lineTo(x * this.resolution, this.height * this.resolution);
      context.stroke();
    }
  },

  drawWalls(context) {
    for(var x = 0; x < this.width; ++x) {
      for(var y = 0; y < this.height; ++y) {
        var cell = this.getCell(x, y);

        if(cell.wall) {
          context.strokeStyle = this.EDGE_STROKE_STYLE;
          context.lineWidth = this.EDGE_LINE_WIDTH;

          context.beginPath();
          context.moveTo(x * this.resolution, (y + 1) * this.resolution);
          context.lineTo(x * this.resolution, y * this.resolution);
          context.stroke();
        }

        if(cell.ceiling) {
          context.strokeStyle = this.EDGE_STROKE_STYLE;
          context.lineWidth = this.EDGE_LINE_WIDTH;

          context.beginPath();
          context.moveTo((x + 1) * this.resolution, y * this.resolution);
          context.lineTo(x * this.resolution, y * this.resolution);
          context.stroke();
        }
      }
    }
  },

  drawNodes(context, helpCtx) {
    for(var i = 0; i < this.nodes.length; ++i) {
      const node = this.nodes[i];

      context.fillStyle = node.color;
      context.beginPath();
      context.rect(node.x, node.y, node.width, node.height);
      context.fill();

      context.font = "16px Arial";
      context.fillText("("+ node.x.toFixed(1)+","+node.y.toFixed(1)+")", node.x, node.y);

      helpCtx.font = "16px Arial";
      helpCtx.fillStyle = node.color;

      helpCtx.fillText("p: ("+ node.x.toFixed(0)+","+node.y.toFixed(0)+")", 10, (i+1)*20);
      const xCells = node.getXCells(this.resolution);
      const yCells = node.getYCells(this.resolution);
      helpCtx.fillText("xC:"+xCells.start+"-"+xCells.end, 130, (i+1)*20);
      helpCtx.fillText("yC:"+yCells.start+"-"+yCells.end, 210, (i+1)*20);
      const B = node.getCellBottom(node.y, this.resolution);
      const T = node.getCellTop(node.y, this.resolution);
      const R = node.getCellRight(node.x, this.resolution);
      const L = node.getCellLeft(node.x, this.resolution);      
      helpCtx.fillText("B:"+B+" T:"+T+" R:"+R+" L"+L, 300, (i+1)*20);

    }
  },

  draw(context, helpCtx) {
    this.drawGrid(context);
    this.drawWalls(context);
    this.drawNodes(context, helpCtx);
  }
};
