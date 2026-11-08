// ===== Silnik warcabów 8x8 (zasady polskie / klasyczne) =====
// - zaczynają białe
// - bicie jest obowiązkowe i trzeba bić maksymalną liczbę pionów
// - piony ruszają się do przodu, ale biją też do tyłu
// - damki są "latające" (ruch i bicie na dowolną odległość po przekątnej)
// - pion zostaje damką tylko gdy KOŃCZY ruch na ostatniej linii
// - zbite piony zdejmuje się po zakończeniu bicia (nie można przeskoczyć dwa razy tego samego)

export const WHITE = 1, BLACK = -1;
export const WM = 1, WK = 2, BM = -1, BK = -2;
const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

export const sideOf = p => (p > 0 ? 1 : p < 0 ? -1 : 0);
export const isKing = p => p === 2 || p === -2;
export const sqName = sq => 'abcdefgh'[sq & 7] + (8 - (sq >> 3));

export function initialBoard() {
  const b = new Array(64).fill(0);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 !== 1) continue;
      if (r < 3) b[r * 8 + c] = BM;
      else if (r > 4) b[r * 8 + c] = WM;
    }
  return b;
}

function capturesFrom(board, sq) {
  const piece = board[sq];
  const side = sideOf(piece);
  const king = isKing(piece);
  const b = board.slice();
  b[sq] = 0; // pion "unosi się" z pola startowego
  const res = [];

  function dfs(pos, path, caps) {
    let extended = false;
    const r = pos >> 3, c = pos & 7;
    for (const [dr, dc] of DIRS) {
      if (king) {
        let rr = r + dr, cc = c + dc;
        while (inB(rr, cc) && b[rr * 8 + cc] === 0) { rr += dr; cc += dc; }
        if (!inB(rr, cc)) continue;
        const mid = rr * 8 + cc;
        if (sideOf(b[mid]) !== -side || caps.includes(mid)) continue;
        let lr = rr + dr, lc = cc + dc;
        while (inB(lr, lc) && b[lr * 8 + lc] === 0) {
          const land = lr * 8 + lc;
          extended = true;
          dfs(land, [...path, land], [...caps, mid]);
          lr += dr; lc += dc;
        }
      } else {
        const lr = r + 2 * dr, lc = c + 2 * dc;
        if (!inB(lr, lc)) continue;
        const mid = (r + dr) * 8 + (c + dc), land = lr * 8 + lc;
        if (sideOf(b[mid]) === -side && !caps.includes(mid) && b[land] === 0) {
          extended = true;
          dfs(land, [...path, land], [...caps, mid]);
        }
      }
    }
    if (!extended && caps.length) res.push({ from: sq, to: pos, path, captured: caps });
  }
  dfs(sq, [sq], []);
  return res;
}

function simpleFrom(board, sq) {
  const p = board[sq], side = sideOf(p), r = sq >> 3, c = sq & 7, res = [];
  if (isKing(p)) {
    for (const [dr, dc] of DIRS) {
      let rr = r + dr, cc = c + dc;
      while (inB(rr, cc) && board[rr * 8 + cc] === 0) {
        const t = rr * 8 + cc;
        res.push({ from: sq, to: t, path: [sq, t], captured: [] });
        rr += dr; cc += dc;
      }
    }
  } else {
    const dr = side === WHITE ? -1 : 1;
    for (const dc of [-1, 1]) {
      const rr = r + dr, cc = c + dc;
      if (inB(rr, cc) && board[rr * 8 + cc] === 0)
        res.push({ from: sq, to: rr * 8 + cc, path: [sq, rr * 8 + cc], captured: [] });
    }
  }
  return res;
}

export function generateMoves(board, side) {
  let caps = [], max = 0;
  const seen = new Set();
  for (let sq = 0; sq < 64; sq++) {
    if (sideOf(board[sq]) !== side) continue;
    for (const m of capturesFrom(board, sq)) {
      const n = m.captured.length;
      if (n < max) continue;
      const key = m.from + '>' + m.to + ':' + [...m.captured].sort((a, b) => a - b).join(',');
      if (n > max) { max = n; caps = []; seen.clear(); }
      if (seen.has(key)) continue;
      seen.add(key);
      caps.push(m);
    }
  }
  if (caps.length) return caps;
  const res = [];
  for (let sq = 0; sq < 64; sq++) if (sideOf(board[sq]) === side) res.push(...simpleFrom(board, sq));
  return res;
}

export function applyMove(board, m) {
  const nb = board.slice();
  let piece = nb[m.from];
  nb[m.from] = 0;
  for (const c of m.captured) nb[c] = 0;
  const row = m.to >> 3;
  if (piece === WM && row === 0) piece = WK;
  if (piece === BM && row === 7) piece = BK;
  nb[m.to] = piece;
  return nb;
}

export function notation(m) {
  return m.path.map(sqName).join(m.captured.length ? 'x' : '-');
}

export class Game {
  constructor() {
    this.board = initialBoard();
    this.turn = WHITE;
    this.history = [];
    this.positions = new Map();
    this.quiet = 0; // ruchy damkami bez bicia (w półruchach)
    this.result = null;
    this._record();
  }
  key() { return this.turn + ':' + this.board.join(','); }
  _record() {
    const k = this.key();
    const n = (this.positions.get(k) || 0) + 1;
    this.positions.set(k, n);
    return n;
  }
  legalMoves() { return generateMoves(this.board, this.turn); }
  play(m) {
    const piece = this.board[m.from];
    const kingQuiet = isKing(piece) && m.captured.length === 0;
    this.board = applyMove(this.board, m);
    this.history.push({ ...m, side: this.turn, text: notation(m) });
    this.quiet = kingQuiet ? this.quiet + 1 : 0;
    this.turn = -this.turn;
    const rep = this._record();
    this.result = this._checkEnd(rep);
    return this.result;
  }
  _checkEnd(rep) {
    if (this.legalMoves().length === 0)
      return { winner: -this.turn, reason: 'Brak możliwych ruchów' };
    if (rep >= 3) return { winner: 0, reason: 'Trzykrotne powtórzenie pozycji' };
    if (this.quiet >= 30) return { winner: 0, reason: '15 ruchów damkami bez bicia' };
    if (this.history.length >= 300) return { winner: 0, reason: 'Limit 150 ruchów' };
    return null;
  }
}
