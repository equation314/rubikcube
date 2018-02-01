const Solver4 = function(_rubikCube, _rotation) {
  const ORDER = _rubikCube.ORDER;
  const EDGE_LENGHT = ORDER - 2;
  const CENTER_COUNT = EDGE_LENGHT * EDGE_LENGHT;

  // [track, toword, offset]
  const TRACK_INFO = [
    [[3, 0, 0], [4, 0, 0]],
    [[1, 0, 0], [4, 0, 1]],
    [[3, 0, 1], [5, 0, 0]],
    [[1, 0, 1], [5, 0, 1]], // front
    [[0, 1, 0], [4, 3, 0]],
    [[2, 3, 0], [4, 3, 1]],
    [[0, 1, 1], [5, 1, 0]],
    [[2, 3, 1], [5, 1, 1]], // right
    [[1, 2, 1], [4, 2, 0]],
    [[3, 2, 1], [4, 2, 1]],
    [[1, 2, 0], [5, 2, 0]],
    [[3, 2, 0], [5, 2, 1]], // back
    [[2, 1, 1], [4, 1, 0]],
    [[0, 3, 1], [4, 1, 1]],
    [[2, 1, 0], [5, 3, 0]],
    [[0, 3, 0], [5, 3, 1]], // left
    [[3, 3, 0], [2, 0, 0]],
    [[1, 1, 0], [2, 0, 1]],
    [[3, 3, 1], [0, 0, 0]],
    [[1, 1, 1], [0, 0, 1]], // top
    [[3, 1, 0], [0, 2, 1]],
    [[1, 3, 0], [0, 2, 0]],
    [[3, 1, 1], [2, 2, 1]],
    [[1, 3, 1], [2, 2, 0]], // down
  ];
  var INV_TRACK_INFO = [];

  var faces = [];
  var edgeToFace = [];
  var frontFace = 0;
  var topFace = 4;

  var stopped = true;

  this.getAdjFace = _rubikCube.getAdjFace;

  init();

  function getFaceId(face, r, c) {
    return (face * ORDER + r) * ORDER + c;
  }

  function getFace(face, r, c) {
    return faces[getFaceId(face, r, c)];
  }

  // 转换为轨道坐标系
  function getTrackInfo(face, r, c) {
    return TRACK_INFO[(face * 2 + r - 1) * 2 + c - 1];
  }

  // 根据轨道坐标系获取一小面
  function getFaceByTrack(track, toward, offset) {
    return faces[INV_TRACK_INFO[(track * 4 + toward) * 2 + offset]];
  }

  // 获取对立面
  function getOppositeFace(face) {
    if (face >= 4) return face ^ 1;
    else return (face + 2) % 4;
  }

  // 获取 pair 个棱块对上第 index 个棱块的 face 面的颜色
  function getEdgeColor(pair, index, face) {
    let faceId = edgeToFace[pair * EDGE_LENGHT + index][face];
    return faces[faceId].color;
  }

  function init() {
    _rubikCube.setOnSwap((fs, rs, cs, dir) => {
      let tmp = [];
      for (let i = 0; i < 4; i++)
        tmp[(i + dir + 4) % 4] = JSON.stringify(getFace(fs[i], rs[i], cs[i]));
      for (let i = 0; i < 4; i++) faces[getFaceId(fs[i], rs[i], cs[i])] = JSON.parse(tmp[i]);
    });

    for (let i = 0; i < 6; i++)
      for (let j = 0; j < ORDER; j++)
        for (let k = 0; k < ORDER; k++)
          faces[getFaceId(i, j, k)] = { color: i, id: _rubikCube.getCubeIdByFace(i, 0, j, k) };

    for (let i = 0; i < EDGE_LENGHT; i++) {
      for (let j = 0; j < 4; j++) {
        const rcs = [
          [ORDER - 1, i + 1],
          [ORDER - i - 2, ORDER - 1],
          [0, ORDER - i - 2],
          [i + 1, 0],
        ];

        // up
        edgeToFace[j * EDGE_LENGHT + i] = [
          getFaceId(4, rcs[j][0], rcs[j][1]),
          getFaceId(j, 0, i + 1),
        ];

        // down
        edgeToFace[(j + 4) * EDGE_LENGHT + i] = [
          getFaceId(5, rcs[(j + 2) % 4][0], rcs[j][1]),
          getFaceId(j, ORDER - 1, i + 1),
        ];

        // around
        edgeToFace[(j + 8) * EDGE_LENGHT + i] = [
          getFaceId(j, i + 1, ORDER - 1),
          getFaceId((j + 1) % 4, i + 1, 0),
        ];
      }
    }

    if (ORDER == 4) {
      for (let f = 0; f < 6; f++)
        for (let r = 0; r < 2; r++)
          for (let c = 0; c < 2; c++)
            for (let i = 0; i < 2; i++) {
              let t = TRACK_INFO[(f * 2 + r) * 2 + c][i];
              INV_TRACK_INFO[(t[0] * 4 + t[1]) * 2 + t[2]] = getFaceId(f, r + 1, c + 1);
            }
    }
  }

  // 当前视角下(topFace 面在上, frontFace 面在前)，顺时针旋转 face 面的 layers 层 dir 次
  async function _(face, layers, dir) {
    let num = Math.abs(dir);
    dir = dir / num;
    if (num == 3) {
      num = 1;
      dir = -dir;
    }

    if (face < 4) {
      // F,R,B,L
      if (topFace == 4) face = (frontFace + face) % 4;
      else face = (frontFace - face + 4) % 4;
    } else if (face == 4)
      face = topFace; // U
    else face = topFace ^ 1; // D

    for (; num > 0 && !stopped; num--) await _rotation.start(face, layers, dir);
  }

  async function forEachCenter(callback) {
    for (let i = 1; i < ORDER - 1; i++)
      for (let j = 1; j < ORDER - 1; j++) {
        await callback(i, j);
      }
  }

  async function forEachEdge(callback) {
    for (let i = 1; i < ORDER - 1; i++) {
      await callback(0, i);
      await callback(ORDER - 1, i);
      await callback(i, 0);
      await callback(i, ORDER - 1);
    }
  }

  async function forEachCorner(callback) {
    await callback(0, 0);
    await callback(0, ORDER - 1);
    await callback(ORDER - 1, 0);
    await callback(ORDER - 1, ORDER - 1);
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

  // 同一面中变轨，转的方向
  function getChangeTrackDircetion(face, r, c, track) {
    let isVerticalTrack =
      TRACK_INFO[face * 4][0][0] === track || TRACK_INFO[face * 4 + 1][0][0] === track;
    return ((r + c - 2) % 2 === 0) ^ isVerticalTrack ? -1 : 1;
  }

  // 同一面同一轨道中变位置
  function getChangeOffsetDircetion(face, r, c, track) {
    return getChangeTrackDircetion(face, r, c, track) * -1;
  }

  // 将中心块 (f1,r1,c1) 移到 (f2,r2,c2)
  async function moveOneCenterTo(f1, r1, c1, f2, r2, c2) {
    if (stopped) return;

    let t1 = getTrackInfo(f1, r1, c1),
      t2 = getTrackInfo(f2, r2, c2);
    for (let i of t1)
      for (let j of t2)
        if (i[0] === j[0] || getOppositeFace(i[0]) === j[0]) {
          t1 = i;
          t2 = j;
          break;
        }

    let changedDir = 1;
    if (t1[0] === t2[0]) {
      await _(f1, [0], getChangeTrackDircetion(f1, r1, c1, t1[0]));
      changedDir = -changedDir;
    }
    if ((getFaceByTrack(t2[0], t2[1], t2[2] ^ 1).color === f2) ^ (t1[2] !== t2[2])) {
      await _(f1, [0], getChangeOffsetDircetion(f1, r1, c1, t1[0]) * changedDir);
      changedDir = -changedDir;
    }

    let dir = t1[0] === t2[0] ? t1[1] - t2[1] : (4 - t1[1]) % 4 - t2[1];
    await _(t2[0], [1], dir);
    await _(f1, [0], getChangeTrackDircetion(f1, r1, c1, t1[0]) * changedDir);
    await _(t2[0], [1], -dir);
  }

  // 将一对棱块移到前面
  async function moveEdgePairToFront(pair, position = 'up') {
    if (stopped) return;

    let dir;
    if (pair < 8) {
      // on up or down
      if (pair < 4 && position == 'down') await _(pair, [0], 2);
      else if (pair >= 4 && position == 'up') await _(pair - 4, [0], 2);
      dir = pair % 4;
    } else {
      // around
      switch (pair) {
        case 8:
          await _(1, [0], position == 'up' ? 1 : -1);
          dir = 1;
          break;
        case 9:
          await _(1, [0], position == 'up' ? -1 : 1);
          dir = 1;
          break;
        case 10:
          await _(3, [0], position == 'up' ? 1 : -1);
          dir = 3;
          break;
        case 11:
          await _(3, [0], position == 'up' ? -1 : 1);
          dir = 3;
          break;
      }
    }

    if (position == 'up') await _(4, [0], dir);
    else await _(5, [0], -dir);
  }

  // 检查棱块对是否完整
  function checkEdgePair(pair) {
    let c1 = getEdgeColor(pair, 0, 0),
      c2 = getEdgeColor(pair, 0, 1);

    for (let j = 1; j < EDGE_LENGHT; j++)
      if (getEdgeColor(pair, j, 0) !== c1 || getEdgeColor(pair, j, 1) !== c2) return false;
    return true;
  }

  async function solveCenters() {
    if (stopped) return;

    if (ORDER == 3) {
      for (let i = 0; i < 6; i++)
        if (getFace(i, 1, 1).color == 4) {
          if (i < 4) await _((i + 1) % 4, [1], 1);
          else if (i == 5) await _(0, [1], 2);
          break;
        }

      while (getFace(0, 1, 1).color !== 0) await _(4, [1], 1);
      return;
    }

    const seq = [4, 5, 0, 1, 2, 3];
    let fuck = false;
    for (face of seq)
      if (!stopped)
        await forEachCenter(async (r, c) => {
          if (getFace(face, r, c).color !== face) {
            for (let i = 0; i < 6; i++)
              if (i !== face)
                await forEachCenter(async (j, k) => {
                  if (getFace(i, j, k).color === face) {
                    await moveOneCenterTo(i, j, k, face, r, c);
                  }
                });
          }
        });
  }

  async function solveEdges() {
    if (stopped) return;

    let found = true;
    while (found && !stopped) {
      found = false;
      for (let i = 0; i < 12; i++)
        if (!found && !stopped && !checkEdgePair(i)) {
          await moveEdgePairToFront(i, 'up');

          let c1 = getFace(0, 0, 1).color,
            c2 = getFace(4, ORDER - 1, 1).color;
          for (let j = 1; j < 12; j++)
            for (let k = 0; k < EDGE_LENGHT; k++) {
              let c3 = getEdgeColor(j, k, 0),
                c4 = getEdgeColor(j, k, 1);
              if (((c1 === c3 && c2 === c4) || (c1 === c4 && c2 === c3)) && !found && !stopped) {
                found = true;
                await moveEdgePairToFront(j, 'down');

                if (getFace(5, 0, 2).color === c1 && getFace(0, ORDER - 1, 2).color === c2) {
                  await _(4, [0], 1); // U
                  await _(0, [0], -1); // F'
                  await _(3, [0], 1); // L
                  await _(0, [0], -1); // F'
                }
                await _(1, [1], 1); // MR
                await _(4, [0], -1); // U'
                await _(0, [0], 1); // F
                await _(1, [0], -1); // R'
                await _(4, [0], 1); // U
                await _(0, [0], -1); // F'
                await _(1, [1], -1); // MR'
              }
            }
        }
    }
  }

  async function solveTopCross() {
    if (stopped) return;
  }

  async function solveTopCorners() {
    if (stopped) return;
  }

  async function solveMiddleLayer() {
    if (stopped) return;
  }

  async function solveBottomCross() {
    if (stopped) return;
  }

  async function solveBottomFace() {
    if (stopped) return;
  }

  async function solveBottomCorners() {
    if (stopped) return;
  }

  async function solveBottomEdges() {
    if (stopped) return;
  }

  this.isStopped = () => stopped;

  this.stop = () => {
    stopped = true;
  };

  this.solve = async () => {
    if (ORDER > 4) {
      alert('The maximum solveble order is 4!');
      return;
    }

    stopped = false;
    await solveCenters();
    await solveEdges();
    await solveTopCross();
    await solveTopCorners();
    await solveMiddleLayer();
    await solveBottomCross();
    await solveBottomFace();
    await solveBottomCorners();
    await solveBottomEdges();
    this.stop();
  };
};
