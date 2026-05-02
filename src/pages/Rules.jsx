import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Rules = () => {
  const navigate = useNavigate()
  const usn = localStorage.getItem('usn')

  useEffect(() => {
    if (!usn) {
      navigate('/')
    }
  }, [navigate, usn])

  return (
    <section className="page">
      <div className="card rules-card">
        <p className="eyebrow">Rules</p>
        <h1>One word. Sixty seconds.</h1>
        <ul className="rule-list">
          <li>You get one attempt. No retries once completed.</li>
          <li>Each word has a 60-second timer.</li>
          <li>Use up to five emojis for each response.</li>
          <li>Add a one-line explanation to clarify the emojis.</li>
          <li>If time runs out, the system auto-submits your response.</li>
        </ul>
        <button className="btn primary" onClick={() => navigate('/challenge')}>
          Enter the challenge
        </button>
      </div>
    </section>
  )
}

export default Rules
