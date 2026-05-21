import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Navbar() {
  const { user, logout } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 60,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ color: 'var(--text)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
        ⬡ MicroFinance
      </Link>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {user ? (
          <>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>{user.full_name}</span>
            <span className={`badge badge-${user.role === 'lender' ? 'amber' : 'blue'}`}>{user.role}</span>
            {user.role === 'lender' && (
              <Link to="/lender-dashboard" style={{ color: 'var(--muted)', fontSize: 13 }}>Dashboard</Link>
            )}
            {user.role === 'applicant' && (
              <Link to="/my-applications" style={{ color: 'var(--muted)', fontSize: 13 }}>My Applications</Link>
            )}
            <button className="btn btn-outline" style={{ padding: '6px 14px' }} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login"><button className="btn btn-outline" style={{ padding: '6px 14px' }}>Login</button></Link>
            <Link to="/register"><button className="btn btn-primary" style={{ padding: '6px 14px' }}>Register</button></Link>
          </>
        )}
      </div>
    </nav>
  )
}
