import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import DrawingCanvas from '../components/DrawingCanvas'
import GuessInput from '../components/GuessInput'
import RoomPlayers from '../components/RoomPlayers'
import Scoreboard from '../components/Scoreboard'
import {
  addGuess,
  addStroke,
  clearRoom,
  clearStrokes,
  setCurrentTurn,
  setPlayers,
  setRoom,
  setScores,
  updateRound,
} from '../store/roomSlice'
import { createSocket } from '../services/socket'

function Room() {
  const { roomId } = useParams()
  const dispatch = useDispatch()
  const session = useSelector((state) => state.session)
  const room = useSelector((state) => state.room)
  const [connected, setConnected] = useState(false)
  const [chatLog, setChatLog] = useState([])
  const socketRef = useRef(null)

  const players = room.players
  const turnPlayer = useMemo(() => players.find((p) => p.id === room.currentTurnPlayerId), [players, room.currentTurnPlayerId])

  useEffect(() => {
    dispatch(setRoom(roomId))
    const socket = createSocket()
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join-room', { roomId, userId: session.userId, name: session.username })
    })

    socket.on('disconnect', () => setConnected(false))
    socket.on('room-state', (payload) => {
      dispatch(setPlayers(payload.players || []))
      dispatch(setScores(payload.scores || {}))
      dispatch(setCurrentTurn(payload.currentTurnPlayerId || null))
      dispatch(updateRound(payload.round || {}))
      if (payload.strokes) {
        dispatch(clearStrokes())
        payload.strokes.forEach((stroke) => dispatch(addStroke(stroke)))
      }
    })
    socket.on('draw-stroke', (payload) => dispatch(addStroke(payload.stroke)))
    socket.on('player-guess', (payload) => dispatch(addGuess(payload)))
    socket.on('chat', (payload) => setChatLog((prev) => [...prev, payload]))

    socket.connect()

    return () => {
      socket.disconnect()
      dispatch(clearRoom())
    }
  }, [dispatch, roomId, session.userId, session.username])

  const handleStroke = (stroke) => {
    dispatch(addStroke({ ...stroke, author: session.userId }))
    socketRef.current?.emit('draw-stroke', { roomId, stroke })
  }

  const handleGuess = (guess) => {
    const payload = { userId: session.userId, name: session.username, guess, at: Date.now() }
    dispatch(addGuess(payload))
    socketRef.current?.emit('player-guess', { roomId, ...payload })
  }

  const handleSendChat = (message) => {
    const payload = { message, from: session.username, at: Date.now() }
    setChatLog((prev) => [...prev, payload])
    socketRef.current?.emit('chat', { roomId, ...payload })
  }

  return (
    <div className="grid">
      <div className="flex-col" style={{ gap: '1rem' }}>
        <div className="card">
          <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="section-title">Room {roomId}</h2>
              <div className="badge">{connected ? 'Connected' : 'Connecting...'}</div>
            </div>
            {turnPlayer && <div className="badge">{turnPlayer.name} is drawing</div>}
          </div>
        </div>

        <DrawingCanvas strokes={room.strokes} onStroke={handleStroke} />
      </div>

      <div className="flex-col" style={{ gap: '1rem' }}>
        <RoomPlayers players={players} />
        <Scoreboard players={players} scores={room.scores} />

        <div className="card chat-panel">
          <h3 className="section-title">Guesses</h3>
          <div className="chat-log">
            {room.guesses.map((entry) => (
              <div key={`${entry.userId}-${entry.at}`} className="chat-message">
                <strong>{entry.name}:</strong> {entry.guess}
              </div>
            ))}
            {room.guesses.length === 0 && <div>No guesses yet.</div>}
          </div>
        </div>

        <div className="card chat-panel">
          <h3 className="section-title">Chat</h3>
          <div className="chat-log">
            {chatLog.map((entry, idx) => (
              <div key={`${entry.at}-${idx}`} className="chat-message">
                <strong>{entry.from}:</strong> {entry.message}
              </div>
            ))}
            {chatLog.length === 0 && <div>No chat yet.</div>}
          </div>
          <ChatInput onSend={handleSendChat} />
        </div>

        <GuessInput onSubmit={handleGuess} disabled={!connected} />
      </div>
    </div>
  )
}

function ChatInput({ onSend }) {
  const [message, setMessage] = useState('')
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    onSend(message.trim())
    setMessage('')
  }
  return (
    <form onSubmit={handleSubmit} className="flex-row">
      <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Say hi" />
      <button className="button" type="submit">
        Send
      </button>
    </form>
  )
}

export default Room
