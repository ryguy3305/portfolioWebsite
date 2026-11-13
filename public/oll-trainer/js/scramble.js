/*
 * OLL scramble generation. Produces a face-turn-only scramble (applied with
 * yellow top / green front) that leaves F2L solved and the last layer in the
 * requested OLL case.
 */
(function (root) {
  'use strict';
  const Cube = root.Cube || (typeof require !== 'undefined' && require('./cube.js'));
  const SOLVED = Cube.solved();
  const AUF = ['', 'U', 'U2', "U'"];

  const cache = new Map();
  // Cube state right before executing `alg`, held the way the alg expects.
  function caseState(alg) {
    if (!cache.has(alg)) cache.set(alg, Cube.yellowUp(Cube.apply(SOLVED, Cube.invert(Cube.parse(alg)))));
    return cache.get(alg);
  }

  /**
   * @param {string[]} algs   every known alg for the case
   * @param {string}   mine   the alg the user drills (fixes the angle when randomAUF is off)
   * @param {object}   opts   { randomAUF, disguise, plls: string[], rand?: (n) => int }
   */
  function make(algs, mine, opts) {
    const rnd = opts.rand || ((n) => Math.floor(Math.random() * n));
    const pick = (a) => a[rnd(a.length)];
    let mv = [];
    if (opts.disguise && opts.plls && opts.plls.length) {
      // A random PLL (plus AUFs) first: permutes the LL without changing orientation.
      mv.push({ m: 'U', n: rnd(4) });
      mv.push(...Cube.toFaceMoves(Cube.invert(Cube.parse(pick(opts.plls)))).moves);
      mv.push({ m: 'U', n: rnd(4) });
    }
    const src = opts.disguise ? pick(algs) : mine;
    mv.push(...Cube.toFaceMoves(Cube.invert(Cube.parse(src))).moves);
    mv = Cube.simplify(mv);
    // U turns on a solved cube only permute the LL, which OLL doesn't care about.
    while (mv.length && mv[0].m === 'U') mv.shift();

    const state = Cube.apply(SOLVED, mv);
    let k;
    if (opts.randomAUF) k = rnd(4);
    else {
      const target = Cube.ollMask(caseState(mine));
      k = Math.max(0, AUF.findIndex((u) => Cube.ollMask(Cube.apply(state, u)) === target));
    }
    if (k) mv = Cube.simplify(mv.concat([{ m: 'U', n: k }]));
    return Cube.fmt(mv);
  }

  const Scramble = { make, caseState };
  if (typeof module !== 'undefined' && module.exports) module.exports = Scramble;
  else root.Scramble = Scramble;
})(typeof window !== 'undefined' ? window : globalThis);
