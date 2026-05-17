import { Chess } from "chess.js";
import mongoose from "mongoose";

// ─── CHESS SCHEMA ───────────────────────────────────────────
const chessSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  fen: { type: String, default: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
  white: { type: String },
  black: { type: String },
  vsBot: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  challenge: { type: Object, default: null },
});
const ChessGame = mongoose.models.ChessGame || mongoose.model("ChessGame", chessSchema);

// ─── TTT SCHEMA ─────────────────────────────────────────────
const tttSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  board: { type: [String], default: ["1","2","3","4","5","6","7","8","9"] },
  players: { type: Object, default: {} },
  currentTurn: { type: String, default: "" },
  active: { type: Boolean, default: false },
  challenge: { type: Object, default: null },
});
const TTTGame = mongoose.models.TTTGame || mongoose.model("TTTGame", tttSchema);

// ─── CONNECT 4 SCHEMA ───────────────────────────────────────
const c4Schema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  board: { type: [[String]], default: () => Array(6).fill(null).map(() => Array(7).fill("⚫")) },
  players: { type: Object, default: {} },
  currentTurn: { type: String, default: "" },
  active: { type: Boolean, default: false },
  challenge: { type: Object, default: null },
});
const C4Game = mongoose.models.C4Game || mongoose.model("C4Game", c4Schema);

// ─── CHESS HELPERS ──────────────────────────────────────────
const getBoardImage = (fen) => `https://fen2image.chessvision.ai/${encodeURIComponent(fen)}`;

const getBotMove = (chess) => {
  const moves = chess.moves();
  return moves.length ? moves[Math.floor(Math.random() * moves.length)] : null;
};

// ─── TTT HELPERS ────────────────────────────────────────────
const renderTTT = (board) => {
  const b = board.map(c => c === "X" ? "❌" : c === "O" ? "⭕" : `${c}️⃣`);
  return `${b[0]} | ${b[1]} | ${b[2]}\n—————————\n${b[3]} | ${b[4]} | ${b[5]}\n—————————\n${b[6]} | ${b[7]} | ${b[8]}`;
};

const checkTTT = (board) => {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of wins) {
    if (board[a] === board[b] && board[b] === board[c] && (board[a] === "X" || board[a] === "O")) return board[a];
  }
  return board.every(c => c === "X" || c === "O") ? "draw" : null;
};

// ─── CONNECT 4 HELPERS ──────────────────────────────────────
const renderC4 = (board) => {
  return board.map(row => row.join("")).join("\n") + "\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣";
};

const dropC4 = (board, col, disc) => {
  for (let row = 5; row >= 0; row--) {
    if (board[row][col] === "⚫") {
      board[row][col] = disc;
      return true;
    }
  }
  return false;
};

const checkC4 = (board, disc) => {
  // Horizontal
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 4; c++)
      if ([0,1,2,3].every(i => board[r][c+i] === disc)) return true;
  // Vertical
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 7; c++)
      if ([0,1,2,3].every(i => board[r+i][c] === disc)) return true;
  // Diagonal
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++)
      if ([0,1,2,3].every(i => board[r+i][c+i] === disc)) return true;
  for (let r = 3; r < 6; r++)
    for (let c = 0; c < 4; c++)
      if ([0,1,2,3].every(i => board[r-i][c+i] === disc)) return true;
  return false;
};

export default {
  name: "games",
  alias: ["chess", "ttt", "c4"],
  uniquecommands: ["chess", "ttt", "c4"],
  description: "Games - Chess, Tic Tac Toe, Connect 4",
  start: async (Atlas, m, { prefix, inputCMD, doReact, args, mentionByTag }) => {
    if (!m.isGroup) return m.reply("Games can only be played in groups!");
    const groupId = m.from;
    const sender = m.sender;

    // ═══════════════════════════════════════════════════════
    // CHESS
    // ═══════════════════════════════════════════════════════
    if (inputCMD === "chess") {
      await doReact("♟️");
      const subCmd = args[0]?.toLowerCase();

      switch (subCmd) {
        case "start": {
          const existing = await ChessGame.findOne({ groupId, active: true });
          if (existing) return m.reply("❌ A chess game is already active! Use `-chess end` to end it.");
          const opponent = args[1]?.toLowerCase();
          const vsBot = opponent === "bot";
          const challenger = mentionByTag?.[0];
          if (!vsBot && !challenger) return m.reply(`Usage:\n▪️ *${prefix}chess start bot*\n▪️ *${prefix}chess start @user*`);

          if (vsBot) {
            const chess = new Chess();
            await ChessGame.findOneAndUpdate({ groupId }, { fen: chess.fen(), white: sender, black: "BOT", vsBot: true, active: true, challenge: null }, { upsert: true });
            await Atlas.sendMessage(m.from, {
              image: { url: getBoardImage(chess.fen()) },
              caption: `♟️ *Chess Match Started!*\n\nWhite: @${sender.split("@")[0]}\nBlack: BOT\nTurn: @${sender.split("@")[0]} (White)\n\nMake moves:\n• Coordinates: e2e4\n• SAN: Nf3, O-O\n• *${prefix}chess resign* to resign\n• *${prefix}chess board* to see board`,
              mentions: [sender],
            }, { quoted: m });
          } else {
            await ChessGame.findOneAndUpdate({ groupId }, { active: false, challenge: { from: sender, to: challenger } }, { upsert: true });
            await Atlas.sendMessage(m.from, {
              text: `♟️ *Chess Challenge!*\n\n@${sender.split("@")[0]} challenges @${challenger.split("@")[0]}!\n\nReply *${prefix}chess accept* or *${prefix}chess decline*`,
              mentions: [sender, challenger],
            }, { quoted: m });
          }
          break;
        }

        case "accept": {
          const game = await ChessGame.findOne({ groupId });
          if (!game?.challenge) return m.reply("❌ No pending chess challenge!");
          if (game.challenge.to !== sender) return m.reply("❌ This challenge is not for you!");
          const chess = new Chess();
          await ChessGame.findOneAndUpdate({ groupId }, { fen: chess.fen(), white: game.challenge.from, black: sender, vsBot: false, active: true, challenge: null });
          await Atlas.sendMessage(m.from, {
            image: { url: getBoardImage(chess.fen()) },
            caption: `♟️ *Chess Match Started!*\n\nWhite: @${game.challenge.from.split("@")[0]}\nBlack: @${sender.split("@")[0]}\nTurn: @${game.challenge.from.split("@")[0]} (White)\n\nMake moves e.g. *${prefix}chess e2e4*`,
            mentions: [game.challenge.from, sender],
          }, { quoted: m });
          break;
        }

        case "decline": {
          const game = await ChessGame.findOne({ groupId });
          if (!game?.challenge || game.challenge.to !== sender) return m.reply("❌ No challenge for you!");
          await ChessGame.findOneAndUpdate({ groupId }, { challenge: null });
          m.reply(`❌ @${sender.split("@")[0]} declined the chess challenge!`);
          break;
        }

        case "resign": {
          const game = await ChessGame.findOne({ groupId, active: true });
          if (!game) return m.reply("❌ No active chess game!");
          if (game.white !== sender && game.black !== sender) return m.reply("❌ You are not in this game!");
          const winner = game.white === sender ? game.black : game.white;
          await ChessGame.findOneAndUpdate({ groupId }, { active: false });
          await Atlas.sendMessage(m.from, {
            text: `🏳️ @${sender.split("@")[0]} resigned!\n🏆 ${winner === "BOT" ? "BOT" : `@${winner.split("@")[0]}`} wins!`,
            mentions: winner === "BOT" ? [sender] : [sender, winner],
          }, { quoted: m });
          break;
        }

        case "end": {
          await ChessGame.findOneAndUpdate({ groupId }, { active: false, challenge: null });
          m.reply("♟️ Chess game ended!");
          break;
        }

        case "board": {
          const game = await ChessGame.findOne({ groupId, active: true });
          if (!game) return m.reply("❌ No active chess game!");
          const chess = new Chess(game.fen);
          const turnPlayer = chess.turn() === "w" ? game.white : game.black;
          await Atlas.sendMessage(m.from, {
            image: { url: getBoardImage(chess.fen()) },
            caption: `♟️ Current board\nTurn: ${turnPlayer === "BOT" ? "BOT" : `@${turnPlayer.split("@")[0]}`} (${chess.turn() === "w" ? "White" : "Black"})`,
            mentions: turnPlayer === "BOT" ? [] : [turnPlayer],
          }, { quoted: m });
          break;
        }

        default: {
          const move = args.join("").trim();
          if (!move) return m.reply(`♟️ *Chess Commands:*\n\n▪️ *${prefix}chess start bot*\n▪️ *${prefix}chess start @user*\n▪️ *${prefix}chess accept/decline*\n▪️ *${prefix}chess e2e4* — make move\n▪️ *${prefix}chess board*\n▪️ *${prefix}chess resign*`);

          const game = await ChessGame.findOne({ groupId, active: true });
          if (!game) return m.reply("❌ No active chess game!");
          const chess = new Chess(game.fen);
          const currentPlayer = chess.turn() === "w" ? game.white : game.black;
          if (currentPlayer !== sender) return m.reply("❌ It's not your turn!");

          let result;
          try { result = chess.move(move); } catch {}
          if (!result && move.length >= 4) {
            try { result = chess.move({ from: move.slice(0,2), to: move.slice(2,4), promotion: move[4] || "q" }); } catch {}
          }
          if (!result) return m.reply("❌ Invalid move! Try again.");

          let caption = `♟️ Move: *${result.san}*`;
          let gameOver = false;
          if (chess.isCheckmate()) { caption += `\n\n♟️ *CHECKMATE!* 🏆 @${sender.split("@")[0]} wins!`; gameOver = true; }
          else if (chess.isDraw()) { caption += `\n\n🤝 *DRAW!*`; gameOver = true; }
          else if (chess.isCheck()) caption += `\n\n⚠️ *CHECK!*`;

          if (gameOver) await ChessGame.findOneAndUpdate({ groupId }, { active: false });
          else {
            await ChessGame.findOneAndUpdate({ groupId }, { fen: chess.fen() });
            const next = chess.turn() === "w" ? game.white : game.black;
            caption += `\n\nTurn: ${next === "BOT" ? "BOT" : `@${next.split("@")[0]}`} (${chess.turn() === "w" ? "White" : "Black"})`;
          }

          await Atlas.sendMessage(m.from, { image: { url: getBoardImage(chess.fen()) }, caption, mentions: [sender] }, { quoted: m });

          // Bot move
          if (!gameOver && game.vsBot && chess.turn() === "b") {
            await new Promise(r => setTimeout(r, 1500));
            const botMove = getBotMove(chess);
            if (botMove) {
              chess.move(botMove);
              let botCaption = `🤖 BOT plays: *${botMove}*`;
              let botOver = false;
              if (chess.isCheckmate()) { botCaption += `\n\n♟️ *CHECKMATE!* 🏆 BOT wins!`; botOver = true; }
              else if (chess.isDraw()) { botCaption += `\n\n🤝 *DRAW!*`; botOver = true; }
              else if (chess.isCheck()) botCaption += `\n\n⚠️ *CHECK!*`;
              if (botOver) await ChessGame.findOneAndUpdate({ groupId }, { active: false });
              else { await ChessGame.findOneAndUpdate({ groupId }, { fen: chess.fen() }); botCaption += `\n\nTurn: @${game.white.split("@")[0]} (White)`; }
              await Atlas.sendMessage(m.from, { image: { url: getBoardImage(chess.fen()) }, caption: botCaption, mentions: [game.white] }, { quoted: m });
            }
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // TIC TAC TOE
    // ═══════════════════════════════════════════════════════
    else if (inputCMD === "ttt") {
      await doReact("🎮");
      const subCmd = args[0]?.toLowerCase();

      switch (subCmd) {
        case "start": {
          const existing = await TTTGame.findOne({ groupId, active: true });
          if (existing) return m.reply("❌ A TTT game is already active! Use `-ttt end` to end it.");
          const opponent = args[1]?.toLowerCase();
          const vsBot = opponent === "bot";
          const challenger = mentionByTag?.[0];
          if (!vsBot && !challenger) return m.reply(`Usage:\n▪️ *${prefix}ttt start bot*\n▪️ *${prefix}ttt start @user*`);

          if (vsBot) {
            const board = ["1","2","3","4","5","6","7","8","9"];
            await TTTGame.findOneAndUpdate({ groupId }, { board, players: { X: sender, O: "BOT" }, currentTurn: sender, active: true, challenge: null }, { upsert: true });
            m.reply(`🎮 *Tic Tac Toe Started!*\n\n❌: @${sender.split("@")[0]}\n⭕: BOT\n\n${renderTTT(board)}\n\nYour turn! Use *${prefix}ttt <1-9>* to place`);
          } else {
            await TTTGame.findOneAndUpdate({ groupId }, { active: false, challenge: { from: sender, to: challenger } }, { upsert: true });
            await Atlas.sendMessage(m.from, { text: `🎮 @${sender.split("@")[0]} challenges @${challenger.split("@")[0]} to Tic Tac Toe!\n\nReply *${prefix}ttt accept* or *${prefix}ttt decline*`, mentions: [sender, challenger] }, { quoted: m });
          }
          break;
        }

        case "accept": {
          const game = await TTTGame.findOne({ groupId });
          if (!game?.challenge || game.challenge.to !== sender) return m.reply("❌ No challenge for you!");
          const board = ["1","2","3","4","5","6","7","8","9"];
          await TTTGame.findOneAndUpdate({ groupId }, { board, players: { X: game.challenge.from, O: sender }, currentTurn: game.challenge.from, active: true, challenge: null });
          await Atlas.sendMessage(m.from, { text: `🎮 *Tic Tac Toe Started!*\n\n❌: @${game.challenge.from.split("@")[0]}\n⭕: @${sender.split("@")[0]}\n\n${renderTTT(board)}\n\nTurn: @${game.challenge.from.split("@")[0]}`, mentions: [game.challenge.from, sender] }, { quoted: m });
          break;
        }

        case "decline": {
          const game = await TTTGame.findOne({ groupId });
          if (!game?.challenge || game.challenge.to !== sender) return m.reply("❌ No challenge for you!");
          await TTTGame.findOneAndUpdate({ groupId }, { challenge: null });
          m.reply(`❌ @${sender.split("@")[0]} declined TTT challenge!`);
          break;
        }

        case "end": {
          await TTTGame.findOneAndUpdate({ groupId }, { active: false, challenge: null });
          m.reply("🎮 TTT game ended!");
          break;
        }

        default: {
          const pos = parseInt(args[0]);
          if (!pos || pos < 1 || pos > 9) return m.reply(`🎮 *TTT Commands:*\n\n▪️ *${prefix}ttt start bot*\n▪️ *${prefix}ttt start @user*\n▪️ *${prefix}ttt <1-9>* — place your piece\n▪️ *${prefix}ttt end*`);

          const game = await TTTGame.findOne({ groupId, active: true });
          if (!game) return m.reply("❌ No active TTT game!");
          if (game.currentTurn !== sender) return m.reply("❌ It's not your turn!");

          const board = [...game.board];
          const playerSymbol = game.players.X === sender ? "X" : "O";
          if (board[pos-1] === "X" || board[pos-1] === "O") return m.reply("❌ That spot is taken!");

          board[pos-1] = playerSymbol;
          const winner = checkTTT(board);

          if (winner === "draw") {
            await TTTGame.findOneAndUpdate({ groupId }, { active: false });
            return m.reply(`🎮 *TIC TAC TOE*\n\n${renderTTT(board)}\n\n🤝 *It's a draw!*`);
          }

          if (winner) {
            await TTTGame.findOneAndUpdate({ groupId }, { active: false });
            return await Atlas.sendMessage(m.from, { text: `🎮 *TIC TAC TOE*\n\n${renderTTT(board)}\n\n🏆 @${sender.split("@")[0]} wins!`, mentions: [sender] }, { quoted: m });
          }

          // Switch turn
          const nextPlayer = game.players.X === sender ? game.players.O : game.players.X;
          await TTTGame.findOneAndUpdate({ groupId }, { board, currentTurn: nextPlayer });

          const nextTag = nextPlayer === "BOT" ? "BOT" : `@${nextPlayer.split("@")[0]}`;
          await Atlas.sendMessage(m.from, { text: `🎮 *TIC TAC TOE*\n\n${renderTTT(board)}\n\nTurn: ${nextTag}`, mentions: nextPlayer === "BOT" ? [] : [nextPlayer] }, { quoted: m });

          // Bot move
          if (nextPlayer === "BOT") {
            await new Promise(r => setTimeout(r, 1000));
            const available = board.map((v,i) => v !== "X" && v !== "O" ? i : -1).filter(i => i !== -1);
            if (available.length) {
              const botPos = available[Math.floor(Math.random() * available.length)];
              board[botPos] = "O";
              const botWinner = checkTTT(board);
              if (botWinner === "draw") {
                await TTTGame.findOneAndUpdate({ groupId }, { active: false });
                return m.reply(`🎮 *TIC TAC TOE*\n\n${renderTTT(board)}\n\n🤝 *It's a draw!*`);
              }
              if (botWinner) {
                await TTTGame.findOneAndUpdate({ groupId }, { active: false });
                return m.reply(`🎮 *TIC TAC TOE*\n\n${renderTTT(board)}\n\n🤖 *BOT wins!*`);
              }
              await TTTGame.findOneAndUpdate({ groupId }, { board, currentTurn: sender });
              await Atlas.sendMessage(m.from, { text: `🎮 *TIC TAC TOE*\n\n${renderTTT(board)}\n\n🤖 BOT placed at ${botPos+1}\nTurn: @${sender.split("@")[0]}`, mentions: [sender] }, { quoted: m });
            }
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // CONNECT 4
    // ═══════════════════════════════════════════════════════
    else if (inputCMD === "c4") {
      await doReact("🔴");
      const subCmd = args[0]?.toLowerCase();

      switch (subCmd) {
        case "start": {
          const existing = await C4Game.findOne({ groupId, active: true });
          if (existing) return m.reply("❌ A Connect 4 game is already active! Use `-c4 end` to end it.");
          const opponent = args[1]?.toLowerCase();
          const vsBot = opponent === "bot";
          const challenger = mentionByTag?.[0];
          if (!vsBot && !challenger) return m.reply(`Usage:\n▪️ *${prefix}c4 start bot*\n▪️ *${prefix}c4 start @user*`);

          const board = Array(6).fill(null).map(() => Array(7).fill("⚫"));
          if (vsBot) {
            await C4Game.findOneAndUpdate({ groupId }, { board, players: { "🔴": sender, "🟡": "BOT" }, currentTurn: sender, active: true, challenge: null }, { upsert: true });
            m.reply(`🔴 *Connect 4 Started!*\n\n🔴: @${sender.split("@")[0]}\n🟡: BOT\n\n${renderC4(board)}\n\nUse *${prefix}c4 <1-7>* to drop your disc!`);
          } else {
            await C4Game.findOneAndUpdate({ groupId }, { active: false, challenge: { from: sender, to: challenger } }, { upsert: true });
            await Atlas.sendMessage(m.from, { text: `🔴 @${sender.split("@")[0]} challenges @${challenger.split("@")[0]} to Connect 4!\n\nReply *${prefix}c4 accept* or *${prefix}c4 decline*`, mentions: [sender, challenger] }, { quoted: m });
          }
          break;
        }

        case "accept": {
          const game = await C4Game.findOne({ groupId });
          if (!game?.challenge || game.challenge.to !== sender) return m.reply("❌ No challenge for you!");
          const board = Array(6).fill(null).map(() => Array(7).fill("⚫"));
          await C4Game.findOneAndUpdate({ groupId }, { board, players: { "🔴": game.challenge.from, "🟡": sender }, currentTurn: game.challenge.from, active: true, challenge: null });
          await Atlas.sendMessage(m.from, { text: `🔴 *Connect 4 Started!*\n\n🔴: @${game.challenge.from.split("@")[0]}\n🟡: @${sender.split("@")[0]}\n\n${renderC4(board)}\n\nTurn: @${game.challenge.from.split("@")[0]}`, mentions: [game.challenge.from, sender] }, { quoted: m });
          break;
        }
case "decline": {
          const game = await C4Game.findOne({ groupId });
          if (!game?.challenge || game.challenge.to !== sender) return m.reply("❌ No challenge for you!");
          await C4Game.findOneAndUpdate({ groupId }, { challenge: null });
          m.reply(`❌ Challenge declined!`);
          break;
        }

        case "end": {
          await C4Game.findOneAndUpdate({ groupId }, { active: false, challenge: null });
          m.reply("🔴 Connect 4 game ended!");
          break;
        }

        default: {
          const col = parseInt(args[0]) - 1;
          if (isNaN(col) || col < 0 || col > 6) return m.reply(`🔴 *Connect 4 Commands:*\n\n▪️ *${prefix}c4 start bot*\n▪️ *${prefix}c4 start @user*\n▪️ *${prefix}c4 <1-7>* — drop disc\n▪️ *${prefix}c4 end*`);

          const game = await C4Game.findOne({ groupId, active: true });
          if (!game) return m.reply("❌ No active Connect 4 game!");
          if (game.currentTurn !== sender) return m.reply("❌ It's not your turn!");

          const disc = game.players["🔴"] === sender ? "🔴" : "🟡";
          const board = game.board;
          if (!dropC4(board, col, disc)) return m.reply("❌ That column is full!");

          if (checkC4(board, disc)) {
            await C4Game.findOneAndUpdate({ groupId }, { active: false });
            return await Atlas.sendMessage(m.from, { text: `🔴 *CONNECT 4*\n\n${renderC4(board)}\n\n🏆 @${sender.split("@")[0]} wins!`, mentions: [sender] }, { quoted: m });
          }

          const nextPlayer = game.players["🔴"] === sender ? game.players["🟡"] : game.players["🔴"];
          await C4Game.findOneAndUpdate({ groupId }, { board, currentTurn: nextPlayer });
          const nextTag = nextPlayer === "BOT" ? "BOT" : `@${nextPlayer.split("@")[0]}`;
          await Atlas.sendMessage(m.from, { text: `🔴 *CONNECT 4*\n\n${renderC4(board)}\n\nTurn: ${nextTag}`, mentions: nextPlayer === "BOT" ? [] : [nextPlayer] }, { quoted: m });

          // Bot move
          if (nextPlayer === "BOT") {
            await new Promise(r => setTimeout(r, 1000));
            const available = [0,1,2,3,4,5,6].filter(c => board[0][c] === "⚫");
            if (available.length) {
              const botCol = available[Math.floor(Math.random() * available.length)];
              dropC4(board, botCol, "🟡");
              if (checkC4(board, "🟡")) {
                await C4Game.findOneAndUpdate({ groupId }, { active: false });
                return m.reply(`🔴 *CONNECT 4*\n\n${renderC4(board)}\n\n🤖 *BOT wins!*`);
              }
              await C4Game.findOneAndUpdate({ groupId }, { board, currentTurn: sender });
              await Atlas.sendMessage(m.from, { text: `🔴 *CONNECT 4*\n\n${renderC4(board)}\n\n🤖 BOT drops in column ${botCol+1}\nTurn: @${sender.split("@")[0]}`, mentions: [sender] }, { quoted: m });
            }
          }
        }
      }
    }
  },
};