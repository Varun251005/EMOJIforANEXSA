import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import QuestionCard from '../components/QuestionCard'
import Timer from '../components/Timer'

const MAX_EMOJI = 5
const QUESTION_TIME = 60

const normalizeEmojiInput = (value) => value.replace(/\s+/g, ' ').trimStart()

const Challenge = () => {
  const navigate = useNavigate()
  const usn = localStorage.getItem('usn')
  const participantName = localStorage.getItem('name') || ''
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [emojis, setEmojis] = useState('')
  const [explanation, setExplanation] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)

  const question = questions?.[currentIndex]

  const handleEmojiChange = (event) => {
    const nextValue = normalizeEmojiInput(event.target.value)
    const parts = nextValue.split(' ').filter(Boolean)

    if (parts.length <= MAX_EMOJI) {
      setEmojis(nextValue)
    } else {
      setEmojis(parts.slice(0, MAX_EMOJI).join(' '))
    }
  }

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (!question || isSubmitting) {
        return
      }

      setIsSubmitting(true)

      const cleanedEmojis = emojis.trim().split(' ').filter(Boolean).slice(0, MAX_EMOJI)
      const timeTaken = Math.min(
        QUESTION_TIME,
        Math.max(0, QUESTION_TIME - timeLeft),
      )

      try {
        await addDoc(collection(db, 'responses'), {
          usn,
          name: participantName,
          questionId: question.id,
          questionText: question.text ?? question.word ?? 'Untitled',
          order: question.order ?? currentIndex + 1,
          emojis: cleanedEmojis.join(' '),
          explanation: explanation.trim(),
          timeTaken,
          timestamp: serverTimestamp(),
          autoSubmit,
        })

        const userPayload = {
          usn,
          name: participantName,
          lastUpdatedAt: serverTimestamp(),
          hasCompleted: false,
        }

        if (!startedAt) {
          userPayload.startedAt = serverTimestamp()
        }

        await setDoc(doc(db, 'users', usn), userPayload, { merge: true })

        if (!startedAt) {
          setStartedAt(new Date().toISOString())
        }

        setEmojis('')
        setExplanation('')

        const nextIndex = currentIndex + 1
        if (nextIndex >= questions.length) {
          await setDoc(
            doc(db, 'users', usn),
            {
              hasCompleted: true,
              completedAt: serverTimestamp(),
              lastUpdatedAt: serverTimestamp(),
            },
            { merge: true },
          )
          setStatus('done')
        } else {
          setCurrentIndex(nextIndex)
        }
      } catch (err) {
        console.error('[Challenge] Save error:', err)
        setError('Unable to save your response. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      currentIndex,
      emojis,
      explanation,
      isSubmitting,
      question,
      questions.length,
      startedAt,
      timeLeft,
      participantName,
      usn,
    ],
  )

  useEffect(() => {
    if (!usn) {
      console.warn('[Challenge] Missing USN, redirecting to login.')
      navigate('/')
    }
  }, [navigate, usn])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!usn) {
        return
      }

      setStatus('loading')
      setError('')

      try {
        console.log('[Challenge] Starting question fetch...')
        const questionsQuery = query(
          collection(db, 'questions'),
          orderBy('order', 'asc'),
        )

        const questionsSnap = await getDocs(questionsQuery)
        const loadedQuestions = questionsSnap.docs.map((docRef) => ({
          id: docRef.id,
          ...docRef.data(),
        }))

        console.log('[Challenge] Fetched questions count:', loadedQuestions.length)
        console.log('[Challenge] Fetched questions data:', loadedQuestions)

        if (!isMounted) {
          return
        }

        if (loadedQuestions.length === 0) {
          console.warn('[Challenge] No questions found in Firestore.')
          setError('No questions found. Please seed the questions first.')
          setStatus('error')
          return
        }

        let nextIndex = 0
        let userData = null

        try {
          console.log('[Challenge] Reading user progress...')
          const [userSnap, responsesSnap] = await Promise.all([
            getDoc(doc(db, 'users', usn)),
            getDocs(query(collection(db, 'responses'), where('usn', '==', usn))),
          ])

          userData = userSnap.exists() ? userSnap.data() : null
          nextIndex = Math.min(responsesSnap.size, loadedQuestions.length)
          console.log('[Challenge] User data:', userData)
          console.log('[Challenge] Responses count:', responsesSnap.size)
        } catch (readErr) {
          console.warn('[Challenge] User progress read failed:', readErr)
          nextIndex = 0
          userData = null
        }

        if (!isMounted) {
          return
        }

        setQuestions(loadedQuestions)
        setCurrentIndex(nextIndex)
        setStartedAt(userData?.startedAt ?? null)

        console.log('[Challenge] State update -> questions:', loadedQuestions.length)
        console.log('[Challenge] State update -> currentIndex:', nextIndex)
        console.log('[Challenge] State update -> startedAt:', userData?.startedAt ?? null)

        if (userData?.hasCompleted) {
          console.log('[Challenge] User already completed. Showing done state.')
          setStatus('done')
          return
        }

        if (nextIndex >= loadedQuestions.length && loadedQuestions.length > 0) {
          console.log('[Challenge] Progress indicates completion. Showing done state.')
          setStatus('done')
          return
        }

        console.log('[Challenge] Ready to render questions.')
        setStatus('ready')
      } catch (err) {
        console.error('[Challenge] Load error:', err)
        if (isMounted) {
          setError('Unable to load the challenge. Please refresh.')
          setStatus('error')
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [usn])

  useEffect(() => {
    if (status !== 'ready') {
      console.log('[Challenge] Timer reset skipped, status:', status)
      return
    }

    console.log('[Challenge] Timer reset for question index:', currentIndex)
    setTimeLeft(QUESTION_TIME)
  }, [currentIndex, status])

  useEffect(() => {
    if (status !== 'ready' || isSubmitting || !question) {
      console.log('[Challenge] Tick skipped', {
        status,
        isSubmitting,
        hasQuestion: Boolean(question),
      })
      return
    }

    if (timeLeft <= 0) {
      console.log('[Challenge] Time reached zero, auto-submit.')
      handleSubmit(true)
      return
    }

    const timeoutId = setTimeout(() => {
      setTimeLeft((current) => current - 1)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [handleSubmit, isSubmitting, question, status, timeLeft])

  const emojiCount = useMemo(() => {
    if (!emojis.trim()) {
      return 0
    }
    return emojis.trim().split(' ').filter(Boolean).length
  }, [emojis])

  console.log('[Challenge] Render snapshot', {
    status,
    questionsCount: questions.length,
    currentIndex,
    hasQuestion: Boolean(question),
    error,
  })

  if (status === 'loading') {
    return (
      <section className="page">
        <div className="card">Loading questions...</div>
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

  if (status === 'done') {
    return (
      <section className="page">
        <div className="card completion-card">
          <p className="eyebrow">Challenge complete</p>
          <h1>Nice work!</h1>
          <p className="lead">Your responses are saved. Thank you for playing.</p>
        </div>
      </section>
    )
  }

  if (!question) {
    return (
      <section className="page">
        <div className="card">No questions found.</div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="challenge-layout">
        <div className="challenge-main">
          <p className="eyebrow">EmojiDecode</p>
          <div className="card debug-card">
            <p className="eyebrow">Debug</p>
            <p>Total questions: {questions.length}</p>
            <p>Current index: {currentIndex + 1}</p>
          </div>
          <QuestionCard
            question={question}
            index={currentIndex}
            total={questions.length}
          />
          <div className="card response-card">
            <div className="response-header">
              <h3>Answer</h3>
              <span className="hint">Up to {MAX_EMOJI} emojis</span>
            </div>
            <label className="field">
              <span>Decode with emoji</span>
              <input
                type="text"
                placeholder=""
                value={emojis}
                onChange={handleEmojiChange}
              />
              <span className="field-help">{emojiCount}/{MAX_EMOJI} used</span>
            </label>
            <label className="field">
              <span>One-line explanation</span>
              <input
                type="text"
                placeholder="Short explanation of your emoji logic"
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                maxLength={140}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="actions">
              <button
                className="btn primary"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
        <aside className="challenge-side">
          <Timer label="Time left" timeLeft={timeLeft} />
          <div className="card tip-card">
            <h3>Quick tips</h3>
            <ul>
              <li>Keep emojis simple and memorable.</li>
              <li>Use the explanation to nail the concept.</li>
              <li>The timer auto-submits when it hits zero.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default Challenge
