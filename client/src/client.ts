import {
  ClientMessage,
  GameState,
  LobbySnapshot,
  ServerMessage,
  ServerEventPayloads
} from '@inner-skribbl/shared';

const lobby: LobbySnapshot = {
  lobbyCode: 'PAINT',
  players: [],
  status: 'lobby'
};

let currentState: GameState = {
  lobbyCode: lobby.lobbyCode,
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

function handleServerMessage(message: ServerMessage) {
  const payload: ServerEventPayloads[typeof message.event] = message.payload;

  switch (message.event) {
    case 'playerJoined':
      currentState = { ...currentState, players: [...currentState.players, payload.player] };
      break;
    case 'gameStarted':
      currentState = payload.state;
      break;
    case 'roundUpdated':
      currentState = payload.state;
      break;
    case 'scoreUpdated':
      currentState = {
        ...currentState,
        players: currentState.players.map((player) =>
          player.id === payload.playerId ? { ...player, score: payload.score } : player
        )
      };
      break;
    case 'chatMessage':
      currentState = { ...currentState, chat: [...currentState.chat, payload.message] };
      break;
    default:
      // Exhaustive switch for future server events.
      const exhaustiveCheck: never = message.event;
      throw new Error(`Unhandled server event: ${exhaustiveCheck}`);
  }
}

function mockSend(event: ClientMessage) {
  console.log('Sending to server', event);
}

function joinLobby(playerName: string) {
  const joinMessage: ClientMessage = {
    event: 'joinLobby',
    payload: { lobbyCode: lobby.lobbyCode, playerName }
  };

  mockSend(joinMessage);
}

function submitGuess(guess: string) {
  const guessMessage: ClientMessage = { event: 'submitGuess', payload: { guess } };
  mockSend(guessMessage);
}

handleServerMessage({
  event: 'gameStarted',
  payload: { lobbyCode: lobby.lobbyCode, totalRounds: 3, state: currentState }
});

joinLobby('Player One');
submitGuess('tree');

console.log('Client state', currentState);
