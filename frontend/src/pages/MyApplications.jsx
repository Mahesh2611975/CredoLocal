import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../api/axios'

// Premium Lucide SVG Icon Components for clean UI design (No raw text emojis)
const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
)
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
)
const CpuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 15h3"/><path d="M1 9h3"/><path d="M1 15h3"/></svg>
)
const LandmarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><path d="m12 2-9 4v3h18V6Z"/></svg>
)
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6Z"/><path d="m9 12 2 2 4-4"/></svg>
)
const ShieldAlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
)
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
)
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
)
const ArrowUpRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" x2="17" y1="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
)

// Professional Color Palette Mapping (Warm Cream background profiles, Deep Forest Greens, Earthy Browns)
const STATUS_META = {
  pending: {
    label: 'Pending Review',
    color: '#4E6E5D', // Dark muted sage green
    bg: '#F4F7F5',
    border: '#DCE4E0',
    icon: <ClockIcon />,
    desc: 'Application successfully initialized. Automated background workflows are currently analyzing standard banking structures.'
  },
  ai_analyzed: {
    label: 'AI Analyzed',
    color: '#2E5A88', // Elegant deep slate blue
    bg: '#F0F5FA',
    border: '#D2E1ED',
    icon: <CpuIcon />,
    desc: 'Risk models have successfully verified structural cash flows. Information dispatched to credit partner networks.'
  },
  lender_selected: {
    label: 'Lender Matching',
    color: '#6D5D4E', // Refined brown tint
    bg: '#F9F6F3',
    border: '#EBE3DB',
    icon: <LandmarkIcon />,
    desc: 'A premium micro-lending provider has claimed this registry file and is establishing optimized criteria records.'
  },
  submitted: {
    label: 'Submitted to Desk',
    color: '#875233', // Warm terracotta earth tone
    bg: '#FAF4F0',
    border: '#F0E2D8',
    icon: <FileTextIcon />,
    desc: 'Credit application dossier securely locked and transmitted directly to financial desk underwriters.'
  },
  approved: {
    label: 'Active & Approved',
    color: '#2A5C3A', // Rich Emerald green
    bg: '#EAF4EE',
    border: '#CBE4D4',
    icon: <ShieldCheckIcon />,
    desc: 'Credit assessment complete. Core policy clear with minimal risk vectors. Asset capitalization is active.'
  },
  rejected: {
    label: 'Declined',
    color: '#963E3E', // Subdued corporate burgundy
    bg: '#FDF2F2',
    border: '#F7DBDB',
    icon: <ShieldAlertIcon />,
    desc: 'High architectural variance detected within standard transaction registries. Review parameters below.'
  },
  modified: {
    label: 'Counter Offer',
    color: '#A06E28', // Muted Gold/Amber
    bg: '#FCF7EE',
    border: '#F4E7CE',
    icon: <EditIcon />,
    desc: 'Action Advised: An altered financial offer structure has been calculated by the partner matching desk.'
  },
  docs_requested: {
    label: 'Action Required',
    color: '#A06E28',
    bg: '#FCF7EE',
    border: '#F4E7CE',
    icon: <FileTextIcon />,
    desc: 'Action Advised: Underwriting profiles mandate immediate provision of validated business credentials.'
  }
}

export default function MyApplications() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [appDetails, setAppDetails] = useState({})
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/applications/my')
      .then(r => { setApps(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const handleCardClick = async (appId) => {
    if (selectedId === appId) {
      setSelectedId(null)
      return
    }
    
    setSelectedId(appId)
    if (!appDetails[appId]) {
      setDetailsLoading(true)
      try {
        const response = await api.get(`/applications/${appId}`)
        setAppDetails(prev => ({ ...prev, [appId]: response.data }))
      } catch (err) {
        console.error("Error retrieving application packet:", err)
      } finally {
        setDetailsLoading(false)
      }
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div> Assembling Registry View...</div>

  return (
    <div className="page-container" style={{ maxWidth: '940px', margin: '0 auto', padding: '40px 24px', background: '#FAF8F5', minHeight: '100vh' }}>
      
      {/* Upper Management Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2C3E35', letterSpacing: '-0.5px', margin: 0 }}>My Applications</h1>
          <p style={{ margin: '4px 0 0 0', color: '#7A8B82', fontSize: 14 }}>Track and view real-time automated ledger distributions.</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ 
            background: '#3A5A40', 
            color: '#FFF', 
            border: 'none', 
            padding: '12px 20px', 
            borderRadius: '8px', 
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(58,90,64,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }} 
          onClick={() => navigate('/apply')}
        >
          New Application <ArrowUpRightIcon />
        </button>
      </div>

      {apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: '#FFF', border: '1px solid #EBE7E0', borderRadius: '16px' }}>
          <div style={{ color: '#A3B19B', marginBottom: 16, display: 'flex', justifyContent: 'center' }}><FileTextIcon /></div>
          <div style={{ fontWeight: 600, fontSize: 18, color: '#3A4D43', marginBottom: 6 }}>No active loans found</div>
          <div style={{ color: '#7A8B82', fontSize: 14, marginBottom: 24 }}>Upload accounting statements to launch dynamic risk calculations.</div>
          <button className="btn btn-primary" style={{ background: '#3A5A40', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600 }} onClick={() => navigate('/apply')}>Launch First Application</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {apps.map(a => {
            const m = STATUS_META[a.status] || STATUS_META.pending
            const isExpanded = selectedId === a.id
            const details = appDetails[a.id]
            const loanAmount = a.requested_loan_amount || a.loan_amount

            return (
              <div key={a.id} 
                style={{ 
                  cursor: 'pointer', 
                  padding: '24px',
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  border: isExpanded ? `1px solid ${m.color}` : '1px solid #EBE7E0',
                  boxShadow: isExpanded ? '0 10px 30px rgba(44,62,53,0.06)' : '0 2px 8px rgba(0,0,0,0.01)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onClick={() => handleCardClick(a.id)}>
                
                {/* Main Visible Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: '12px', 
                      background: m.bg, 
                      color: m.color, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: `1px solid ${m.border}`
                    }}>
                      {m.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16, color: '#2C3E35', marginBottom: 4 }}>
                        {a.business_type || 'Commercial Profile'} · Tier {a.city_tier || 'N/A'}
                        {loanAmount && <span style={{ marginLeft: 12, color: '#3A5A40', fontWeight: 700 }}>₹{loanAmount.toLocaleString('en-IN')}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#7A8B82' }}>
                        {(a.lender?.name || a.lender_name) && <span style={{ color: '#4A554F', fontWeight: 500 }}>{a.lender?.name || a.lender_name} · </span>}
                        Originated {new Date(a.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 14px', 
                      borderRadius: '8px', 
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: '0.2px',
                      background: m.bg,
                      color: m.color,
                      border: `1px solid ${m.border}`
                    }}>{m.label}</span>
                    <div style={{ fontSize: 11, color: '#A3B19B', marginTop: 6, fontFamily: 'monospace' }}>APPID #{a.id}</div>
                  </div>
                </div>

                {/* Smooth Hidden Expandable Details Drawer */}
                {isExpanded && (
                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #EBE7E0' }} onClick={(e) => e.stopPropagation()}>
                    
                    {/* Status Descriptor Card */}
                    <div style={{ 
                      background: m.bg, 
                      borderLeft: `4px solid ${m.color}`, 
                      padding: '16px 20px', 
                      borderRadius: '8px', 
                      marginBottom: 24 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: m.color, fontSize: 14, marginBottom: 4 }}>
                        <span style={{ display: 'inline-flex', scale: '0.85' }}>{m.icon}</span> System Status Log
                      </div>
                      <p style={{ margin: 0, fontSize: 13.5, color: '#4A554F', lineHeight: '1.5' }}>
                        {m.desc}
                      </p>
                    </div>

                    <ApplicationTimeline status={a.status} />

                    {detailsLoading && !details ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#7A8B82', fontSize: 14 }}>Parsing secure telemetry nodes...</div>
                    ) : details ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 12 }}>
                        
                        {/* Lender Counter Offer Conditionals */}
                        {details.status === 'modified' && (
                          <div style={{ background: '#FFFDF0', border: '1px solid #F3E5AB', padding: '16px', borderRadius: '10px' }}>
                            <div style={{ fontWeight: 700, color: '#8A6D3B', fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <InfoIcon /> Counter-Offer Parameters Proposed
                            </div>
                            <p style={{ margin: 0, fontSize: 13.5, color: '#5C5346', lineHeight: '1.5' }}>
                              Lender <strong>{details.lender?.name}</strong> requested a profile evaluation update. 
                              Desk Specification Note: <span style={{ background: '#F9F1D2', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>"{details.lender_note}"</span>
                              <br />
                              Principal capital availability updated to <strong style={{ color: '#8A6D3B', fontSize: 15 }}>₹{details.modified_loan_amount?.toLocaleString('en-IN')}</strong>.
                            </p>
                          </div>
                        )}

                        {/* Summary Data Grid */}
                        <div>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#2C3E35' }}>Financial File Overview</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            <div style={{ padding: '14px', background: '#FBFBFA', borderRadius: '10px', border: '1px solid #F0EDE8' }}>
                              <div style={{ fontSize: 12, color: '#7A8B82' }}>Capital Allocation Range</div>
                              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4, color: '#2C3E35' }}>
                                ₹{details.requested_loan_amount?.toLocaleString('en-IN')} 
                                {details.modified_loan_amount && <span style={{ color: '#A06E28' }}> → ₹{details.modified_loan_amount?.toLocaleString('en-IN')}</span>}
                              </div>
                            </div>
                            <div style={{ padding: '14px', background: '#FBFBFA', borderRadius: '10px', border: '1px solid #F0EDE8' }}>
                              <div style={{ fontSize: 12, color: '#7A8B82' }}>Declared Cash Flows</div>
                              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4, color: '#2C3E35' }}>₹{details.declared_income?.toLocaleString('en-IN')}</div>
                            </div>
                            <div style={{ padding: '14px', background: '#FBFBFA', borderRadius: '10px', border: '1px solid #F0EDE8' }}>
                              <div style={{ fontSize: 12, color: '#7A8B82' }}>Term Structure</div>
                              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4, color: '#2C3E35' }}>{details.selected_emi_months} Calendar Months</div>
                            </div>
                            <div style={{ padding: '14px', background: '#FBFBFA', borderRadius: '10px', border: '1px solid #F0EDE8' }}>
                              <div style={{ fontSize: 12, color: '#7A8B82' }}>Monthly Service Outflow</div>
                              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4, color: '#3A5A40' }}>₹{details.selected_emi_amount?.toLocaleString('en-IN')}/mo</div>
                            </div>
                          </div>
                        </div>

                        {/* Artificial Intelligence Structural Report */}
                        {details.ai_report && (
                          <div style={{ border: '1px solid #E4EBE7', background: '#FDFDFD', padding: '20px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#2C3E35', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CpuIcon /> Core Underwriting Engine Verification
                              </h4>
                              <span style={{ 
                                padding: '4px 10px', 
                                borderRadius: '6px', 
                                fontSize: 11, 
                                fontWeight: 700,
                                letterSpacing: '0.3px',
                                background: details.ai_report.risk_category === 'HIGH RISK' ? '#FDF2F2' : details.ai_report.risk_category === 'MEDIUM RISK' ? '#FCF7EE' : '#EAF4EE',
                                color: details.ai_report.risk_category === 'HIGH RISK' ? '#963E3E' : details.ai_report.risk_category === 'MEDIUM RISK' ? '#A06E28' : '#2A5C3A',
                                border: `1px solid ${details.ai_report.risk_category === 'HIGH RISK' ? '#F7DBDB' : details.ai_report.risk_category === 'MEDIUM RISK' ? '#F4E7CE' : '#CBE4D4'}`
                              }}>
                                {details.ai_report.risk_category}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                              <div style={{ padding: '12px', background: '#FFF', borderRadius: '8px', border: '1px solid #EBE7E0', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: '#7A8B82' }}>System Trust Score</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#2E5A88', marginTop: 4 }}>{details.ai_report.trust_score}</div>
                              </div>
                              <div style={{ padding: '12px', background: '#FFF', borderRadius: '8px', border: '1px solid #EBE7E0', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: '#7A8B82' }}>Bureau CIBIL Pull</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#2A5C3A', marginTop: 4 }}>{details.ai_report.cibil_data?.cibil_score || 'N/A'}</div>
                              </div>
                              <div style={{ padding: '12px', background: '#FFF', borderRadius: '8px', border: '1px solid #EBE7E0', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: '#7A8B82' }}>Max Safe Capacity</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#2C3E35', marginTop: 6 }}>₹{details.ai_report.safe_loan_amount?.toLocaleString('en-IN')}</div>
                              </div>
                              <div style={{ padding: '12px', background: '#FFF', borderRadius: '8px', border: '1px solid #EBE7E0', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: '#7A8B82' }}>Default Deviation</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#963E3E', marginTop: 6 }}>{(details.ai_report.default_probability * 100).toFixed(1)}%</div>
                              </div>
                            </div>

                            {/* Anomaly warning flags */}
                            {details.ai_report.anomaly_flagged && (
                              <div style={{ background: '#FCF7EE', padding: '12px 16px', borderRadius: '8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, color: '#A06E28', border: '1px solid #F4E7CE', marginBottom: 14 }}>
                                <InfoIcon />
                                <span><strong>Anomalous Variance Flagged:</strong> Internal algorithms captured structural inconsistencies inside electronic ledger rows. Deviation variance: {details.ai_report.anomaly_risk_pct}%.</span>
                              </div>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#4A554F', pt: 4 }}>
                              <div>• <strong>Debt Service Coverage Ratio:</strong> {(details.ai_report.emi_to_income_ratio * 100).toFixed(1)}%</div>
                              <div>• <strong>Cash Velocity Fluidity Index:</strong> {details.ai_report.credit_debit_ratio}</div>
                              <div>• <strong>Bureau Historic Cleanliness:</strong> {(details.ai_report.cibil_data?.on_time_payment_pct * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        )}

                        {/* Repayment matrices table */}
                        {details.emi_options && details.emi_options.length > 0 && (
                          <div>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#2C3E35' }}>Eligible Amortization Alternatives</h4>
                            <div style={{ overflowX: 'auto', border: '1px solid #EBE7E0', borderRadius: '10px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left', background: '#FFF' }}>
                                <thead>
                                  <tr style={{ background: '#FBFBFA', borderBottom: '1px solid #EBE7E0', color: '#56665D' }}>
                                    <th style={{ padding: '12px 16px' }}>Term Structure</th>
                                    <th style={{ padding: '12px 16px' }}>Calculated APR</th>
                                    <th style={{ padding: '12px 16px' }}>Monthly Installment</th>
                                    <th style={{ padding: '12px 16px' }}>Cumulative Interest</th>
                                    <th style={{ padding: '12px 16px' }}>Aggregate Outflow</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {details.emi_options.map((opt, index) => (
                                    <tr key={index} style={{ borderBottom: index !== details.emi_options.length - 1 ? '1px solid #F0EDE8' : 'none', color: '#4A554F' }}>
                                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2C3E35' }}>{opt.tenure_months} Months</td>
                                      <td style={{ padding: '12px 16px' }}>{opt.interest_rate}%</td>
                                      <td style={{ padding: '12px 16px', color: '#3A5A40', fontWeight: 600 }}>₹{opt.monthly_emi?.toLocaleString('en-IN')}</td>
                                      <td style={{ padding: '12px 16px', color: '#963E3E' }}>₹{opt.total_interest?.toLocaleString('en-IN')}</td>
                                      <td style={{ padding: '12px 16px' }}>₹{opt.total_payable?.toLocaleString('en-IN')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Blockchain Web3 Ledger Records trail */}
                        {details.blockchain_txns && details.blockchain_txns.length > 0 && (
                          <div style={{ background: '#F5F4F0', border: '1px solid #E4DFD5', padding: '16px', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 600, color: '#4A554F', display: 'flex', alignItems: 'center', gap: 6 }}>
                              Cryptographic Transaction Audit Trail
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {details.blockchain_txns.map((tx, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, paddingBottom: idx !== details.blockchain_txns.length - 1 ? '10px' : '0', borderBottom: idx !== details.blockchain_txns.length - 1 ? '1px dashed #E4DFD5' : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ textTransform: 'uppercase', fontSize: 10, padding: '3px 8px', borderRadius: '4px', background: '#E4DFD5', fontWeight: 700, color: '#5C5346' }}>
                                      {tx.action}
                                    </span>
                                    <code style={{ color: '#6A756F', background: '#FFF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #E4DFD5', fontSize: 11, fontFamily: 'monospace' }}>
                                      {tx.tx_hash.substring(0, 20)}...{tx.tx_hash.substring(tx.tx_hash.length - 12)}
                                    </code>
                                  </div>
                                  <div style={{ color: '#7A8B82', fontSize: 11 }}>
                                    {new Date(tx.created_at).toLocaleTimeString('en-IN')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#963E3E', fontSize: 13 }}>Failed to map downstream JSON telemetry configurations.</div>
                    )}
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

function ApplicationTimeline({ status }) {
  const steps = [
    { key: 'submitted',      label: 'Submitted',       icon: <FileTextIcon /> },
    { key: 'under_review',   label: 'Review Active',   icon: <ClockIcon /> },
    { key: 'modified',       label: 'Offer Computed',  icon: <EditIcon /> },
    { key: 'approved',      label: 'Resolution',      icon: <ShieldCheckIcon /> },
  ]
  
  const isDone = (k) => {
    const order = { submitted: 1, ai_analyzed: 2, lender_selected: 2, under_review: 2, docs_requested: 2, modified: 3, approved: 4, rejected: 4 }
    const cur = order[status] || 1
    return order[k] <= cur
  }

  return (
    <div style={{ display: 'flex', gap: 0, margin: '24px 0 32px 0' }}>
      {steps.map((s, i) => {
        const finished = isDone(s.key)
        let activeColor = '#3A5A40' // Primary Deep Forest Green
        
        if ((status === 'modified' || status === 'docs_requested') && s.key === 'modified') {
          activeColor = '#A06E28' // Amber
        } else if (status === 'rejected' && s.key === 'approved') {
          activeColor = '#963E3E' // Burgundy Decline
        }

        return (
          <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* Step Connection Bar */}
            {i < steps.length - 1 && (
              <div style={{ 
                position: 'absolute', 
                top: 18, 
                left: '50%', 
                right: '-50%', 
                height: 2, 
                background: isDone(steps[i+1]?.key) ? activeColor : '#EBE7E0',
                zIndex: 0
              }} />
            )}
            
            {/* Circular SVG Icon Wrap */}
            <div style={{
              width: 38, 
              height: 38, 
              borderRadius: '50%',
              background: finished ? activeColor : '#FFF',
              border: `2px solid ${finished ? activeColor : '#EBE7E0'}`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative', 
              zIndex: 1,
              color: finished ? '#FFF' : '#A3B19B',
              boxShadow: finished ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
              scale: finished ? '1.05' : '1'
            }}>
              {finished ? (
                status === 'rejected' && s.key === 'approved' ? <ShieldAlertIcon /> : 
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : s.icon}
            </div>
            
            <div style={{ 
              fontSize: 12, 
              fontWeight: finished ? '600' : '400', 
              color: finished ? '#2C3E35' : '#7A8B82', 
              marginTop: 10, 
              textAlign: 'center' 
            }}>
              {s.key === 'approved' && status === 'rejected' ? 'Declined' : s.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}