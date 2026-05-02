import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import heroImage from '../assets/image.png'

const normalizeUsn = (value) => value.trim().toUpperCase()

const Login = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [usn, setUsn] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const normalizedName = name.trim()
    const normalized = normalizeUsn(usn)

    if (!normalizedName || !normalized) {
      setError('Please enter your name and USN to continue.')
      return
    }

    setError('')
    localStorage.setItem('name', normalizedName)
    localStorage.setItem('usn', normalized)
    navigate('/rules')
  }

  return (
    <section className="page login-page">
      <div className="card login-card">
        <div className="login-header">
          <div className="login-brand">
            <span className="login-brand-mark">EC</span>
            <div>
              <p className="login-brand-title">Emoji Challenge</p>
              <p className="login-brand-subtitle">Explain - Think - Win</p>
            </div>
          </div>
          <h1>
            Show your <span className="highlight">technical creativity</span> in
            60 seconds.
          </h1>
          <p className="lead">Enter your USN to unlock the challenge.</p>
        </div>
        <div className="login-art">
          <img src={heroImage} alt="Challenge illustration" />
        </div>
        <div className="login-form">
          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={60}
              />
            </label>
            <label className="field">
              <span>USN</span>
              <input
                type="text"
                placeholder="Enter your USN"
                value={usn}
                onChange={(event) => setUsn(event.target.value)}
                autoComplete="off"
                maxLength={20}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn primary" type="submit">
              Continue -&gt;
            </button>
          </form>
          <div className="login-note">
            <span className="note-icon">*</span>
            <span>Fair rounds. Fast thinking. Real creativity.</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login
