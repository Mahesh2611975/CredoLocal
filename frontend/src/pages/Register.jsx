import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../api/axios'

export default function Register() {
  const { login }     = useApp()
  const navigate      = useNavigate()
  const [params]      = useSearchParams()
  const defaultRole   = params.get('role') || 'applicant'

  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: defaultRole })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.access_token, data.user)
      navigate(data.user.role === 'lender' ? '/lender-dashboard' : '/apply')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Create account</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
          Already have one? <Link to="/login">Sign in</Link>
        </p>
        <div className="card">
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Your full name" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 characters" required />
            </div>
            <div className="form-group">
              <label>I am a</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="applicant">Loan Applicant (Business Owner)</option>
                <option value="lender">Microfinance Lender</option>
              </select>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
