var camera, scene, renderer, controls;

function createScene() {
  let cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshNormalMaterial()
  );
  scene.add(cube);
}

function init() {
  let w = window.innerWidth,
    h = window.innerHeight;
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, w / h, 1, 100);
  camera.position.set(3, 2, 8);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor("#333");
  renderer.setSize(w, h);
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  createScene();
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
}

$(document).ready(() => {
  init();
  animate();
});
