var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
var light = new THREE.DirectionalLight(0xffffff);
var ambientLight = new THREE.AmbientLight(0x404040);
var dir = new THREE.Vector3(1, 0, 0);
var origin = new THREE.Vector3(0, 0, 0);
var length = 10;
var hex = 0xffff00;
var arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);

var gameState = {
  bombs: [],
  knownClients: {}
};

var lastState = gameState;

light.position.x = Math.random() - 0.5;
light.position.y = Math.random() - 0.5;
light.position.z = Math.random() - 0.5;
light.position.normalize();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var step = 5;
var playerGeometry = new THREE.BoxGeometry(step, step, step);
var bombGeometry = new THREE.SphereGeometry(step * 0.5, 32, 32);
var gridGeometry = new THREE.Geometry();
var groundGeometry = new THREE.PlaneGeometry(20 * step, 20 * step);

var size = step * 20 / 2;

for (var i = -size; i <= size; i += step) {
  gridGeometry.vertices.push(new THREE.Vector3(-size, 0, i));
  gridGeometry.vertices.push(new THREE.Vector3(size, 0, i));

  gridGeometry.vertices.push(new THREE.Vector3(i, 0, -size));
  gridGeometry.vertices.push(new THREE.Vector3(i, 0, size));
}

var material = new THREE.MeshLambertMaterial({color: 0x00ff00, overdraw: 0.5});
var bombMaterial = new THREE.MeshLambertMaterial({color: 0xff0000, overdraw: 0.5});
var bombMaterial2 = new THREE.MeshLambertMaterial({color: 0xeeeeee, overdraw: 0.5});
var lineMaterial = new THREE.LineBasicMaterial({color: 0xffff00, opacity: 0.2});
var groundMaterial = new THREE.MeshLambertMaterial({color: 0xffff00, side: THREE.BackSide});
var line = new THREE.LineSegments(gridGeometry, lineMaterial);
var controls = new THREE.OrbitControls(camera);
var groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
groundPlane.rotateX(Math.PI / 2);

scene.add(light);
scene.add(ambientLight);
//scene.add(line);
//scene.add(arrowHelper);
scene.add(groundPlane);

camera.position.z = 5 * step;
camera.position.y = 5 * step;
camera.position.x = 5 * step;

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
      if(xhttp.readyState === 4 && xhttp.status === 200) {
        gameState = JSON.parse(xhttp.responseText);
      }
    };

    xhttp.open('GET', endpoint, true);
    xhttp.send();
  }

}, 10);

function pointToVec3(point) {
  return new THREE.Vector3(-size + (point.x * step) + step / 2, step / 2, -size + (point.y * step) + step / 2);
}

function update() {
  var knownClients = gameState.knownClients;
  var lastStateClients = lastState.knownClients;
  var keys = Object.keys(knownClients);
  var lastKeys = Object.keys(lastStateClients);
  keys.forEach(function (key) {
    var player = knownClients[key];
    var maybeObject = scene.getObjectByName(key);
    var newPoint = pointToVec3(player.position);
    if (!maybeObject) {
      var obj = new THREE.Mesh(playerGeometry, material);
      obj.position.set(newPoint.x, newPoint.y, newPoint.z);
      var playerLight = new THREE.PointLight(0xffff00, 1, 100);
      playerLight.position.set(0, 15, 0);
      obj.name = key;
      obj.add(playerLight);
      scene.add(obj);
    } else {
      maybeObject.position.set(newPoint.x, newPoint.y, newPoint.z);
      if (!player.isAlive) {
        maybeObject.material = bombMaterial;
      }
    }
  });
  gameState.bombs.forEach(function (bomb) {
    var name = bomb.plantedAt[0] + '_' + bomb.plantedAt[1];
    var newPoint = pointToVec3(bomb.position);
    var maybeObject = scene.getObjectByName(name);
    if (!maybeObject) {
      var obj = new THREE.Mesh(bombGeometry, bombMaterial);
      var bombLight = new THREE.PointLight(0xff0000, 1, 100);
      bombLight.position.set(0, 15, 0);
      obj.position.set(newPoint.x, newPoint.y, newPoint.z)
      obj.name = name;
      obj.add(bombLight);
      scene.add(obj);
    } else {
      maybeObject.position.set(newPoint.x, newPoint.y, newPoint.z);
      if (bomb.exploded) {
        maybeObject.material = bombMaterial2;
      }
    }
  });

  var filtered = lastKeys.filter(function (lastKey) {
    return keys.indexOf(lastKey) === -1;
  });
  filtered.forEach(function (keyToRemove) {
    var maybeObjectToRemove = scene.getObjectByName(keyToRemove);
    if (maybeObjectToRemove) {
      scene.remove(maybeObjectToRemove);
    }
  });

  lastState = gameState;
}

function render() {
  requestAnimationFrame(render);
  controls.update();
  update();
  renderer.render(scene, camera);
}

render();