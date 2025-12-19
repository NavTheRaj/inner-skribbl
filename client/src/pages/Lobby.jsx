import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { setSession } from '../store/sessionSlice'
import { nanoid } from '../utils/id'

const mockRooms = [
  { id: 'lounge', name: 'Cozy Lounge', players: 2 },
  { id: 'garden', name: 'Sketch Garden', players: 1 },
  { id: 'arena', name: 'Rapid Arena', players: 0 },
]

function Lobby() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const session = useSelector((state) => state.session)
  const [username, setUsername] = useState(session.username || '')
  const [roomCode, setRoomCode] = useState('')

  useEffect(() => {
    if (!session.userId) {
      dispatch(setSession({ username: username || `Player-${Math.floor(Math.random() * 999)}`, userId: nanoid() }))
    }
  }, [dispatch, session.userId, username])

  const readyUsername = useMemo(() => username || session.username, [username, session.username])

  const handleEnterRoom = (id) => {
    if (!readyUsername) return
    dispatch(setSession({ username: readyUsername, userId: session.userId }))
    navigate(`/rooms/${id}`)
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!roomCode.trim() || !readyUsername) return
    handleEnterRoom(roomCode.trim())
  }

  return (
    <div className="grid">
      <div className="card flex-col">
        <h2 className="section-title">Your profile</h2>
        <label>
          Display name
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Pick a name" />
        </label>
        <div className="badge">ID: {session.userId || 'pending'}</div>
        <form onSubmit={handleCreate} className="flex-col">
          <h3 className="section-title">Create or join by code</h3>
          <input
            placeholder="room-code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button className="button" type="submit" disabled={!readyUsername}>
            Go to room
          </button>
        </form>
      </div>

      <div className="card flex-col">
        <h2 className="section-title">Public rooms</h2>
        <ul className="list">
          {mockRooms.map((room) => (
            <li key={room.id} className="flex-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{room.name}</div>
                <div className="badge">{room.players} players</div>
              </div>
              {readyUsername ? (
                <button className="button" onClick={() => handleEnterRoom(room.id)}>
                  Join
                </button>
              ) : (
                <span className="badge">Set name to join</span>
              )}
            </li>
          ))}
        </ul>
        <Link to="/" style={{ marginTop: '0.5rem', color: '#0ea5e9', fontWeight: 600 }}>
          Refresh rooms
        </Link>
      </div>
    </div>
  )
}

export default Lobby
