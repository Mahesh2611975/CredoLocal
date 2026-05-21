import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../api/axios'

export default function LenderSelection() {
  const { matchedLenders, selectedEMI, applicationId, setSelectedLender, selectedLender, aiResult } = useApp()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (!aiResult) navigate('/apply') }, [aiResult])
  if (!aiResult) return null

  const handleSubmit = async () => {
    if (!selectedLender || !selectedEMI) return
    setSubmitting(true); setError('')
    try {
      await api.post('/applications/submit', {
        application_id:       applicationId,
        lender_id:            selectedLender.lender_id,
        requested_loan_amount: selectedEMI.loan_amount,
        selected_emi_months:  selectedEMI.tenure_months,
        selected_emi_amount:  selectedEMI.monthly_emi,
        selected_interest_rate: selectedEMI.interest_rate,
      })
      navigate('/my-applications')
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.')
    } finally { setSubmitting(false) }
  }

  const scoreColor = (s) => s >= 85 ? '#22c55e' : s >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Select a Lender</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>
        {matchedLenders.length > 0
          ? `${matchedLenders.length} lenders matched to your profile`
          : 'No lenders matched your profile at this time.'}
      </p>

      {/* Selected EMI summary */}
      {selectedEMI && (
        <div style={{
          background: '#3b82f612', border: '1px solid #3b82f644',
          borderRadius: 10, padding: '14px 20px', marginBottom: 24,
          display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Selected Plan</span>
          {[
            ['Loan', `₹${selectedEMI.loan_amount.toLocaleString('en-IN')}`],
            ['EMI', `₹${selectedEMI.monthly_emi.toLocaleString('en-IN')}/mo`],
            ['Tenure', `${selectedEMI.tenure_months} months`],
          ].map(([k,v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: 'var(--blue)' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{k}</div>
            </div>
          ))}
          <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }}
            onClick={() => navigate('/emi-selection')}>Change</button>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {matchedLenders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>😔</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No lenders matched</div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Try improving your CIBIL score or providing additional documents.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {matchedLenders.map((l, i) => {
            const isSelected = selectedLender?.lender_id === l.lender_id
            return (
              <div key={i}
                onClick={() => setSelectedLender(l)}
                style={{
                  background: isSelected ? '#22c55e08' : 'var(--surface)',
                  border: `2px solid ${isSelected ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  gap: 20,
                  alignItems: 'flex-start',
                }}>
                <div style={{
                  width: 52, height: 52,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>🏦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{l.name}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                        {l.interest_rate}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>per annum</div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>{l.description}</div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                      ['Loan Range', `₹${l.min_loan.toLocaleString('en-IN')} – ₹${l.max_loan.toLocaleString('en-IN')}`],
                      ['EMI (18mo)', `₹${l.sample_emi?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo`],
                      ['Match Score', l.match_score + '%'],
                    ].map(([k,v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: k === 'Match Score' ? scoreColor(l.match_score) : 'var(--text)' }}>{v}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{k}</div>
                      </div>
                    ))}
                  </div>
                  {/* match score bar */}
                  <div style={{ marginTop: 10 }}>
                    <div className="ratio-bar-bg">
                      <div className="ratio-bar-fill" style={{ width: `${l.match_score}%`, background: scoreColor(l.match_score) }} />
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{ color: 'var(--green)', fontSize: 22, flexShrink: 0 }}>✓</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-outline" onClick={() => navigate('/emi-selection')}>← Back</button>
        <button className="btn btn-success" style={{ padding: '12px 28px', fontSize: 15 }}
          disabled={!selectedLender || !selectedEMI || submitting}
          onClick={handleSubmit}>
          {submitting ? 'Submitting...' : '🚀 Submit Application →'}
        </button>
      </div>
    </div>
  )
}
