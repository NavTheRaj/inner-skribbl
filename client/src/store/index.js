import { configureStore } from '@reduxjs/toolkit'
import sessionReducer from './sessionSlice'
import roomReducer from './roomSlice'

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    room: roomReducer,
  },
})
