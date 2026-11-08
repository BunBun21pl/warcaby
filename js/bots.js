// Lista botów. Każdy ma stałe Elo i styl gry (wpływa na funkcję oceny).
export const BOTS = [
  { id: 'piotrus',   name: 'Piotruś',            avatar: '🧒', elo: 400,  style: 'aggressive', bio: 'Ma 7 lat i właśnie nauczył się, że pionem można bić do tyłu.' },
  { id: 'halina',    name: 'Babcia Halina',      avatar: '👵', elo: 500,  style: 'defensive',  bio: 'Gra w przerwach między serialami. Zawsze częstuje pierniczkami.' },
  { id: 'mruczek',   name: 'Kot Mruczek',        avatar: '🐈', elo: 600,  style: 'balanced',   bio: 'Chodzi po planszy. Czasem zrzuci pion, ale nie celowo.' },
  { id: 'kuba',      name: 'Kuba ze studiów',    avatar: '🎒', elo: 700,  style: 'aggressive', bio: 'Gra zamiast uczyć się do kolokwium.' },
  { id: 'zenek',     name: 'Pan Zenek z parku',  avatar: '🧢', elo: 800,  style: 'balanced',   bio: 'Od 30 lat przy tym samym stoliku w parku Jordana.' },
  { id: 'wiesia',    name: 'Wiesia z warzywniaka', avatar: '🥕', elo: 900, style: 'positional', bio: 'Liczy szybciej niż kasa fiskalna.' },
  { id: 'kolejarz',  name: 'Emerytowany kolejarz', avatar: '🚂', elo: 1000, style: 'defensive', bio: 'Wszystko musi jechać zgodnie z rozkładem.' },
  { id: 'ola',       name: 'Ola',                avatar: '🎧', elo: 1100, style: 'balanced',   bio: 'Gra ze słuchawkami na uszach i nie odzywa się. Idealnie.' },
  { id: 'mirek',     name: 'Taksówkarz Mirek',   avatar: '🚕', elo: 1200, style: 'aggressive', bio: 'Na postojach rozegrał więcej partii niż przejechał kursów.' },
  { id: 'bogdan',    name: 'Wujek Bogdan',       avatar: '🍖', elo: 1300, style: 'balanced',   bio: 'Mistrz rodzinnych grilli. Nie lubi przegrywać.' },
  { id: 'profesor',  name: 'Profesor Wiśniewski', avatar: '🎓', elo: 1400, style: 'positional', bio: 'Wykłada matematykę dyskretną. Liczy warianty z kredą w ręku.' },
  { id: 'grazyna',   name: 'Grażyna, mistrzyni osiedla', avatar: '🏆', elo: 1500, style: 'defensive', bio: 'Niepokonana na ławce pod blokiem od 2009 roku.' },
  { id: 'kapitan',   name: 'Kapitan Damka',      avatar: '⚓', elo: 1600, style: 'aggressive', bio: 'Pływał po wszystkich przekątnych świata.' },
  { id: 'zegarmistrz', name: 'Zegarmistrz',      avatar: '⌚', elo: 1700, style: 'positional', bio: 'Precyzja co do sekundy. Nie lubi pośpiechu.' },
  { id: 'general',   name: 'Generał Bicie',      avatar: '🎖️', elo: 1800, style: 'aggressive', bio: 'Uważa, że najlepszą obroną jest bicie obowiązkowe.' },
  { id: 'mnich',     name: 'Cichy mnich',        avatar: '🕯️', elo: 1900, style: 'defensive',  bio: 'Złożył śluby milczenia. Jego piony też nic nie mówią.' },
  { id: 'nowak',     name: 'Arcymistrz Nowak',   avatar: '🧠', elo: 2000, style: 'positional', bio: 'Dawny mistrz Polski. Gra powoli i bezlitośnie.' },
  { id: 'zelazny',   name: 'Żelazny Pion',       avatar: '🛡️', elo: 2100, style: 'defensive',  bio: 'Nie da się go przebić. Przynajmniej nikt jeszcze nie dał rady.' },
  { id: 'liczydlo',  name: 'Liczydło',           avatar: '🧮', elo: 2200, style: 'balanced',   bio: 'Liczy wszystkie warianty. Dosłownie wszystkie.' },
  { id: 'maszyna',   name: 'Maszyna parowa 1899', avatar: '⚙️', elo: 2300, style: 'positional', bio: 'Najsilniejszy z botów. Mechaniczny, cierpliwy, bezlitosny.' },
];

export const botById = id => BOTS.find(b => b.id === id);

// Ukryte dobieranie przeciwnika: cel = Twoje Elo ± losowe odchylenie,
// a potem losowanie bota ważone bliskością do celu. Nie wiesz, kogo dostaniesz.
export function pickRankedOpponent(playerElo) {
  const target = playerElo + Math.round((Math.random() + Math.random() - 1) * 80);
  const weights = BOTS.map(b => Math.exp(-((b.elo - target) ** 2) / (2 * 90 * 90)));
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum < 1e-9) return BOTS.reduce((a, b) => (Math.abs(b.elo - target) < Math.abs(a.elo - target) ? b : a));
  let x = Math.random() * sum;
  for (let i = 0; i < BOTS.length; i++) { x -= weights[i]; if (x <= 0) return BOTS[i]; }
  return BOTS[BOTS.length - 1];
}
