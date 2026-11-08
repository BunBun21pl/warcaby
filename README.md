# Warcaby Arena

Strona w stylu chess.com, ale z warcabami i samymi botami. Boty nie używają AI –
liczą warianty klasycznym algorytmem minimax z alfa-beta i ręcznie napisaną oceną pozycji.

## Podstrony
- `index.html` – lobby: partia rankingowa, lista botów do gry towarzyskiej, ostatnie partie
- `play.html` – plansza (`?mode=ranked` albo `?mode=casual&bot=ID&color=white|black`)
- `profil.html` – nick, awatar, statystyki, wykres Elo, historia partii z zapisem ruchów
- `ranking.html` – ranking botów i graczy
- `zasady.html` – zasady gry i opis działania botów
- `login.html` – logowanie, rejestracja, gra jako gość

## Boty
- 20 stałych bywalców (`js/bots.js`) o Elo od 400 do 2300
- losowi goście (`js/random-bots.js`): losowa nazwa, awatar, Elo, styl i wagi oceny pozycji.
  Bot powstaje z ziarna, więc jego id (np. `r1a2b3c-tv`) zawsze odtwarza tego samego bota
  (historia, rewanż, rozliczenie porzuconej partii). Lista gości w lobby zmienia się co godzinę.
- w partii rankingowej 60% przeciwników to losowi goście z Elo wylosowanym wokół Twojego
  (`RANDOM_SHARE` w `js/bots.js`), reszta to stali bywalcy

## Aplikacja (PWA)
- `manifest.webmanifest`, `sw.js` i ikony w `icons/` pozwalają zainstalować stronę jak aplikację
- przycisk „Zainstaluj aplikację” pojawia się w pasku, gdy przeglądarka na to pozwala (Chrome, Edge,
  Android); na iPhonie: Safari → Udostępnij → Do ekranu początkowego
- instalacja wymaga HTTPS, a GitHub Pages to zapewnia
- **po każdej zmianie plików podbij `VERSION` w `sw.js`** (np. `wa-v3`), inaczej przeglądarka może
  pokazywać starą wersję z pamięci podręcznej; nowe pliki JS dopisz też do listy `SHELL`

## Ranking
- start: 800 Elo, pierwsze 20 partii to kalibracja (K=40), potem K=24, od 60 partii K=16
- w partii rankingowej przeciwnik jest losowany w okolicach Twojego Elo (±~100) i ukryty do końca partii
- kolor pionów jest losowy
- zamknięcie strony w trakcie partii rankingowej = porażka (liczona przy następnym wejściu)

## Uruchomienie bez Firebase
Strona działa od razu w trybie lokalnym (dane w localStorage). Musi być serwowana przez HTTP,
np. `npx serve` albo `python -m http.server` – otwarcie pliku dwuklikiem nie zadziała (moduły JS).

## Firebase
1. https://console.firebase.google.com → Dodaj projekt.
2. **Authentication** → Sign-in method → włącz **E-mail/hasło** i **Anonimowe**.
3. **Authentication → Settings → Authorized domains** → dodaj `TWOJ-LOGIN.github.io`.
4. **Firestore Database** → Utwórz bazę → zakładka **Reguły** → wklej zawartość `firestore.rules` → Opublikuj.
5. Ustawienia projektu → Twoje aplikacje → ikona `</>` → skopiuj `firebaseConfig` do `js/firebase-config.js`.

## GitHub Pages
1. Utwórz repozytorium i wrzuć wszystkie pliki (index.html ma być w głównym katalogu).
2. Settings → Pages → Source: `Deploy from a branch`, gałąź `main`, folder `/ (root)`.
3. Po chwili strona będzie pod `https://TWOJ-LOGIN.github.io/NAZWA-REPO/`.

Uwaga: cała logika działa w przeglądarce, więc ktoś obeznany technicznie mógłby
"podkręcić" sobie Elo. Do gry dla siebie to bez znaczenia.
