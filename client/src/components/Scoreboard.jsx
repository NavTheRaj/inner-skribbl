function Scoreboard({ players, scores }) {
  const withScores = players.map((player) => ({
    ...player,
    score: scores[player.id] ?? player.score ?? 0,
  }))

  return (
    <div className="card">
      <h3 className="section-title">Scores</h3>
      <div className="scoreboard">
        {withScores.map((player) => (
          <div key={player.id} className="score-row">
            <span className="player-chip">
              <span className="avatar">{player.name[0]?.toUpperCase()}</span>
              {player.name}
            </span>
            <strong>{player.score} pts</strong>
          </div>
        ))}
        {withScores.length === 0 && <div>No players yet.</div>}
      </div>
    </div>
  )
}

export default Scoreboard
