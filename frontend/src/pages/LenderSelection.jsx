
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import api from '../api/axios'

export default function LenderSelection() {
  const {
    matchedLenders,
    selectedEMI,
    applicationId,
    setSelectedLender,
    selectedLender,
    aiResult
  } = useApp()

  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Redirect if AI analysis is not available
  useEffect(() => {
    if (!aiResult) {
      navigate('/apply')
    }
  }, [aiResult, navigate])

  if (!aiResult) return null

  // Safely handle lender data
  const lenders = Array.isArray(matchedLenders)
    ? matchedLenders
    : []

  // Filter lenders according to selected loan amount
  const eligibleLenders = lenders.filter((l) => {
    if (!selectedEMI) return false

    const amount = Number(selectedEMI.loan_amount)
    const minLoan = Number(l.min_loan)
    const maxLoan = Number(l.max_loan)

    return (
      Number.isFinite(amount) &&
      Number.isFinite(minLoan) &&
      Number.isFinite(maxLoan) &&
      amount >= minLoan &&
      amount <= maxLoan
    )
  })

  // Check selected lender
  const selectedLenderIsEligible = eligibleLenders.some(
    (l) =>
      String(l.lender_id) === String(selectedLender?.lender_id)
  )

  // Handle lender selection
  const handleSelectLender = (lender) => {
    setSelectedLender(lender)
    setError('')
  }

  // Submit application
  const handleSubmit = async () => {
    if (!applicationId) {
      setError('Application ID is missing. Please complete the analysis again.')
      return
    }

    if (!selectedEMI) {
      setError('Please select an EMI option.')
      return
    }

    if (!selectedLenderIsEligible) {
      setError('Please select an eligible lender.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await api.post('/applications/submit', {
        application_id: applicationId,
        lender_id: selectedLender.lender_id,
        requested_loan_amount: Number(selectedEMI.loan_amount),
        selected_emi_months: Number(selectedEMI.tenure_months),
        selected_emi_amount: Number(selectedEMI.monthly_emi),
        selected_interest_rate: Number(selectedEMI.interest_rate),
      })

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message || 'Application submission failed.'
        )
      }

      navigate('/my-applications')

    } catch (err) {
      console.error('Application submission error:', err)

      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Submission failed. Please try again.'

      setError(
        typeof detail === 'string'
          ? detail
          : JSON.stringify(detail)
      )

    } finally {
      setSubmitting(false)
    }
  }

  const scoreColor = (s) =>
    s >= 85 ? '#22c55e' :
    s >= 70 ? '#f59e0b' :
    '#ef4444'

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    })

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>

      <h1 style={{
        fontSize: 26,
        fontWeight: 700,
        marginBottom: 4
      }}>
        Select a Lender
      </h1>

      <p style={{
        color: 'var(--muted)',
        marginBottom: 28
      }}>
        {eligibleLenders.length > 0
          ? `${eligibleLenders.length} lenders matched your selected loan amount`
          : 'No eligible lenders found for your selected loan amount.'}
      </p>

      {/* Selected EMI summary */}
      {selectedEMI && (
        <div style={{
          background: '#3b82f612',
          border: '1px solid #3b82f644',
          borderRadius: 10,
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
        }}>

          <span style={{
            fontSize: 12,
            color: 'var(--muted)'
          }}>
            Selected Plan
          </span>

          {[
            ['Loan', `₹${formatCurrency(selectedEMI.loan_amount)}`],
            ['EMI', `₹${formatCurrency(selectedEMI.monthly_emi)}/mo`],
            ['Tenure', `${selectedEMI.tenure_months} months`],
          ].map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{
                fontWeight: 600,
                color: 'var(--blue)'
              }}>
                {v}
              </div>

              <div style={{
                fontSize: 11,
                color: 'var(--muted)'
              }}>
                {k}
              </div>
            </div>
          ))}

          <button
            className="btn btn-outline"
            style={{
              padding: '4px 12px',
              fontSize: 12
            }}
            onClick={() => navigate('/emi-selection')}
          >
            Change
          </button>

        </div>
      )}

      {error && (
        <div className="error-msg">
          {error}
        </div>
      )}

      {eligibleLenders.length === 0 ? (

        <div className="card" style={{
          textAlign: 'center',
          padding: 40
        }}>

          <div style={{
            fontSize: 40,
            marginBottom: 14
          }}>
            😔
          </div>

          <div style={{
            fontWeight: 600,
            marginBottom: 8
          }}>
            No lenders matched
          </div>

          <div style={{
            color: 'var(--muted)',
            fontSize: 13
          }}>
            Try improving your CIBIL score or providing additional documents.
          </div>

        </div>

      ) : (

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          marginBottom: 28
        }}>

          {eligibleLenders.map((l, i) => {

            const isSelected =
              String(selectedLender?.lender_id) ===
              String(l.lender_id)

            const matchScore = Number(l.match_score || 0)

            return (
              <div
                key={l.lender_id ?? i}
                onClick={() => handleSelectLender(l)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault()
                    handleSelectLender(l)
                  }
                }}
                style={{
                  background: isSelected
                    ? '#22c55e08'
                    : 'var(--surface)',

                  border: `2px solid ${
                    isSelected
                      ? 'var(--green)'
                      : 'var(--border)'
                  }`,

                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  gap: 20,
                  alignItems: 'flex-start',
                }}
              >

                <div style={{
                  width: 52,
                  height: 52,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}>
                  🏦
                </div>

                <div style={{ flex: 1 }}>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4
                  }}>

                    <span style={{
                      fontWeight: 700,
                      fontSize: 16
                    }}>
                      {l.name}
                    </span>

                    <div style={{ textAlign: 'right' }}>

                      <div style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#22c55e'
                      }}>
                        {l.interest_rate}%
                      </div>

                      <div style={{
                        fontSize: 10,
                        color: 'var(--muted)'
                      }}>
                        per annum
                      </div>

                    </div>
                  </div>

                  <div style={{
                    color: 'var(--muted)',
                    fontSize: 13,
                    marginBottom: 12
                  }}>
                    {l.description}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 24,
                    flexWrap: 'wrap'
                  }}>

                    {[
                      [
                        'Loan Range',
                        `₹${formatCurrency(l.min_loan)} – ₹${formatCurrency(l.max_loan)}`
                      ],
                      [
                        'EMI (18mo)',
                        `₹${formatCurrency(l.sample_emi)}/mo`
                      ],
                      [
                        'Match Score',
                        `${matchScore}%`
                      ],
                    ].map(([k, v]) => (

                      <div key={k}>

                        <div style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: k === 'Match Score'
                            ? scoreColor(matchScore)
                            : 'var(--text)'
                        }}>
                          {v}
                        </div>

                        <div style={{
                          fontSize: 11,
                          color: 'var(--muted)'
                        }}>
                          {k}
                        </div>

                      </div>

                    ))}

                  </div>

                  {/* Match score bar */}
                  <div style={{ marginTop: 10 }}>

                    <div className="ratio-bar-bg">

                      <div
                        className="ratio-bar-fill"
                        style={{
                          width: `${Math.min(Math.max(matchScore, 0), 100)}%`,
                          background: scoreColor(matchScore)
                        }}
                      />

                    </div>

                  </div>

                </div>

                {isSelected && (
                  <div style={{
                    color: 'var(--green)',
                    fontSize: 22,
                    flexShrink: 0
                  }}>
                    ✓
                  </div>
                )}

              </div>
            )
          })}

        </div>
      )}

      {/* Bottom buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between'
      }}>

        <button
          className="btn btn-outline"
          onClick={() => navigate('/emi-selection')}
        >
          ← Back
        </button>

        <button
          className="btn btn-success"
          style={{
            padding: '12px 28px',
            fontSize: 15
          }}
          disabled={
            !selectedLender ||
            !selectedEMI ||
            submitting
          }
          onClick={handleSubmit}
        >
          {submitting
            ? 'Submitting...'
            : '🚀 Submit Application →'}
        </button>

      </div>

    </div>
  )
}
