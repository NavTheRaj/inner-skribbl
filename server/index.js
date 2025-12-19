const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { randomUUID } = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const WORD_OPTIONS = [
  'apple',
  'mountain',
  'river',
  'spaceship',
  'library',
  'puzzle',
  'dragon',
  'forest',
  'guitar',
  'umbrella',
];

const rooms = new Map();

function createRoom({ name = 'New Room', maxRounds = 3, roundTime = 75 }) {
  const id = randomUUID();
  const room = {
    id,
    name,
    settings: {
      maxRounds: Number(maxRounds) || 3,
      roundTime: Number(roundTime) || 75,
      wordOptionsPerTurn: 3,
      wordChoiceTime: 15,
      intermission: 3,
    },
    players: new Map(),
    state: 'waiting', // waiting, choosing, drawing, finished
    round: 0,
    turnIndex: null,
    hasStarted: false,
    currentDrawerId: null,
    currentWord: null,
    wordChoices: [],
    guessedPlayers: new Set(),
    timers: {
      wordChoice: null,
      round: null,
      intermission: null,
    },
  };
  rooms.set(id, room);
  return room;
}

function findRoom(roomId) {
  return rooms.get(roomId);
}

function serializeRoom(room, includeWordForDrawer = false, drawerId = null) {
  return {
    id: room.id,
    name: room.name,
    settings: room.settings,
    state: room.state,
    round: room.round,
    currentDrawerId: room.currentDrawerId,
    players: Array.from(room.players.values()).map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      ready: player.ready,
    })),
    currentWord:
      includeWordForDrawer && drawerId === room.currentDrawerId
        ? room.currentWord
        : null,
  };
}

function cleanupRoomTimers(room) {
  Object.values(room.timers).forEach((timer) => {
    if (timer) {
      clearTimeout(timer);
    }
  });
  room.timers.wordChoice = null;
  room.timers.round = null;
  room.timers.intermission = null;
}

function removePlayerFromRoom(room, playerId) {
  if (!room || !room.players.has(playerId)) return;
  room.players.delete(playerId);
  room.guessedPlayers.delete(playerId);
  if (room.players.size === 0) {
    cleanupRoomTimers(room);
    rooms.delete(room.id);
  }
}

function broadcastRoom(room) {
  if (!room) return;
  io.to(room.id).emit('room_updated', serializeRoom(room));
}

function startIntermission(room) {
  cleanupRoomTimers(room);
  room.state = 'intermission';
  io.to(room.id).emit('round_ended', {
    round: room.round,
    currentDrawerId: room.currentDrawerId,
    word: room.currentWord,
  });

  room.timers.intermission = setTimeout(() => {
    advanceTurn(room.id);
  }, room.settings.intermission * 1000);
}

function finishGame(room) {
  cleanupRoomTimers(room);
  room.state = 'finished';
  io.to(room.id).emit('game_finished', serializeRoom(room));
}

function startRound(room, word) {
  cleanupRoomTimers(room);
  room.currentWord = word;
  room.state = 'drawing';
  room.guessedPlayers = new Set();

  io.to(room.currentDrawerId).emit('drawer_word', { word });
  io.to(room.id).emit('round_started', {
    round: room.round,
    currentDrawerId: room.currentDrawerId,
  });
  broadcastRoom(room);

  room.timers.round = setTimeout(() => {
    startIntermission(room);
  }, room.settings.roundTime * 1000);
}

function sendWordChoices(room) {
  cleanupRoomTimers(room);
  room.state = 'choosing';
  const shuffled = [...WORD_OPTIONS].sort(() => Math.random() - 0.5);
  room.wordChoices = shuffled.slice(0, room.settings.wordOptionsPerTurn);
  io.to(room.currentDrawerId).emit('word_options', room.wordChoices);
  room.timers.wordChoice = setTimeout(() => {
    const fallbackWord = room.wordChoices[0] || WORD_OPTIONS[0];
    startRound(room, fallbackWord);
  }, room.settings.wordChoiceTime * 1000);
}

function advanceTurn(roomId) {
  const room = findRoom(roomId);
  if (!room) return;
  const playerIds = Array.from(room.players.keys());
  if (playerIds.length === 0) {
    rooms.delete(roomId);
    return;
  }

  if (room.turnIndex === null || room.turnIndex >= playerIds.length - 1) {
    room.turnIndex = 0;
    if (room.hasStarted) {
      room.round += 1;
    } else {
      room.round = 1;
    }
    room.hasStarted = true;
  } else {
    room.turnIndex += 1;
  }

  if (room.round > room.settings.maxRounds) {
    finishGame(room);
    broadcastRoom(room);
    return;
  }

  room.currentDrawerId = playerIds[room.turnIndex];
  room.currentWord = null;
  room.state = 'choosing';
  sendWordChoices(room);
  broadcastRoom(room);
}

function resetRoom(room) {
  cleanupRoomTimers(room);
  room.state = 'waiting';
  room.round = 0;
  room.turnIndex = null;
  room.hasStarted = false;
  room.currentDrawerId = null;
  room.currentWord = null;
  room.wordChoices = [];
  room.guessedPlayers = new Set();
  room.players.forEach((player) => {
    player.ready = false;
    player.score = 0;
  });
  broadcastRoom(room);
}

function validateRoomAvailability(room, ack) {
  if (!room) {
    ack?.({ error: 'Room not found' });
    return false;
  }
  if (room.state === 'finished') {
    ack?.({ error: 'Game has already finished' });
    return false;
  }
  return true;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/rooms', (req, res) => {
  const list = Array.from(rooms.values()).map((room) => serializeRoom(room));
  res.json({ rooms: list });
});

app.post('/rooms', (req, res) => {
  const { name, maxRounds, roundTime } = req.body || {};
  if (maxRounds !== undefined && (!Number.isFinite(Number(maxRounds)) || Number(maxRounds) <= 0)) {
    return res.status(400).json({ error: 'maxRounds must be a positive number' });
  }
  if (roundTime !== undefined && (!Number.isFinite(Number(roundTime)) || Number(roundTime) <= 0)) {
    return res.status(400).json({ error: 'roundTime must be a positive number' });
  }
  const room = createRoom({ name, maxRounds, roundTime });
  res.status(201).json({ room: serializeRoom(room) });
});

app.get('/rooms/:roomId', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ room: serializeRoom(room) });
});

app.post('/rooms/:roomId/reset', (req, res) => {
  const room = findRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  resetRoom(room);
  res.json({ room: serializeRoom(room) });
});

io.on('connection', (socket) => {
  socket.on('join_room', (payload = {}, ack) => {
    const { roomId, playerName } = payload;
    const room = findRoom(roomId);
    if (!room) {
      return ack?.({ error: 'Room not found' });
    }
    const name = typeof playerName === 'string' && playerName.trim().length > 0 ? playerName.trim() : 'Player';
    room.players.set(socket.id, {
      id: socket.id,
      name,
      score: 0,
      ready: false,
    });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = socket.id;
    broadcastRoom(room);
    ack?.({ room: serializeRoom(room) });
  });

  socket.on('leave_room', (payload = {}, ack) => {
    const { roomId } = payload;
    const room = findRoom(roomId);
    if (room) {
      removePlayerFromRoom(room, socket.id);
      broadcastRoom(room);
    }
    socket.leave(roomId);
    ack?.({});
  });

  socket.on('set_ready', (payload = {}, ack) => {
    const { roomId, ready } = payload;
    const room = findRoom(roomId);
    if (!validateRoomAvailability(room, ack)) return;
    const player = room.players.get(socket.id);
    if (!player) {
      return ack?.({ error: 'Player not in room' });
    }
    player.ready = Boolean(ready);
    broadcastRoom(room);
    ack?.({ room: serializeRoom(room) });
  });

  socket.on('start_game', (payload = {}, ack) => {
    const { roomId } = payload;
    const room = findRoom(roomId);
    if (!validateRoomAvailability(room, ack)) return;
    if (room.state !== 'waiting') {
      return ack?.({ error: 'Game already in progress' });
    }
    if (room.players.size < 2) {
      return ack?.({ error: 'At least two players are required' });
    }
    const allReady = Array.from(room.players.values()).every((p) => p.ready);
    if (!allReady) {
      return ack?.({ error: 'All players must be ready to start' });
    }
    room.state = 'choosing';
    room.round = 0;
    room.turnIndex = null;
    room.hasStarted = false;
    advanceTurn(roomId);
    ack?.({ room: serializeRoom(room) });
  });

  socket.on('choose_word', (payload = {}, ack) => {
    const { roomId, word } = payload;
    const room = findRoom(roomId);
    if (!validateRoomAvailability(room, ack)) return;
    if (room.currentDrawerId !== socket.id) {
      return ack?.({ error: 'Only the current drawer can choose a word' });
    }
    if (room.state !== 'choosing') {
      return ack?.({ error: 'Not accepting word choices right now' });
    }
    const chosenWord = typeof word === 'string' ? word.trim().toLowerCase() : '';
    const validChoice = room.wordChoices.map((w) => w.toLowerCase()).includes(chosenWord);
    if (!validChoice) {
      return ack?.({ error: 'Invalid word choice' });
    }
    startRound(room, word);
    ack?.({});
  });

  socket.on('drawing', (payload = {}) => {
    const { roomId, stroke } = payload;
    const room = findRoom(roomId);
    if (!room || room.state !== 'drawing' || room.currentDrawerId !== socket.id) return;
    socket.to(roomId).emit('drawing', { stroke });
  });

  socket.on('guess', (payload = {}, ack) => {
    const { roomId, text } = payload;
    const room = findRoom(roomId);
    if (!validateRoomAvailability(room, ack)) return;
    if (room.state !== 'drawing') {
      return ack?.({ error: 'No active round' });
    }
    const player = room.players.get(socket.id);
    if (!player) {
      return ack?.({ error: 'Player not in room' });
    }
    if (socket.id === room.currentDrawerId) {
      return ack?.({ error: 'Drawer cannot guess' });
    }
    const guessText = typeof text === 'string' ? text.trim() : '';
    if (!guessText) {
      return ack?.({ error: 'Guess text is required' });
    }
    const normalizedGuess = guessText.toLowerCase();
    const normalizedWord = (room.currentWord || '').toLowerCase();
    const correct = normalizedGuess === normalizedWord;

    if (correct && !room.guessedPlayers.has(socket.id)) {
      room.guessedPlayers.add(socket.id);
      player.score += 100;
      const drawer = room.players.get(room.currentDrawerId);
      if (drawer) drawer.score += 50;
      io.to(room.id).emit('guess_result', { playerId: socket.id, correct: true });
      broadcastRoom(room);
      const nonDrawerCount = room.players.size - 1;
      if (room.guessedPlayers.size >= nonDrawerCount) {
        startIntermission(room);
      }
    } else {
      io.to(room.id).emit('guess_result', { playerId: socket.id, correct: false, guess: guessText });
    }
    ack?.({ correct });
  });

  socket.on('skip_turn', (payload = {}, ack) => {
    const { roomId } = payload;
    const room = findRoom(roomId);
    if (!validateRoomAvailability(room, ack)) return;
    if (room.currentDrawerId !== socket.id) {
      return ack?.({ error: 'Only the current drawer can skip' });
    }
    startIntermission(room);
    ack?.({});
  });

  socket.on('disconnect', () => {
    const { roomId } = socket.data;
    if (!roomId) return;
    const room = findRoom(roomId);
    if (!room) return;
    const wasDrawer = room.currentDrawerId === socket.id;
    removePlayerFromRoom(room, socket.id);
    if (room.players.size === 0) {
      rooms.delete(roomId);
      return;
    }
    if (wasDrawer && room.state === 'drawing') {
      startIntermission(room);
    } else {
      broadcastRoom(room);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
