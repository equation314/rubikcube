var camera, scene, renderer, controls, stats, rotation;
var rubikCube;

function init() {
  let w = window.innerWidth,
    h = window.innerHeight;
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(3, 2, 8);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer = new THREE.WebGLRenderer({ antialias: true });
  // renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor("#222");
  renderer.setSize(w, h);
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  stats = new Stats();
  document.body.appendChild(stats.dom);

  rubikCube = new RubikCube();
  rubikCube.createScene(scene);

  rotation = new Rotation(rubikCube.onRotate, rubikCube.onRotateStop);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  renderer.render(scene, camera);
}

function addEvent() {
  window.addEventListener(
    "keydown",
    event => {
      if (event.code == "Space") randomShuffle(20);
    },
    false
  );

  let shakeThreshold = 2000;
  let lastUpdate = 0,
    lastX = 0,
    lastY = 0,
    lastZ = 0;
  window.addEventListener(
    "devicemotion",
    event => {
      let acceleration = event.accelerationIncludingGravity;
      let curTime = new Date().getTime();

      if (curTime - lastUpdate > 100) {
        let x = acceleration.x;
        let y = acceleration.y;
        let z = acceleration.z;

        let speed =
          Math.abs(x + y + z - lastX - lastY - lastZ) /
          (curTime - lastUpdate) *
          10000;

        if (speed > shakeThreshold) randomShuffle(20);

        lastX = x;
        lastY = y;
        lastZ = z;
        lastUpdate = curTime;
      }
    },
    false
  );
}

async function randomShuffle(num) {
  for (; num > 0; num--) {
    let face = Math.floor(Math.random() * 6);
    let dir = Math.random() > 0.5 ? 1 : -1;
    let layer = Math.floor(Math.random() * rubikCube.LAYER_COUNT);
    await rotation.start(face, [layer], dir);
  }
}

$(document).ready(() => {
  init();
  addEvent();
  animate();
});
