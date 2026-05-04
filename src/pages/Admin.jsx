import { useEffect, useState } from 'react'
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

    const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const marginX = 48
    const marginTop = 56
    const marginBottom = 56
    const maxTextWidth = pageWidth - marginX * 2
    let cursorY = marginTop

    const ensureSpace = (heightNeeded) => {
      if (cursorY + heightNeeded > pageHeight - marginBottom) {
        doc.addPage()
        cursorY = marginTop
      }
    }

    const addWrappedText = (text, { fontSize = 12, color = '#0f172a', bold = false } = {}) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(fontSize)
      doc.setTextColor(color)
      const lineHeight = fontSize * 1.35
      const lines = doc.splitTextToSize(text, maxTextWidth)

      lines.forEach((line) => {
        ensureSpace(lineHeight)
        doc.text(line, marginX, cursorY)
        cursorY += lineHeight
      })
    }

    const emojiCache = new Map()
    const emojiSegmenter = typeof Intl !== 'undefined' && Intl.Segmenter
      ? new Intl.Segmenter('en', { granularity: 'grapheme' })
      : null
    const emojiRegex = /\p{Extended_Pictographic}/u

    const toCodePointSequence = (segment) => {
      return Array.from(segment)
        .map((char) => char.codePointAt(0).toString(16))
        .join('-')
    }

    const loadEmojiImage = (emoji) => {
      const codePoint = toCodePointSequence(emoji)
      if (emojiCache.has(codePoint)) {
        return emojiCache.get(codePoint)
      }

      const url = `https://twemoji.maxcdn.com/v/latest/72x72/${codePoint}.png`
      const imagePromise = new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })

      emojiCache.set(codePoint, imagePromise)
      return imagePromise
    }

    const extractEmojis = (value) => {
      if (!value) {
        return []
      }

      const segments = emojiSegmenter
        ? Array.from(emojiSegmenter.segment(value), (part) => part.segment)
        : Array.from(value)

      return segments.filter((segment) => emojiRegex.test(segment))
    }

    const addEmojiLine = async (label, emojiText) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.setTextColor('#0f172a')
      const lineHeight = 20

      ensureSpace(lineHeight)
      doc.text(label, marginX, cursorY)
      let x = marginX + doc.getTextWidth(label) + 8
      const emojiSize = 16

      const emojis = extractEmojis(emojiText)
      if (emojis.length === 0) {
        doc.setTextColor('#64748b')
        doc.text('—', x, cursorY)
        cursorY += lineHeight
        return
      }

      for (const emoji of emojis) {
        if (x + emojiSize > pageWidth - marginX) {
          cursorY += lineHeight
          ensureSpace(lineHeight)
          x = marginX
        }

        try {
          const img = await loadEmojiImage(emoji)
          doc.addImage(img, 'PNG', x, cursorY - emojiSize + 4, emojiSize, emojiSize)
          x += emojiSize + 4
        } catch (error) {
          doc.setTextColor('#0f172a')
          doc.text(emoji, x, cursorY)
          x += doc.getTextWidth(emoji) + 4
        }
      }

      cursorY += lineHeight
    }

    addWrappedText('EmojiDecode Responses', { fontSize: 20, bold: true })
    addWrappedText(`Exported: ${new Date().toLocaleString()}`, {
      fontSize: 10,
      color: '#64748b',
    })
    cursorY += 12

    for (const entry of responses) {
      addWrappedText(`${entry.usn}${entry.name ? ` - ${entry.name}` : ''}`, {
        fontSize: 14,
        bold: true,
      })
      cursorY += 4

      for (const [index, response] of entry.responses.entries()) {
        addWrappedText(`${index + 1}. ${response.questionText || 'Question'}`, {
          fontSize: 12,
          bold: true,
        })
        await addEmojiLine('Emojis:', response.emojis || '')
        addWrappedText(`Explanation: ${response.explanation || 'No explanation'}`, {
          fontSize: 11,
          color: '#475569',
        })
        cursorY += 8
      }

      cursorY += 8
    }

    doc.save('emoji-responses.pdf')
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
