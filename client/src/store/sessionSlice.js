import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from '../utils/id'

const initialState = {
  username: '',
  userId: null,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession(state, action) {
      state.username = action.payload.username
      state.userId = action.payload.userId || state.userId || nanoid()
    },
    resetSession(state) {
      state.username = ''
      state.userId = null
    },
  },
})

export const { setSession, resetSession } = sessionSlice.actions
export default sessionSlice.reducer
