import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect } from 'react'

export default function EMISelection() {
  const { aiResult, emiOptions, setSelectedEMI, selectedEMI } = useApp()
  const navigate = useNavigate()
  useEffect(() => { if (!aiResult) navigate('/apply') }, [aiResult])
  if (!aiResult) return null

  const [customAmount, setCustomAmount] = useState(aiResult?.safe_loan_amount || 0)
  const [activeEMI, setActiveEMI] = useState(null)

  // recalculate EMI when user types a custom amount
  const calcEMI = (P, annualRate, n) => {
    const r = annualRate / 100 / 12
    if (r === 0) return P / n
    return (P * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1)
  }

  const displayOptions = emiOptions.map(opt => {
    const emi = calcEMI(customAmount, opt.interest_rate, opt.tenure_months)
    return {
      ...opt,
      loan_amount:    customAmount,
      monthly_emi:    Math.round(emi),
      total_payable:  Math.round(emi * opt.tenure_months),
      total_interest: Math.round(emi * opt.tenure_months - customAmount),
    }
  })

  const safeMax = aiResult.safe_loan_amount

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Choose Your EMI Plan</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>
        Max eligible: <strong style={{ color: 'var(--green)' }}>₹{safeMax.toLocaleString('en-IN')}</strong>
        &nbsp;— you can apply for a lower amount too.
      </p>

      {/* Loan amount slider */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Select Loan Amount</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <input type="range" min={5000} max={safeMax} step={1000}
              value={customAmount}
              onChange={e => { setCustomAmount(Number(e.target.value)); setActiveEMI(null) }}
              style={{ width: '100%', accentColor: 'var(--blue)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              <span>₹5,000</span><span>₹{safeMax.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 120 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--blue)' }}>
              ₹{customAmount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>loan amount</div>
          </div>
        </div>
      </div>

      {/* EMI options grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {displayOptions.map((opt, i) => {
          const isSelected = activeEMI?.tenure_months === opt.tenure_months
          return (
            <div key={i}
              onClick={() => { setActiveEMI(opt); setSelectedEMI(opt) }}
              style={{
                background: isSelected ? '#3b82f622' : 'var(--surface)',
                border: `2px solid ${isSelected ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {opt.tenure_months} months
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: isSelected ? 'var(--blue)' : 'var(--text)', marginBottom: 4 }}>
                ₹{opt.monthly_emi.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>per month</div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {[
                  ['Interest Rate', opt.interest_rate + '%'],
                  ['Total Payable', '₹' + opt.total_payable.toLocaleString('en-IN')],
                  ['Total Interest', '₹' + opt.total_interest.toLocaleString('en-IN')],
                ].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              {isSelected && (
                <div style={{ marginTop: 10, textAlign: 'center', color: 'var(--blue)', fontSize: 12, fontWeight: 600 }}>
                  ✓ Selected
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-outline" onClick={() => navigate('/eligibility')}>← Back</button>
        <button className="btn btn-primary" style={{ padding: '12px 28px' }}
          disabled={!activeEMI}
          onClick={() => navigate('/lender-selection')}>
          Continue: Choose Lender →
        </button>
      </div>
    </div>
  )
}
