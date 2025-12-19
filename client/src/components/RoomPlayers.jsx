function RoomPlayers({ players }) {
  return (
    <div className="card">
      <h3 className="section-title">Players</h3>
      <ul className="list">
        {players.map((player) => (
          <li key={player.id} className="flex-row" style={{ justifyContent: 'space-between' }}>
            <span className="player-chip">
              <span className="avatar">{player.name[0]?.toUpperCase()}</span>
              {player.name}
            </span>
            <span className="badge">{player.status || 'idle'}</span>
          </li>
        ))}
        {players.length === 0 && <li>No players yet.</li>}
      </ul>
    </div>
  )
}

export default RoomPlayers
