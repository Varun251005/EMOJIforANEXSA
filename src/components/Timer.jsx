const formatTime = (seconds) => {
  const padded = String(Math.max(seconds, 0)).padStart(2, '0')
  return `00:${padded}`
}

const Timer = ({ label, timeLeft }) => {
  return (
    <div className="timer" aria-live="polite">
      <span className="timer-label">{label}</span>
      <span className="timer-value">{formatTime(timeLeft)}</span>
    </div>
  )
}

export default Timer
