import { chooseMove } from './bot.js';
self.onmessage = e => {
  const { board, side, elo, style } = e.data;
  self.postMessage(chooseMove(board, side, elo, style));
};
