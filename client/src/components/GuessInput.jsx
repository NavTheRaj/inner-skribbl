import { useState } from 'react'

function GuessInput({ onSubmit, disabled }) {
  const [guess, setGuess] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!guess.trim()) return
    onSubmit(guess.trim())
    setGuess('')
  }

  return (
    <form onSubmit={handleSubmit} className="card flex-col">
      <h3 className="section-title">Guess the word</h3>
      <input
        placeholder="Type your guess"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        disabled={disabled}
      />
      <button className="button" type="submit" disabled={disabled}>
        Send guess
      </button>
    </form>
  )
}

export default GuessInput
