const Solver4 = function(_rubikCube, _rotation) {
  const ORDER = _rubikCube.ORDER;

  var faces = [];
  var frontFace = 0;
  var topFace = 4;

  this.stopped = true;

  init();

  function getFaceId(face, r, c) {
    return (face * ORDER + r) * ORDER + c;
  }

  function getFace(face, r, c) {
    return faces[getFaceId(face, r, c)];
  }

  function init() {
    _rubikCube.setOnSwap((fs, rs, cs, dir) => {
      let tmp = [];
      for (let i = 0; i < 4; i++) tmp[(i + dir + 4) % 4] = { ...getFace(fs[i], rs[i], cs[i]) };
      for (let i = 0; i < 4; i++) faces[getFaceId(fs[i], rs[i], cs[i])] = tmp[i];
    });

    for (let i = 0; i < 6; i++)
      for (let j = 0; j < ORDER; j++)
        for (let k = 0; k < ORDER; k++)
          faces[getFaceId(i, j, k)] = { color: i, id: _rubikCube.getCubeIdByFace(i, 0, j, k) };
  }

  // 当前视角下(topFace 面在上, frontFace 面在前)，顺时针旋转 face 面的 layers 层 dir 次
  async function _(face, layers, dir) {
    let num = Math.abs(dir);
    if (num == 3) {
      num = 1;
      dir = -dir;
    }
    dir = dir / num;

    if (face < 4) {
      // F,R,B,L
      if (topFace == 4) face = (frontFace + t) % 4;
      else face = (frontFace - t + 4) % 4;
    } else if (face == 4)
      face = topFace; // U
    else face = topFace ^ 1; // D

    for (; num > 0 && !this.stopped; num--) await _rotation.start(face, layers, dir);
  }

  function forEachCenter(callback) {
    for (let i = 1; i < ORDER - 1; i++)
      for (let j = 1; j < ORDER - 1; j++) {
        callback(i, j);
      }
  }

  function forEachEdge(callback) {
    for (let i = 1; i < ORDER - 1; i++) {
      callback(0, i);
      callback(ORDER - 1, i);
      callback(i, 0);
      callback(i, ORDER - 1);
    }
  }

  function forEachCorner(callback) {
    callback(0, 0);
    callback(0, ORDER - 1);
    callback(ORDER - 1, 0);
    callback(ORDER - 1, ORDER - 1);
  }

  // 统计 face 面上中心块颜色为 color 的个数
  function countCenterColor(face, color) {
    let s = 0;
    forEachCenter((r, c) => (s += getFace(face, r, c).color === color));
    return s;
  }

  // 统计 face 面上棱块颜色为 color 的个数
  function countEdgeColor(face, color) {
    let s = 0;
    forEachEdge((r, c) => (s += getFace(face, r, c).color === color));
    return s;
  }

  // 统计 face 面上角块颜色为 color 的个数
  function countCornerColor(face, color) {
    let s = 0;
    forEachCorner((r, c) => (s += getFace(face, r, c).color === color));
    return s;
  }

  async function solveCenters() {
    if (this.stopped) return;
  }

  async function solveEdges() {
    if (this.stopped) return;
  }

  async function solveTopCross() {
    if (this.stopped) return;
  }

  async function solveTopCorners() {
    if (this.stopped) return;
  }

  async function solveMiddleLayer() {
    if (this.stopped) return;
  }

  async function solveBottomCross() {
    if (this.stopped) return;
  }

  async function solveBottomFace() {
    if (this.stopped) return;
  }

  async function solveBottomCorners() {
    if (this.stopped) return;
  }

  async function solveBottomEdges() {
    if (this.stopped) return;
  }

  this.stop = () => {
    this.stopped = true;
  };

  this.solve = async () => {
    this.stopped = false;
    await solveCenters();
    await solveEdges();
    await solveTopCross();
    await solveTopCorners();
    await solveMiddleLayer();
    await solveBottomCross();
    await solveBottomFace();
    await solveBottomCorners();
    await solveBottomEdges();
    this.stopped = true;
  };
};
