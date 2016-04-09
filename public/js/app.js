var rectWidth = 30;
var gameState = {};
setInterval(function() {
    fetch('api').then(function(response){
      return response.json();
    }).then(function(response) {
      gameState = response;
    });

  }, 10);

function draw() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='green';
  Object.keys(gameState).forEach(function (k) {
    var position = gameState[k].position;
    ctx.fillRect(rectWidth*position.x,rectWidth*position.y,rectWidth,rectWidth);
  });
  window.requestAnimationFrame(draw);
}
