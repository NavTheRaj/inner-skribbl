import {
  ChatMessage,
  ClientEventPayloads,
  ClientMessage,
  GameState,
  Player,
  ServerMessage
} from '@inner-skribbl/shared';

const baseState: GameState = {
  lobbyCode: 'PAINT',
  phase: 'lobby',
  players: [],
  round: {
    round: 0,
    totalRounds: 3,
    currentWord: '',
    hint: { revealedLetters: '', remainingLetters: 0 },
    timeRemainingSeconds: 0
  },
  chat: []
};

let gameState: GameState = baseState;

function broadcast(messages: ServerMessage[]) {
  messages.forEach((message) => console.log('Broadcasting', message));
}

function handleClientMessage(message: ClientMessage): ServerMessage[] {
  const payload: ClientEventPayloads[typeof message.event] = message.payload;

  switch (message.event) {
    case 'joinLobby': {
      const player: Player = {
        id: `player-${gameState.players.length + 1}`,
        name: payload.playerName,
        score: 0,
        isDrawing: false
      };

      gameState = { ...gameState, players: [...gameState.players, player] };

      return [{ event: 'playerJoined', payload: { player } }];
    }
    case 'submitGuess': {
      const nextScore = (gameState.players[0]?.score ?? 0) + 50;
      const firstPlayer = gameState.players[0];

      if (!firstPlayer) {
        return [];
      }

      const updatedPlayers = gameState.players.map((player) =>
        player.id === firstPlayer.id ? { ...player, score: nextScore } : player
      );

      gameState = {
        ...gameState,
        chat: [...gameState.chat, createChat(payload.guess)],
        players: updatedPlayers
      };

      return [
        { event: 'chatMessage', payload: { message: gameState.chat.at(-1)! } },
        { event: 'scoreUpdated', payload: { playerId: firstPlayer.id, score: nextScore } }
      ];
    }
    case 'startGame': {
      gameState = { ...gameState, phase: 'drawing', round: { ...gameState.round, round: 1 } };
      return [
        {
          event: 'gameStarted',
          payload: {
            lobbyCode: gameState.lobbyCode,
            totalRounds: gameState.round.totalRounds,
            state: gameState
          }
        }
      ];
    }
    case 'startDrawing':
      gameState = {
        ...gameState,
        round: {
          ...gameState.round,
          currentWord: payload.word,
          hint: { ...gameState.round.hint, remainingLetters: payload.word.length }
        }
      };

      return [{ event: 'roundUpdated', payload: { state: gameState } }];
    case 'sendChat': {
      gameState = { ...gameState, chat: [...gameState.chat, createChat(payload.message)] };
      return [{ event: 'chatMessage', payload: { message: gameState.chat.at(-1)! } }];
    }
    default: {
      const exhaustiveCheck: never = message.event;
      throw new Error(`Unhandled client event: ${exhaustiveCheck}`);
    }
  }
}

function createChat(message: string): ChatMessage {
  return {
    id: `chat-${gameState.chat.length + 1}`,
    authorId: gameState.players[0]?.id ?? 'system',
    authorName: gameState.players[0]?.name ?? 'System',
    message,
    timestamp: new Date().toISOString()
  };
}

const joinEvents = handleClientMessage({
  event: 'joinLobby',
  payload: { lobbyCode: gameState.lobbyCode, playerName: 'Host' }
});

broadcast(joinEvents);

const gameStartEvents = handleClientMessage({
  event: 'startGame',
  payload: { lobbyCode: gameState.lobbyCode }
});

broadcast(gameStartEvents);

const drawingEvents = handleClientMessage({ event: 'startDrawing', payload: { word: 'tree' } });

broadcast(drawingEvents);

const guessEvents = handleClientMessage({ event: 'submitGuess', payload: { guess: 'tree' } });

broadcast(guessEvents);
