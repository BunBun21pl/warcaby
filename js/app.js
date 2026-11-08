// Wspólne rzeczy dla wszystkich podstron: nawigacja, logowanie, rozliczanie porzuconych partii.
import * as store from './store.js';
import { newRating } from './elo.js';
import { botById } from './bots.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const LINKS = [
  ['index.html', 'Graj'],
  ['ranking.html', 'Ranking'],
  ['profil.html', 'Profil'],
  ['zasady.html', 'Zasady'],
];

function renderNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  const nav = document.createElement('header');
  nav.className = 'topbar';
  nav.innerHTML = `
    <a class="brand" href="index.html"><span class="brand-disc"></span>Warcaby Arena</a>
    <nav>${LINKS.map(([h, t]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    <div class="nav-user" id="navUser"></div>`;
  document.body.prepend(nav);
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 4200);
}

export async function applyRankedResult(profile, { bot, score, reason, color, moves }) {
  const before = profile.elo;
  const after = newRating(before, bot.elo, score, profile.games);
  const upd = {
    elo: after,
    peak: Math.max(profile.peak || before, after),
    games: profile.games + 1,
    wins: profile.wins + (score === 1 ? 1 : 0),
    losses: profile.losses + (score === 0 ? 1 : 0),
    draws: profile.draws + (score === 0.5 ? 1 : 0),
    eloHistory: [...(profile.eloHistory || [before]), after].slice(-200),
  };
  const game = {
    date: Date.now(), ranked: true, botId: bot.id, botName: bot.name, botAvatar: bot.avatar, botElo: bot.elo,
    result: score === 1 ? 'win' : score === 0 ? 'loss' : 'draw', reason, color, moves: moves || [],
    eloBefore: before, eloAfter: after,
  };
  await store.recordGame(game, upd);
  Object.assign(profile, upd);
  return { before, after };
}

// Jeśli ktoś zamknął kartę w trakcie partii rankingowej, liczymy to jako porażkę
async function settleAbandoned(profile) {
  let p;
  try { p = JSON.parse(localStorage.getItem('wa_pending')); } catch {}
  if (!p || p.uid !== store.user().uid) return;
  localStorage.removeItem('wa_pending');
  const bot = botById(p.botId);
  if (!bot) return;
  const { before, after } = await applyRankedResult(profile, { bot, score: 0, reason: 'Porzucona partia', color: p.color, moves: p.moves || [] });
  toast(`Porzucona partia rankingowa liczy się jako porażka (${before} → ${after}).`);
}

export async function boot({ requireAuth = true } = {}) {
  renderNav();
  let u = null;
  try { u = await store.init(); } catch (e) {
    console.error(e);
    toast('Nie udało się połączyć z Firebase. Sprawdź konfigurację w js/firebase-config.js.');
  }
  if (!u) { if (requireAuth) location.href = 'login.html'; return null; }
  const profile = await store.getProfile();
  await settleAbandoned(profile);
  const nu = document.getElementById('navUser');
  nu.innerHTML = `<a href="profil.html" class="nav-chip"><span>${esc(profile.avatar)}</span>${esc(profile.nick)}<b>${profile.elo}</b></a>`;
  if (store.USE_FIREBASE) {
    const b = document.createElement('button');
    b.className = 'linkish'; b.textContent = 'Wyloguj';
    b.onclick = async () => { await store.logout(); location.href = 'login.html'; };
    nu.append(b);
  }
  return profile;
}
