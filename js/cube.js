const ORDER = 4;

const SIZE = ORDER;

const SUB_SIZE = SIZE / ORDER;

const FACE_COLOR = ["red", "orange", "white", "yellow", "green", "blue"];

var camera, scene, renderer, controls;
var cubes = [];

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

  createScene();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
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

function createScene() {
  createAxis();

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

          scene.add(frame);
          scene.add(cube);

          cubes[i * ORDER * ORDER + j * ORDER + k] = cubeGeo;
        }

  for (let i = 0; i < 3; i++) {
    let light1 = new THREE.DirectionalLight("white");
    light1.position.set((i == 0) * SIZE, (i == 1) * SIZE, (i == 2) * SIZE);
    scene.add(light1);

    let light2 = new THREE.DirectionalLight("white");
    light2.position.set((i == 0) * -SIZE, (i == 1) * -SIZE, (i == 2) * -SIZE);
    scene.add(light2);
  }
}

$(document).ready(() => {
  init();
  animate();
});
