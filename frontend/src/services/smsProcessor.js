/**
 * SMS On-Device Processing Module
 * ─────────────────────────────────────────────────────────────────────
 * PRIVACY DESIGN:
 *   • Raw SMS never leaves the device
 *   • OTP / personal messages filtered out before any processing
 *   • Only structured numeric aggregates are transmitted to server
 *   • No message text, no sender names, no account numbers stored
 * ─────────────────────────────────────────────────────────────────────
 */

// ── Regex patterns for financial SMS classification ─────────────────

const PATTERNS = {
  // Credit transactions
  credit: [
    /credited\s+(?:with\s+)?(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s+(?:has been\s+)?credited/i,
    /received\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:salary|payment|refund|transfer)\s+of\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
  ],
  // Debit transactions
  debit: [
    /debited\s+(?:by|with|for)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s+(?:has been\s+)?debited/i,
    /spent\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    /payment\s+of\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s+(?:made|done|processed)/i,
  ],
  // Patterns to EXCLUDE (OTP / non-financial)
  exclude: [
    /\botp\b/i,
    /\bverif(?:y|ication)\s+code\b/i,
    /\bone.?time.?password\b/i,
    /\bpassword\b/i,
    /your\s+code\s+is/i,
    /do\s+not\s+share/i,
  ],
  // Loan / EMI related
  emi: [
    /emi\s+(?:of\s+)?(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    /loan\s+(?:repayment|due)\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
  ],
}

// ── OTP / sensitive message filter ──────────────────────────────────

function isSensitiveMessage(body) {
  return PATTERNS.exclude.some(p => p.test(body))
}

function isFinancialMessage(body) {
  return (
    PATTERNS.credit.some(p => p.test(body)) ||
    PATTERNS.debit.some(p => p.test(body)) ||
    PATTERNS.emi.some(p => p.test(body))
  )
}

// ── Extract amount from message ──────────────────────────────────────

function extractAmount(body, patternList) {
  for (const p of patternList) {
    const m = body.match(p)
    if (m && m[1]) {
      const num = parseFloat(m[1].replace(/,/g, ''))
      if (!isNaN(num) && num > 0) return num
    }
  }
  return null
}

// ── Month bucket key ─────────────────────────────────────────────────

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// ── Main: process SMS array on-device ───────────────────────────────
/**
 * @param {Array<{body: string, date: Date|number}>} smsList
 * @returns {Object} structured feature object — NO raw text included
 */
export function processMessagesOnDevice(smsList) {
  const monthlyCredits = {}  // { "2024-01": [amt, ...] }
  const monthlyDebits  = {}
  let totalCredits  = 0
  let totalDebits   = 0
  let creditCount   = 0
  let debitCount    = 0
  let emiAmounts    = []
  let processedMonths = new Set()

  for (const sms of smsList) {
    const body = sms.body || ''
    const ts   = sms.date instanceof Date ? sms.date : new Date(sms.date)

    // Step 1: Hard filter — never process OTP / sensitive messages
    if (isSensitiveMessage(body)) continue

    // Step 2: Skip non-financial messages
    if (!isFinancialMessage(body)) continue

    const mk = monthKey(ts)
    processedMonths.add(mk)

    // Step 3: Classify and extract amount only
    const creditAmt = extractAmount(body, PATTERNS.credit)
    if (creditAmt !== null) {
      if (!monthlyCredits[mk]) monthlyCredits[mk] = []
      monthlyCredits[mk].push(creditAmt)
      totalCredits += creditAmt
      creditCount++
    }

    const debitAmt = extractAmount(body, PATTERNS.debit)
    if (debitAmt !== null) {
      if (!monthlyDebits[mk]) monthlyDebits[mk] = []
      monthlyDebits[mk].push(debitAmt)
      totalDebits += debitAmt
      debitCount++
    }

    const emiAmt = extractAmount(body, PATTERNS.emi)
    if (emiAmt !== null) emiAmounts.push(emiAmt)
  }

  const n = processedMonths.size || 1

  // Compute monthly aggregates
  const allMonths = [...processedMonths].sort()
  const monthlyC  = allMonths.map(m => (monthlyCredits[m] || []).reduce((a, b) => a + b, 0))
  const monthlyD  = allMonths.map(m => (monthlyDebits[m]  || []).reduce((a, b) => a + b, 0))

  const avgMonthlyCredit = totalCredits / n
  const avgMonthlyDebit  = totalDebits  / n

  // Standard deviation of monthly credits (income consistency signal)
  const mean   = avgMonthlyCredit
  const stdDev = monthlyC.length > 1
    ? Math.sqrt(monthlyC.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / monthlyC.length)
    : 0

  const maxSingleDebit = monthlyD.length > 0 ? Math.max(...monthlyD) : 0

  const avgEMI = emiAmounts.length > 0
    ? emiAmounts.reduce((a, b) => a + b, 0) / emiAmounts.length
    : 0

  // ── Return ONLY structured features — zero raw text ──────────────
  return {
    // Core features for ML model
    avg_monthly_credit:           Math.round(avgMonthlyCredit),
    std_monthly_credit:           Math.round(stdDev),
    avg_monthly_debit:            Math.round(avgMonthlyDebit),
    avg_txn_frequency_per_month:  Math.round((creditCount + debitCount) / n),
    max_single_debit:             Math.round(maxSingleDebit),
    detected_emi_amount:          Math.round(avgEMI),

    // Metadata (counts only — no amounts tied to dates)
    n_months_analyzed:            n,
    total_credit_transactions:    creditCount,
    total_debit_transactions:     debitCount,

    // Chart data (amounts by month — NO merchant names, NO account numbers)
    monthly_summary: allMonths.map((m, i) => ({
      month:   m,
      credit:  Math.round(monthlyC[i] || 0),
      debit:   Math.round(monthlyD[i]  || 0),
    })),

    // Privacy attestation (transmitted with payload)
    privacy: {
      raw_sms_transmitted: false,
      otp_messages_filtered: true,
      processing_location: 'on_device',
      features_only: true,
    }
  }
}

// ── Serialize for API transmission ──────────────────────────────────
/**
 * Returns a clean JSON payload safe to POST to /api/applications/analyze
 * Contains only numeric aggregates + privacy attestation.
 */
export function serializeForTransmission(features) {
  // Double-check: strip any string fields that sneak in
  const safe = {}
  const ALLOWED_NUMERIC = [
    'avg_monthly_credit', 'std_monthly_credit', 'avg_monthly_debit',
    'avg_txn_frequency_per_month', 'max_single_debit', 'detected_emi_amount',
    'n_months_analyzed', 'total_credit_transactions', 'total_debit_transactions',
  ]
  for (const k of ALLOWED_NUMERIC) {
    if (typeof features[k] === 'number') safe[k] = features[k]
  }
  // Monthly summary: only month string + two numbers
  safe.monthly_summary = (features.monthly_summary || []).map(m => ({
    month:  m.month,
    credit: m.credit,
    debit:  m.debit,
  }))
  safe.privacy = features.privacy
  return safe
}
