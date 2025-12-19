import { Link, Route, Routes } from 'react-router-dom'
import Lobby from './pages/Lobby'
import Room from './pages/Room'
import { useSelector } from 'react-redux'
import TurnIndicator from './components/TurnIndicator'

function App() {
  const { username } = useSelector((state) => state.session)
  const { roomId, currentTurnPlayerId, players } = useSelector((state) => state.room)
  const currentTurn = players.find((p) => p.id === currentTurnPlayerId)

  return (
    <div className="app-shell">
      <header>
        <div>
          <strong>Inner Skribbl</strong>
        </div>
        <nav>
          <Link to="/">Lobby</Link>
          {roomId && <Link to={`/rooms/${roomId}`}>Current Room</Link>}
        </nav>
        <div className="player-chip" title={username || 'Guest'}>
          <span className="avatar">{username ? username[0]?.toUpperCase() : '?'}</span>
          <span>{username || 'Guest'}</span>
        </div>
      </header>
      <main>
        {roomId && currentTurn ? <TurnIndicator player={currentTurn} /> : null}
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/rooms/:roomId" element={<Room />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
