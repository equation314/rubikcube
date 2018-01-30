var camera, scene, renderer, raycaster, controls;
var stats, mouse, rotation, stats, dom;
var rubikCube;
var lastAcc = { x: 0, y: 0, z: 0, t: 0 };
var dragState = null;
var enableDrag = true;

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
      randomShuffle(20);
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

  let rc = rubikCube.getRcOnFace(dragState.cube, dragState.face);
  if (!rc || direction.length() < 1e-5) return;

  const horizantalVectors = [
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
  ];
  let hvec = horizantalVectors[dragState.face];
  let vvec = new THREE.Vector3();
  vvec.crossVectors(dragState.norm, hvec);

  switch (dragState.face) {
    case 0:
      let { r, c } = rc;
      let h = direction.dot(hvec);
      let v = direction.dot(vvec);
      let face, layer, dir, hv;

      if (!dragState.rotHv) dragState.rotHv = Math.abs(h) > Math.abs(v) ? 'h' : 'v';
      if (dragState.rotHv == 'h') {
        if (r < rubikCube.LAYER_COUNT) {
          face = 2;
          layer = r;
          dir = h < 0 ? 1 : -1;
        } else {
          face = 3;
          layer = rubikCube.ORDER - r - 1;
          dir = h < 0 ? -1 : 1;
        }
      } else {
        if (c < rubikCube.LAYER_COUNT) {
          face = 4;
          layer = c;
          dir = v < 0 ? 1 : -1;
        } else {
          face = 5;
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
      break;
  }
}

function onMouseDown(event) {
  if (event.button == 2 || dragState || !enableDrag) return;
  onMouseMove(event);

  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(scene.children);
  for (let int of intersects)
    if (int.object.type == 'Mesh') {
      let cube = int.object;
      let face = Math.floor(int.faceIndex / 2);
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
  enableDrag = false;
  for (; num > 0; num--) {
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
