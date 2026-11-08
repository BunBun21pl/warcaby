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
