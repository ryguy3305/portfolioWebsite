/*
 * Minimal 3x3 facelet simulator.
 * Coordinates: +x = R, +y = U, +z = F. Every sticker has a cubie position
 * (each coord in -1..1) and an outward normal. Moves are 90° rotations of the
 * stickers in a set of layers, so face turns, slices, wide moves and whole-cube
 * rotations all share one code path.
 *
 * Colours are face indices of the sticker's home face: 0=U 1=R 2=F 3=D 4=L 5=B.
 * The trainer assumes yellow top / green front, so U=yellow, F=green, R=orange,
 * L=red, B=blue, D=white.
 */
(function (root) {
  'use strict';

  const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
  const NORMALS = {
    U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1],
    D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1],
  };

  // Rotate a vector a quarter turn (q = +1 is right-hand positive) about an axis.
  function rotQ(v, axis, q) {
    let [x, y, z] = v;
    q = ((q % 4) + 4) % 4;
    for (let i = 0; i < q; i++) {
      if (axis === 0) [y, z] = [-z, y];
      else if (axis === 1) [x, z] = [z, -x];
      else[x, y] = [-y, x];
    }
    return [x, y, z];
  }

  const stickers = [];
  const indexOf = new Map();
  const key = (p, n) => p.join(',') + '|' + n.join(',');
  FACES.forEach((f, fi) => {
    const n = NORMALS[f];
    const a = n.findIndex((c) => c !== 0);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const p = [0, 0, 0];
        p[a] = n[a];
        const others = [0, 1, 2].filter((k) => k !== a);
        p[others[0]] = i;
        p[others[1]] = j;
        indexOf.set(key(p, n), stickers.length);
        stickers.push({ pos: p, n, face: fi });
      }
    }
  });

  // axis, rotation sign for a clockwise turn, affected layers
  const MOVE_DEFS = {
    R: [0, -1, [1]], L: [0, 1, [-1]], M: [0, 1, [0]], r: [0, -1, [0, 1]], l: [0, 1, [-1, 0]], x: [0, -1, [-1, 0, 1]],
    U: [1, -1, [1]], D: [1, 1, [-1]], E: [1, 1, [0]], u: [1, -1, [0, 1]], d: [1, 1, [-1, 0]], y: [1, -1, [-1, 0, 1]],
    F: [2, -1, [1]], B: [2, 1, [-1]], S: [2, -1, [0]], f: [2, -1, [0, 1]], b: [2, 1, [-1, 0]], z: [2, -1, [-1, 0, 1]],
  };

  // perms[move][amount] : array where perm[i] = destination index of sticker i
  const PERMS = {};
  for (const m of Object.keys(MOVE_DEFS)) {
    const [axis, sign, layers] = MOVE_DEFS[m];
    PERMS[m] = {};
    for (const amt of [1, 2, 3]) {
      PERMS[m][amt] = stickers.map((s, i) => {
        if (!layers.includes(s.pos[axis])) return i;
        const p = rotQ(s.pos, axis, sign * amt);
        const n = rotQ(s.n, axis, sign * amt);
        return indexOf.get(key(p, n));
      });
    }
  }

  function solved() {
    return stickers.map((s) => s.face);
  }

  // ---------- notation ----------
  // Returns [{m, n}] with n in {1,2,3} (3 = prime).
  function parse(str) {
    const out = [];
    const clean = String(str).replace(/[’`]/g, "'").replace(/[()\[\]]/g, ' ');
    const re = /([URFDLBMESxyzurfdlb])(w?)(\d*)('?)(\d*)/g;
    let t;
    while ((t = re.exec(clean))) {
      let m = t[1];
      if (t[2] && 'URFDLB'.includes(m)) m = m.toLowerCase();
      let amt = parseInt(t[3] || t[5] || '1', 10) % 4;
      if (t[4]) amt = (4 - amt) % 4;
      if (amt === 0) continue;
      out.push({ m, n: amt });
    }
    return out;
  }

  function fmt(moves) {
    return moves.map(({ m, n }) => m + (n === 2 ? '2' : n === 3 ? "'" : '')).join(' ');
  }

  function invert(moves) {
    return moves.slice().reverse().map(({ m, n }) => ({ m, n: (4 - n) % 4 }));
  }

  function apply(state, moves) {
    if (typeof moves === 'string') moves = parse(moves);
    let s = state.slice();
    for (const { m, n } of moves) {
      const perm = PERMS[m][n];
      const next = new Array(s.length);
      for (let i = 0; i < s.length; i++) next[perm[i]] = s[i];
      s = next;
    }
    return s;
  }

  // ---------- face-only translation ----------
  // Rewrites any sequence (slices, wide moves, rotations) as outer-face turns
  // relative to the cube's fixed centres. Net whole-cube rotation is returned
  // separately rather than emitted.
  const EXPAND = {
    r: (n) => [['L', n], ['x', n]], l: (n) => [['R', n], ['x', 4 - n]],
    u: (n) => [['D', n], ['y', n]], d: (n) => [['U', n], ['y', 4 - n]],
    f: (n) => [['B', n], ['z', n]], b: (n) => [['F', n], ['z', 4 - n]],
    M: (n) => [['R', n], ['L', 4 - n], ['x', 4 - n]],
    E: (n) => [['U', n], ['D', 4 - n], ['y', 4 - n]],
    S: (n) => [['F', 4 - n], ['B', n], ['z', n]],
  };
  const matMul = (A, B) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
  const matVec = (A, v) => A.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
  function rotMatrix(axis, q) {
    const cols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => rotQ(e, axis, q));
    return [0, 1, 2].map((i) => cols.map((c) => c[i]));
  }
  function faceFor(v) {
    return FACES.find((f) => NORMALS[f].every((c, i) => c === v[i]));
  }

  function toFaceMoves(moves) {
    // rot maps view direction -> body (centre) direction
    let rot = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const out = [];
    const emit = (m, n) => {
      n = ((n % 4) + 4) % 4;
      if (!n) return;
      if ('xyz'.includes(m)) {
        const [axis, sign] = MOVE_DEFS[m];
        rot = matMul(rot, rotMatrix(axis, -sign * n));
      } else {
        out.push({ m: faceFor(matVec(rot, NORMALS[m])), n });
      }
    };
    for (const { m, n } of moves) {
      if (EXPAND[m]) EXPAND[m](n).forEach(([mm, nn]) => emit(mm, nn));
      else emit(m, n);
    }
    return { moves: out, rot };
  }

  const OPP = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
  function simplify(moves) {
    const out = [];
    for (const mv of moves) {
      let { m, n } = mv;
      n %= 4;
      if (!n) continue;
      let k = out.length - 1;
      if (k >= 0 && out[k].m !== m && OPP[out[k].m] === m) k--; // commute past opposite face
      if (k >= 0 && out[k].m === m) {
        const nn = (out[k].n + n) % 4;
        if (nn) out[k] = { m, n: nn };
        else out.splice(k, 1);
      } else {
        out.push({ m, n });
      }
    }
    return out.length === moves.length ? out : simplify(out);
  }

  // ---------- inspection helpers ----------
  function at(state, pos, n) {
    return state[indexOf.get(key(pos, n))];
  }

  function centerFacing(state, n) {
    return at(state, n, n);
  }

  // Which body direction currently holds the given centre colour.
  function normalOfCenter(state, color) {
    for (const f of FACES) if (centerFacing(state, NORMALS[f]) === color) return NORMALS[f];
    return null;
  }

  // True when every sticker outside the layer facing `topNormal` matches its centre.
  function f2lSolved(state, topNormal) {
    return stickers.every((s, i) => {
      const depth = s.pos[0] * topNormal[0] + s.pos[1] * topNormal[1] + s.pos[2] * topNormal[2];
      if (depth === 1) return true;
      return state[i] === centerFacing(state, s.n);
    });
  }

  // OLL solved: F2L intact under the U-colour (yellow) face, and every yellow sticker faces it.
  function ollSolved(state) {
    const top = normalOfCenter(state, 0);
    if (!f2lSolved(state, top)) return false;
    return stickers.every((s, i) => state[i] !== 0 || s.n.every((c, k) => c === top[k]));
  }

  // Rotate the whole cube (via x/z turns) so the yellow centre is on top.
  function yellowUp(state) {
    for (const r of ['', 'x', "x'", 'x2', 'z', "z'"]) {
      const s = r ? apply(state, r) : state;
      if (centerFacing(s, NORMALS.U) === 0) return s;
    }
    return state;
  }

  // Top-down view of the last layer: u = 3x3 (back row first), and the top row
  // of each side as seen from above (b, f left->right; l, r back->front).
  function topView(state) {
    const v = { u: [], b: [], f: [], l: [], r: [] };
    for (let z = -1; z <= 1; z++) for (let x = -1; x <= 1; x++) v.u.push(at(state, [x, 1, z], NORMALS.U));
    for (let x = -1; x <= 1; x++) {
      v.b.push(at(state, [x, 1, -1], NORMALS.B));
      v.f.push(at(state, [x, 1, 1], NORMALS.F));
    }
    for (let z = -1; z <= 1; z++) {
      v.l.push(at(state, [-1, 1, z], NORMALS.L));
      v.r.push(at(state, [1, 1, z], NORMALS.R));
    }
    return v;
  }

  // Orientation-only signature (which LL stickers are yellow).
  function ollMask(state) {
    const v = topView(state);
    return ['u', 'b', 'f', 'l', 'r'].map((k) => v[k].map((c) => (c === 0 ? 1 : 0)).join('')).join('-');
  }

  const Cube = {
    FACES, parse, fmt, invert, apply, solved, toFaceMoves, simplify,
    f2lSolved, ollSolved, yellowUp, topView, ollMask, normalOfCenter, NORMALS,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Cube;
  else root.Cube = Cube;
})(typeof window !== 'undefined' ? window : globalThis);
