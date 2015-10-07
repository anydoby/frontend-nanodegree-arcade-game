var Renderable = function(x, y, sprite) {
  this.sprite = sprite;
  this.x = x;
  this.y = y;
  var dis = this;
  Resources.load(sprite, function() {
    var image = Resources.get(sprite);
    dis.width = image.width;
    dis.height = image.height;
  });
};

Renderable.prototype.constructor = Renderable;
Renderable.prototype.render = function() {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Enemies our player must avoid
var Enemy = function(y, sprite) {
  Renderable.call(this, 0, y, sprite || 'images/enemy-bug.png');
  this.speed = 20 + Math.random() * 100;
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
  allEnemies.splice(allEnemies.indexOf(this), 1);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var Player = function(sprite) {
  Renderable.call(this, 200, 200, sprite);
  this.speed = 20;
};

Player.prototype = Object.create(Renderable.prototype);
Player.prototype.constructor = Player;
Player.prototype.update = function(dt) {

};
var actions = {
  "up" : function() {
    this.y -= this.speed;
  },
  "down" : function() {
    this.y += this.speed;
  },
  "left" : function() {
    this.x -= this.speed;
  },
  "right" : function() {
    this.x += this.speed;
  }
};
Player.prototype.handleInput = function(direction) {
  actions[direction].call(this);
}

var player = new Player('images/char-boy.png');
var allEnemies = [ new Enemy(100) ];

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
  var allowedKeys = {
    37 : 'left',
    38 : 'up',
    39 : 'right',
    40 : 'down'
  };

  player.handleInput(allowedKeys[e.keyCode]);
});
