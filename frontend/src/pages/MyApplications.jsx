import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../api/axios'

const STATUS_META = {
  pending:       { label: 'Pending',           color: 'var(--muted)',  badge: 'badge-blue',   icon: '🕐' },
  ai_analyzed:   { label: 'AI Analyzed',       color: 'var(--blue)',   badge: 'badge-blue',   icon: '🧠' },
  lender_selected:{ label: 'Lender Selected',  color: 'var(--blue)',   badge: 'badge-blue',   icon: '🏦' },
  submitted:     { label: 'Submitted',         color: 'var(--amber)',  badge: 'badge-amber',  icon: '📤' },
  approved:      { label: 'Approved',          color: 'var(--green)',  badge: 'badge-green',  icon: '✅' },
  rejected:      { label: 'Rejected',          color: 'var(--red)',    badge: 'badge-red',    icon: '❌' },
  modified:      { label: 'Modified by Lender',color: 'var(--amber)',  badge: 'badge-amber',  icon: '✏️' },
  docs_requested:{ label: 'Docs Requested',    color: 'var(--amber)',  badge: 'badge-amber',  icon: '📋' },
}

export default function MyApplications() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/applications/my').then(r => { setApps(r.data); setLoading(false) })
  }, [user])

  if (loading) return <div className="loading-spinner"><div className="spinner"></div> Loading applications…</div>

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>My Applications</h1>
        <button className="btn btn-primary" onClick={() => navigate('/apply')}>+ New Application</button>
      </div>

      {apps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No applications yet</div>
          <div style={{ color: 'var(--muted)', marginBottom: 24 }}>Upload your documents to get started</div>
          <button className="btn btn-primary" onClick={() => navigate('/apply')}>Apply for a Loan →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {apps.map(a => {
            const m = STATUS_META[a.status] || STATUS_META.pending
            return (
              <div key={a.id} className="card" style={{ cursor: 'pointer', padding: 20 }}
                onClick={() => setSelected(selected?.id === a.id ? null : a)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 28 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {a.business_type} · Tier {a.city_tier}
                        {a.loan_amount && <span style={{ marginLeft: 10, color: 'var(--blue)' }}>₹{a.loan_amount.toLocaleString('en-IN')}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {a.lender_name && `${a.lender_name} · `}
                        Applied {new Date(a.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${m.badge}`}>{m.label}</span>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>App #{a.id}</div>
                  </div>
                </div>

                {/* Timeline */}
                {selected?.id === a.id && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <ApplicationTimeline status={a.status} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const TIMELINE_STEPS = ['submitted', 'approved']
function ApplicationTimeline({ status }) {
  const steps = [
    { key: 'submitted',     label: 'Submitted',      icon: '📤' },
    { key: 'under_review',  label: 'Under Review',   icon: '👁️' },
    { key: 'approved',      label: 'Approved',       icon: '✅' },
    { key: 'rejected',      label: 'Rejected',       icon: '❌' },
  ]
  const isDone = (k) => {
    const order = { submitted: 1, under_review: 2, approved: 3, rejected: 3, docs_requested: 2, modified: 2 }
    const cur = order[status] || 1
    return order[k] <= cur
  }
  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {i < steps.length - 1 && (
            <div style={{ position: 'absolute', top: 16, left: '50%', right: '-50%', height: 2, background: isDone(steps[i+1]?.key) ? 'var(--green)' : 'var(--border)' }} />
          )}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: isDone(s.key) ? 'var(--green)' : 'var(--surface)',
            border: `2px solid ${isDone(s.key) ? 'var(--green)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, position: 'relative', zIndex: 1,
          }}>{isDone(s.key) ? '✓' : s.icon}</div>
          <div style={{ fontSize: 11, color: isDone(s.key) ? 'var(--text)' : 'var(--muted)', marginTop: 6, textAlign: 'center' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}
