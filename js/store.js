// Warstwa danych: Firebase (Auth + Firestore) albo tryb lokalny (localStorage),
// jeśli konfiguracja Firebase nie jest jeszcze uzupełniona.
import { firebaseConfig } from './firebase-config.js';
import { START_ELO } from './elo.js';

export const USE_FIREBASE = !!(firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('WKLEJ'));
const V = '10.12.2';
let fb = null, auth = null, db = null, currentUser = null;

const defaultProfile = () => ({
  nick: 'Gracz', avatar: '🙂', elo: START_ELO, peak: START_ELO,
  games: 0, wins: 0, losses: 0, draws: 0, casual: 0,
  eloHistory: [START_ELO], createdAt: Date.now(),
});

const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export async function init() {
  if (!USE_FIREBASE) { currentUser = { uid: 'local', local: true }; return currentUser; }
  const [a, b, c] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  fb = { ...a, ...b, ...c };
  const app = fb.initializeApp(firebaseConfig);
  auth = fb.getAuth(app);
  db = fb.getFirestore(app);
  currentUser = await new Promise(res => { const un = fb.onAuthStateChanged(auth, u => { un(); res(u); }); });
  return currentUser;
}
export const user = () => currentUser;

export async function getProfile() {
  if (!USE_FIREBASE) {
    let p = lsGet('wa_profile', null);
    if (!p) { p = defaultProfile(); lsSet('wa_profile', p); }
    return { ...defaultProfile(), ...p };
  }
  const ref = fb.doc(db, 'users', currentUser.uid);
  const snap = await fb.getDoc(ref);
  if (snap.exists()) return { ...defaultProfile(), ...snap.data() };
  const p = defaultProfile();
  p.nick = currentUser.displayName || (currentUser.isAnonymous ? 'Gość' + Math.floor(Math.random() * 9000 + 1000) : 'Gracz');
  await fb.setDoc(ref, p);
  return p;
}

export async function saveProfile(partial) {
  if (!USE_FIREBASE) { lsSet('wa_profile', { ...lsGet('wa_profile', defaultProfile()), ...partial }); return; }
  await fb.updateDoc(fb.doc(db, 'users', currentUser.uid), partial);
}

export async function recordGame(game, profileUpdate) {
  if (!USE_FIREBASE) {
    const games = lsGet('wa_games', []);
    games.unshift(game);
    lsSet('wa_games', games.slice(0, 300));
    if (profileUpdate) await saveProfile(profileUpdate);
    return;
  }
  const batch = fb.writeBatch(db);
  batch.set(fb.doc(fb.collection(db, 'users', currentUser.uid, 'games')), game);
  if (profileUpdate) batch.update(fb.doc(db, 'users', currentUser.uid), profileUpdate);
  await batch.commit();
}

export async function getGames(n = 50) {
  if (!USE_FIREBASE) return lsGet('wa_games', []).slice(0, n);
  const q = fb.query(fb.collection(db, 'users', currentUser.uid, 'games'), fb.orderBy('date', 'desc'), fb.limit(n));
  return (await fb.getDocs(q)).docs.map(d => d.data());
}

export async function getTopPlayers(n = 50) {
  if (!USE_FIREBASE) return [{ uid: 'local', ...(await getProfile()) }];
  const q = fb.query(fb.collection(db, 'users'), fb.orderBy('elo', 'desc'), fb.limit(n));
  return (await fb.getDocs(q)).docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function login(email, pass) {
  currentUser = (await fb.signInWithEmailAndPassword(auth, email, pass)).user;
}
export async function register(email, pass, nick) {
  const cred = await fb.createUserWithEmailAndPassword(auth, email, pass);
  await fb.updateProfile(cred.user, { displayName: nick });
  currentUser = cred.user;
  await fb.setDoc(fb.doc(db, 'users', cred.user.uid), { ...defaultProfile(), nick });
}
export async function guest() { currentUser = (await fb.signInAnonymously(auth)).user; }
export async function logout() { if (USE_FIREBASE) await fb.signOut(auth); }
