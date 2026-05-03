import { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const ADMIN_EMAIL = 'admin@gmail.com'
const ADMIN_PASSWORD = 'admin@4321'

const Admin = () => {
  const [responses, setResponses] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthed, setIsAuthed] = useState(() => {
    return localStorage.getItem('adminAuth') === 'true'
  })

  useEffect(() => {
    if (!isAuthed) {
      setStatus('idle')
      return
    }

    const loadResponses = async () => {
      setStatus('loading')
      setError('')

      try {
        const snapshot = await getDocs(collection(db, 'responses'))
        const grouped = snapshot.docs.reduce((acc, docRef) => {
          const entry = docRef.data()
          if (!entry?.usn) {
            return acc
          }

          if (!acc[entry.usn]) {
            acc[entry.usn] = { usn: entry.usn, name: entry.name, responses: [] }
          }

          acc[entry.usn].responses.push({ id: docRef.id, ...entry })
          return acc
        }, {})

        const data = Object.values(grouped).map((entry) => ({
          ...entry,
          responses: entry.responses.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        }))

        data.sort((a, b) => a.usn.localeCompare(b.usn))

        setResponses(data)
        setStatus('ready')
      } catch (err) {
        setError('Unable to load responses.')
        setStatus('error')
      }
    }

    loadResponses()
  }, [isAuthed])

  const handleLogin = (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (
      normalizedEmail === ADMIN_EMAIL &&
      password.trim() === ADMIN_PASSWORD
    ) {
      localStorage.setItem('adminAuth', 'true')
      setIsAuthed(true)
      setAuthError('')
      return
    }

    setAuthError('Invalid admin credentials.')
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    setIsAuthed(false)
    setEmail('')
    setPassword('')
  }

  const handleExportPdf = async () => {
    if (responses.length === 0) {
      return
    }

    const exportContainer = document.createElement('div')
    exportContainer.style.position = 'fixed'
    exportContainer.style.left = '-10000px'
    exportContainer.style.top = '0'
    exportContainer.style.width = '794px'
    exportContainer.style.padding = '32px'
    exportContainer.style.background = '#ffffff'
    exportContainer.style.color = '#0f172a'
    exportContainer.style.fontFamily =
      '"Noto Color Emoji", "Segoe UI Emoji", "Apple Color Emoji", "Segoe UI Symbol", Arial, sans-serif'
    exportContainer.style.fontSize = '14px'

    const heading = document.createElement('h1')
    heading.textContent = 'EmojiDecode Responses'
    heading.style.margin = '0 0 8px'
    heading.style.fontSize = '22px'
    exportContainer.appendChild(heading)

    const timestamp = document.createElement('p')
    timestamp.textContent = `Exported: ${new Date().toLocaleString()}`
    timestamp.style.margin = '0 0 24px'
    timestamp.style.fontSize = '12px'
    exportContainer.appendChild(timestamp)

    responses.forEach((entry) => {
      const entryHeader = document.createElement('h2')
      entryHeader.textContent = `${entry.usn}${entry.name ? ` - ${entry.name}` : ''}`
      entryHeader.style.margin = '16px 0 8px'
      entryHeader.style.fontSize = '16px'
      exportContainer.appendChild(entryHeader)

      const responseList = document.createElement('ol')
      responseList.style.margin = '0 0 16px 18px'
      responseList.style.padding = '0'

      entry.responses.forEach((response, index) => {
        const item = document.createElement('li')
        item.style.marginBottom = '10px'

        const question = document.createElement('div')
        question.textContent = `${index + 1}. ${response.questionText || 'Question'}`
        question.style.fontWeight = '600'
        question.style.marginBottom = '4px'
        item.appendChild(question)

        const emojiLine = document.createElement('div')
        emojiLine.textContent = `Emojis: ${response.emojis || '—'}`
        emojiLine.style.marginBottom = '4px'
        item.appendChild(emojiLine)

        const explanation = document.createElement('div')
        explanation.textContent = `Explanation: ${response.explanation || 'No explanation'}`
        explanation.style.color = '#475569'
        item.appendChild(explanation)

        responseList.appendChild(item)
      })

      exportContainer.appendChild(responseList)
    })

    document.body.appendChild(exportContainer)

    try {
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const imgData = canvas.toDataURL('image/png')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        doc.addPage()
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      doc.save('emoji-responses.pdf')
    } finally {
      document.body.removeChild(exportContainer)
    }
  }

  if (!isAuthed) {
    return (
      <section className="page">
        <div className="card intro-card">
          <p className="eyebrow">Admin access</p>
          <h1>Sign in</h1>
          <p className="lead">
            Enter the admin email and password to view responses.
          </p>
          <form className="form" onSubmit={handleLogin}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            {authError ? <p className="form-error">{authError}</p> : null}
            <button className="btn primary" type="submit">
              Enter admin
            </button>
          </form>
        </div>
      </section>
    )
  }

  if (status === 'loading') {
    return (
      <section className="page">
        <div className="card">Loading responses...</div>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="page">
        <div className="card">{error}</div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="card admin-card">
        <p className="eyebrow">Admin</p>
        <div className="admin-entry-header">
          <h1>All responses</h1>
          <div className="admin-actions">
            <button
              className="btn ghost"
              type="button"
              onClick={handleExportPdf}
              disabled={responses.length === 0}
            >
              Export PDF
            </button>
            <button className="btn ghost" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
        <div className="admin-grid">
          {responses.length === 0 ? (
            <p className="lead">No responses yet.</p>
          ) : (
            responses.map((entry) => (
              <article key={entry.usn} className="admin-entry">
                <div className="admin-entry-header">
                  <div>
                    <h3 className="admin-usn">{entry.usn}</h3>
                    {entry.name ? (
                      <p className="lead admin-name">{entry.name}</p>
                    ) : null}
                  </div>
                  <span>{entry.responses?.length ?? 0} answers</span>
                </div>
                <ol>
                  {entry.responses?.map((response, index) => (
                    <li key={`${entry.usn}-${response.id}-${index}`}>
                      <p className="question">{response.questionText}</p>
                      <p className="emoji">{response.emojis || '—'}</p>
                      <p className="explanation">
                        {response.explanation || 'No explanation'}
                      </p>
                    </li>
                  ))}
                </ol>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default Admin
