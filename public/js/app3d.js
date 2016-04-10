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
light.position.x = Math.random() - 0.5;
light.position.y = Math.random() - 0.5;
light.position.z = Math.random() - 0.5;
light.position.normalize();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var step = 5;
var geometry = new THREE.BoxGeometry(step, step, step);
var gridGeometry = new THREE.Geometry();

var size = step * 20 / 2;

for (var i = -size; i <= size; i += step) {
  gridGeometry.vertices.push(new THREE.Vector3(-size, 0, i));
  gridGeometry.vertices.push(new THREE.Vector3(size, 0, i));

  gridGeometry.vertices.push(new THREE.Vector3(i, 0, -size));
  gridGeometry.vertices.push(new THREE.Vector3(i, 0, size));
}

var material = new THREE.MeshLambertMaterial({color: 0x00ff00, overdraw: 0.5});
var bombMaterial = new THREE.MeshLambertMaterial({color: 0xff0000, overdraw: 0.5});
var lineMaterial = new THREE.LineBasicMaterial({color: 0xffff00, opacity: 0.2});
var line = new THREE.LineSegments(gridGeometry, lineMaterial);
var controls = new THREE.OrbitControls(camera);
scene.add(light);
scene.add(ambientLight);
scene.add(line);
scene.add(arrowHelper);

camera.position.z = 5 * step;
camera.position.y = 5 * step;
camera.position.x = 5 * step;

setInterval(function () {
  fetch('api').then(function (response) {
    return response.json();
  }).then(function (response) {
    gameState = response;
  });
}, 10);

function pointToVec3(point) {
  return new THREE.Vector3(-size + (point.x * step), 0, -size + (point.y * step));
}

function update() {
  var knownClients = gameState.knownClients;
  var keys = Object.keys(knownClients);
  keys.forEach(function (key) {
    var maybeObject = scene.getObjectByName(key);
    console.log(maybeObject);
    var newPoint = pointToVec3(knownClients[key].position);
    if (!maybeObject) {
      var obj = new THREE.Mesh(geometry, material);
      obj.position.x = newPoint.x;
      obj.position.y = newPoint.y;
      obj.position.z = newPoint.z;
      obj.name = key;
      console.log('adding', obj);
      scene.add(obj);
    } else {
      maybeObject.position.x = newPoint.x;
      maybeObject.position.y = newPoint.y;
      maybeObject.position.z = newPoint.z;
    }
  })
}

function render() {
  requestAnimationFrame(render);
  controls.update();
  update();
  renderer.render(scene, camera);
}

render();