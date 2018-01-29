const ORDER = 4;

const LAYER_COUNT = Math.floor(ORDER / 2);

const SIZE = ORDER;

const SUB_SIZE = SIZE / ORDER;

const FACE_COLOR = [
  "red", // Right
  "orange", // Left
  "white", // Up
  "yellow", // Down
  "green", // Front
  "blue" //Back
];

var camera, scene, renderer, controls, stats, rotation;
var cubes = [];
var faceToCube = [];

function getCubeId(x, y, z) {
  return (x * ORDER + y) * ORDER + z;
}

function getFaceId(face, layer, r, c) {
  return ((face * LAYER_COUNT + layer) * ORDER + r) * ORDER + c;
}

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

  rotation = new Rotation(onRotate, onRotateStop);

  createScene();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  rotation.update();
  renderer.render(scene, camera);
}

function createAxis() {
  let gx = new THREE.Geometry();
  gx.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, SIZE));
  let x = new THREE.Line(gx, new THREE.LineBasicMaterial({ color: "red" }));

  let gy = new THREE.Geometry();
  gy.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(SIZE, 0, 0));
  let y = new THREE.Line(gy, new THREE.LineBasicMaterial({ color: "green" }));

  let gz = new THREE.Geometry();
  gz.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, SIZE, 0));
  let z = new THREE.Line(gz, new THREE.LineBasicMaterial({ color: "blue" }));

  scene.add(x);
  scene.add(y);
  scene.add(z);
}

function calcFaceToCube(x, y, z) {
  for (let face = 0; face < 6; face++) {
    let layer, r, c;

    switch (face) {
      case 0:
        layer = ORDER - 1 - x;
        r = ORDER - y - 1;
        c = ORDER - z - 1;
        break;
      case 1:
        layer = x;
        r = ORDER - y - 1;
        c = z;
        break;
      case 2:
        layer = ORDER - 1 - y;
        r = z;
        c = x;
        break;
      case 3:
        layer = y;
        r = ORDER - z - 1;
        c = x;
        break;
      case 4:
        layer = ORDER - 1 - z;
        r = ORDER - y - 1;
        c = x;
        break;
      case 5:
        layer = z;
        r = ORDER - y - 1;
        c = ORDER - x - 1;
        break;
    }

    if (layer < LAYER_COUNT) {
      faceToCube[getFaceId(face, layer, r, c)] = getCubeId(x, y, z);
    }
  }
}

function createCubes() {
  for (let i = 0; i < ORDER; i++)
    for (let j = 0; j < ORDER; j++)
      for (let k = 0; k < ORDER; k++)
        if (
          i == 0 ||
          i == ORDER - 1 ||
          j == 0 ||
          j == ORDER - 1 ||
          k == 0 ||
          k == ORDER - 1
        ) {
          calcFaceToCube(i, j, k);

          let cubeGeo = new THREE.BoxGeometry(SUB_SIZE, SUB_SIZE, SUB_SIZE);
          cubeGeo.faces.forEach((face, index) => {
            let id = Math.floor(index / 2);
            let color =
              (id == 0 && i == ORDER - 1) ||
              (id == 1 && i == 0) ||
              (id == 2 && j == ORDER - 1) ||
              (id == 3 && j == 0) ||
              (id == 4 && k == ORDER - 1) ||
              (id == 5 && k == 0)
                ? FACE_COLOR[id]
                : "#666";
            face.color = new THREE.Color(color);
          });
          cubeGeo.translate(
            (SUB_SIZE - SIZE) / 2 + SUB_SIZE * i,
            (SUB_SIZE - SIZE) / 2 + SUB_SIZE * j,
            (SUB_SIZE - SIZE) / 2 + SUB_SIZE * k
          );

          let frame = new THREE.LineSegments(
            new THREE.EdgesGeometry(cubeGeo),
            new THREE.LineBasicMaterial({ color: "black" })
          );

          let cube = new THREE.Mesh(
            cubeGeo,
            new THREE.MeshPhongMaterial({
              vertexColors: THREE.FaceColors,
              side: THREE.DoubleSide
            })
          );

          cube.add(frame);
          scene.add(cube);

          cubes[getCubeId(i, j, k)] = cube;
        }
}

function createScene() {
  createAxis();
  createCubes();

  for (let i = 0; i < 3; i++) {
    let light1 = new THREE.DirectionalLight("white");
    light1.position.set((i == 0) * SIZE, (i == 1) * SIZE, (i == 2) * SIZE);
    scene.add(light1);

    let light2 = new THREE.DirectionalLight("white");
    light2.position.set((i == 0) * -SIZE, (i == 1) * -SIZE, (i == 2) * -SIZE);
    scene.add(light2);
  }
}

function onRotate(face, layers, dir, angle) {
  for (l of layers)
    if (l < LAYER_COUNT)
      for (let i = 0; i < ORDER; i++)
        for (let j = 0; j < ORDER; j++) {
          let id = faceToCube[getFaceId(face, l, i, j)];
          if (!cubes[id]) continue;
          switch (face) {
            case 0:
              cubes[id].rotation.x = -angle * dir;
              break;
            case 1:
              cubes[id].rotation.x = angle * dir;
              break;
            case 2:
              cubes[id].rotation.y = -angle * dir;
              break;
            case 3:
              cubes[id].rotation.y = angle * dir;
              break;
            case 4:
              cubes[id].rotation.z = -angle * dir;
              break;
            case 5:
              cubes[id].rotation.z = angle * dir;
              break;
          }
        }
}

function swapFace4(fs, rs, cs, dir) {
  let tmp = [];
  for (let i = 0; i < 4; i++) {
    let id = faceToCube[getFaceId(fs[i], 0, rs[i], cs[i])];
    tmp[(i + dir + 4) % 4] = cubes[id].geometry.faces[fs[i] * 2].color.clone();
  }
  for (let i = 0; i < 4; i++) {
    let id = faceToCube[getFaceId(fs[i], 0, rs[i], cs[i])];
    cubes[id].geometry.colorsNeedUpdate = true;
    for (let j = 0; j < 2; j++)
      cubes[id].geometry.faces[fs[i] * 2 + j].color.set(tmp[i]);
  }
}

function rotateFace(face, dir) {
  for (let i = Math.floor(ORDER / 2) - 1; i >= 0; i--)
    for (let j = Math.ceil(ORDER / 2) - 1; j >= 0; j--) {
      let f = [face],
        r = [i],
        c = [j];
      for (let k = 1; k < 4; k++) {
        r[k] = c[k - 1];
        c[k] = ORDER - r[k - 1] - 1;
        f[k] = face;
      }
      swapFace4(f, r, c, dir);
    }
}

function onRotateStop(face, layers, dir) {
  for (l of layers)
    if (l < LAYER_COUNT) {
      if (l == 0) rotateFace(face, dir);
      for (i = 0; i < ORDER; i++) {
        switch (face) {
          case 0:
            swapFace4(
              [4, 2, 5, 3],
              [ORDER - i - 1, ORDER - i - 1, i, ORDER - i - 1],
              [ORDER - l - 1, ORDER - l - 1, l, ORDER - l - 1],
              dir
            );
            break;
          case 1:
            swapFace4(
              [5, 2, 4, 3],
              [ORDER - i - 1, i, i, i],
              [ORDER - l - 1, l, l, l],
              dir
            );
            break;
          case 2:
            swapFace4([1, 5, 0, 4], [l, l, l, l], [i, i, i, i], dir);
            break;
          case 3:
            swapFace4(
              [1, 4, 0, 5],
              [ORDER - l - 1, ORDER - l - 1, ORDER - l - 1, ORDER - l - 1],
              [i, i, i, i],
              dir
            );
            break;
          case 4:
            swapFace4(
              [1, 2, 0, 3],
              [ORDER - i - 1, ORDER - l - 1, i, l],
              [ORDER - l - 1, i, l, ORDER - i - 1],
              dir
            );
            break;
          case 5:
            swapFace4(
              [0, 2, 1, 3],
              [ORDER - i - 1, l, i, ORDER - l - 1],
              [ORDER - l - 1, ORDER - i - 1, l, i],
              dir
            );
            break;
        }
      }
    }
}

$(document).ready(() => {
  init();
  animate();
});
