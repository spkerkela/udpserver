var rectWidth = 30;
var gameState = {
  bombs:[],
  knownClients: {}
};
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
  var knownClients =  gameState.knownClients;
  gameState.bombs.forEach(function(bomb) {
    ctx.fillStyle= bomb.exploded ? 'grey':'yellow';
    ctx.fillRect(rectWidth*bomb.position.x,rectWidth*bomb.position.y,rectWidth,rectWidth);
  });
  Object.keys(knownClients).forEach(function (k) {
    ctx.fillStyle='green';
    var player = knownClients[k];
    var position = player.position;
    ctx.fillRect(rectWidth*position.x,rectWidth*position.y,rectWidth,rectWidth);
  });
    window.requestAnimationFrame(draw);
}
