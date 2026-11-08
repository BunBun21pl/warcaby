// Generator losowych botów. Każdy bot powstaje z ziarna (seed), więc ten sam
// identyfikator zawsze daje tego samego bota: tę samą nazwę, Elo, styl i charakter.
// Dzięki temu da się zapisać go w historii, rozliczyć porzuconą partię i zagrać rewanż.

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const between = (r, a, b) => Math.round(a + r() * (b - a));

const MALE = ['Staszek', 'Heniek', 'Rysiek', 'Zbyszek', 'Tadek', 'Mietek', 'Józek', 'Kazik', 'Waldek', 'Krzysiek', 'Darek', 'Bartek', 'Marek', 'Antek', 'Franek', 'Igor', 'Jacek', 'Leszek', 'Tomek', 'Wojtek', 'Sławek', 'Edek', 'Gienek', 'Olek', 'Kamil', 'Szymon', 'Adrian', 'Filip'];
const FEMALE = ['Jola', 'Basia', 'Krysia', 'Zosia', 'Hania', 'Ela', 'Gosia', 'Danuta', 'Marta', 'Ania', 'Iwona', 'Kasia', 'Teresa', 'Ewa', 'Lena', 'Natalia', 'Wanda', 'Bożena', 'Ula', 'Agata', 'Renata', 'Magda'];
const ADJ_M = ['Szybki', 'Cierpliwy', 'Cichy', 'Podstępny', 'Uparty', 'Nieustraszony', 'Spokojny', 'Sprytny', 'Wielki', 'Mały', 'Zamyślony', 'Rozważny', 'Nocny', 'Wesoły', 'Zawzięty'];
const ADJ_F = ['Szybka', 'Cierpliwa', 'Cicha', 'Podstępna', 'Uparta', 'Nieustraszona', 'Spokojna', 'Sprytna', 'Wielka', 'Mała', 'Zamyślona', 'Rozważna', 'Nocna', 'Wesoła', 'Zawzięta'];
const PLACES = ['z Nowej Huty', 'z Bałut', 'z Pragi', 'z Grabiszyna', 'z Nadodrza', 'z Wrzeszcza', 'z Łazarza', 'z Kazimierza', 'z Mokotowa', 'z Zaspy', 'spod Tatr', 'znad Bałtyku', 'z Mazur', 'z Bieszczad', 'z Krzyków', 'z Ursynowa', 'z Podgórza', 'z Gocławia'];
const JOBS_M = ['Listonosz', 'Kierowca autobusu', 'Stróż nocny', 'Pszczelarz', 'Elektryk', 'Bibliotekarz', 'Hydraulik', 'Ogrodnik', 'Piekarz', 'Kominiarz', 'Rybak', 'Leśniczy', 'Fryzjer', 'Kucharz', 'Magazynier'];
const JOBS_F = ['Bibliotekarka', 'Pielęgniarka', 'Kwiaciarka', 'Pszczelarka', 'Konduktorka', 'Nauczycielka', 'Farmaceutka', 'Krawcowa', 'Piekarka', 'Księgowa', 'Ogrodniczka', 'Fryzjerka'];
const NICK_WORDS = ['pionek', 'damka', 'bicie', 'skos', 'przekatna', 'warcabnik', 'krolowka', 'szachownica', 'kamyk', 'zeton', 'cichy.gracz', 'nocny.marek', 'wilk', 'sowa', 'lis', 'jez', 'kawa', 'herbatka', 'piernik', 'ogorek'];
const NICK_PARTS = [['Mistrz', 'Pan', 'Król', 'Ninja', 'Baron', 'Kapral', 'Doktor', 'Hrabia'], ['Bicia', 'Skosu', 'Przekątnej', 'Damki', 'Pionów', 'Narożnika', 'Planszy', 'Remisu']];
const AVATARS = ['🦔', '🦉', '🐺', '🦊', '🐻', '🐗', '🐿️', '🦡', '🐌', '🐞', '🐟', '🦆', '🐓', '🐐', '🐴', '🍄', '🌻', '🌲', '🪵', '☕', '🍵', '🥨', '🍐', '🎲', '🎯', '🧩', '🪁', '🎻', '🪗', '📻', '🔧', '🧵', '🕰️', '🚲', '🛶', '⛺', '🌧️', '❄️', '🌙', '⭐'];
// {a} -> "" dla mężczyzny, "a" dla kobiety (pokonał / pokonała)
const BIO = [
  'Gra wieczorami, po pracy.',
  'Mówi, że kiedyś pokonał{a} mistrza województwa. Nikt tego nie sprawdzał.',
  'Uczy się z książek z lat osiemdziesiątych.',
  'Zawsze zaczyna od tego samego ruchu.',
  'Gra szybko i rzadko się waha.',
  'Długo myśli nad każdym ruchem, nawet oczywistym.',
  'Nie znosi remisów.',
  'Woli bronić się do końca niż ryzykować.',
  'Gra w warcaby od dziecka, z dziadkiem na działce.',
  'Trenuje na planszy z magnesami w tramwaju.',
  'Wpadł{a} do klubu na jedną partię i został{a} na dłużej.',
  'Ma swoją ulubioną przekątną.',
  'Podobno nigdy nie przegrał{a} w niedzielę.',
  'Rozgrywa partie korespondencyjne z kuzynem z Kanady.',
  'Przychodzi do klubu z termosem herbaty.',
  'Nauczył{a} się grać z filmików, ale nie przyznaje się do tego.',
  'Zawsze gra tym samym kompletem drewnianych pionów.',
];
const STYLE_NAMES = ['balanced', 'aggressive', 'defensive', 'positional'];

function makeName(r, female) {
  switch (Math.floor(r() * 5)) {
    case 0: return female ? `${pick(r, FEMALE)} ${pick(r, ADJ_F)}` : `${pick(r, MALE)} ${pick(r, ADJ_M)}`;
    case 1: return female ? `Pani ${pick(r, FEMALE)} ${pick(r, PLACES)}` : `Pan ${pick(r, MALE)} ${pick(r, PLACES)}`;
    case 2: return female ? `${pick(r, JOBS_F)} ${pick(r, FEMALE)}` : `${pick(r, JOBS_M)} ${pick(r, MALE)}`;
    case 3: {
      const w = pick(r, NICK_WORDS);
      const sep = pick(r, ['_', '', '.', '_']);
      const num = r() < 0.5 ? between(r, 1, 99) : between(r, 1955, 2012);
      return `${w}${sep}${num}`;
    }
    default: return `${pick(r, NICK_PARTS[0])}${pick(r, NICK_PARTS[1])}`;
  }
}

// Losowe Elo: dowolne z zakresu albo w pobliżu podanego celu
export function makeRandomBot(seed, aroundElo = null) {
  const r = rng(seed);
  const female = r() < 0.45;
  const name = makeName(r, female);
  let elo;
  if (aroundElo == null) elo = between(r, 350, 2350);
  else {
    const g = Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
    elo = Math.round(aroundElo + g * 55);
  }
  elo = Math.min(2400, Math.max(300, elo));
  const style = pick(r, STYLE_NAMES);
  // Każdy losowy bot ma też lekko inne "upodobania" w ocenie pozycji
  const weights = {
    kingVal: between(r, 270, 340),
    adv: +(1 + r() * 6).toFixed(1),
    back: between(r, 0, 18),
    center: between(r, 2, 10),
  };
  return {
    id: `r${seed.toString(36)}${aroundElo == null ? '' : '-' + elo.toString(36)}`,
    name, avatar: pick(r, AVATARS), elo, style, weights,
    bio: pick(r, BIO).replaceAll('{a}', female ? 'a' : ''), random: true,
  };
}

// Odtwarzanie bota z identyfikatora (np. z historii partii)
export function randomBotFromId(id) {
  const m = /^r([0-9a-z]+)(?:-([0-9a-z]+))?$/.exec(id || '');
  if (!m) return null;
  const seed = parseInt(m[1], 36);
  if (!m[2]) return makeRandomBot(seed);
  const target = parseInt(m[2], 36);
  const b = makeRandomBot(seed, target);
  // Elo zakodowane w id jest ostateczne – gwarantuje zgodność po odtworzeniu
  b.elo = target; b.id = id;
  return b;
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

// Goście klubu w danej godzinie: lista zmienia się co godzinę (lub po kliknięciu "Wylosuj")
export function clubGuests(count = 9, salt = 0) {
  const hour = Math.floor(Date.now() / 3600000);
  const r = rng(hour * 7919 + salt * 104729);
  return Array.from({ length: count }, () => makeRandomBot(Math.floor(r() * 2 ** 31)))
    .sort((a, b) => a.elo - b.elo);
}
