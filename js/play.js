import { boot, applyRankedResult, toast, esc } from './app.js';
import { Game, WHITE, BLACK, isKing, sideOf } from './engine.js';
import { pickRankedOpponent, botById, BOTS } from './bots.js';
import { chooseMove, evaluate, STYLES } from './bot.js';
import * as store from './store.js';

const qs = new URLSearchParams(location.search);
const mode = qs.get('mode') === 'casual' ? 'casual' : 'ranked';
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));

let profile, bot, game, me, flipped, selected = null, busy = false, ended = false;
let pendingSet = false, lastDrawOffer = -99, worker = null;

(async () => {
  profile = await boot();
  if (!profile) return;
  if (mode === 'casual') bot = botById(qs.get('bot')) || BOTS[0];
  else bot = pickRankedOpponent(profile.elo);

  const col = qs.get('color');
  me = col === 'white' ? WHITE : col === 'black' ? BLACK : (Math.random() < 0.5 ? WHITE : BLACK);
  flipped = me === BLACK;
  setupWorker();
  game = new Game();

  $('modeLabel').textContent = mode === 'ranked' ? 'Partia rankingowa' : 'Partia towarzyska';
  renderPlayers();
  render();

  if (mode === 'ranked') {
    // Krótkie "szukanie przeciwnika" - dla klimatu
    busy = true;
    $('searching').hidden = false;
    await sleep(1200 + Math.random() * 1300);
    $('searching').hidden = true;
    busy = false;
    render();
  }
  setStatus(me === WHITE ? 'Twój ruch. Grasz białymi.' : 'Grasz czarnymi. Przeciwnik zaczyna.');
  if (game.turn !== me) botTurn();
})();

function setupWorker() {
  try { worker = new Worker('js/bot-worker.js', { type: 'module' }); }
  catch { worker = null; }
}
function askBot() {
  const data = { board: game.board, side: -me, elo: bot.elo, style: bot.style };
  if (!worker) return new Promise(r => setTimeout(() => r(chooseMove(data.board, data.side, data.elo, data.style)), 30));
  return new Promise(r => {
    worker.onmessage = e => r(e.data);
    worker.onerror = () => { worker = null; r(chooseMove(data.board, data.side, data.elo, data.style)); };
    worker.postMessage(data);
  });
}

function renderPlayers() {
  const hidden = mode === 'ranked' && !ended;
  $('oppAvatar').textContent = hidden ? '?' : bot.avatar;
  $('oppName').textContent = hidden ? 'Ukryty przeciwnik' : bot.name;
  $('oppElo').textContent = hidden ? 'Elo ukryte do końca partii' : `Elo ${bot.elo}, styl: ${STYLES[bot.style].label.toLowerCase()}`;
  $('meAvatar').textContent = profile.avatar;
  $('meName').textContent = profile.nick;
  $('meElo').textContent = `Elo ${profile.elo}` + (mode === 'ranked' && profile.games < 20 ? ` (kalibracja ${profile.games}/20)` : '');
  $('oppDisc').className = 'mini-disc ' + (me === WHITE ? 'black' : 'white');
  $('meDisc').className = 'mini-disc ' + (me === WHITE ? 'white' : 'black');
}

function setStatus(t) { $('status').textContent = t; }

function render(board = game.board, extra = {}) {
  const el = $('board');
  const moves = !busy && !ended && game.turn === me ? game.legalMoves() : [];
  const movable = new Set(moves.map(m => m.from));
  const targets = new Set(selected !== null ? moves.filter(m => m.from === selected).map(m => m.to) : []);
  const forced = moves.length && moves[0].captured.length > 0;
  const last = extra.last || game.history[game.history.length - 1];
  const lastSet = new Set(last ? last.path : []);
  let html = '';
  for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
    const r = flipped ? 7 - vr : vr, c = flipped ? 7 - vc : vc, sq = r * 8 + c;
    const dark = (r + c) % 2 === 1;
    const cls = ['sq', dark ? 'dark' : 'light'];
    if (lastSet.has(sq)) cls.push('last');
    if (sq === selected) cls.push('sel');
    if (targets.has(sq)) cls.push('target');
    if (forced && movable.has(sq)) cls.push('must');
    if (movable.has(sq)) cls.push('movable');
    const p = board[sq];
    let inner = '';
    if (p) inner = `<div class="piece ${sideOf(p) === WHITE ? 'white' : 'black'}${isKing(p) ? ' king' : ''}"></div>`;
    if (vc === 0) inner += `<span class="coord rank">${8 - r}</span>`;
    if (vr === 7) inner += `<span class="coord file">${'abcdefgh'[c]}</span>`;
    html += `<div class="${cls.join(' ')}" data-sq="${sq}" ${dark ? 'role="button" tabindex="-1"' : ''}>${inner}</div>`;
  }
  el.innerHTML = html;
  renderMoves();
}

function renderMoves() {
  const h = game.history;
  let html = '';
  for (let i = 0; i < h.length; i += 2) {
    html += `<li><span class="n">${i / 2 + 1}.</span><span>${h[i].text}</span><span>${h[i + 1] ? h[i + 1].text : ''}</span></li>`;
  }
  const ol = $('moveList');
  ol.innerHTML = html || '<li class="empty">Ruchy pojawią się tutaj.</li>';
  ol.scrollTop = ol.scrollHeight;
}

$('board').addEventListener('click', e => {
  const cell = e.target.closest('.sq');
  if (!cell || busy || ended || game.turn !== me) return;
  const sq = +cell.dataset.sq;
  const moves = game.legalMoves();
  if (selected !== null) {
    const m = moves.find(m => m.from === selected && m.to === sq);
    if (m) return playerMove(m);
  }
  selected = moves.some(m => m.from === sq) ? sq : null;
  if (selected === null && sideOf(game.board[sq]) === me && moves[0]?.captured.length)
    setStatus('Bicie jest obowiązkowe. Zaznaczone piony muszą bić.');
  render();
});

async function animate(m) {
  if (m.path.length <= 2) return;
  const b = game.board.slice();
  const piece = b[m.from];
  for (let i = 1; i < m.path.length; i++) {
    b[m.path[i - 1]] = 0;
    b[m.path[i]] = piece;
    b[m.captured[i - 1]] = 0;
    render(b, { last: { path: m.path.slice(0, i + 1) } });
    await sleep(170);
  }
}

async function playerMove(m) {
  selected = null;
  busy = true;
  await animate(m);
  game.play(m);
  busy = false;
  if (mode === 'ranked' && !pendingSet) {
    pendingSet = true;
    savePending();
  }
  afterMove();
}

function savePending() {
  if (mode !== 'ranked' || ended) return;
  localStorage.setItem('wa_pending', JSON.stringify({
    uid: store.user().uid, botId: bot.id, color: me === WHITE ? 'white' : 'black',
    moves: game.history.map(h => h.text), date: Date.now(),
  }));
}

function afterMove() {
  render();
  if (pendingSet) savePending();
  if (game.result) return finish(game.result.winner, game.result.reason);
  if (game.turn !== me) botTurn();
  else {
    const forced = game.legalMoves()[0]?.captured.length;
    setStatus(forced ? 'Twój ruch. Masz obowiązkowe bicie.' : 'Twój ruch.');
  }
}

async function botTurn() {
  busy = true;
  render();
  setStatus('Przeciwnik się zastanawia…');
  const t0 = Date.now();
  const m = await askBot();
  const wait = 450 + Math.random() * 900 - (Date.now() - t0);
  if (wait > 0) await sleep(wait);
  if (ended) return;
  await animate(m);
  game.play(m);
  busy = false;
  afterMove();
}

$('resignBtn').onclick = () => {
  if (ended) return;
  const msg = mode === 'ranked' ? 'Na pewno się poddać? Stracisz punkty Elo.' : 'Na pewno się poddać?';
  if (confirm(msg)) finish(-me, 'Poddanie partii');
};

$('drawBtn').onclick = () => {
  if (ended || busy) return;
  const n = game.history.length;
  if (n < 20) return toast('Remis można zaproponować po 10 ruchach każdej strony.');
  if (n - lastDrawOffer < 10) return toast('Przeciwnik niedawno odrzucił remis. Spróbuj za kilka ruchów.');
  lastDrawOffer = n;
  const evalForBot = -me * evaluate(game.board, STYLES[bot.style]);
  if (evalForBot <= 25) finish(0, 'Remis za porozumieniem');
  else toast('Przeciwnik odrzucił propozycję remisu.');
};

async function finish(winner, reason) {
  if (ended) return;
  ended = true;
  busy = false;
  if (worker) worker.terminate();
  localStorage.removeItem('wa_pending');
  render();
  const score = winner === me ? 1 : winner === 0 ? 0.5 : 0;
  const color = me === WHITE ? 'white' : 'black';
  const moves = game.history.map(h => h.text);
  let eloHtml = '';
  try {
    if (mode === 'ranked') {
      const { before, after } = await applyRankedResult(profile, { bot, score, reason, color, moves });
      const d = after - before;
      eloHtml = `<p class="elo-change ${d >= 0 ? 'up' : 'down'}">${before} → <b>${after}</b> <span>(${d >= 0 ? '+' : ''}${d})</span></p>`;
    } else {
      await store.recordGame({
        date: Date.now(), ranked: false, botId: bot.id, botName: bot.name, botAvatar: bot.avatar, botElo: bot.elo,
        result: score === 1 ? 'win' : score === 0 ? 'loss' : 'draw', reason, color, moves,
      }, { casual: (profile.casual || 0) + 1 });
    }
  } catch (e) {
    console.error(e);
    toast('Nie udało się zapisać wyniku partii.');
  }
  renderPlayers();
  const chip = document.querySelector('.nav-chip b');
  if (chip) chip.textContent = profile.elo;
  const title = score === 1 ? 'Wygrana' : score === 0 ? 'Porażka' : 'Remis';
  setStatus(`${title}. ${reason}.`);
  $('resultBox').innerHTML = `
    <h2>${title}</h2>
    <p class="muted">${esc(reason)}</p>
    ${eloHtml}
    <div class="reveal">
      <span class="avatar big">${bot.avatar}</span>
      <div><p class="muted small">${mode === 'ranked' ? 'Twoim przeciwnikiem był' : 'Grałeś z'}</p>
      <h3>${esc(bot.name)}</h3><p>Elo ${bot.elo}, styl: ${STYLES[bot.style].label.toLowerCase()}</p>
      <p class="muted small">${esc(bot.bio)}</p></div>
    </div>
    <div class="actions">
      <a class="btn primary" href="play.html?mode=ranked">Nowa partia rankingowa</a>
      <a class="btn" href="play.html?mode=casual&bot=${bot.id}">Zagraj z nim towarzysko</a>
      <button class="btn ghost" id="closeResult">Zobacz planszę</button>
    </div>`;
  $('resultDlg').showModal();
  $('closeResult').onclick = () => $('resultDlg').close();
}

window.addEventListener('beforeunload', e => {
  if (mode === 'ranked' && pendingSet && !ended) { e.preventDefault(); e.returnValue = ''; }
});
