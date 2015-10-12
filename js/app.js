/*
 * constants
 */
DEBUG = false; // to debug collision boxes and other stuff enable
MIN_ENEMY_SPEED = 100; // the minimum speed an enemy can have
/*
 * additional random surplus to an enemy speed it gets at spawn time (when he is
 * created at the beginning of the road)
 */

ENEMY_SPEED_ENTROPY = 100;
// where the first row of bricks starts
FIRST_ROW_Y = 75;
// height of a brick road block
ROW_HEIGHT = 83;
// this is a carefully picked amount of initial acceleration the player has
MAX_ACCELERATION = 30;
// maximum speed of the hero
MAX_PLAYER_SPEED = 50;
/*
 * number of pixels the new heart will be offset on the x axis relative to
 * another heart
 */
HEART_OFFSET = 20;
// number of bands per pixel of image data
BANDS = 4;
// index of the alpha channel of an image
ALPHA = 3;
// initial x position of the hero
PLAYER_STARTX = 200;
// initial y position of the hero
PLAYER_STARTY = 400;
// stores cached image bounds as detected during sprite loading
var boundsCache = {};

/*
 * some handy extensions to the basic js array
 */
Array.prototype.peek = function() {
  return this[this.length - 1];
};
Array.prototype.remove = function(object) {
  var index = this.indexOf(object);
  if (index != -1) {
    this.splice(index, 1);
  }
}
Array.prototype.clear = function() {
  this.length = 0;
};

/*
 * A list of all moving and displayed objects that are able to behave accept
 * input and collide with each other
 */
var renderables = [];

var inactive = function() {
  // a behaviour of an inactive object
};

// a behaviour of an object that needs to be removed from the screen
var vanishing = function(dt) {
  if (!this.vanishSpeed) {
    this.vanishSpeed = (canvas.width - this.x) / 120; // we want to vanish in 2
    // seconds
    this.alpha = 1;
  }
  if (this.x < canvas.width) {
    this.x += this.vanishSpeed;
    if (this.alpha > 0.1) {
      this.alpha -= 0.01;
    }
  } else {
    renderables.remove(this);
  }
};

/*
 * a renderable with position and a sprite image. you may have renderables
 * without sprite, then please set width and height manually if you want to
 * detect collisions.
 * 
 */
var Renderable = function(x, y, sprite) {
  this.sprite = sprite;
  this.x = x;
  this.y = y;
  /*
   * images with transparent pixels around main content will have visibleX and
   * visibleY different from x and y
   */
  this.visibleX = x;
  this.visibleY = y;
  this.width = 0;
  this.height = 0;
  this.visibleW = this.width;
  this.visibleH = this.height;
  this.behaviours = [];
  this.become(inactive);
  if (this.sprite) {
    var dis = this;
    Resources.load(sprite, function() {
      var image = Resources.get(sprite);
      dis.width = image.width;
      dis.height = image.height;
      dis.visibleW = image.width;
      dis.visibleH = image.height;
      _detectRealBounds(dis);
    });
  }
};
Renderable.prototype.constructor = Renderable;
// get another behaviour
Renderable.prototype.become = function(behaviour) {
  this.behaviours.push(behaviour);
};
// move to previous behaviour
Renderable.prototype.unbecome = function() {
  if (this.behaviours.length != 0) {
    this.behaviours.pop();
  }
};
// execute current behaviour
Renderable.prototype.update = function(dt) {
  this.behaviours.peek().call(this, dt);
};
/*
 * We detect only intersections between bounding boxes of renderables.
 */
Renderable.prototype.collidesWith = function(other) {
  if (other instanceof Renderable) {
    var tw = this.visibleW;
    var th = this.visibleH;
    var rw = other.visibleW;
    var rh = other.visibleH;
    if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
      return false;
    }
    var tx = this.x + this.visibleX;
    var ty = this.y + this.visibleY;
    var rx = other.x + other.visibleX;
    var ry = other.y + other.visibleY;
    rw += rx;
    rh += ry;
    tw += tx;
    th += ty;
    // overflow || intersect
    return ((rw < rx || rw > tx) && (rh < ry || rh > ty) && (tw < tx || tw > rx) && (th < ty || th > ry));
  }
}
Renderable.prototype.onCollision = function(withOther) {
};
Renderable.prototype.render = function() {
  ctx.save();
  /*
   * renderables without a sprite are just logical elements used for collision
   * detection
   */
  if (this.sprite) {
    if (this.alpha) {
      ctx.globalAlpha = this.alpha;
    }
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
  }
  if (DEBUG) {
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = 'red';
    ctx.strokeRect(this.visibleX, this.visibleY, this.visibleW, this.visibleH);
  }
  ctx.restore();
};
/*
 * we can only detect real bounds when image is drawn on a canvas. this method
 * traces the image for darker areas and makes bounds accordingly ignoring
 * transparent pixels.
 */
function _detectRealBounds(renderable) {
  var cachedBounds = boundsCache[renderable.sprite];
  if (!cachedBounds) {
    var width = renderable.width;
    var height = renderable.height;
    var minX = width, minY = height, maxX = 0, maxY = 0;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(Resources.get(renderable.sprite), 0, 0);
    var data = ctx.getImageData(0, 0, width, height).data;
    var darkEnough = function(data, x, y) {
      var a = data[(width * y + x) * BANDS + ALPHA];
      return a != 0;
    };
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (darkEnough(data, x, y)) {
          minX = Math.min(minX, x);
          maxX = Math.max(x, maxX);
          minY = Math.min(minY, y);
          maxY = Math.max(y, maxY);
        }
      }
    }
    cachedBounds = {
      minX : minX,
      minY : minY,
      maxX : maxX,
      maxY : maxY
    };
    boundsCache[renderable.sprite] = cachedBounds;
  }
  renderable.visibleX = cachedBounds.minX;
  renderable.visibleY = cachedBounds.minY;
  renderable.visibleW = cachedBounds.maxX - cachedBounds.minX;
  renderable.visibleH = cachedBounds.maxY - cachedBounds.minY;
};

// represents a life of a hero
var Heart = function(x) {
  Renderable.call(this, x, -40, 'images/Heart.png');
};
Heart.prototype = Object.create(Renderable.prototype);
Heart.prototype.constructor = Heart;

// Enemies our player must avoid
var Enemy = function(initialY, sprite) {
  Renderable.call(this, -100, initialY, sprite || 'images/enemy-bug.png');
  this.initialY = initialY;
  this.alpha = 1;
  this.name = 'enemy';
  this.reset();
};

Enemy.prototype = Object.create(Renderable.prototype);
Enemy.prototype.constructor = Enemy;
/*
 * You can add other animations to the enemies. Every time an enemy is reset its
 * animation is randomly chosen from this list.
 */
Enemy.prototype.animations = [
// straight line movement
function(dt) {
  this.x += this.speed * dt;
  if (this.x > canvas.width - this.width / 2) {
    this.reset();
  }
},
// wobbling around central y line
function(dt) {
  if (this.dy) {
    if (this.y < this.initialY - 20) {
      this.dy = 2;
    }
    if (this.y > this.initialY + 20) {
      this.dy = -2;
    }
  } else {
    this.dy = -2;
  }
  this.x += this.speed * dt;
  this.y += this.dy;
  if (this.x > canvas.width - this.width / 2) {
    this.reset();
  }
},
// disappearing at times
function(dt) {
  if (this.alpha >= 1) {
    this.dAlpha = -0.01;
    this.alpha = 1;
  }
  if (this.alpha <= 0.05) {
    this.alpha = 0.05;
    this.dAlpha = 0.01;
  }
  this.alpha += this.dAlpha;
  this.x += this.speed * dt;
  if (this.x > canvas.width - this.width / 2) {
    this.reset();
  }
} ];
// moves enemy of the left side of the screen and initializes behaviour
Enemy.prototype.reset = function() {
  this.unbecome();
  this.alpha = 1;
  this.x = -100;
  this.y = this.initialY;
  this.speed = MIN_ENEMY_SPEED + Math.random() * ENEMY_SPEED_ENTROPY;
  var animated = this.animations[(Math.random() * this.animations.length) | 0];
  this.become(animated);
};
// hero will lose live on collision with enemy, if he's still alive
Enemy.prototype.onCollision = function(object) {
  if (object instanceof Player && object.isAlive()) {
    object.lifeLost();
  }
}

/*
 * This interface makes a renderable react to key up/down events
 */
var Controlable = function() {
};
Controlable.prototype = Object.create(Renderable.prototype);
Controlable.prototype.constructor = Controlable;
// direction can be up/down/left/right/space
// upOfDownInt is 1 for pressed, 0 for released
Controlable.prototype.handleInput = function(direction, upOrDownInt) {
};

/*
 * Here's the player class which encapsulates player behaviour and state
 */
var Player = function(sprite) {
  Controlable.call(this);
  Renderable.call(this, PLAYER_STARTX, PLAYER_STARTY, sprite);
  this.acceleration = 0;
  this.alive = true;
  this.maxAcceleration = MAX_ACCELERATION;
  this.speed = 0;
  this.score = 0;
  this.dx = 0;
  this.dy = 0;
  this.score = 0;
  this.lives = [];
  this.name = 'player';
  // add 3 lives
  this.oneUp();
  this.oneUp();
  this.oneUp();
  this.become(movingFreely);
};
Player.prototype = Object.create(Controlable.prototype);
Player.prototype.constructor = Player;
// don't let the hero escape the screen
Player.prototype.ensureImOnScreen = function() {
  if (this.x < 0) {
    this.x = 0;
  }
  if (this.y < -20) {
    this.y = -20;
  }
  if (this.x + this.width > canvas.width) {
    this.x = canvas.width - this.width;
  }
  if (this.y + this.height > canvas.height) {
    this.y = canvas.height - this.height;
  }
};
// allows user to move on the screen in all directions with acceleration
var movingFreely = function(dt) {
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
// stops hero
Player.prototype.stop = function() {
  this.acceleration = 0;
  this.maxAcceleration = MAX_ACCELERATION;
  this.speed = 0;
  this.dx = 0;
  this.dy = 0;
};
// player rendering displays him, his lives and his score
Player.prototype.render = function() {
  Renderable.prototype.render.call(this);
  this.lives.forEach(function(life) {
    life.render();
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
Player.prototype.isAlive = function() {
  return this.lives.length > 0;
};
/*
 * Adds a life
 */
Player.prototype.oneUp = function() {
  this.lives.push(new Heart(this.lives.length * HEART_OFFSET));
};
/*
 * Removes a life or kills him if there are no more lives left
 */
Player.prototype.lifeLost = function() {
  if (this.isAlive()) {
    var lostLife = this.lives.pop();
    renderables.push(lostLife);
    lostLife.become(vanishing);
    if (this.isAlive()) {
      this.returnToStart();
    } else {
      // deanimate hero
      this.handleInput = inactive;
      renderables.push(new GameOver());
    }
  }
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

// returns hero to the starting position and counts down from 3 to 0
Player.prototype.returnToStart = function() {
  this.become(inactive);
  this.x = PLAYER_STARTX;
  this.y = PLAYER_STARTY;
  var counter = new Renderable(0, 0);
  counter.count = 3;
  counter.render = function() {
    ctx.save();
    ctx.font = "10em Arial";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(counter.count, canvas.width / 2, canvas.height / 2);
    ctx.strokeText(counter.count, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  };
  renderables.push(counter);
  animateAfterCoundDown(counter, this);
};

Player.prototype.handleInput = function(direction, pressed) {
  if (this.actions[direction] && this.isAlive()) {
    this.actions[direction].call(this, pressed);
  }
};

// a game over sprite which waits for the space button to start new game
var GameOver = function() {
  Controlable.call(this);
  Renderable.call(this, 0, 0);
  this.render = function() {
    ctx.save();
    ctx.font = "4em Arial";
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.strokeText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "2em Arial";
    ctx.fillText("(press space)", canvas.width / 2, canvas.height / 2 + 40);
    ctx.strokeText("(press space)", canvas.width / 2, canvas.height / 2 + 40);
    ctx.restore();
  };
  this.handleInput = function(key) {
    if (key == 'space') {
      startGame();
    }
  };
};
GameOver.prototype = Object.create(Controlable.prototype);
GameOver.prototype.constructor = GameOver;

/*
 * When game starts we reset all renderables, add enemies and the player
 */
function startGame() {
  renderables.clear();
  // we introduce a fake renderable without a sprite here to detect collisions
  // with the level target - the other side of the road
  // in a real game with different layers we would of course have a real object
  // like a door or a gateway to the next level.
  renderables.push(levelEndPlaceholder());
  for (var row = 0; row < 3; row++) {
    renderables.push(new Enemy(FIRST_ROW_Y + row * ROW_HEIGHT));
  }
  var player = new Player('images/char-boy.png');
  renderables.push(player);
};

/*
 * Creates a level end marker object which records the player touching the last
 * line of bricks.
 */
function levelEndPlaceholder() {
  var levelEnd = new Renderable(0, 0);
  levelEnd.name = "level-end";
  levelEnd.visibleW = canvas.width;
  levelEnd.visibleH = ROW_HEIGHT * (2 / 3);
  levelEnd.onCollision = function(object) {
    if (object instanceof Player && object.isAlive()) {
      object.score += 10;
      object.returnToStart();
    }
  };
  return levelEnd;
}

/*
 * Counts down to 0 and then the player can move again
 */
function animateAfterCoundDown(counter, player) {
  if (counter.count == 0) {
    renderables.remove(counter);
    player.unbecome();
    player.become(movingFreely);
  } else {
    window.setTimeout(function() {
      counter.count--;
      animateAfterCoundDown(counter, player);
    }, 1000);
  }
}
