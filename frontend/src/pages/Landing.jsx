import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #161b22 0%, #0d1117 60%)',
        padding: '80px 24px 60px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'inline-block',
          background: '#3b82f622',
          border: '1px solid #3b82f644',
          color: 'var(--blue)',
          borderRadius: 20,
          padding: '4px 14px',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          marginBottom: 24,
        }}>AI + BLOCKCHAIN POWERED</div>
        <h1 style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-1px', marginBottom: 20, lineHeight: 1.1 }}>
          Microfinance Loans<br />
          <span style={{ color: 'var(--blue)' }}>Underwritten by AI</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 560, margin: '0 auto 36px' }}>
          Upload your financials, get AI-powered loan eligibility in seconds,
          choose your lender and EMI — all on an immutable blockchain audit trail.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register">
            <button className="btn btn-primary" style={{ padding: '13px 32px', fontSize: 15 }}>
              Apply for a Loan →
            </button>
          </Link>
          <Link to="/register?role=lender">
            <button className="btn btn-outline" style={{ padding: '13px 32px', fontSize: 15 }}>
              Join as Lender
            </button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginTop: 40 }}>
          {[
            { icon: '🧠', title: 'AI Underwriting', desc: 'LightGBM + Gradient Boosting models analyze 20+ financial signals from your bank data and CIBIL report.' },
            { icon: '⛓️', title: 'Blockchain Audit', desc: 'Every application, approval and rejection is cryptographically hashed and stored on Polygon — immutable forever.' },
            { icon: '📊', title: 'Smart EMI Engine', desc: 'Dynamic EMI options calculated per lender interest rates, your city tier, and selected tenure.' },
            { icon: '🏦', title: 'Lender Matching', desc: 'AI matches you with compatible lenders based on business type, risk score, and loan requirements.' },
          ].map((f, i) => (
            <div key={i} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 10 }}>{f.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>How it works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { step: '01', title: 'Fill your details', desc: 'Enter income, years in business, city tier and business type.' },
              { step: '02', title: 'Upload documents', desc: 'Upload your bank transactions CSV and CIBIL report HTML.' },
              { step: '03', title: 'AI analysis', desc: 'Our 3-model AI stack generates your trust score, default probability and eligible loan amount.' },
              { step: '04', title: 'Choose & apply', desc: 'Pick a lender, select your EMI plan and submit. Application goes live on the lender dashboard instantly.' },
              { step: '05', title: 'Lender decision', desc: 'Lender reviews the full AI analytics dashboard and approves, rejects or modifies your loan.' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 24,
                padding: '24px 0',
                borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  minWidth: 48, height: 48,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--blue)',
                }}>{s.step}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
