var test = TestCase("Collision testing")
test.prototype.collidesWithOutOfScreen = function() {
  var player = new Renderable(200, -50);
  player.boxX = 10;
  player.boxY = 100;
  player.boxW = 50;
  player.boxH = 71;
  var level = levelEnd();
  assertFalse("Player must collide", player.collidesWith(level));
};