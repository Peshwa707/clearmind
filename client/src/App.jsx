import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home as HomeIcon, BookOpen, BarChart2, Settings, User, LogOut } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Exercises from './pages/Exercises'
import Progress from './pages/Progress'
import './App.css'

function App() {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/exercises', icon: BookOpen, label: 'Exercises' },
    { path: '/progress', icon: BarChart2, label: 'Progress' },
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="url(#gradient)" />
                <path
                  d="M20 10C15 10 12 14 12 18C12 22 15 26 20 30C25 26 28 22 28 18C28 14 25 10 20 10Z"
                  fill="white"
                  fillOpacity="0.9"
                />
                <circle cx="20" cy="18" r="4" fill="url(#gradient)" />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
                    <stop stopColor="#5B8FB9" />
                    <stop offset="1" stopColor="#7AB8A8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">ClearMind</span>
          </Link>

          <nav className="main-nav">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-name">
                  <User size={18} />
                  {user?.name || user?.email}
                </span>
                <button onClick={logout} className="btn-logout" title="Sign out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/progress" className="btn-signin">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>
          ClearMind helps you identify and reframe negative thought patterns.
          <br />
          <small>This is not a substitute for professional mental health care.</small>
        </p>
      </footer>
    </div>
  )
}

export default App
