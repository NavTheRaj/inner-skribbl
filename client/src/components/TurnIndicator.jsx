function TurnIndicator({ player }) {
  if (!player) return null
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="turn-indicator">
        <span className="turn-dot" aria-hidden />
        <div>
          <div style={{ fontWeight: 700 }}>Current Turn</div>
          <div>{player.name} is drawing</div>
        </div>
      </div>
    </div>
  )
}

export default TurnIndicator
