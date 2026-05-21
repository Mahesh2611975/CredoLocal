import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

// ── Status config for simple language ─────────────────────────────────
const STATUS_INFO = {
  pending:        { icon: '🕐', text: 'Being checked',     color: '#7d8590', bg: '#21262d' },
  ai_analyzed:    { icon: '🧠', text: 'Analysis done',     color: '#3b82f6', bg: '#3b82f622' },
  submitted:      { icon: '📤', text: 'Sent to bank',      color: '#f59e0b', bg: '#f59e0b22' },
  approved:       { icon: '✅', text: 'Loan Approved!',    color: '#22c55e', bg: '#22c55e22' },
  rejected:       { icon: '❌', text: 'Not approved',      color: '#ef4444', bg: '#ef444422' },
  modified:       { icon: '✏️', text: 'Bank changed offer',color: '#f59e0b', bg: '#f59e0b22' },
  docs_requested: { icon: '📋', text: 'Documents needed',  color: '#f59e0b', bg: '#f59e0b22' },
}

export default function VendorDashboard() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [tab, setTab]           = useState('home')
  const [apps, setApps]         = useState([])
  const [smsStatus, setSmsStatus] = useState('not_granted') // not_granted | granted | processing | done
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/applications/my')
      .then(r => { setApps(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const latestApp = apps.length > 0 ? apps[apps.length - 1] : null
  const approvedApp = apps.find(a => a.status === 'approved')

  return (
    <div style={{
      maxWidth: 420,
      margin: '0 auto',
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '20px 20px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>NAMASTE,</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.full_name || 'Vendor'} 👋</div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>

        {tab === 'home' && (
          <HomeTab latestApp={latestApp} approvedApp={approvedApp} loading={loading} navigate={navigate} />
        )}
        {tab === 'loan' && (
          <LoanTab apps={apps} loading={loading} navigate={navigate} />
        )}
        {tab === 'sms' && (
          <SMSPrivacyTab smsStatus={smsStatus} setSmsStatus={setSmsStatus} />
        )}
        {tab === 'help' && (
          <HelpTab />
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        display: 'flex',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '8px 0 4px',
      }}>
        {[
          { key: 'home', icon: '🏠', label: 'Home' },
          { key: 'loan', icon: '💰', label: 'My Loan' },
          { key: 'sms',  icon: '🔒', label: 'Privacy' },
          { key: 'help', icon: '❓', label: 'Help' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
              padding: '6px 0',
              color: tab === t.key ? 'var(--blue)' : 'var(--muted)',
            }}>
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontSize: 10, marginTop: 2, fontWeight: tab === t.key ? 600 : 400 }}>{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Home Tab ───────────────────────────────────────────────────────────
function HomeTab({ latestApp, approvedApp, loading, navigate }) {
  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Eligibility card */}
      {!latestApp ? (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f, #0d1117)',
          border: '1px solid #3b82f644',
          borderRadius: 16,
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💼</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Check your loan</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            Find out how much loan you can get. Takes only 2 minutes.
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 15, borderRadius: 12 }}
            onClick={() => navigate('/apply')}>
            Check Eligibility →
          </button>
        </div>
      ) : (
        <EligibilityCard app={latestApp} />
      )}

      {/* Active loan */}
      {approvedApp && (
        <ActiveLoanCard app={approvedApp} />
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { icon: '📊', label: 'View Analysis', action: () => navigate('/eligibility'), show: !!latestApp?.ai_report },
          { icon: '🏦', label: 'Choose Bank',   action: () => navigate('/lender-selection'), show: latestApp?.status === 'ai_analyzed' },
          { icon: '📋', label: 'My Applications', action: () => navigate('/my-applications'), show: true },
          { icon: '➕', label: 'New Application', action: () => navigate('/apply'), show: true },
        ].filter(a => a.show).map((a, i) => (
          <button key={i} onClick={a.action}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 12px',
              cursor: 'pointer',
              textAlign: 'center',
              color: 'var(--text)',
            }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function EligibilityCard({ app }) {
  const st = STATUS_INFO[app.status] || STATUS_INFO.pending
  return (
    <div style={{
      background: st.bg,
      border: `1px solid ${st.color}44`,
      borderRadius: 16,
      padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 28 }}>{st.icon}</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 6, color: st.color }}>{st.text}</div>
        </div>
        {app.loan_amount && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
              ₹{app.loan_amount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>requested</div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
        {app.business_type} · Tier {app.city_tier} city
        {app.lender_name && ` · ${app.lender_name}`}
      </div>
    </div>
  )
}

function ActiveLoanCard({ app }) {
  const emi = app.selected_emi_amount
  const total = app.requested_loan_amount
  return (
    <div style={{
      background: '#22c55e12',
      border: '1px solid #22c55e44',
      borderRadius: 16,
      padding: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: '#22c55e' }}>
        ✅ Active Loan
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
        {[
          ['Loan Amount', `₹${total?.toLocaleString('en-IN') || '—'}`],
          ['Monthly EMI', `₹${emi?.toLocaleString('en-IN') || '—'}`],
          ['Months', app.selected_emi_months || '—'],
        ].map(([k,v]) => (
          <div key={k} style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 6px' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{v}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{k}</div>
          </div>
        ))}
      </div>
      {app.lender_note && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', background: 'var(--bg)', padding: '8px 12px', borderRadius: 8 }}>
          📩 Bank note: {app.lender_note}
        </div>
      )}
    </div>
  )
}

// ── Loan Tab ───────────────────────────────────────────────────────────
function LoanTab({ apps, loading, navigate }) {
  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  if (apps.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>No loan applied yet</div>
        <div style={{ color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>Apply for a loan to see your status here.</div>
        <button className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: 12 }} onClick={() => navigate('/apply')}>
          Apply Now →
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Your Applications</div>
      {apps.map(a => {
        const st = STATUS_INFO[a.status] || STATUS_INFO.pending
        return (
          <div key={a.id} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>{st.icon}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.business_type}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(a.created_at).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
              <div style={{ color: st.color, fontWeight: 600, fontSize: 13 }}>{st.text}</div>
            </div>

            {/* Simple progress bar */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['Submitted', 'Under Review', 'Decision'].map((s, i) => {
                const doneIdx = { submitted: 0, ai_analyzed: 0, submitted: 1, approved: 2, rejected: 2, modified: 1, docs_requested: 1 }
                const cur = doneIdx[a.status] ?? 0
                return (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= cur ? st.color : 'var(--border)' }} />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
              <span>Submitted</span><span>Reviewing</span><span>Decision</span>
            </div>

            {a.loan_amount && (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>
                ₹{a.loan_amount.toLocaleString('en-IN')} · {a.lender_name || 'Lender TBD'}
              </div>
            )}

            {/* EMI repayment schedule for approved loans */}
            {a.status === 'approved' && a.selected_emi_amount && (
              <div style={{ marginTop: 12, background: 'var(--bg)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Repayment Schedule</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#22c55e' }}>₹{a.selected_emi_amount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Every month</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.selected_emi_months}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Months total</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── SMS Privacy Tab ────────────────────────────────────────────────────
function SMSPrivacyTab({ smsStatus, setSmsStatus }) {
  const steps = [
    { icon: '📱', title: 'Reading your messages', detail: 'We read your bank SMS messages only' },
    { icon: '🔍', title: 'Finding bank messages', detail: 'We look for messages from banks only — not personal chats' },
    { icon: '🧮', title: 'Calculating on your phone', detail: 'All calculations happen on your phone. Nothing is sent until you agree' },
    { icon: '🔒', title: 'Only numbers are sent', detail: 'We only send your total income/expense numbers — NOT your actual messages' },
    { icon: '🗑️', title: 'Messages are not saved', detail: 'We never store your SMS. No bank names, no account numbers sent' },
  ]

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Privacy Control</div>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
        Your messages are private. Here's exactly what we do:
      </div>

      {/* Privacy steps */}
      {steps.map((s, i) => (
        <div key={i} style={{
          display: 'flex', gap: 14, padding: '14px 0',
          borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#22c55e22', border: '1px solid #22c55e44',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>{s.icon}</div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{s.detail}</div>
          </div>
        </div>
      ))}

      {/* SMS permission control */}
      <div style={{
        marginTop: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 18,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>SMS Access Status</div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 0',
        }}>
          <div>
            <div style={{ fontSize: 14 }}>
              {smsStatus === 'granted' ? '✅ Access allowed' : '⏸️ Access not given yet'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {smsStatus === 'granted' ? 'You can remove access any time' : 'Needed to auto-fill your income details'}
            </div>
          </div>
          <button
            className={`btn ${smsStatus === 'granted' ? 'btn-danger' : 'btn-success'}`}
            style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
            onClick={() => setSmsStatus(smsStatus === 'granted' ? 'not_granted' : 'granted')}>
            {smsStatus === 'granted' ? 'Remove' : 'Allow'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          ⚠️ Even if you allow access, your messages stay on your phone. Only your income and expense totals are shared with us.
        </div>
      </div>
    </div>
  )
}

// ── Help Tab ───────────────────────────────────────────────────────────
function HelpTab() {
  const [openIdx, setOpenIdx] = useState(null)

  const faqs = [
    { q: 'How do I know how much loan I can get?', a: 'Upload your last 6 months bank statements and CIBIL report. Our system will tell you the exact amount in seconds.' },
    { q: 'What documents do I need?', a: 'Just two files: 1) Your bank transactions as a CSV file, and 2) Your CIBIL credit report as an HTML file. Download CIBIL report from www.cibil.com.' },
    { q: 'Is my information safe?', a: 'Yes. Your bank messages never leave your phone. Only total income/expense numbers are sent to us — never your actual messages or account numbers.' },
    { q: 'How long does approval take?', a: 'Our AI checks your application in seconds. The lender then reviews it, which usually takes 1–3 working days.' },
    { q: 'What if my loan is rejected?', a: 'Don\'t worry. You can improve your CIBIL score and apply again after 3 months. The rejection reason will be shown on screen.' },
    { q: 'How do I repay my EMI?', a: 'Your lender will share repayment details after approval. You can pay via UPI, NEFT, or direct bank transfer.' },
    { q: 'Can I apply for a smaller loan than what\'s offered?', a: 'Yes! You can always choose a smaller amount using the slider on the EMI selection screen.' },
  ]

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Help & Support</div>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>Common questions answered simply.</div>

      {faqs.map((f, i) => (
        <div key={i} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          marginBottom: 8,
          overflow: 'hidden',
        }}>
          <div
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            style={{
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 500,
              fontSize: 14,
            }}>
            {f.q}
            <span style={{ color: 'var(--muted)', fontSize: 18 }}>{openIdx === i ? '−' : '+'}</span>
          </div>
          {openIdx === i && (
            <div style={{
              padding: '0 16px 14px',
              fontSize: 13,
              color: 'var(--muted)',
              lineHeight: 1.6,
              borderTop: '1px solid var(--border)',
              paddingTop: 12,
            }}>
              {f.a}
            </div>
          )}
        </div>
      ))}

      {/* Contact */}
      <div style={{
        marginTop: 16,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 18,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📞</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Still need help?</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>Call or WhatsApp us — we reply in Hindi/English</div>
        <button className="btn btn-outline" style={{ width: '100%', padding: 12, borderRadius: 10 }}>
          WhatsApp Support →
        </button>
      </div>
    </div>
  )
}
