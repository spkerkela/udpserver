var rectWidth = 30;
var gameState = {
  bombs: [],
  knownClients: {}
};
setInterval(function () {
  var endpoint = 'api';
  if (window.fetch) {
    window.fetch(endpoint).then(function (response) {
      return response.json();
    }).then(function (response) {
      gameState = response;
    });
  } else {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        gameState = JSON.parse(xhttp.responseText);
      }
    };

    xhttp.open('GET', endpoint, true);
    xhttp.send();
  }

}, 1000);

function draw() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'green';
  var knownClients = gameState.knownClients;
  gameState.bombs.forEach(function (bomb) {
    ctx.fillStyle = bomb.exploded ? 'grey' : 'yellow';
    ctx.fillRect(rectWidth * bomb.position.x, rectWidth * bomb.position.y, rectWidth, rectWidth);
  });
  Object.keys(knownClients).forEach(function (k) {
    var player = knownClients[k];
    ctx.fillStyle = player.isAlive ? 'green' : 'red';
    var position = player.position;
    ctx.fillRect(rectWidth * position.x, rectWidth * position.y, rectWidth, rectWidth);
  });
  window.requestAnimationFrame(draw);
}
