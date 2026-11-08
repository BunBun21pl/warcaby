export const START_ELO = 800;
export const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
// Pierwsze 20 partii to okres kalibracji: ranking zmienia się szybciej
export const kFactor = games => (games < 20 ? 40 : games < 60 ? 24 : 16);
export const newRating = (r, opp, score, games) =>
  Math.max(100, Math.round(r + kFactor(games) * (score - expected(r, opp))));
