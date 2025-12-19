import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  roomId: null,
  players: [],
  strokes: [],
  guesses: [],
  scores: {},
  currentTurnPlayerId: null,
  round: {
    number: 1,
    status: 'waiting',
  },
}

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoom(state, action) {
      state.roomId = action.payload
    },
    setPlayers(state, action) {
      state.players = action.payload
    },
    addStroke(state, action) {
      state.strokes.push(action.payload)
    },
    clearStrokes(state) {
      state.strokes = []
    },
    addGuess(state, action) {
      state.guesses.push(action.payload)
    },
    setCurrentTurn(state, action) {
      state.currentTurnPlayerId = action.payload
    },
    setScores(state, action) {
      state.scores = action.payload
    },
    updateRound(state, action) {
      state.round = {
        ...state.round,
        ...action.payload,
      }
    },
    clearRoom() {
      return initialState
    },
  },
})

export const {
  setRoom,
  setPlayers,
  addStroke,
  clearStrokes,
  addGuess,
  setCurrentTurn,
  setScores,
  updateRound,
  clearRoom,
} = roomSlice.actions

export default roomSlice.reducer
