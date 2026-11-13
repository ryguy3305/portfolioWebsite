/*
 * Anki-style SM-2 scheduler.
 * Card states: new -> learning (minute steps) -> review (day intervals);
 * a failed review goes to relearning, then back to review.
 */
(function (root) {
  'use strict';
  const MIN = 60 * 1000;
  const DAY = 24 * 60 * MIN;
  const ROLLOVER_HOUR = 4; // the study day starts at 4am, like Anki

  const DEFAULTS = {
    learningSteps: [1, 10], // minutes
    relearningSteps: [10],
    graduatingInterval: 1, // days
    easyInterval: 4,
    startingEase: 2.5,
    easyBonus: 1.3,
    hardFactor: 1.2,
    minEase: 1.3,
    maxInterval: 365,
  };

  function newCard(id) {
    return { id, state: 'new', step: 0, due: 0, interval: 0, ease: DEFAULTS.startingEase, reps: 0, lapses: 0 };
  }

  function dayStart(t) {
    const d = new Date(t);
    if (d.getHours() < ROLLOVER_HOUR) d.setDate(d.getDate() - 1);
    d.setHours(ROLLOVER_HOUR, 0, 0, 0);
    return d.getTime();
  }
  const dayEnd = (t) => dayStart(t) + DAY;
  const dayKey = (t) => new Date(dayStart(t)).toISOString().slice(0, 10);

  function fuzz(ivl) {
    if (ivl < 3) return ivl;
    const spread = Math.max(1, Math.round(ivl * 0.05));
    return ivl + Math.round((Math.random() * 2 - 1) * spread);
  }

  // rating: 1 Again, 2 Hard, 3 Good, 4 Easy. Pure: returns a new card.
  function schedule(card, rating, now, cfg, { noFuzz = false } = {}) {
    cfg = Object.assign({}, DEFAULTS, cfg || {});
    const c = Object.assign({}, card, { reps: card.reps + 1, lastReview: now });
    const fz = noFuzz ? (x) => x : fuzz;
    const graduate = (days) => {
      c.state = 'review';
      c.step = 0;
      c.interval = Math.min(cfg.maxInterval, Math.max(1, Math.round(days)));
      c.due = dayStart(now) + c.interval * DAY;
    };

    if (c.state === 'new' || c.state === 'learning' || c.state === 'relearning') {
      const relearn = c.state === 'relearning';
      const steps = relearn ? cfg.relearningSteps : cfg.learningSteps;
      if (c.state === 'new') { c.state = 'learning'; c.step = 0; c.ease = cfg.startingEase; }
      const i = Math.min(c.step, steps.length - 1);
      if (rating === 1) {
        c.step = 0;
        c.due = now + steps[0] * MIN;
      } else if (rating === 2) {
        const mins = i === 0 && steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[i] * (steps.length === 1 ? 1.5 : 1);
        c.due = now + mins * MIN;
      } else if (rating === 3) {
        if (i + 1 < steps.length) {
          c.step = i + 1;
          c.due = now + steps[i + 1] * MIN;
        } else graduate(relearn ? c.interval : cfg.graduatingInterval);
      } else {
        graduate(relearn ? c.interval + 1 : cfg.easyInterval);
      }
      return c;
    }

    // review
    const ivl = Math.max(1, c.interval);
    if (rating === 1) {
      c.lapses += 1;
      c.ease = Math.max(cfg.minEase, c.ease - 0.2);
      c.interval = 1;
      c.state = 'relearning';
      c.step = 0;
      c.due = now + cfg.relearningSteps[0] * MIN;
      return c;
    }
    const hard = Math.max(ivl + 1, ivl * cfg.hardFactor);
    const good = Math.max(hard + 1, ivl * c.ease);
    const easy = Math.max(good + 1, ivl * c.ease * cfg.easyBonus);
    if (rating === 2) { c.ease = Math.max(cfg.minEase, c.ease - 0.15); graduate(fz(hard)); }
    else if (rating === 3) graduate(fz(good));
    else { c.ease += 0.15; graduate(fz(easy)); }
    return c;
  }

  function formatInterval(ms) {
    const m = ms / MIN;
    if (m < 1) return '<1m';
    if (m < 60) return Math.round(m) + 'm';
    const h = m / 60;
    if (h < 24) return Math.round(h) + 'h';
    const d = h / 24;
    if (d < 30) return Math.round(d) + 'd';
    if (d < 365) return (d / 30).toFixed(1).replace(/\.0$/, '') + 'mo';
    return (d / 365).toFixed(1).replace(/\.0$/, '') + 'y';
  }

  // Label for the button: time from now until the card would next be due.
  function previewLabel(card, rating, now, cfg) {
    const next = schedule(card, rating, now, cfg, { noFuzz: true });
    if (next.state === 'review') return formatInterval(next.interval * DAY);
    return formatInterval(next.due - now);
  }

  root.SRS = { DEFAULTS, newCard, schedule, previewLabel, formatInterval, dayStart, dayEnd, dayKey, MIN, DAY };
})(typeof window !== 'undefined' ? window : globalThis);
