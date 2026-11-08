// ===== Boty BEZ sztucznej inteligencji =====
// Klasyczny algorytm: minimax (negamax) z odcięciem alfa-beta, pogłębianiem iteracyjnym
// i ręcznie napisaną funkcją oceny pozycji. Żadnych sieci neuronowych, żadnego API.
// Siła bota zależy od jego Elo: głębokość liczenia, "szum" w ocenie i szansa na błąd.
import { generateMoves, applyMove } from './engine.js';

const INF = 1e9, WIN = 100000;
const TIMEOUT = Symbol('timeout');

export const STYLES = {
  balanced:   { kingVal: 300, adv: 3,   back: 8,  label: 'Zrównoważony' },
  aggressive: { kingVal: 330, adv: 6,   back: 2,  label: 'Agresywny' },
  defensive:  { kingVal: 290, adv: 1.5, back: 16, label: 'Defensywny' },
  positional: { kingVal: 300, adv: 2.5, back: 10, center: 9, label: 'Pozycyjny' },
};

export function botParams(elo) {
  const t = Math.min(1, Math.max(0, (elo - 400) / 1900)); // 400 … 2300
  return {
    depth: Math.max(1, Math.round(1 + t * 11)),         // 1 … 12 półruchów
    noise: Math.round(Math.pow(1 - t, 1.6) * 150),       // losowy błąd oceny
    blunder: Math.max(0, 0.3 - 0.45 * t),                // szansa na zupełnie losowy ruch
    timeMs: Math.round(300 + t * 2700),
  };
}

// Ocena z perspektywy białych (dodatnia = lepiej dla białych)
export function evaluate(board, st = STYLES.balanced) {
  let s = 0, wm = 0, bm = 0, wk = 0, bk = 0;
  const center = st.center || 4;
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p) continue;
    const r = sq >> 3, c = sq & 7;
    const mid = c >= 2 && c <= 5 && r >= 2 && r <= 5 ? center : 0;
    const edge = c === 0 || c === 7 ? -3 : 0;
    switch (p) {
      case 1: wm++; s += 100 + (7 - r) * st.adv + (r === 7 ? st.back : 0) + mid + edge; break;
      case -1: bm++; s -= 100 + r * st.adv + (r === 0 ? st.back : 0) + mid + edge; break;
      case 2: wk++; s += st.kingVal + (r + c === 7 ? 15 : 0); break;
      case -2: bk++; s -= st.kingVal + (r + c === 7 ? 15 : 0); break;
    }
  }
  // Zachęta do wymian, gdy ma się przewagę materialną
  const wt = wm * 100 + wk * st.kingVal, bt = bm * 100 + bk * st.kingVal;
  const pieces = wm + bm + wk + bk;
  if (wt !== bt) s += Math.sign(wt - bt) * 40 * (1 - pieces / 24);
  return s;
}

function gauss(rnd) {
  return Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
}

export function chooseMove(board, side, elo, styleName = 'balanced', rnd = Math.random) {
  const P = botParams(elo);
  const st = STYLES[styleName] || STYLES.balanced;
  const moves = generateMoves(board, side);
  if (moves.length <= 1) return moves[0] || null;
  if (rnd() < P.blunder) return moves[Math.floor(rnd() * moves.length)];

  const deadline = Date.now() + P.timeMs;
  let nodes = 0;

  function negamax(b, s, depth, alpha, beta, ply) {
    if ((++nodes & 1023) === 0 && Date.now() > deadline) throw TIMEOUT;
    const ms = generateMoves(b, s);
    if (ms.length === 0) return -WIN + ply;
    const forced = ms[0].captured.length > 0;
    // przy biciach liczymy dalej (wyszukiwanie spoczynkowe), żeby nie urywać w połowie wymiany
    if (depth <= 0 && (!forced || depth < -8)) return s * evaluate(b, st);
    let best = -INF;
    for (const m of ms) {
      const v = -negamax(applyMove(b, m), -s, depth - 1, -beta, -alpha, ply + 1);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }

  let order = moves.map(m => ({ m, v: 0 }));
  let done = null;
  try {
    for (let d = 1; d <= P.depth; d++) {
      const res = [];
      let alpha = -INF;
      for (const it of order) {
        const child = applyMove(board, it.m);
        const v = P.noise > 0
          ? -negamax(child, -side, d - 1, -INF, INF, 1)          // pełne okno: dokładne oceny wszystkich ruchów
          : -negamax(child, -side, d - 1, -INF, -alpha, 1);
        if (v > alpha) alpha = v;
        res.push({ m: it.m, v });
      }
      res.sort((a, b) => b.v - a.v);
      order = res;
      done = res;
      if (res[0].v > WIN - 100) break; // znaleziono wygraną
    }
  } catch (e) {
    if (e !== TIMEOUT) throw e;
  }
  if (!done) return moves[Math.floor(rnd() * moves.length)];
  let best = null, bestV = -INF;
  for (const it of done) {
    const v = it.v + (P.noise ? gauss(rnd) * P.noise : 0);
    if (v > bestV) { bestV = v; best = it.m; }
  }
  return best;
}
