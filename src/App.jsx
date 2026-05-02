import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Admin from './pages/Admin'
import Challenge from './pages/Challenge'
import Login from './pages/Login'
import Rules from './pages/Rules'
import Seed from './pages/Seed'
import './App.css'

function App() {
  const location = useLocation()
  const adminAuthed = localStorage.getItem('adminAuth') === 'true'
  const hideHeader =
    location.pathname === '/' ||
    (location.pathname === '/admin' && !adminAuthed)

  return (
    <div className="app-shell">
      {hideHeader ? null : (
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">EE</span>
            <div>
              <p className="brand-title">EmojiDecode</p>
              <p className="brand-subtitle">Translate tech into emoji logic.</p>
            </div>
          </div>
        </header>
      )}
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/seed" element={<Seed />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>Built for fair, fast, and creative rounds.</p>
      </footer>
    </div>
  )
}

export default App
