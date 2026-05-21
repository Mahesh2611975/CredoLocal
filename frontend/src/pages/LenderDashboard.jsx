import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../api/axios'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const RISK_COLOR = { 'LOW RISK': '#22c55e', 'MEDIUM RISK': '#f59e0b', 'HIGH RISK': '#ef4444' }
const STATUS_BADGE = {
  submitted: 'badge-blue', approved: 'badge-green', rejected: 'badge-red',
  modified: 'badge-amber', docs_requested: 'badge-amber', pending: 'badge-blue'
}

export default function LenderDashboard() {
  const { user }     = useApp()
  const navigate     = useNavigate()
  const [apps, setApps]       = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionNote, setActionNote]     = useState('')
  const [modAmount, setModAmount]       = useState('')
  const [modEMI, setModEMI]             = useState('')
  const [actionBusy, setActionBusy]     = useState(false)
  const [actionMsg, setActionMsg]       = useState('')

  useEffect(() => {
    if (!user || user.role !== 'lender') { navigate('/login'); return }
    fetchApps()
  }, [user])

  const fetchApps = async () => {
    try {
      const r = await api.get('/applications/lender/dashboard')
      setApps(r.data); setLoading(false)
    } catch { setLoading(false) }
  }

  const doAction = async (action) => {
    setActionBusy(true); setActionMsg('')
    try {
      await api.post(`/applications/${selected.id}/lender-action`, {
        action, note: actionNote,
        modified_loan_amount: modAmount ? Number(modAmount) : undefined,
        modified_emi: modEMI ? Number(modEMI) : undefined,
      })
      setActionMsg(`✅ Application ${action}d successfully`)
      fetchApps()
      // Refresh selected
      const r = await api.get(`/applications/${selected.id}`)
      setSelected(r.data)
    } catch (err) {
      setActionMsg('❌ ' + (err.response?.data?.detail || 'Action failed'))
    } finally { setActionBusy(false) }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div> Loading dashboard…</div>

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      {/* Sidebar */}
      <div style={{ width: 320, background: 'var(--surface)', borderRight: '1px solid var(--border)', overflow: 'auto', padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, padding: '4px 8px' }}>
          Applications ({apps.length})
        </div>
        {apps.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: 8 }}>No applications submitted yet.</div>
        )}
        {apps.map(a => (
          <div key={a.id}
            onClick={() => { setSelected(a); setActionNote(''); setModAmount(''); setModEMI(''); setActionMsg('') }}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              marginBottom: 6,
              cursor: 'pointer',
              background: selected?.id === a.id ? '#3b82f622' : 'transparent',
              border: `1px solid ${selected?.id === a.id ? '#3b82f644' : 'transparent'}`,
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>#{a.id} · {a.business_type}</span>
              <span className={`badge ${STATUS_BADGE[a.status] || 'badge-blue'}`} style={{ fontSize: 10 }}>{a.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {a.ai_report && (
                <span style={{ color: RISK_COLOR[a.ai_report.risk_category] }}>
                  {a.ai_report.risk_category} · Score {a.ai_report.trust_score}
                </span>
              )}
            </div>
            {a.requested_loan_amount && (
              <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 2 }}>
                ₹{a.requested_loan_amount.toLocaleString('en-IN')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {!selected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 48 }}>🏦</div>
            <div style={{ color: 'var(--muted)', fontSize: 15 }}>Select an application from the sidebar</div>
          </div>
        ) : (
          <ApplicationDetail app={selected} onAction={doAction}
            actionNote={actionNote} setActionNote={setActionNote}
            modAmount={modAmount} setModAmount={setModAmount}
            modEMI={modEMI} setModEMI={setModEMI}
            actionBusy={actionBusy} actionMsg={actionMsg} />
        )}
      </div>
    </div>
  )
}

function ApplicationDetail({ app, onAction, actionNote, setActionNote, modAmount, setModAmount, modEMI, setModEMI, actionBusy, actionMsg }) {
  const r = app.ai_report
  if (!r) return <div style={{ padding: 32, color: 'var(--muted)' }}>No AI report available.</div>

  const rc = RISK_COLOR[r.risk_category]
  const months = Object.keys(r.txn_data?.monthly_chart || {})
  const credits = months.map(m => r.txn_data.monthly_chart[m].credit)
  const debits  = months.map(m => r.txn_data.monthly_chart[m].debit)

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Application #{app.id} · {app.business_type}
          </h2>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            Tier {app.city_tier} · Applied {new Date(app.created_at).toLocaleDateString('en-IN')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className={`badge ${STATUS_BADGE[app.status] || 'badge-blue'}`}>{app.status}</span>
          <span style={{ background: rc + '22', color: rc, border: `1px solid ${rc}55`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
            {r.risk_category}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Trust Score',    val: r.trust_score, sub: '/1000', color: rc },
          { label: 'Default Prob',   val: (r.default_probability * 100).toFixed(1) + '%', color: rc },
          { label: 'Safe Loan',      val: `₹${r.safe_loan_amount.toLocaleString('en-IN')}`, color: '#22c55e' },
          { label: 'CIBIL Score',    val: r.cibil_data?.cibil_score || '—', sub: '/900' },
          { label: 'Anomaly Risk',   val: r.anomaly_risk_pct + '%', color: r.anomaly_flagged ? '#ef4444' : '#22c55e' },
          { label: 'Requested',      val: app.requested_loan_amount ? `₹${app.requested_loan_amount.toLocaleString('en-IN')}` : '—', color: 'var(--blue)' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color || 'var(--text)' }}>{k.val}</div>
            {k.sub && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{k.sub}</div>}
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Anomaly + profile */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Monthly Cash Flow</div>
          <div style={{ height: 200 }}>
            {months.length > 0 ? (
              <Bar data={{
                labels: months,
                datasets: [
                  { label: 'Credits', data: credits, backgroundColor: '#22c55e55', borderColor: '#22c55e', borderWidth: 1, borderRadius: 3 },
                  { label: 'Debits',  data: debits,  backgroundColor: '#ef444433', borderColor: '#ef4444', borderWidth: 1, borderRadius: 3 },
                ]
              }} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#7d8590', font: { size: 11 } } } },
                scales: {
                  x: { ticks: { color: '#7d8590', font: { size: 10 } }, grid: { color: '#21262d' } },
                  y: { ticks: { color: '#7d8590', callback: v => '₹' + (v/1000).toFixed(0) + 'K', font: { size: 10 } }, grid: { color: '#21262d' } }
                }
              }} />
            ) : <div style={{ color: 'var(--muted)', fontSize: 13 }}>No data</div>}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Applicant Profile</div>
          {[
            ['Name', r.cibil_data?.name],
            ['PAN', r.cibil_data?.pan],
            ['DOB', r.cibil_data?.dob],
            ['Income', `₹${app.declared_income?.toLocaleString('en-IN')}/mo`],
            ['Years in Biz', app.years_in_business + ' yrs'],
            ['On-Time Pmts', `${Math.round((r.cibil_data?.on_time_payment_pct || 0) * 100)}%`],
            ['Hard Inquiries', r.cibil_data?.hard_inquiries_12m + ' (12m)'],
          ].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ratios */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Financial Ratios</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { name: 'Credit–Debit Ratio', val: r.credit_debit_ratio, pct: Math.min(r.credit_debit_ratio * 100, 100), color: r.credit_debit_ratio >= 0.6 ? '#22c55e' : '#f59e0b' },
            { name: 'EMI-to-Income', val: r.emi_to_income_ratio, pct: Math.min(r.emi_to_income_ratio * 100, 100), color: r.emi_to_income_ratio > 0.5 ? '#ef4444' : '#22c55e' },
            { name: 'Income Consistency', val: (r.income_consistency * 100).toFixed(0) + '%', pct: r.income_consistency * 100, color: r.income_consistency >= 0.5 ? '#22c55e' : '#f59e0b' },
          ].map((rt, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: 'var(--muted)' }}>{rt.name}</span>
                <span style={{ fontWeight: 600, color: rt.color }}>{rt.val}</span>
              </div>
              <div className="ratio-bar-bg">
                <div className="ratio-bar-fill" style={{ width: `${rt.pct}%`, background: rt.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EMI details */}
      {app.emi_options?.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Selected EMI Plan</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              ['Tenure', app.selected_emi_months + ' months'],
              ['Monthly EMI', `₹${app.selected_emi_amount?.toLocaleString('en-IN') || '—'}`],
              ['Requested', `₹${app.requested_loan_amount?.toLocaleString('en-IN') || '—'}`],
            ].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockchain txns */}
      {app.blockchain_txns?.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Blockchain Audit Trail</div>
          {app.blockchain_txns.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span className="badge badge-purple">{t.action}</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--muted)', wordBreak: 'break-all' }}>{t.tx_hash || 'Pending'}</span>
              <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lender Action Panel */}
      {app.status === 'submitted' && (
        <div className="card">
          <div className="card-title">Take Action</div>
          {actionMsg && <div style={{ marginBottom: 14, fontSize: 13 }}>{actionMsg}</div>}
          <div className="form-group">
            <label>Note to Applicant</label>
            <input value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="Optional note or reason..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Modified Loan Amount (₹) — optional</label>
              <input type="number" value={modAmount} onChange={e => setModAmount(e.target.value)} placeholder="e.g. 80000" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Modified EMI (₹/mo) — optional</label>
              <input type="number" value={modEMI} onChange={e => setModEMI(e.target.value)} placeholder="e.g. 4500" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-success" disabled={actionBusy} onClick={() => onAction('approve')}>✅ Approve</button>
            <button className="btn btn-danger"  disabled={actionBusy} onClick={() => onAction('reject')}>❌ Reject</button>
            <button className="btn btn-amber"   disabled={actionBusy} onClick={() => onAction('modify')}>✏️ Modify Offer</button>
            <button className="btn btn-outline" disabled={actionBusy} onClick={() => onAction('request_docs')}>📋 Request Docs</button>
          </div>
        </div>
      )}
    </div>
  )
}
