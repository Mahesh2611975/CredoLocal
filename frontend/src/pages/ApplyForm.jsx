import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../api/axios'

const BUSINESS_TYPES = [
  'Kirana/Grocery', 'Retail', 'Food & Beverage', 'Textile/Clothing',
  'Electronics', 'Pharmacy', 'Agriculture', 'Manufacturing',
  'Service/Repair', 'Transportation', 'Construction', 'Education', 'Other'
]

export default function ApplyForm() {
  const { setAiResult, setTxnData, setCibilData, setEmiOptions, setMatchedLenders, setApplicationId, setLoading } = useApp()
  const navigate = useNavigate()

  const [step, setStep]     = useState(1)
  const [error, setError]   = useState('')
  const [busy, setBusy]     = useState(false)

  const [form, setForm] = useState({
    declared_monthly_income: '',
    years_in_business: '',
    city_tier: '2',
    business_type: 'Kirana/Grocery',
  })
  const [csvFile, setCsvFile]     = useState(null)
  const [cibilFile, setCibilFile] = useState(null)

  const handleSubmit = async () => {
    if (!csvFile || !cibilFile) { setError('Please upload both files.'); return }
    setError(''); setBusy(true); setLoading(true)

    const fd = new FormData()
    fd.append('csv_file',   csvFile)
    fd.append('cibil_file', cibilFile)
    fd.append('declared_monthly_income', form.declared_monthly_income)
    fd.append('years_in_business',       form.years_in_business)
    fd.append('city_tier',               form.city_tier)
    fd.append('business_type',           form.business_type)

    try {
      const { data } = await api.post('/applications/analyze', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAiResult(data.ai_result)
      setTxnData(data.txn_data)
      setCibilData(data.cibil_data)
      setEmiOptions(data.emi_options)
      setMatchedLenders(data.matched_lenders)
      setApplicationId(data.application_id)
      navigate('/eligibility')
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Check your files and try again.')
    } finally { setBusy(false); setLoading(false) }
  }

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Loan Application</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Fill your details and upload documents for AI analysis.</p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {['Business Details', 'Upload Documents'].map((s, i) => (
          <div key={i} style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: `1px solid ${step === i + 1 ? 'var(--blue)' : 'var(--border)'}`,
            background: step === i + 1 ? '#3b82f622' : 'transparent',
            fontSize: 13,
            fontWeight: step === i + 1 ? 600 : 400,
            color: step === i + 1 ? 'var(--blue)' : 'var(--muted)',
            cursor: 'pointer',
          }} onClick={() => setStep(i + 1)}>
            <span style={{ opacity: 0.6, marginRight: 8 }}>{i + 1}</span>{s}
          </div>
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {step === 1 && (
        <div className="card">
          <div className="card-title">Business Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Declared Monthly Income (₹)</label>
              <input type="number" value={form.declared_monthly_income}
                onChange={e => setForm({...form, declared_monthly_income: e.target.value})}
                placeholder="e.g. 45000" />
            </div>
            <div className="form-group">
              <label>Years in Business</label>
              <input type="number" step="0.5" value={form.years_in_business}
                onChange={e => setForm({...form, years_in_business: e.target.value})}
                placeholder="e.g. 2.5" />
            </div>
            <div className="form-group">
              <label>City Tier</label>
              <select value={form.city_tier} onChange={e => setForm({...form, city_tier: e.target.value})}>
                <option value="1">Tier 1 — Metro (Delhi, Mumbai, Bangalore…)</option>
                <option value="2">Tier 2 — Major cities (Pune, Jaipur, Lucknow…)</option>
                <option value="3">Tier 3 — Small towns / Rural</option>
              </select>
            </div>
            <div className="form-group">
              <label>Business Type</label>
              <select value={form.business_type} onChange={e => setForm({...form, business_type: e.target.value})}>
                {BUSINESS_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 8 }}
            disabled={!form.declared_monthly_income || !form.years_in_business}
            onClick={() => setStep(2)}>
            Next: Upload Documents →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="card-title">Upload Documents</div>

          <FileUploadBox
            label="Bank Transactions CSV"
            accept=".csv"
            file={csvFile}
            onChange={setCsvFile}
            hint="CSV with columns: date, type (CREDITED/DEBITED), amount, recipient"
          />
          <FileUploadBox
            label="CIBIL Report HTML"
            accept=".html,.htm"
            file={cibilFile}
            onChange={setCibilFile}
            hint="Download your CIBIL report as HTML from CIBIL website"
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-success" onClick={handleSubmit} disabled={busy || !csvFile || !cibilFile}
              style={{ flex: 1 }}>
              {busy ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <span className="spinner" style={{ width: 18, height: 18 }}></span>
                  Running AI Analysis...
                </span>
              ) : '🧠 Analyze & Get Eligibility →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FileUploadBox({ label, accept, file, onChange, hint }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{label}</label>
      <label style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 20px',
        border: `2px dashed ${file ? 'var(--green)' : 'var(--border)'}`,
        borderRadius: 10,
        cursor: 'pointer',
        background: file ? '#22c55e08' : 'var(--bg)',
        transition: 'all 0.2s',
        gap: 8,
      }}>
        <span style={{ fontSize: 28 }}>{file ? '✅' : '📂'}</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {file ? file.name : `Click to upload ${label}`}
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>{hint}</span>
        <input type="file" accept={accept} style={{ display: 'none' }}
          onChange={e => onChange(e.target.files[0])} />
      </label>
    </div>
  )
}
