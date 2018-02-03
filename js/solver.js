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

  const EDGE_RC = {
    l: [1, 0],
    u: [0, 1],
    r: [1, ORDER - 1],
    d: [ORDER - 1, 1],
  };

  const CORNER_RC = [[ORDER - 1, ORDER - 1], [0, ORDER - 1], [0, 0], [ORDER - 1, 0]];

  var faces = [];
  var edgeToFace = [];
  var frontFace = 0;
  var topFace = 4;

  var stopped = true;

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

  // face 面 dir 方向相邻的面
  function getAdjFace(face, dir) {
    return _rubikCube.getAdjFace(face, dir);
  }

  // face 面 dir 方向棱块相邻的颜色
  function getAdjColor(face, dir) {
    let adjFace = getAdjFace(face, dir),
      res;
    forEachEdge((r, c, d) => {
      if (getAdjFace(adjFace, d) === face) res = getFace(adjFace, r, c).color;
    }, 1);
    return res;
  }

  function reset() {
    stopped = true;
    frontFace = 0;
    topFace = 4;

    for (let i = 0; i < 6; i++)
      for (let j = 0; j < ORDER; j++)
        for (let k = 0; k < ORDER; k++)
          faces[getFaceId(i, j, k)] = { color: i, id: _rubikCube.getCubeIdByFace(i, 0, j, k) };
  }

  function init() {
    reset();

    _rubikCube.setOnSwap((fs, rs, cs, dir) => {
      let tmp = [];
      for (let i = 0; i < 4; i++)
        tmp[(i + dir + 4) % 4] = JSON.stringify(getFace(fs[i], rs[i], cs[i]));
      for (let i = 0; i < 4; i++) faces[getFaceId(fs[i], rs[i], cs[i])] = JSON.parse(tmp[i]);
    });

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
    // console.log(face, layers, dir);
    if (stopped || dir == 0) return;
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
    await _rotation.start({ face, layers, dir, num });
  }

  async function forEachCenterAsync(callback) {
    for (let i = 1; i < ORDER - 1; i++)
      for (let j = 1; j < ORDER - 1; j++) {
        await callback(i, j);
      }
  }

  async function forEachEdgeAsync(callback, num = EDGE_LENGHT) {
    for (let i = 1; i <= num; i++) {
      await callback(i, 0, 'l');
      await callback(0, i, 'u');
      await callback(i, ORDER - 1, 'r');
      await callback(ORDER - 1, i, 'd');
    }
  }

  async function forEachCornerAsync(callback) {
    for (let i = 0; i < 4; i++) {
      await callback(CORNER_RC[i][0], CORNER_RC[i][1], i);
    }
  }

  function forEachCenter(callback) {
    for (let i = 1; i < ORDER - 1; i++)
      for (let j = 1; j < ORDER - 1; j++) {
        callback(i, j);
      }
  }

  function forEachEdge(callback, num = EDGE_LENGHT) {
    for (let i = 1; i <= num; i++) {
      callback(i, 0, 'l');
      callback(0, i, 'u');
      callback(i, ORDER - 1, 'r');
      callback(ORDER - 1, i, 'd');
    }
  }

  function forEachCorner(callback) {
    for (let i = 0; i < 4; i++) {
      callback(CORNER_RC[i][0], CORNER_RC[i][1], i);
    }
  }

  // 统计 face 面上中心块颜色为 color 的个数
  function countCenterColor(face, color) {
    let s = 0;
    forEachCenter((r, c) => (s += getFace(face, r, c).color === color));
    return s;
  }

  // 统计 face 面上棱块颜色为 color 的个数
  function countEdgeColor(face, color, num = EDGE_LENGHT) {
    let s = 0;
    forEachEdge((r, c) => (s += getFace(face, r, c).color === color), num);
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

  // 检查 face 面 dir 方向的棱块是否归位
  function checkFaceEdge(face, dir) {
    return (
      getFace(face, EDGE_RC[dir][0], EDGE_RC[dir][1]).color === face &&
      getAdjFace(face, dir) === getAdjColor(face, dir)
    );
  }

  // 检查顶面 dir 方向的角块是否归位
  function checkTopCorner(dir) {
    if (getFace(4, CORNER_RC[dir][0], CORNER_RC[dir][1]).color !== 4) return false;
    if (getFace(dir, 0, ORDER - 1).color !== dir) return false;
    if (getFace((dir + 1) % 4, 0, 0).color !== (dir + 1) % 4) return false;
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
        await forEachCenterAsync(async (r, c) => {
          if (getFace(face, r, c).color !== face) {
            for (let i = 0; i < 6; i++)
              if (i !== face)
                await forEachCenterAsync(async (j, k) => {
                  if (getFace(i, j, k).color === face) {
                    await moveOneCenterTo(i, j, k, face, r, c);
                  }
                });
          }
        });
  }

  async function solveEdges() {
    if (ORDER <= 3) return;

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
    if (ORDER <= 2) return;

    while (
      !stopped &&
      (!checkFaceEdge(0, 'u') ||
        !checkFaceEdge(1, 'u') ||
        !checkFaceEdge(2, 'u') ||
        !checkFaceEdge(3, 'u'))
    ) {
      // 底面白色棱块归位
      while (!stopped && countEdgeColor(5, 4, 1) > 0) {
        await forEachEdgeAsync(async (r, c, dir) => {
          if (getFace(5, r, c).color === 4) {
            let adjFace = getAdjFace(5, dir),
              bottomColor = getFace(adjFace, ORDER - 1, 1).color;
            await _(5, [0], bottomColor - adjFace);
            await _(bottomColor, [0], 2);
          }
        }, 1);
      }

      // 侧面白色棱块移到底面
      for (let i = 0; i < 4; i++) {
        // u, d
        await forEachEdgeAsync(async (r, c, dir) => {
          if (getFace(i, r, c).color === 4 && (dir === 'u' || dir === 'd')) {
            if (checkFaceEdge(i, 'u')) await _(5, [0], 1);
            else await _(i, [0], 1);
          }
        }, 1);
        // l, r
        await forEachEdgeAsync(async (r, c, dir) => {
          if (getFace(i, r, c).color === 4 && (dir === 'l' || dir === 'r')) {
            let adjFace = getAdjFace(i, dir);
            if (getAdjColor(i, dir) == adjFace) await _(adjFace, [0], dir === 'l' ? -1 : 1);
            else {
              await _(adjFace, [0], dir === 'l' ? 1 : -1);
              await _(5, [0], 1);
              await _(adjFace, [0], dir === 'l' ? -1 : 1);
            }
          }
        }, 1);
      }

      // 顶面错误白色棱块移到底面
      await forEachEdgeAsync(async (r, c, dir) => {
        if (getFace(4, r, c).color == 4 && !checkFaceEdge(4, dir)) {
          await _(getAdjFace(4, dir), [0], 2);
        }
      }, 1);
    }
  }

  async function solveTopCorners() {
    while (
      !stopped &&
      (!checkTopCorner(0) || !checkTopCorner(1) || !checkTopCorner(2) || !checkTopCorner(3))
    ) {
      // 侧面底部白色角块归位
      let found = true;
      while (!stopped && found) {
        found = false;
        for (let i = 0; i < 4; i++) {
          if (getFace(i, ORDER - 1, 0).color == 4) {
            let id = getFace(i, ORDER - 1, 0).id,
              bottomColor;
            forEachCorner((r, c) => {
              if (getFace(5, r, c).id === id) bottomColor = getFace(5, r, c).color;
            });
            await _(5, [0], bottomColor - i);
            await _(bottomColor, [0], -1);
            await _(5, [0], -1);
            await _(bottomColor, [0], 1);
            found = true;
          }
          if (getFace(i, ORDER - 1, ORDER - 1).color == 4) {
            let id = getFace(i, ORDER - 1, ORDER - 1).id,
              bottomColor;
            forEachCorner((r, c) => {
              if (getFace(5, r, c).id === id) bottomColor = getFace(5, r, c).color;
            });
            await _(5, [0], bottomColor - i);
            await _(bottomColor, [0], 1);
            await _(5, [0], 1);
            await _(bottomColor, [0], -1);
            found = true;
          }
        }
      }
      // 侧面顶部白色角块移到侧面底部
      for (let i = 0; i < 4; i++) {
        if (getFace(i, 0, 0).color === 4) {
          await _(i, [0], -1);
          await _(5, [0], -1);
          await _(i, [0], 1);
        }
        if (getFace(i, 0, ORDER - 1).color === 4) {
          await _(i, [0], 1);
          await _(5, [0], 1);
          await _(i, [0], -1);
        }
      }
      // 底面白色角块移到侧面底部
      await forEachCornerAsync(async (r, c, dir) => {
        if (!stopped && getFace(5, r, c).color === 4) {
          let replaceFace;
          forEachCorner((r, c, d) => {
            if (replaceFace === undefined && !checkTopCorner(d)) replaceFace = d;
          });
          await _(5, [0], (replaceFace + dir - 1) % 4);
          await _(replaceFace, [0], 1);
          await _(5, [0], -1);
          await _(replaceFace, [0], -1);
        }
      });
      // 顶面错误白色角块移到侧面底部
      await forEachCornerAsync(async (r, c, dir) => {
        if (!stopped && getFace(4, r, c).color === 4 && !checkTopCorner(dir)) {
          await _(dir, [0], 1);
          await _(5, [0], 1);
          await _(dir, [0], -1);
          await _(5, [0], -1);
        }
      });
    }
  }

  async function solveMiddleLayer() {
    if (ORDER <= 2) return;

    const formula = async dir => {
      await _(5, [0], -dir); // D'
      await _(dir > 0 ? 1 : 3, [0], -dir); // R'
      await _(5, [0], dir); // D
      await _(dir > 0 ? 1 : 3, [0], dir); // R
      await _(5, [0], dir); // D
      await _(0, [0], dir); // F
      await _(5, [0], -dir); // D'
      await _(0, [0], -dir); // F'
    };

    while (
      !stopped &&
      (!checkFaceEdge(0, 'l') ||
        !checkFaceEdge(0, 'r') ||
        !checkFaceEdge(2, 'l') ||
        !checkFaceEdge(2, 'r'))
    ) {
      let found = true;
      while (!stopped && found) {
        found = false;
        for (let i = 0; i < 4; i++) {
          let c1 = getFace(i, ORDER - 1, 1).color,
            c2 = getAdjColor(i, 'd');
          if (c1 === 5 || c2 === 5) continue;

          await _(5, [0], c1 - i); // 把当前面的i色转到面c
          frontFace = c1;
          if (c2 === (c1 + 1) % 4) {
            await formula(1);
          } else {
            await formula(-1);
          }
          frontFace = 0;
          found = true;
        }
      }
      // 中间层错误棱块移到第三层
      for (let i = 0; i < 4; i++)
        if (
          getFace(i, 1, ORDER - 1).color !== 5 &&
          getAdjColor(i, 1, ORDER - 1) !== 5 &&
          !checkFaceEdge(i, 'r')
        ) {
          while (
            !stopped &&
            getFace(i, ORDER - 1, 1).color !== 5 &&
            getAdjColor(i, ORDER - 1, 1) !== 5
          )
            await _(5, [0], 1);
          frontFace = i;
          await formula(1);
        }
    }
  }

  async function solveBottomCross() {
    topFace = 5;
    frontFace = 2;
    if (stopped || ORDER <= 2) return;

    const formula1 = async () => {
      await _(1, [0], -1); // R'
      await _(4, [0], -1); // U'
      await _(0, [0], -1); // F'
      await _(4, [0], 1); // U
      await _(0, [0], 1); // F
      await _(1, [0], 1); // R
    };

    const formula2 = async () => {
      await _(1, [0], -1); // R'
      await _(4, [0], -1); // U'
      await _(0, [0], -1); // F'
      await _(4, [0], 1); // U
      await _(0, [0], 1); // F
      await _(4, [0], -1); // U'
      await _(0, [0], -1); // F'
      await _(4, [0], 1); // U
      await _(0, [0], 1); // F
      await _(1, [0], 1); // R
    };

    const formulaMagic = async () => {
      await _(1, [0, 1], 2); // TR2
      await _(2, [0], 2); // B2
      await _(4, [0], 2); // U2
      await _(3, [0, 1], 1); // TL
      await _(4, [0], 2); // U2
      await _(1, [0, 1], -1); // TR'
      await _(4, [0], 2); // U2
      await _(1, [0, 1], 1); // TR
      await _(4, [0], 2); // U2
      await _(0, [0], 2); // F2
      await _(1, [0, 1], 1); // TR
      await _(0, [0], 2); // F2
      await _(3, [0, 1], -1); // TL'
      await _(2, [0], 2); // B2
      await _(1, [0, 1], 2); // TR2
    };

    while (!stopped) {
      let count = countEdgeColor(5, 5, 1);

      if (count == 4) break;
      else if (count == 1 || count == 3) {
        // 4 阶特殊情况
        await formulaMagic();
      } else if (!count) {
        await formula1();
      } else {
        if (getFace(5, 1, 0).color === 5 && getFace(5, 1, ORDER - 1).color === 5)
          await _(4, [0], 1);
        if (getFace(5, 0, 1).color === 5 && getFace(5, ORDER - 1, 1).color === 5) {
          await formula2();
        } else {
          while (!stopped && (getFace(5, 0, 1).color !== 5 || getFace(5, 1, 0).color !== 5))
            await _(4, [0], 1);
          await formula1();
        }
      }
    }
  }

  async function solveBottomFace() {
    const formula = async () => {
      await _(3, [0], 1); // L
      await _(4, [0], 1); // U
      await _(3, [0], -1); // L'
      await _(4, [0], 1); // U
      await _(3, [0], 1); // L
      await _(4, [0], 2); // U2
      await _(3, [0], -1); // L'
    };

    while (!stopped) {
      let count = countCornerColor(5, 5);
      if (count == 4) break;
      else if (!count) {
        for (let i = 0; i < 4; i++)
          if (getFace(i, ORDER - 1, 0).color === 5) frontFace = (i + 1) % 4;
      } else if (count == 2) {
        for (let i = 0; i < 4; i++)
          if (getFace(i, ORDER - 1, ORDER - 1).color === 5) frontFace = (i + 2) % 4;
      } else {
        forEachCorner((r, c, dir) => {
          if (getFace(5, r, c).color === 5) frontFace = 3 - dir;
        });
      }
      await formula();
    }
  }

  async function solveBottomCorners() {
    const formula = async () => {
      await _(1, [0], 1); // R
      await _(2, [0], -1); // B'
      await _(1, [0], 1); // R
      await _(0, [0], 2); // F2
      await _(1, [0], -1); // R'
      await _(2, [0], 1); // B
      await _(1, [0], 1); // R
      await _(0, [0], 2); // F2
      await _(1, [0], 2); // R2
    };

    while (!stopped) {
      frontFace = 2;
      let count = 0;
      for (let i = 0; i < 4; i++)
        if (getFace(i, ORDER - 1, 0).color === getFace(i, ORDER - 1, ORDER - 1).color) {
          frontFace = i;
          count++;
        }
      if (count == 4) break;
      await formula();
    }
    while (!stopped && countCornerColor(0, 0) !== 4) await _(4, [0], 1);
  }

  async function solveBottomEdges() {
    if (ORDER <= 2) return;

    const formula = async () => {
      await _(1, [0], 1); // R
      await _(4, [0], -1); // U'
      await _(1, [0], 1); // R
      await _(4, [0], 1); // U
      await _(1, [0], 1); // R
      await _(4, [0], 1); // U
      await _(1, [0], 1); // R
      await _(4, [0], -1); // U'
      await _(1, [0], -1); // R'
      await _(4, [0], -1); // U'
      await _(1, [0], 2); // R2
    };

    const formulaMagic = async () => {
      await _(1, [1], 2); // MR2
      await _(4, [0], 2); // U2
      await _(1, [1], 2); // MR2
      await _(4, [0, 1], 2); // TU2
      await _(1, [1], 2); // MR2
      await _(4, [1], 2); // MU2
    };

    while (!stopped) {
      frontFace = 2;
      let count = 0;
      for (let i = 0; i < 4; i++)
        if (getFace(i, ORDER - 1, 0).color === getFace(i, ORDER - 1, 1).color) {
          frontFace = (i + 2) % 4;
          count++;
        }
      if (count == 4) break;
      else if (count == 2) await formulaMagic(); // 4 阶特殊情况
      await formula();
    }
  }

  this.isStopped = () => stopped;

  this.reset = reset;

  this.stop = () => {
    stopped = true;
  };

  this.solve = async () => {
    if (!stopped || ORDER == 1) return;
    if (ORDER > 4) {
      alert('The maximum solveble order is 4!');
      return;
    }

    stopped = false;
    topFace = 4;
    frontFace = 0;

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
