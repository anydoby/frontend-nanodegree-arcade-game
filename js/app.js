Array.prototype.peek = function() {
  return this[this.length - 1];
}
var renderables = []; // a list of objects that can interact with each other
var inactive = function() {
}; // a behaviour of an inactive object
MIN_ENEMY_SPEED = 100; // the minimum speed an enemy can have
ENEMY_SPEED_ENTROPY = 100; // additional random surplus to an enemy speed it
// gets at spawn time
FIRST_ROW_Y = 75; // where the first row of bricks starts
ROW_HEIGHT = 83; // height of a brick road block
// this is a carefully picked amount of initial acceleration the player has
MAX_ACCELERATION = 30;
// maximum speed of the hero
MAX_PLAYER_SPEED = 50;
// number of pixels the new heart will be offset by x axis relative to another
// heart
HEART_OFFSET = 20;
// number of bands per pixel of image data
BANDS = 4;
// index of the alpha channel of an image
ALPHA = 3;
PLAYER_STARTX = 200;
PLAYER_STARTY = 400;

// a renderable with position and a sprite image
// you may have renderables without sprite, then please set width and height
// manually
var Renderable = function(x, y, sprite) {
  this.sprite = sprite;
  this.x = x;
  this.y = y;
  this.boxX = 0;
  this.boxY = 0;
  this.width = 0;
  this.height = 0;
  this.boxW = this.width;
  this.boxH = this.height;
  this.calculateBounds = sprite;
  this.behaviours = [];
  this.become(inactive);
  if (sprite) {
    var dis = this;
    Resources.load(sprite, function() {
      var image = Resources.get(sprite);
      dis.width = image.width;
      dis.height = image.height;
      dis.boxW = image.width;
      dis.boxH = image.height;
    });
  }
};
Renderable.prototype.constructor = Renderable;
Renderable.prototype.update = function(dt) {
};
Renderable.prototype.become = function(behaviour) {
  this.behaviours.push(behaviour);
};
Renderable.prototype.unbecome = function() {
  this.behaviours.pop();
};
Renderable.prototype.update = function(dt) {
  this.behaviours.peek().call(this, dt);
};
Renderable.prototype.collidesWith = function(other) {
  // we detect only intersections between bounding boxes of renderables
  // if both renderables have sprites we perform dot to dot collision detection
  if (other instanceof Renderable) {
    var w = this.boxW;
    var h = this.boxH;
    var x = this.x + this.boxX;
    var y = this.y + this.boxY;
    var X = other.x + other.boxX;
    var Y = other.y + other.boxY;
    var W = other.boxW;
    var H = other.boxH;
    if (w <= 0 || H <= 0 || w <= 0 || H <= 0) {
      return false;
    }
    W += X;
    H += Y;
    w += x;
    h += y;
    var collides = ((W < X || W > x) && (H < Y || H > y) && (w < x || w > X) && (h < y || h > Y));
    return collides;
  }
}
Renderable.prototype.onCollision = function(withOther) {
};
Renderable.prototype.render = function() {
  /*
   * renderables without a sprite are just logical elements used for collision
   * detection
   */
  if (this.sprite) {
    if (this.calculateBounds) {
      _detectRealBounds.call(this);
    }
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
  }
};
/*
 * we can only detect real bounds when image is drawn on a canvas. this method
 * traces the image for darker areas and makes bounds accordingly ignoring
 * transparent pixels.
 */
function _detectRealBounds() {
  var width = this.width;
  var height = this.height;
  var minX = width, minY = height, maxX = 0, maxY = 0;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(Resources.get(this.sprite), 0, 0);
  var data = ctx.getImageData(0, 0, width, height).data;
  var darkEnough = function(x, y) {
    var r = data[y * x * BANDS + 0];
    var g = data[y * x * BANDS + 1];
    var b = data[y * x * BANDS + 2];
    var a = data[y * x * BANDS + ALPHA];
    if (a == 255) {
      var avg = (r + g + b) / 3;
      return avg > 128;
    }
    return false;
  };
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (darkEnough(x, y)) {
        minX = Math.min(minX, x);
        maxX = Math.max(x, maxX);
        minY = Math.min(minY, y);
        maxY = Math.max(y, maxY);
      }
    }
  }
  this.boxX = minX * 1.2;
  this.boxY = minY * 1.2;
  this.boxW = maxX - minX;
  this.boxH = maxY - minY;
  this.calculateBounds = false;
};

var Heart = function(x) {
  Renderable.call(this, x, -40, 'images/Heart.png');
};
Heart.prototype = Object.create(Renderable.prototype);
Heart.prototype.constructor = Heart;

// Enemies our player must avoid
var Enemy = function(y, sprite) {
  Renderable.call(this, -100, y, sprite || 'images/enemy-bug.png');
  this.speed = MIN_ENEMY_SPEED + Math.random() * ENEMY_SPEED_ENTROPY;
  this.initialY = y;
  this.name = 'enemy';
};

Enemy.prototype = Object.create(Renderable.prototype);
Enemy.prototype.constructor = Enemy;
// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
  // You should multiply any movement by the dt parameter
  // which will ensure the game runs at the same speed for
  // all computers.
  this.x += this.speed * dt;
  if (this.x > canvas.width - this.width / 2) {
    this.die();
  }
};

Enemy.prototype.die = function() {
  renderables.splice(renderables.indexOf(this), 1);
  spawnEnemy(this.initialY);
};

/*
 * Creates a new enemy at the specified row
 */
function spawnEnemy(y) {
  renderables.push(new Enemy(y));
}

/*
 * This interface makes a renderable react to key up/down events
 */
var Controlable = function() {
};
Controlable.prototype = Object.create(Renderable.prototype);
Controlable.prototype.constructor = Controlable;
Controlable.prototype.handleInput = function(direction, upOrDownInt) {
};

/*
 * Here's the player class which encapsulates player behaviour and state
 */
var Player = function(sprite) {
  Controlable.call(this);
  Renderable.call(this, PLAYER_STARTX, PLAYER_STARTY, sprite);
  this.acceleration = 0;
  this.maxAcceleration = MAX_ACCELERATION;
  this.speed = 0;
  this.score = 0;
  this.dx = 0;
  this.dy = 0;
  this.score = 0;
  this.lives = [];
  this.name = 'player';
  this.oneUp();
  this.oneUp();
  this.oneUp();
};
Player.prototype = Object.create(Controlable.prototype);
Player.prototype.constructor = Player;
Player.prototype.ensureImOnScreen = function() {
  if (this.x < 0) {
    this.x = 0;
  }
  if (this.y < -10) {
    this.y = -10;
  }
  if (this.x + this.width > canvas.width) {
    this.x = canvas.width - this.width;
  }
  if (this.y + this.height > canvas.height) {
    this.y = canvas.height - this.height;
  }
};

Player.prototype.update = function(dt) {
  if (this.dx || this.dy) {
    if (this.speed < MAX_PLAYER_SPEED) {
      this.acceleration += dt * this.maxAcceleration;
      if (this.maxAcceleration > 0) {
        this.maxAcceleration--;
      }
      this.speed += this.acceleration * dt;
    }
    this.x += this.speed * this.dx;
    this.y += this.speed * this.dy;
    this.ensureImOnScreen();
  } else {
    this.stop();
  }
};
Player.prototype.stop = function() {
  this.acceleration = 0;
  this.maxAcceleration = MAX_ACCELERATION;
  this.speed = 0;
  this.dx = 0;
  this.dy = 0;
};
Player.prototype.render = function() {
  Renderable.prototype.render.call(this);
  this.lives.forEach(function(life) {
    life.render()
  });
  ctx.save();
  ctx.font = "3em Arial";
  ctx.fillStyle = "white";
  ctx.srokeStyle = "black";
  ctx.textAlign = "right";
  ctx.fillText(this.score, canvas.width, 45);
  ctx.strokeText(this.score, canvas.width, 45);
  ctx.restore();
};
/*
 * Adds a life
 */
Player.prototype.oneUp = function() {
  this.lives.push(new Heart(this.lives.length * HEART_OFFSET));
};
Player.prototype.actions = {
  "up" : function(pressed) {
    this.dy = -pressed;
  },
  "down" : function(pressed) {
    this.dy = pressed;
  },
  "left" : function(pressed) {
    this.dx = -pressed;
  },
  "right" : function(pressed) {
    this.dx = pressed;
  }
};

Player.prototype.handleInput = function(direction, pressed) {
  if (direction) {
    this.actions[direction].call(this, pressed);
  }
}

var allowedKeys = {
  37 : 'left',
  38 : 'up',
  39 : 'right',
  40 : 'down'
};

document.addEventListener('keyup', function(e) {
  handleInput(e, 0);
});
document.addEventListener('keydown', function(e) {
  handleInput(e, 1);
});

/*
 * Traverses renderables and invokes handleInput on Controlable's.
 */
function handleInput(e, upOrDown) {
  renderables.forEach(function(r) {
    if (r instanceof Controlable) {
      r.handleInput(allowedKeys[e.keyCode], upOrDown);
    }
  });
}

function startGame() {
  // we introduce a fake renderable without a sprite here to detect collisions
  // with the level target - the other side of the road
  // in a real game with different layers we would of course have a real object
  // like a door or a gateway to the next level.
  var levelEnd = new Renderable(0, 0);
  levelEnd.name = "level-end";
  levelEnd.boxW = canvas.width;
  levelEnd.boxH = 60;
  levelEnd.onCollision = levelReached;
  renderables.push(levelEnd);
  for (var row = 0; row < 3; row++) {
    renderables.push(new Enemy(FIRST_ROW_Y + row * ROW_HEIGHT));
  }
  var player = new Player('images/char-boy.png');
  renderables.push(player);
};

var levelReached = function(player) {
  player.score += 10;
  player.stop();
  player.x = PLAYER_STARTX;
  player.y = PLAYER_STARTY;
};