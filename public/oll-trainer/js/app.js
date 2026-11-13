/* OLL Trainer — Anki-style spaced repetition for the 57 OLL cases. */
(function () {
  'use strict';

  const CASES = window.OLL_DATA;
  const BY_ID = new Map(CASES.map((c) => [c.id, c]));
  const PLLS = Object.values(window.PLL_DISGUISE);
  const STORE_KEY = 'oll-anki-v1';
  const LEARN_AHEAD = 20 * SRS.MIN;
  const SOLVED = Cube.solved();

  // Roughly easiest-to-recognise first: 2-look OLL cases, then common shapes, dots last.
  const BEGINNER_ORDER = [27, 26, 21, 22, 23, 24, 25, 45, 44, 33, 43, 31, 32, 57, 28, 37, 35, 10, 9,
    34, 46, 36, 38, 13, 14, 15, 16, 5, 6, 7, 8, 11, 12, 39, 40, 47, 48, 53, 54, 49, 50, 51, 52, 55, 56,
    29, 30, 41, 42, 1, 2, 3, 4, 17, 18, 19, 20];

  const DEFAULT_SETTINGS = {
    newPerDay: 10,
    learningSteps: [1, 10],
    order: 'beginner',
    timer: true,
    randomAUF: true,
    disguise: true,
    frontDiagram: false,
    theme: 'auto',
  };

  // ---------------- persistence ----------------
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { /* storage unavailable */ }
    d = d && typeof d === 'object' ? d : {};
    return {
      cards: d.cards || {},
      settings: Object.assign({}, DEFAULT_SETTINGS, d.settings || {}),
      prefs: d.prefs || {}, // caseId -> alg string chosen as "my alg"
      custom: d.custom || {}, // caseId -> user-entered alg
      disabled: d.disabled || {}, // caseId -> true
      log: d.log || [],
      daily: d.daily || { day: '', newCount: 0, extra: 0 },
    };
  }
  let store = load();
  function save() {
    if (store.log.length > 20000) store.log = store.log.slice(-20000);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
  }

  const cfg = () => ({ learningSteps: store.settings.learningSteps });
  const getCard = (id) => store.cards[id] || SRS.newCard(id);
  const enabledIds = () => CASES.map((c) => c.id).filter((id) => !store.disabled[id]);
  function daily(now) {
    const day = SRS.dayKey(now);
    if (store.daily.day !== day) store.daily = { day, newCount: 0, extra: 0 };
    return store.daily;
  }
  const newLeft = (now) => Math.max(0, store.settings.newPerDay + daily(now).extra - daily(now).newCount);

  // ---------------- algs & diagrams ----------------
  function algsFor(id) {
    const c = BY_ID.get(id);
    const list = c.algs.map((a) => a.alg);
    if (store.custom[id] && !list.includes(store.custom[id])) list.push(store.custom[id]);
    return list;
  }
  function myAlg(id) {
    const p = store.prefs[id];
    const list = algsFor(id);
    return list.includes(p) ? p : list[0];
  }

  const caseState = Scramble.caseState;

  function diagram(alg, size = 120) {
    const v = Cube.topView(caseState(alg));
    const t = 0.36, g = 0.1, ins = 0.05, W = 3 + 2 * (t + g);
    const o = t + g;
    const cls = (c) => (c === 0 ? 'on' : 'off');
    const r = [];
    const rect = (x, y, w, h, c) => r.push(`<rect x="${x + ins}" y="${y + ins}" width="${w - 2 * ins}" height="${h - 2 * ins}" rx="0.1" class="${cls(c)}"/>`);
    v.u.forEach((c, i) => rect(o + (i % 3), o + Math.floor(i / 3), 1, 1, c));
    v.b.forEach((c, i) => rect(o + i, 0, 1, t, c));
    v.f.forEach((c, i) => rect(o + i, o + 3 + g, 1, t, c));
    v.l.forEach((c, i) => rect(0, o + i, t, 1, c));
    v.r.forEach((c, i) => rect(o + 3 + g, o + i, t, 1, c));
    return `<svg class="oll" viewBox="0 0 ${W} ${W}" width="${size}" height="${size}" role="img" aria-label="OLL case diagram">${r.join('')}</svg>`;
  }

  // Validate a user-entered alg: must solve this case from yellow-top.
  function validateAlg(id, alg) {
    const mv = Cube.parse(alg);
    if (!mv.length) return 'Could not read any moves.';
    const lit = Cube.yellowUp(Cube.apply(SOLVED, Cube.invert(mv)));
    if (!Cube.f2lSolved(lit, [0, 1, 0]) || Cube.ollSolved(lit) || !Cube.ollSolved(Cube.apply(lit, mv))) {
      return "That doesn't orient the last layer while keeping F2L intact.";
    }
    const ref = Cube.ollMask(caseState(BY_ID.get(id).algs[0].alg));
    const masks = ['', 'U', 'U2', "U'"].map((u) => Cube.ollMask(Cube.apply(lit, u)));
    if (!masks.includes(ref)) return 'That alg solves a different OLL case.';
    return null;
  }

  // ---------------- scrambles ----------------
  // With "disguise", a random PLL and a random alternative alg are mixed in so
  // the scramble isn't just your alg backwards.
  function makeScramble(id) {
    const s = store.settings;
    return Scramble.make(algsFor(id), myAlg(id), { randomAUF: s.randomAUF, disguise: s.disguise, plls: PLLS });
  }

  // ---------------- queue ----------------
  function counts(now) {
    let n = 0, l = 0, r = 0;
    const end = SRS.dayEnd(now);
    for (const id of enabledIds()) {
      const c = getCard(id);
      if (c.state === 'new') n++;
      else if (c.state === 'review') { if (c.due < end) r++; }
      else if (c.due < end) l++;
    }
    return { n: Math.min(n, newLeft(now)), l, r, totalNew: n };
  }

  function newOrder() {
    const ids = enabledIds().filter((id) => getCard(id).state === 'new');
    const o = store.settings.order;
    if (o === 'number') return ids.sort((a, b) => a - b);
    if (o === 'random') return ids.sort((a, b) => hash(a) - hash(b));
    return ids.sort((a, b) => BEGINNER_ORDER.indexOf(a) - BEGINNER_ORDER.indexOf(b));
  }
  // stable per-day shuffle for "random" order
  function hash(id) {
    const s = daily(Date.now()).day + ':' + id;
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function nextSrsCard(now, lastId) {
    const cards = enabledIds().map(getCard);
    const byDue = (a, b) => a.due - b.due;
    const learning = cards.filter((c) => (c.state === 'learning' || c.state === 'relearning')).sort(byDue);
    const due = learning.filter((c) => c.due <= now);
    if (due.length) return due[0].id;
    const reviews = cards.filter((c) => c.state === 'review' && c.due < SRS.dayEnd(now)).sort(byDue);
    if (reviews.length) return reviews[0].id;
    if (newLeft(now) > 0) {
      const nw = newOrder();
      if (nw.length) return nw[0];
    }
    const ahead = learning.filter((c) => c.due <= now + LEARN_AHEAD);
    if (ahead.length) return (ahead.find((c) => c.id !== lastId) || ahead[0]).id;
    return null;
  }

  // Practice: weighted toward weak/slow cases, never the same case twice in a row.
  function nextPracticeCard(lastId, only) {
    let pool = only ? [only] : enabledIds();
    const seen = pool.filter((id) => getCard(id).state !== 'new');
    if (seen.length >= 2) pool = seen;
    if (pool.length > 1) pool = pool.filter((id) => id !== lastId);
    const w = pool.map((id) => {
      const c = getCard(id);
      const t = caseTimes(id);
      const avg = t.length ? avgOf(t.slice(-5)) / 1000 : 3;
      return 1 + c.lapses * 0.5 + Math.max(0, 2.5 - c.ease) * 4 + Math.min(avg, 10) / 2;
    });
    let x = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { x -= w[i]; if (x <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  // ---------------- stats helpers ----------------
  const caseTimes = (id) => store.log.filter((e) => e.id === id && e.ms).map((e) => e.ms);
  const avgOf = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const fmtTime = (ms) => (ms == null ? '—' : (ms / 1000).toFixed(2));

  // ---------------- session state ----------------
  const session = {
    view: 'study',
    mode: 'srs', // or 'practice'
    only: null, // practice a single case
    current: null, // { id, scramble, revealed, ms }
    lastId: null,
    timer: { state: 'idle', start: 0, raf: 0 },
    undo: null,
  };

  function nextCard() {
    const now = Date.now();
    const id = session.mode === 'practice' ? nextPracticeCard(session.lastId, session.only) : nextSrsCard(now, session.lastId);
    session.current = id == null ? null : { id, scramble: makeScramble(id), revealed: false, ms: null };
    resetTimer();
  }

  function resetTimer() {
    cancelAnimationFrame(session.timer.raf);
    session.timer = { state: 'idle', start: 0, raf: 0 };
  }

  function startTimer() {
    session.timer.state = 'running';
    session.timer.start = performance.now();
    const el = document.getElementById('timer');
    if (el) el.classList.add('running');
    const tick = () => {
      const t = document.getElementById('timer');
      if (t) t.textContent = fmtTime(performance.now() - session.timer.start);
      session.timer.raf = requestAnimationFrame(tick);
    };
    tick();
    const hint = document.getElementById('timer-hint');
    if (hint) hint.innerHTML = 'Solving… <kbd>Space</kbd> or tap to stop';
  }

  function stopTimer() {
    cancelAnimationFrame(session.timer.raf);
    session.timer.state = 'stopped';
    session.current.ms = Math.round(performance.now() - session.timer.start);
    reveal();
  }

  function reveal() {
    if (!session.current || session.current.revealed) return;
    if (session.timer.state === 'running') { stopTimer(); return; }
    session.current.revealed = true;
    render();
  }

  function rate(r) {
    const cur = session.current;
    if (!cur || !cur.revealed) return;
    const now = Date.now();
    const before = store.cards[cur.id] ? Object.assign({}, store.cards[cur.id]) : null;
    session.undo = {
      id: cur.id, before, logLen: store.log.length, daily: Object.assign({}, daily(now)),
      current: Object.assign({}, cur, { revealed: false, ms: null }),
    };
    if (session.mode === 'srs') {
      const card = getCard(cur.id);
      if (card.state === 'new') daily(now).newCount++;
      store.cards[cur.id] = SRS.schedule(card, r, now, cfg());
    }
    store.log.push({ id: cur.id, t: now, r, ms: cur.ms, mode: session.mode });
    save();
    session.lastId = cur.id;
    nextCard();
    render();
  }

  function undo() {
    const u = session.undo;
    if (!u) return;
    if (u.before) store.cards[u.id] = u.before; else delete store.cards[u.id];
    store.log.length = u.logLen;
    store.daily = u.daily;
    save();
    session.current = u.current;
    session.undo = null;
    resetTimer();
    render();
    toast('Undid last rating');
  }

  // ---------------- rendering ----------------
  const $app = document.getElementById('app');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function render() {
    document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.view === session.view)));
    renderCounts();
    ({ study: renderStudy, cases: renderCases, stats: renderStats, settings: renderSettings })[session.view]();
  }

  function renderCounts() {
    const c = counts(Date.now());
    document.getElementById('counts').innerHTML =
      `<span class="c-new" title="New">${c.n}</span><span class="c-learn" title="Learning">${c.l}</span><span class="c-due" title="Due">${c.r}</span>`;
  }

  function renderStudy() {
    if (!session.current) nextCard();
    const cur = session.current;
    const banner = session.mode === 'practice'
      ? `<div class="banner"><span>Practice mode${session.only ? ` · ${esc(BY_ID.get(session.only).name)} only` : ''}. Your schedule isn't affected.</span><button class="btn small" data-act="exit-practice">Back to reviews</button></div>`
      : '';

    if (!cur) {
      const now = Date.now();
      const upcoming = enabledIds().map(getCard).filter((c) => c.state !== 'new').sort((a, b) => a.due - b.due)[0];
      const c = counts(now);
      const msg = !enabledIds().length
        ? 'No cases are enabled. Turn some on in the Cases tab.'
        : upcoming
          ? `Next card is due in ${SRS.formatInterval(Math.max(0, upcoming.due - now))}.`
          : 'Nothing scheduled yet.';
      $app.innerHTML = `<section class="study">${banner}<div class="card done">
        <h2>All done for now</h2>
        <p>${msg}${c.totalNew && !newLeft(now) ? ` You've hit today's limit of new cases; ${c.totalNew} still unseen.` : ''}</p>
        <div class="row">
          ${c.totalNew ? '<button class="btn primary" data-act="more-new">Learn 5 more new cases</button>' : ''}
          ${enabledIds().length ? '<button class="btn" data-act="practice">Practice anyway</button>' : ''}
        </div></div></section>`;
      return;
    }

    const c = BY_ID.get(cur.id);
    const s = store.settings;
    const alg = myAlg(cur.id);
    const card = getCard(cur.id);
    const parts = [];
    parts.push(`<div class="label">Scramble · yellow top, green front</div>
      <div class="scramble" id="scramble">${esc(cur.scramble)}</div>
      <div class="scramble-meta">
        <span>${cur.scramble.split(' ').length} moves</span>
        <button class="linkbtn" data-act="copy">Copy</button>
        <button class="linkbtn" data-act="rescramble">New scramble</button>
        ${session.undo ? '<button class="linkbtn" data-act="undo">Undo last (Z)</button>' : ''}
      </div>`);

    if (s.frontDiagram && !cur.revealed) parts.push(`<div class="front-diagram">${diagram(alg, 130)}</div>`);

    if (!cur.revealed) {
      if (s.timer) {
        parts.push(`<div class="timer-zone" data-act="timer" id="timer-zone">
          <div class="timer" id="timer">0.00</div>
          <div class="timer-hint" id="timer-hint">Scramble, then <kbd>Space</kbd> or tap here to start · <kbd>Enter</kbd> to just show the answer</div>
        </div>`);
      } else {
        parts.push('<div class="actions"><button class="btn primary" data-act="reveal">Show answer <kbd>Enter</kbd></button></div>');
      }
      $app.innerHTML = `<section class="study">${banner}<div class="card">${parts.join('')}</div></section>`;
      return;
    }

    const times = caseTimes(cur.id);
    const others = algsFor(cur.id).filter((a) => a !== alg);
    parts.push(`<div class="answer">
      <div>${diagram(alg, 150)}</div>
      <div>
        <h2>${esc(c.name)}</h2>
        <div class="group">${esc(c.group)}</div>
        <div class="main-alg">${esc(alg)}</div>
        ${others.length ? `<ul class="alts">${others.map((a) => `<li><button class="linkbtn" data-act="use-alg" data-alg="${esc(a)}">Use</button><span>${esc(a)}</span></li>`).join('')}</ul>` : ''}
        <div class="result-line">
          ${cur.ms != null ? `<span>This solve <strong>${fmtTime(cur.ms)}s</strong></span>` : ''}
          ${times.length ? `<span>Avg of last ${Math.min(5, times.length)} <strong>${fmtTime(avgOf(times.slice(-5)))}s</strong></span>` : ''}
          ${card.state !== 'new' ? `<span>Ease <strong>${Math.round(card.ease * 100)}%</strong></span>` : ''}
        </div>
      </div>
    </div>`);

    const now = Date.now();
    const lbl = (r) => (session.mode === 'srs' ? SRS.previewLabel(card, r, now, cfg()) : 'practice');
    const names = ['Again', 'Hard', 'Good', 'Easy'];
    const ratings = `<div class="ratings">${names.map((n, i) => `<button class="rate" data-act="rate" data-r="${i + 1}">
        <span class="ivl">${lbl(i + 1)}</span><span class="name">${n}</span><span class="key">${i + 1}</span></button>`).join('')}</div>`;

    $app.innerHTML = `<section class="study">${banner}<div class="card">${parts.join('')}</div>${ratings}</section>`;
  }

  function statusPill(id) {
    const c = getCard(id);
    const now = Date.now();
    if (c.state === 'new') return '<span class="pill new">New</span>';
    if (c.state !== 'review') return `<span class="pill ${c.state}">Learning</span>`;
    return c.due < SRS.dayEnd(now) ? '<span class="pill review">Due</span>' : `<span class="pill">${SRS.formatInterval(c.due - now)}</span>`;
  }

  function renderCases() {
    const groups = [];
    for (const c of CASES) {
      let g = groups.find((x) => x.name === c.group);
      if (!g) groups.push((g = { name: c.group, ids: [] }));
      g.ids.push(c.id);
    }
    const on = enabledIds().length;
    $app.innerHTML = `<div class="toolbar">
        <strong>${on} of ${CASES.length} cases enabled</strong>
        <span class="spacer"></span>
        <button class="btn small" data-act="enable-all">Enable all</button>
        <button class="btn small" data-act="disable-all">Disable all</button>
      </div>
      ${groups.map((g) => {
        const allOn = g.ids.every((id) => !store.disabled[id]);
        return `<section class="group-block">
          <div class="group-head">
            <h3>${esc(g.name)}</h3><span class="muted">${g.ids.length}</span>
            <label class="check"><input type="checkbox" data-act="toggle-group" data-group="${esc(g.name)}" ${allOn ? 'checked' : ''}> enabled</label>
          </div>
          <div class="grid">${g.ids.map((id) => {
            const t = caseTimes(id);
            return `<button class="tile ${store.disabled[id] ? 'disabled' : ''}" data-act="open-case" data-id="${id}">
              ${diagram(myAlg(id), 78)}
              <span class="nm">${esc(BY_ID.get(id).name)}</span>
              ${statusPill(id)}
              ${t.length ? `<span class="pill">${fmtTime(avgOf(t.slice(-5)))}s</span>` : ''}
            </button>`;
          }).join('')}</div>
        </section>`;
      }).join('')}`;
  }

  function openCase(id) {
    const c = BY_ID.get(id);
    const dlg = document.getElementById('case-dialog');
    const card = getCard(id);
    const t = caseTimes(id);
    const mine = myAlg(id);
    const votes = new Map(c.algs.map((a) => [a.alg, a]));
    dlg.innerHTML = `<div class="dlg">
      <div class="dlg-head">
        ${diagram(mine, 130)}
        <div>
          <h2>${esc(c.name)}</h2>
          <div class="group" style="color:var(--muted)">${esc(c.group)}</div>
          <div class="result-line">
            ${statusPill(id)}
            <span>Reviews <strong>${card.reps}</strong></span>
            <span>Lapses <strong>${card.lapses}</strong></span>
            ${t.length ? `<span>Avg5 <strong>${fmtTime(avgOf(t.slice(-5)))}s</strong></span><span>Best <strong>${fmtTime(Math.min(...t))}s</strong></span>` : ''}
          </div>
        </div>
      </div>
      <div>
        <div class="label" style="margin-bottom:8px">Your algorithm</div>
        <div class="alg-choice">${algsFor(id).map((a) => {
          const v = votes.get(a);
          const meta = v ? `${v.std ? 'SpeedCubeDB standard · ' : ''}${v.votes} votes` : 'custom';
          return `<label><input type="radio" name="alg" value="${esc(a)}" ${a === mine ? 'checked' : ''}>${esc(a)}<span class="votes">${meta}</span></label>`;
        }).join('')}</div>
      </div>
      <div>
        <div class="label" style="margin-bottom:8px">Add your own</div>
        <div class="custom-row">
          <input class="input" id="custom-alg" placeholder="e.g. R U R' U R U2 R'" value="${esc(store.custom[id] || '')}">
          <button class="btn small" data-act="save-custom" data-id="${id}">Save</button>
        </div>
        <div class="err" id="custom-err"></div>
      </div>
      <div class="dlg-foot">
        <label class="check" style="margin-right:auto"><input type="checkbox" data-act="toggle-case" data-id="${id}" ${store.disabled[id] ? '' : 'checked'}> Include in reviews</label>
        <button class="btn small danger" data-act="reset-case" data-id="${id}">Reset progress</button>
        <button class="btn small" data-act="practice-case" data-id="${id}">Practice this case</button>
        <button class="btn small primary" data-act="close-dialog">Done</button>
      </div>
    </div>`;
    dlg.querySelectorAll('input[name="alg"]').forEach((r) => r.addEventListener('change', () => {
      store.prefs[id] = r.value;
      save();
      dlg.querySelector('.dlg-head svg').outerHTML = diagram(r.value, 130);
    }));
    if (!dlg.open) dlg.showModal();
  }

  function renderStats() {
    const now = Date.now();
    const ids = CASES.map((c) => c.id);
    const cards = ids.map(getCard);
    const today = SRS.dayStart(now);
    const todayLog = store.log.filter((e) => e.t >= today);
    const timed = store.log.filter((e) => e.ms);
    const st = { new: 0, learning: 0, young: 0, mature: 0 };
    cards.forEach((c) => {
      if (c.state === 'new') st.new++;
      else if (c.state !== 'review') st.learning++;
      else if (c.interval >= 21) st.mature++;
      else st.young++;
    });
    const correct = todayLog.filter((e) => e.r > 1).length;

    const days = 14;
    const forecast = Array.from({ length: days }, (_, i) => {
      const s = today + i * SRS.DAY, e = s + SRS.DAY;
      return cards.filter((c) => c.state !== 'new' && !store.disabled[c.id] && (i === 0 ? c.due < e : c.due >= s && c.due < e)).length;
    });
    const maxF = Math.max(1, ...forecast);

    const rows = ids.map((id) => {
      const c = getCard(id), t = caseTimes(id);
      return { id, c, avg: t.length ? avgOf(t.slice(-5)) : null, best: t.length ? Math.min(...t) : null, n: t.length };
    }).filter((r) => r.c.state !== 'new');
    rows.sort((a, b) => (a.c.ease - b.c.ease) || (b.c.lapses - a.c.lapses) || ((b.avg || 0) - (a.avg || 0)));

    const pct = (n) => (n / ids.length) * 100;
    $app.innerHTML = `
      <div class="kpis">
        <div class="kpi"><div class="v">${todayLog.length}</div><div class="k">Reviews today</div></div>
        <div class="kpi"><div class="v">${todayLog.length ? Math.round((correct / todayLog.length) * 100) + '%' : '—'}</div><div class="k">Recalled today</div></div>
        <div class="kpi"><div class="v">${ids.length - st.new}/${ids.length}</div><div class="k">Cases started</div></div>
        <div class="kpi"><div class="v">${timed.length ? fmtTime(avgOf(timed.slice(-50))) + 's' : '—'}</div><div class="k">Avg time (last 50)</div></div>
      </div>
      <div class="panel">
        <h3>Case progress</h3>
        <div class="stack">
          <div style="width:${pct(st.mature)}%;background:var(--good)"></div>
          <div style="width:${pct(st.young)}%;background:color-mix(in srgb, var(--good) 45%, var(--surface-2))"></div>
          <div style="width:${pct(st.learning)}%;background:var(--again)"></div>
        </div>
        <div class="legend">
          <span><i style="background:var(--good)"></i>Mature ${st.mature}</span>
          <span><i style="background:color-mix(in srgb, var(--good) 45%, var(--surface-2))"></i>Young ${st.young}</span>
          <span><i style="background:var(--again)"></i>Learning ${st.learning}</span>
          <span><i style="background:var(--surface-2)"></i>New ${st.new}</span>
        </div>
      </div>
      <div class="panel">
        <h3>Due over the next 2 weeks</h3>
        <div class="bars">${forecast.map((n, i) => `<div class="bar-col"><span class="n">${n || ''}</span>
          <div class="b" style="height:${(n / maxF) * 100}%"></div>
          <span>${i === 0 ? 'Today' : new Date(today + i * SRS.DAY).toLocaleDateString(undefined, { weekday: 'short' })}</span></div>`).join('')}</div>
      </div>
      <div class="panel">
        <h3>Weakest cases</h3>
        ${rows.length ? `<div class="table-wrap"><table>
          <thead><tr><th></th><th>Case</th><th>Ease</th><th>Lapses</th><th>Avg5</th><th>Best</th><th>Next</th></tr></thead>
          <tbody>${rows.slice(0, 15).map((r) => `<tr>
            <td>${diagram(myAlg(r.id), 34)}</td>
            <td><button class="linkbtn" data-act="open-case" data-id="${r.id}">${esc(BY_ID.get(r.id).name)}</button></td>
            <td class="num">${Math.round(r.c.ease * 100)}%</td>
            <td class="num">${r.c.lapses}</td>
            <td class="num">${fmtTime(r.avg)}</td>
            <td class="num">${fmtTime(r.best)}</td>
            <td>${statusPill(r.id)}</td></tr>`).join('')}</tbody></table></div>` : '<p style="color:var(--muted);margin:0">Study a few cases and they will show up here.</p>'}
      </div>`;
  }

  function renderSettings() {
    const s = store.settings;
    const sw = (k) => `<input type="checkbox" class="switch" data-set="${k}" ${s[k] ? 'checked' : ''}>`;
    $app.innerHTML = `<div class="panel settings">
      <div class="setting"><div><div class="t">New cases per day</div><div class="d">How many unseen cases get introduced each day.</div></div>
        <input type="number" min="0" max="57" data-set="newPerDay" value="${s.newPerDay}"></div>
      <div class="setting"><div><div class="t">Learning steps (minutes)</div><div class="d">Re-show intervals for new cases before they graduate to days.</div></div>
        <input type="text" data-set="learningSteps" value="${s.learningSteps.join(' ')}"></div>
      <div class="setting"><div><div class="t">New case order</div><div class="d">Beginner-friendly starts with 2-look OLL cases and leaves dot cases for last.</div></div>
        <select data-set="order">
          <option value="beginner" ${s.order === 'beginner' ? 'selected' : ''}>Beginner-friendly</option>
          <option value="number" ${s.order === 'number' ? 'selected' : ''}>By number</option>
          <option value="random" ${s.order === 'random' ? 'selected' : ''}>Random</option>
        </select></div>
      <div class="setting"><div><div class="t">Timer</div><div class="d">Time each attempt with Space or a tap.</div></div>${sw('timer')}</div>
      <div class="setting"><div><div class="t">Random AUF</div><div class="d">Present the case from a random angle, so you have to recognise it and adjust U first.</div></div>${sw('randomAUF')}</div>
      <div class="setting"><div><div class="t">Disguise scrambles</div><div class="d">Mix in a random PLL and a different alg, so the scramble isn't just your alg backwards.</div></div>${sw('disguise')}</div>
      <div class="setting"><div><div class="t">Show case diagram before answer</div><div class="d">Handy if you don't have a cube in hand. Off makes you recognise it on the cube.</div></div>${sw('frontDiagram')}</div>
      <div class="setting"><div><div class="t">Theme</div></div>
        <select data-set="theme">
          <option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>System</option>
          <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option>
          <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option>
        </select></div>
    </div>
    <div class="panel settings">
      <div class="setting"><div><div class="t">Back up progress</div><div class="d">Progress is saved in this browser. Export it to move between devices.</div></div>
        <div style="display:flex;gap:8px"><button class="btn small" data-act="export">Export</button>
        <label class="btn small">Import<input type="file" accept="application/json" data-act="import" hidden></label></div></div>
      <div class="setting"><div><div class="t">Reset everything</div><div class="d">Clears all review history, alg choices and settings.</div></div>
        <button class="btn small danger" data-act="reset-all">Reset</button></div>
    </div>
    <p class="footnote">Algorithms from <a href="https://speedcubedb.com/a/3x3/OLL" target="_blank" rel="noopener">SpeedCubeDB</a>: the standard alg plus the most-voted alternatives for each case, all checked with a cube simulator.
    Keys: <kbd>Space</kbd> timer, <kbd>Enter</kbd> show answer, <kbd>1</kbd>–<kbd>4</kbd> rate, <kbd>Z</kbd> undo.</p>`;
  }

  function applyTheme() {
    const t = store.settings.theme;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }

  let toastTimer = 0;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  // ---------------- events ----------------
  function setView(v) {
    session.view = v;
    if (v === 'study' && session.current && !session.current.revealed) resetTimer();
    render();
  }

  document.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (b) setView(b.dataset.view);
  });

  function onAction(el, e) {
    const act = el.dataset.act;
    const id = el.dataset.id ? Number(el.dataset.id) : null;
    switch (act) {
      case 'timer':
        if (session.timer.state === 'idle') startTimer();
        else if (session.timer.state === 'running') stopTimer();
        break;
      case 'reveal': reveal(); break;
      case 'rate': rate(Number(el.dataset.r)); break;
      case 'undo': undo(); break;
      case 'copy':
        navigator.clipboard && navigator.clipboard.writeText(session.current.scramble).then(() => toast('Scramble copied'), () => {});
        break;
      case 'rescramble':
        session.current.scramble = makeScramble(session.current.id);
        resetTimer();
        render();
        break;
      case 'use-alg':
        store.prefs[session.current.id] = el.dataset.alg;
        save();
        render();
        toast('Set as your alg');
        break;
      case 'practice':
        session.mode = 'practice'; session.only = null; nextCard(); render(); break;
      case 'practice-case':
        document.getElementById('case-dialog').close();
        session.mode = 'practice'; session.only = id; session.view = 'study'; nextCard(); render(); break;
      case 'exit-practice':
        session.mode = 'srs'; session.only = null; nextCard(); render(); break;
      case 'more-new':
        daily(Date.now()).extra += 5; save(); nextCard(); render(); break;
      case 'open-case': openCase(id); break;
      case 'close-dialog': document.getElementById('case-dialog').close(); break;
      case 'enable-all': store.disabled = {}; save(); render(); break;
      case 'disable-all': CASES.forEach((c) => { store.disabled[c.id] = true; }); save(); render(); break;
      case 'save-custom': {
        const val = document.getElementById('custom-alg').value.trim();
        const err = document.getElementById('custom-err');
        if (!val) { delete store.custom[id]; save(); openCase(id); render(); return; }
        const problem = validateAlg(id, val);
        if (problem) { err.textContent = problem; return; }
        const norm = (a) => Cube.fmt(Cube.parse(a));
        const existing = BY_ID.get(id).algs.find((a) => norm(a.alg) === norm(val));
        if (existing) delete store.custom[id]; else store.custom[id] = val;
        store.prefs[id] = existing ? existing.alg : val;
        save();
        openCase(id);
        render();
        toast('Custom alg saved');
        break;
      }
      case 'reset-case':
        if (!confirm(`Reset all progress for ${BY_ID.get(id).name}?`)) return;
        delete store.cards[id];
        store.log = store.log.filter((x) => x.id !== id);
        save(); openCase(id); render();
        break;
      case 'export': {
        const blob = new Blob([JSON.stringify(store, null, 1)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `oll-trainer-${SRS.dayKey(Date.now())}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        break;
      }
      case 'reset-all':
        if (!confirm('Reset all progress, alg choices and settings? This cannot be undone.')) return;
        try { localStorage.removeItem(STORE_KEY); } catch (err) { /* ignore */ }
        store = load();
        session.current = null; session.undo = null; session.mode = 'srs';
        applyTheme(); render(); toast('Everything reset');
        break;
      default: return;
    }
    e.preventDefault();
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'INPUT') return;
    onAction(el, e);
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.act === 'toggle-group') {
      CASES.filter((c) => c.group === el.dataset.group).forEach((c) => {
        if (el.checked) delete store.disabled[c.id]; else store.disabled[c.id] = true;
      });
      save(); render(); return;
    }
    if (el.dataset.act === 'toggle-case') {
      const id = Number(el.dataset.id);
      if (el.checked) delete store.disabled[id]; else store.disabled[id] = true;
      save(); render(); return;
    }
    if (el.dataset.act === 'import') {
      const f = el.files[0];
      if (!f) return;
      f.text().then((txt) => {
        const d = JSON.parse(txt);
        if (!d || typeof d.cards !== 'object') throw new Error('bad file');
        localStorage.setItem(STORE_KEY, JSON.stringify(d));
        store = load();
        session.current = null; session.undo = null;
        applyTheme(); render(); toast('Progress imported');
      }).catch(() => toast("Couldn't read that file"));
      return;
    }
    const k = el.dataset.set;
    if (!k) return;
    const s = store.settings;
    if (k === 'newPerDay') s.newPerDay = Math.max(0, Math.min(57, parseInt(el.value, 10) || 0));
    else if (k === 'learningSteps') {
      const steps = el.value.split(/[\s,]+/).map(Number).filter((n) => n > 0);
      s.learningSteps = steps.length ? steps : DEFAULT_SETTINGS.learningSteps;
    } else if (el.type === 'checkbox') s[k] = el.checked;
    else s[k] = el.value;
    if (k === 'randomAUF' || k === 'disguise') session.current = null; // re-scramble with new rules
    save();
    applyTheme();
    render();
  });

  document.getElementById('case-dialog').addEventListener('close', () => { if (session.view !== 'study') render(); });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea') || document.getElementById('case-dialog').open) return;
    if (e.metaKey || e.ctrlKey || e.altKey) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { undo(); e.preventDefault(); }
      return;
    }
    if (session.view !== 'study') return;
    const cur = session.current;
    if (e.key === 'z' || e.key === 'Z') { undo(); return; }
    if (!cur) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (e.repeat || cur.revealed) return;
      if (!store.settings.timer) reveal();
      else if (session.timer.state === 'idle') startTimer();
      else if (session.timer.state === 'running') stopTimer();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!cur.revealed) reveal(); else rate(3);
      return;
    }
    if (cur.revealed && ['1', '2', '3', '4'].includes(e.key)) rate(Number(e.key));
  });

  // Keep the header counts fresh as learning cards come due.
  setInterval(() => {
    renderCounts();
    if (session.view === 'study' && !session.current) render();
  }, 30000);

  applyTheme();
  render();
})();
