var camera, scene, renderer, raycaster, controls;
var stats, mouse, rotation, stats, dom;
var rubikCube;
var lastAcc = { x: 0, y: 0, z: 0, t: 0 };
var dragState = null;
var enableDrag = true;
var stopShuffle = true;

function init() {
  let w = window.innerWidth,
    h = window.innerHeight;
  scene = new THREE.Scene();
  raycaster = new THREE.Raycaster();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(4, 3, 7);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer = new THREE.WebGLRenderer({ antialias: true });
  // renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor('#222');
  renderer.setSize(w, h);

  dom = renderer.domElement;
  document.body.appendChild(dom);

  controls = new THREE.TrackballControls(camera, dom);
  controls.noPan = true;

  stats = new Stats();
  document.body.appendChild(stats.dom);

  rubikCube = new RubikCube();
  rubikCube.createScene(scene);

  rotation = new Rotation(rubikCube.rotateScene, rubikCube.rotateModel);

  mouse = new THREE.Vector2();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  renderer.render(scene, camera);
}

function onKeyDown(event) {
  switch (event.code) {
    case 'Space':
      randomShuffle();
      break;
  }
}

function onMouseMove(event) {
  mouse.x = ((event.touches && event.touches[0]) || event).clientX / window.innerWidth * 2 - 1;
  mouse.y = -((event.touches && event.touches[0]) || event).clientY / window.innerHeight * 2 + 1;

  event.preventDefault();
  if (!dragState || !enableDrag) return;

  raycaster.setFromCamera(mouse, camera);
  let direction = new THREE.Vector3();
  direction.subVectors(raycaster.ray.direction, dragState.proj);
  direction.multiplyScalar(camera.position.length());

  let f = dragState.face;
  let rc = rubikCube.getRcOnFace(dragState.cube, f);
  if (!rc) return;

  const horizantalVectors = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(1, 0, 0),
  ];
  let hvec = horizantalVectors[f];
  let vvec = new THREE.Vector3();
  vvec.crossVectors(dragState.norm, hvec);

  let { r, c } = rc;
  let h = direction.dot(hvec);
  let v = direction.dot(vvec);
  let face, layer, dir, hv;
  if (h * h + v * v < 1e-2) return;

  if (!dragState.rotHv) dragState.rotHv = Math.abs(h) > Math.abs(v) ? 'h' : 'v';
  if (dragState.rotHv == 'h') {
    if (r < rubikCube.LAYER_COUNT) {
      face = rubikCube.getAdjFace(f, 'u');
      layer = r;
      dir = h < 0 ? 1 : -1;
    } else {
      face = rubikCube.getAdjFace(f, 'd');
      layer = rubikCube.ORDER - r - 1;
      dir = h < 0 ? -1 : 1;
    }
  } else {
    if (c < rubikCube.LAYER_COUNT) {
      face = rubikCube.getAdjFace(f, 'l');
      layer = c;
      dir = v < 0 ? 1 : -1;
    } else {
      face = rubikCube.getAdjFace(f, 'r');
      layer = rubikCube.ORDER - c - 1;
      dir = v < 0 ? -1 : 1;
    }
  }
  if (dragState.rotFace == undefined) {
    dragState.rotFace = face;
    dragState.rotLayer = layer;
  }
  dragState.rotDir = dir;
  dragState.angle = Math.abs(dragState.rotHv == 'h' ? h : v) * dir;
  rubikCube.rotateScene(dragState.rotFace, [dragState.rotLayer], dragState.angle);
}

function onMouseDown(event) {
  if (event.button == 2 || dragState || !enableDrag) return;
  onMouseMove(event);

  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(scene.children);
  for (let int of intersects)
    if (int.object.type == 'Mesh') {
      let cube = int.object;
      let face = rubikCube.toLogicFace(int.faceIndex);
      if (!rubikCube.getRcOnFace(cube, face)) break;
      dragState = {
        proj: raycaster.ray.direction.clone(),
        norm: int.face.normal.clone(),
        cube,
        face,
      };
      controls.enabled = false;
      break;
    }
}

function onMouseUp(event) {
  if (dragState && dragState.rotFace !== undefined && enableDrag) {
    let num = Math.round(dragState.angle / (Math.PI / 2));
    let dstAngle = num * (Math.PI / 2);
    let face = dragState.rotFace,
      layers = [dragState.rotLayer],
      dir = dragState.rotDir;
    if (dstAngle) num = Math.abs(num) % 4;

    enableDrag = false;
    rotation.start(face, layers, 0, dragState.angle, dstAngle, () => {
      rubikCube.rotateModel(face, layers, dir, num);
      enableDrag = true;
    });
  }
  controls.enabled = true;
  dragState = null;
}

function onDevicemotion(event) {
  let acceleration = event.accelerationIncludingGravity;
  let curTime = new Date().getTime();

  if (curTime - lastAcc.t > 100) {
    let x = acceleration.x;
    let y = acceleration.y;
    let z = acceleration.z;

    let speed =
      Math.abs(x + y + z - lastAcc.x - lastAcc.y - lastAcc.z) / (curTime - lastAcc.t) * 10000;

    if (speed > 2000) randomShuffle(20);

    lastAcc = { x, y, z, t: curTime };
  }
}

function addEvent() {
  window.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('devicemotion', onDevicemotion, false);
  document.addEventListener('mouseup', onMouseUp, false);
  document.addEventListener('touchend', onMouseUp, false);
  dom.addEventListener('mousedown', onMouseDown, false);
  dom.addEventListener('touchstart', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('touchmove', onMouseMove, false);
}

async function randomShuffle(num) {
  if (!stopShuffle) {
    stopShuffle = true;
    return;
  }
  if (rotation.rotating || dragState) return;
  enableDrag = false;
  stopShuffle = false;
  while (true) {
    if (num !== undefined) {
      if (num === 0) break;
      num--;
    } else if (stopShuffle) break;
    let face = Math.floor(Math.random() * 6);
    let dir = Math.random() > 0.5 ? 1 : -1;
    let layer = Math.floor(Math.random() * rubikCube.LAYER_COUNT);
    await rotation.start(face, [layer], dir);
  }
  enableDrag = true;
}

$(document).ready(() => {
  init();
  addEvent();
  animate();
});
