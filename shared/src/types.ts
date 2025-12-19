export type ClientEvent =
  | 'joinLobby'
  | 'submitGuess'
  | 'startGame'
  | 'startDrawing'
  | 'sendChat';

export type ServerEvent =
  | 'playerJoined'
  | 'gameStarted'
  | 'roundUpdated'
  | 'scoreUpdated'
  | 'chatMessage';

export interface Player {
  id: string;
  name: string;
  score: number;
  isDrawing: boolean;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  message: string;
  timestamp: string;
}

export interface WordHint {
  revealedLetters: string;
  remainingLetters: number;
}

export interface RoundState {
  round: number;
  totalRounds: number;
  currentWord: string;
  hint: WordHint;
  timeRemainingSeconds: number;
}

export interface GameState {
  lobbyCode: string;
  phase: 'lobby' | 'drawing' | 'guessing' | 'roundEnd' | 'gameOver';
  players: Player[];
  round: RoundState;
  chat: ChatMessage[];
}

export interface ClientEventPayloads {
  joinLobby: { playerName: string; lobbyCode: string };
  submitGuess: { guess: string };
  startGame: { lobbyCode: string };
  startDrawing: { word: string };
  sendChat: { message: string };
}

export interface ServerEventPayloads {
  playerJoined: { player: Player };
  gameStarted: { lobbyCode: string; totalRounds: number; state: GameState };
  roundUpdated: { state: GameState };
  scoreUpdated: { playerId: string; score: number };
  chatMessage: { message: ChatMessage };
}

export interface EventEnvelope<TEvent extends string, TPayloads extends Record<TEvent, unknown>> {
  event: TEvent;
  payload: TPayloads[TEvent];
}

export type ClientMessage = EventEnvelope<ClientEvent, ClientEventPayloads>;

export type ServerMessage = EventEnvelope<ServerEvent, ServerEventPayloads>;

export interface LobbySnapshot {
  lobbyCode: string;
  players: Player[];
  status: GameState['phase'];
}
