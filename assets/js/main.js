var camera, scene, renderer, raycaster, controls;
var stats, gui, controller, mouse, rotation, stats, dom;
var rubikCube, solver;
var lastAcc = { x: 0, y: 0, z: 0, t: 0 };
var dragState = null;
var stopShuffle = true;
var canUndo = false,
  canRedo = false;

const Controller = function(_order, _speed) {
  this.order = _order;
  this.rotationSpeed = _speed;
  this.resetCamera = () => controls.reset();
};

function init() {
  let w = window.innerWidth,
    h = window.innerHeight;
  raycaster = new THREE.Raycaster();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(4, 4, 8);
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

  mouse = new THREE.Vector2();

  controller = new Controller(4, 1);
  gui = new dat.GUI();
  gui
    .add(controller, 'order', 1, 20, 1)
    .name('阶数')
    .onFinishChange(createRubikCube);
  gui
    .add(controller, 'rotationSpeed', 0.1, 5)
    .name('旋转速度')
    .onChange(setRotationSpeed);
  gui.add(controller, 'resetCamera').name('重置视图');

  createRubikCube();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  rotation.update();
  renderer.render(scene, camera);
}

function createRubikCube() {
  stopShuffling();
  stopSolving();
  rotation && rotation.reset();
  dragState = null;

  scene = new THREE.Scene();
  rubikCube = new RubikCube(controller.order);
  rubikCube.createScene(scene);

  rotation = new Rotation(rubikCube.rotateScene, rubikCube.rotateModel);
  rotation.rotationSpeed = controller.rotationSpeed;
  rotation.onUndoRedoChange = onUndoRedoChange;

  solver = new Solver4(rubikCube, rotation);

  $('#btn-solve').prop('disabled', controller.order > 4);
}

function onKeyDown(event) {
  const key2face = {
    KeyF: 0,
    KeyR: 1,
    KeyB: 2,
    KeyL: 3,
    KeyU: 4,
    KeyD: 5,
  };
  if (key2face[event.code] !== undefined) {
    rotation.start({
      face: key2face[event.code],
      layers: [event.ctrlKey ? 1 : 0],
      dir: event.shiftKey ? -1 : 1,
      num: 1,
    });
    return;
  } else if (event.code.startsWith('Digit')) {
    let order = parseInt(event.code.substring(5));
    if (order > 0) createRubikCube(order);
    return;
  }

  switch (event.code) {
    case 'Space':
      event.preventDefault();
      randomShuffle();
      break;
    case 'Enter':
      event.preventDefault();
      solve();
      break;
    case 'KeyO':
      controls.reset();
      break;
    case 'KeyZ':
      if (event.ctrlKey && event.shiftKey) {
        rotation.redo();
      } else if (event.ctrlKey) {
        rotation.undo();
      }
      break;
    case 'F5':
      onReset();
      break;
  }
}

function onMouseMove(event) {
  mouse.x = ((event.touches && event.touches[0]) || event).clientX / window.innerWidth * 2 - 1;
  mouse.y = -((event.touches && event.touches[0]) || event).clientY / window.innerHeight * 2 + 1;

  event.preventDefault();
  if (!dragState || rotation.rotating) return;

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
  if (event.button == 2 || dragState || rotation.rotating) return;
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
  if (dragState && dragState.rotFace !== undefined && !rotation.rotating) {
    let num = Math.round(dragState.angle / (Math.PI / 2));
    let dstAngle = num * (Math.PI / 2);
    let face = dragState.rotFace,
      layers = [dragState.rotLayer],
      dir = dragState.rotDir;
    if (dstAngle) num = Math.abs(num) % 4;

    rotation.start({ face, layers, dir, num }, dragState.angle, dstAngle);
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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onReset() {
  dragState = null;
  stopShuffling();
  stopSolving();
  rotation.reset();
  rubikCube.reset();
  solver.reset();
  controls.reset();
}

function setRotationSpeed(speed) {
  rotation.rotationSpeed = speed;
}

function onUndoRedoChange(_canUndo, _canRedo) {
  canUndo = _canUndo;
  canRedo = _canRedo;
  if (stopShuffle && solver.isStopped()) {
    $('#btn-undo').prop('disabled', !canUndo);
    $('#btn-redo').prop('disabled', !canRedo);
  }
}

function addEvent() {
  window.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('devicemotion', onDevicemotion, false);
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mouseup', onMouseUp, false);
  document.addEventListener('touchend', onMouseUp, false);
  dom.addEventListener('mousedown', onMouseDown, false);
  dom.addEventListener('touchstart', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('touchmove', onMouseMove, false);
  $('#btn-restart').click(onReset);
  $('#btn-shuffle').click(randomShuffle);
  $('#btn-solve').click(solve);
  $('#btn-undo').click(() => rotation.undo());
  $('#btn-redo').click(() => rotation.redo());
}

function stopShuffling() {
  stopShuffle = true;
  $('#btn-shuffle').text('打乱');
  $('#btn-solve').prop('disabled', false);
  $('#btn-undo').prop('disabled', !canUndo);
  $('#btn-redo').prop('disabled', !canRedo);
}

async function randomShuffle(num) {
  if (!stopShuffle) {
    stopShuffling();
    return;
  }
  if (rotation.rotating || dragState) return;
  stopShuffle = false;
  $('#btn-shuffle').text('停止');
  $('#btn-solve').prop('disabled', true);
  $('#btn-undo').prop('disabled', true);
  $('#btn-redo').prop('disabled', true);

  while (true) {
    if (Number.isInteger(num)) {
      if (num === 0) break;
      num--;
    } else if (stopShuffle) break;
    let face = Math.floor(Math.random() * 6);
    let dir = Math.random() > 0.5 ? 1 : -1;
    let layer = Math.floor(Math.random() * rubikCube.LAYER_COUNT);
    await rotation.start({ face, layers: [layer], dir, num: 1 });
  }
  stopShuffling();
}

function stopSolving() {
  solver && solver.stop();
  $('#btn-solve').text('复原');
  $('#btn-shuffle').prop('disabled', false);
  $('#btn-undo').prop('disabled', !canUndo);
  $('#btn-redo').prop('disabled', !canRedo);
}

async function solve() {
  if (!solver.isStopped()) {
    stopSolving();
    return;
  }
  if (rotation.rotating || dragState) return;
  $('#btn-solve').text('停止');
  $('#btn-shuffle').prop('disabled', true);
  $('#btn-undo').prop('disabled', true);
  $('#btn-redo').prop('disabled', true);

  await solver.solve();

  stopSolving();
}

$(document).ready(() => {
  init();
  addEvent();
  animate();
});
