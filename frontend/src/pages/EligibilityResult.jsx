import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const RISK_COLOR = { 'LOW RISK': '#22c55e', 'MEDIUM RISK': '#f59e0b', 'HIGH RISK': '#ef4444' }
const RISK_BADGE = { 'LOW RISK': 'badge-green', 'MEDIUM RISK': 'badge-amber', 'HIGH RISK': 'badge-red' }

export default function EligibilityResult() {
  const { aiResult, txnData, cibilData } = useApp()
  const navigate = useNavigate()
  useEffect(() => { if (!aiResult) navigate('/apply') }, [aiResult])
  if (!aiResult) return null

  const rc = RISK_COLOR[aiResult.risk_category]
  const scorePct = ((aiResult.trust_score - 100) / 9).toFixed(1)
  const cibilPct = ((cibilData.cibil_score - 300) / 6).toFixed(1)

  const months = Object.keys(txnData.monthly_chart || {})
  const credits = months.map(m => txnData.monthly_chart[m].credit)
  const debits  = months.map(m => txnData.monthly_chart[m].debit)

  const topRKeys = Object.keys(txnData.top_recipients || {})
  const topRVals = Object.values(txnData.top_recipients || {})

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#7d8590', font: { size: 12 } } } },
    scales: {
      x: { ticks: { color: '#7d8590' }, grid: { color: '#21262d' } },
      y: { ticks: { color: '#7d8590', callback: v => '₹' + (v/1000).toFixed(0) + 'K' }, grid: { color: '#21262d' } }
    }
  }

  const ratios = [
    { name: 'Trust Score', val: aiResult.trust_score, max: 1000, pct: scorePct, color: rc },
    { name: 'CIBIL Score', val: `${cibilData.cibil_score}/900`, pct: cibilPct, color: cibilData.cibil_score >= 700 ? '#22c55e' : '#f59e0b' },
    { name: 'Income Consistency', val: (aiResult.income_consistency * 100).toFixed(0) + '%', pct: aiResult.income_consistency * 100, color: aiResult.income_consistency >= 0.5 ? '#22c55e' : '#f59e0b' },
    { name: 'Credit–Debit Ratio', val: aiResult.credit_debit_ratio, pct: Math.min(aiResult.credit_debit_ratio * 100, 100), color: aiResult.credit_debit_ratio >= 0.6 ? '#22c55e' : '#f59e0b' },
    { name: 'Anomaly Risk', val: aiResult.anomaly_risk_pct + '%', pct: aiResult.anomaly_risk_pct, color: aiResult.anomaly_risk_pct > 60 ? '#ef4444' : '#22c55e' },
  ]

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>AI Analysis Complete</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{cibilData.name} · {new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <span className={`badge ${RISK_BADGE[aiResult.risk_category]}`} style={{ fontSize: 13, padding: '6px 18px' }}>
          {aiResult.risk_category}
        </span>
      </div>

      {/* Anomaly banner */}
      <div style={{
        borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 24,
        background: aiResult.anomaly_flagged ? '#ef444412' : '#22c55e12',
        border: `1px solid ${aiResult.anomaly_flagged ? '#ef444444' : '#22c55e44'}`,
      }}>
        <span style={{ fontSize: 22 }}>{aiResult.anomaly_flagged ? '⚠️' : '✅'}</span>
        <div>
          <strong style={{ display: 'block', marginBottom: 2 }}>
            {aiResult.anomaly_flagged ? 'Transaction Anomaly Detected' : 'No Anomalies Detected'}
          </strong>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
            {aiResult.anomaly_flagged
              ? 'Unusual patterns found. Lender may request additional documents.'
              : 'Transaction behaviour is within normal parameters.'}
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Trust Score', val: aiResult.trust_score, sub: '/ 1000', color: rc },
          { label: 'Safe Loan Amount', val: `₹${aiResult.safe_loan_amount.toLocaleString('en-IN')}`, color: '#22c55e' },
          { label: 'Default Probability', val: (aiResult.default_probability * 100).toFixed(1) + '%', color: rc },
          { label: 'CIBIL Score', val: cibilData.cibil_score, sub: '/ 900', color: cibilData.cibil_score >= 700 ? '#22c55e' : '#f59e0b' },
          { label: 'Avg Monthly Credit', val: `₹${txnData.avg_monthly_credit.toLocaleString('en-IN')}` },
          { label: 'Avg Monthly Debit', val: `₹${txnData.avg_monthly_debit.toLocaleString('en-IN')}` },
        ].map((k, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: 18 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color || 'var(--text)', lineHeight: 1 }}>{k.val}</div>
            {k.sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{k.sub}</div>}
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Ratio bars + cash flow chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Key Financial Ratios</div>
          {ratios.map((r, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: 'var(--muted)' }}>{r.name}</span>
                <span style={{ fontWeight: 600, color: r.color }}>{r.val}</span>
              </div>
              <div className="ratio-bar-bg">
                <div className="ratio-bar-fill" style={{ width: `${Math.min(r.pct, 100)}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Monthly Cash Flow — {txnData.n_months} Months</div>
          <div style={{ height: 220 }}>
            <Bar data={{
              labels: months,
              datasets: [
                { label: 'Credits', data: credits, backgroundColor: '#22c55e55', borderColor: '#22c55e', borderWidth: 1.5, borderRadius: 4 },
                { label: 'Debits',  data: debits,  backgroundColor: '#ef444433', borderColor: '#ef4444', borderWidth: 1.5, borderRadius: 4 },
              ]
            }} options={chartOpts} />
          </div>
        </div>
      </div>

      {/* Top spend + open accounts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {topRKeys.length > 0 && (
          <div className="card">
            <div className="card-title">Top Spend Recipients</div>
            <div style={{ height: 200 }}>
              <Doughnut data={{
                labels: topRKeys,
                datasets: [{ data: topRVals, backgroundColor: ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899'], borderWidth: 0 }]
              }} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { color: '#7d8590', font: { size: 11 }, boxWidth: 10 } } } }} />
            </div>
          </div>
        )}
        <div className="card">
          <div className="card-title">Open Loan Accounts</div>
          {(cibilData.open_accounts || []).length === 0
            ? <p style={{ color: 'var(--muted)', fontSize: 13 }}>No open accounts found.</p>
            : (cibilData.open_accounts || []).map((a, i) => (
              <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{a.bank || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{a.type || '—'}</div>
                {[['Outstanding', `₹${(a.balance||0).toLocaleString('en-IN')}`],['EMI', `₹${(a.emi||0).toLocaleString('en-IN')}/mo`],['Rate', a.rate||'—']].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingTop: 4, borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
                    <span>{k}</span><strong style={{ color: 'var(--text)' }}>{v}</strong>
                  </div>
                ))}
              </div>
            ))
          }
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}
          onClick={() => navigate('/emi-selection')}>
          Continue: Choose EMI Plan →
        </button>
      </div>
    </div>
  )
}
