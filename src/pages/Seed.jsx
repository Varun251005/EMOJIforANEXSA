import { useMemo, useState } from 'react'
import { addDoc, collection, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

const QUESTIONS = [
  { text: 'Artificial Intelligence', order: 1 },
  { text: 'Data Analytics', order: 2 },
  { text: 'Cloud Storage', order: 3 },
  { text: 'Mobile Communication', order: 4 },
  { text: 'Internet / World Wide Web', order: 5 },
  { text: 'Python Programming', order: 6 },
  { text: 'File Management System', order: 7 },
  { text: 'Debugging / Software Testing', order: 8 },
  { text: 'Data Security', order: 9 },
  { text: 'Database Management', order: 10 },
  { text: 'Machine Learning', order: 11 },
  { text: 'Problem Solving / Coding Logic', order: 12 },
  { text: 'Team Collaboration / Team Coding', order: 13 },
  { text: 'Blockchain', order: 14 },
  { text: 'Predictive Analytics', order: 15 },
]

const Seed = () => {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const canSeed = useMemo(() => confirmText.trim().toUpperCase() === 'SEED', [
    confirmText,
  ])

  const handleSeed = async () => {
    setStatus('loading')
    setMessage('')

    try {
      const batch = writeBatch(db)
      QUESTIONS.forEach((question) => {
        const docRef = doc(collection(db, 'questions'))
        batch.set(docRef, question)
      })

      await batch.commit()
      setStatus('success')
      setMessage('Questions seeded successfully.')
    } catch (err) {
      setStatus('error')
      setMessage('Seeding failed. Please try again.')
    }
  }

  const handleSimpleSeed = async () => {
    setStatus('loading')
    setMessage('')

    try {
      for (const question of QUESTIONS) {
        await addDoc(collection(db, 'questions'), question)
      }
      setStatus('success')
      setMessage('Questions seeded successfully.')
    } catch (err) {
      setStatus('error')
      setMessage('Seeding failed. Please try again.')
    }
  }

  return (
    <section className="page">
      <div className="card intro-card">
        <p className="eyebrow">Admin utility</p>
        <h1>Seed questions</h1>
        <p className="lead">
          Type SEED below, then click the button to insert the 15 challenge
          questions into Firestore.
        </p>
        <label className="field">
          <span>Confirmation</span>
          <input
            type="text"
            placeholder="Type SEED"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
          />
        </label>
        {message ? <p className="form-error">{message}</p> : null}
        <div className="actions">
          <button
            className="btn primary"
            onClick={handleSeed}
            disabled={!canSeed || status === 'loading'}
          >
            {status === 'loading' ? 'Seeding...' : 'Seed questions'}
          </button>
        </div>
        <p className="hint">
          If the batch write fails in your environment, use the alternative
          button below.
        </p>
        <div className="actions">
          <button
            className="btn ghost"
            onClick={handleSimpleSeed}
            disabled={!canSeed || status === 'loading'}
          >
            Seed with single writes
          </button>
        </div>
      </div>
    </section>
  )
}

export default Seed
