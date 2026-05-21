import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0e14', 
      color: '#c9d1d9',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Split Hero Section */}
      <div style={{
        background: 'radial-gradient(circle at 90% 10%, rgba(31, 111, 235, 0.08) 0%, rgba(10, 14, 20, 0) 60%), linear-gradient(135deg, #10141b 0%, #0a0e14 100%)',
        padding: '120px 4% 90px',
        borderBottom: '1px solid #21262d',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '64px',
        alignItems: 'center',
        maxWidth: '1340px',
        margin: '0 auto'
      }}>
        {/* Left Side: Technical Value Proposition */}
        <div style={{ textAlign: 'left' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 139, 253, 0.1)',
            border: '1px solid rgba(56, 139, 253, 0.25)',
            color: '#58a6ff',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'monospace',
            letterSpacing: '0.5px',
            marginBottom: '28px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            EIP-712 COMPLIANT SECURITY PROTOCOL
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(38px, 4.5vw, 56px)', 
            fontWeight: 800, 
            letterSpacing: '-1.5px', 
            marginBottom: '24px', 
            lineHeight: 1.1,
            color: '#f0f6fc'
          }}>
            On-Chain Microfinance <br />
            <span style={{ 
              background: 'linear-gradient(90deg, #58a6ff 0%, #1f6feb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Underwritten by LightGBM.</span>
          </h1>
          
          <p style={{ color: '#8b949e', fontSize: '16px', lineHeight: '1.65', maxWidth: '540px', marginBottom: '40px' }}>
            Bridge institutional liquidity parameters with distributed auditing. Machine learning architectures execute local telemetry proofs across bank statement arrays, hashing validation matrices to the Polygon ledger via MetaMask secure signatures.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/register">
              <button style={{ 
                padding: '14px 32px', 
                fontSize: '15px', 
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: '#238636',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2ea44f'}
              onMouseOut={(e) => e.currentTarget.style.background = '#238636'}>
                Apply for Loan
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </Link>
            <Link to="/register?role=lender">
              <button style={{ 
                padding: '14px 32px', 
                fontSize: '15px', 
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #30363d',
                background: '#21262d',
                color: '#c9d1d9',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#8b949e'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#30363d'}>
                Connect Institutional Node
              </button>
            </Link>
          </div>
        </div>

        {/* Right Side: Interactive Core Engine Component */}
        <div>
          <BlockchainModelValidator />
        </div>
      </div>

      {/* Grid Technical Specifications */}
      <div style={{ maxWidth: '1340px', margin: '90px auto 0', padding: '0 4%' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '32px' 
        }}>
          {[
            { 
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
              title: 'LightGBM Regression Core', 
              desc: 'Vectorized classification matrix analyzes credit history arrays, banking velocities, and regional asset indexes to compute default probability bounds instantly.' 
            },
            { 
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>,
              title: 'Cryptographic Hashing Blocks', 
              desc: 'Encodes evaluation parameters, historical weights, and dynamic state decisions into keccak256 roots directly processed into non-custodial logs.' 
            },
            { 
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
              title: 'Dynamic Liquidity Indexing', 
              desc: 'Real-time multi-lender engine evaluates operational periods, geographical risk matrices, and customized risk boundaries on-the-fly.' 
            },
            { 
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
              title: 'EIP-712 Signature Node Routing', 
              desc: 'Establishes direct link agreements between verified wallets and institutional ledger pools with typed structured data definitions.' 
            },
          ].map((item, index) => (
            <div key={index} style={{ 
              background: '#12161f', 
              border: '1px solid #21262d', 
              borderRadius: '8px', 
              padding: '32px 24px',
            }}>
              <div style={{ marginBottom: '16px' }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '16px', color: '#f0f6fc', marginBottom: '12px' }}>{item.title}</div>
              <div style={{ color: '#8b949e', fontSize: '13px', lineHeight: 1.65 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Verification Architecture Pipe */}
        <div style={{ marginTop: '120px', paddingBottom: '120px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 700, textAlign: 'center', marginBottom: '16px', color: '#f0f6fc' }}>
            Data Ingestion & Verification Protocol
          </h2>
          <p style={{ color: '#8b949e', fontSize: '14px', textAlign: 'center', maxWidth: '600px', margin: '0 auto 60px' }}>
            A rigorous, mathematically transparent pipeline designed to parse secure data frames into deterministic smart contract outputs.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '860px', margin: '0 auto' }}>
            {[
              { num: '01', title: 'Data Array Sanitation', desc: 'Accounting logs, transaction distributions, and historical debt indices are parsed locally into isolated execution layers.' },
              { num: '02', title: 'Gradient Boost Feature Matching', desc: 'Telemetry variables feed through a pre-trained ensemble tree mechanism calculating deterministic risk weighting coefficients.' },
              { num: '03', title: 'Keccak-256 State Calculation', desc: 'System wraps resulting scores, debt caps, and address structures into static payloads ready for ledger commitment.' },
              { num: '04', title: 'EIP-1559 Transaction Structuring', desc: 'Payload configurations calculate priority fees, routing arrays across integrated non-custodial dashboards.' },
              { num: '05', title: 'State Invariant Initialization', desc: 'Lending contracts confirm balance proofs, lock structural boundaries, and initialize automated execution protocols.' },
            ].map((step, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: '24px',
                padding: '20px 24px',
                background: '#12161f',
                borderRadius: '6px',
                border: '1px solid #21262d',
                alignItems: 'center'
              }}>
                <div style={{
                  minWidth: '36px', height: '36px',
                  background: '#0a0e14',
                  border: '1px solid #1f6feb',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#58a6ff',
                }}>{step.num}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#f0f6fc' }}>{step.title}</div>
                  <div style={{ color: '#8b949e', fontSize: '13px', lineHeight: '1.5' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Integrated Interactive Verification Component Modeling MetaMask & AI Logic
function BlockchainModelValidator() {
  const [step, setStep] = useState(0); // 0: Vector Ingestion, 1: Boosting Arrays, 2: MetaMask Sign, 3: Success
  const [hash, setHash] = useState('0x0000000000000000000000000000000000000000');

  useEffect(() => {
    const sequence = setInterval(() => {
      setStep((current) => {
        if (current === 1) {
          // Generate realistic mock proof transaction hash
          const chars = '0123456789abcdef';
          let hex = '0x';
          for (let i = 0; i < 40; i++) hex += chars[Math.floor(Math.random() * 16)];
          setHash(hex);
        }
        return (current + 1) % 4;
      });
    }, 4000);

    return () => clearInterval(sequence);
  }, []);

  return (
    <div style={{
      background: '#12161f',
      border: '1px solid #30363d',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 24px 50px rgba(0,0,0,0.6)',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      {/* Network Interface Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #21262d', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === 3 ? '#238636' : '#e3b341' }}></div>
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#8b949e' }}>POLYGON_MAINNET_NODE_04</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(235, 115, 31, 0.1)', border: '1px solid rgba(235, 115, 31, 0.2)', padding: '4px 10px', borderRadius: '4px' }}>
          {/* Orange Abstract MetaMask Indicator Geometry */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f37021"><polygon points="12,2 22,9 17,22 12,17 7,22 2,9" /></svg>
          <span style={{ fontSize: '11px', color: '#f37021', fontWeight: 600, fontFamily: 'monospace' }}>METAMASK CONNECTOR</span>
        </div>
      </div>

      {/* Verification Sub-Console */}
      <div style={{ background: '#0a0e14', borderRadius: '6px', padding: '18px', fontFamily: 'monospace', fontSize: '12.5px', lineHeight: '1.6' }}>
        
        {/* Step 01: Data Parser */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: step >= 0 ? '#f0f6fc' : '#484f58' }}>
          <div style={{ color: step === 0 ? '#58a6ff' : step > 0 ? '#34d058' : '#484f58' }}>
            {step > 0 ? '✓' : '➔'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Vectorizing Data Array</div>
            <div style={{ fontSize: '11px', color: '#8b949e' }}>Ingesting CSV matrix structure into model pipelines</div>
          </div>
        </div>

        {/* Step 02: Model Validation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: step >= 1 ? '#f0f6fc' : '#484f58' }}>
          <div style={{ color: step === 1 ? '#58a6ff' : step > 1 ? '#34d058' : '#484f58' }}>
            {step === 1 ? '➔' : step > 1 ? '✓' : '▫'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Executing LightGBM Invariants</div>
            <div style={{ fontSize: '11px', color: '#8b949e' }}>Analyzing node splitting limits & risk bounds</div>
          </div>
        </div>

        {/* Step 03: Crypto Ledger Sign */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: step >= 2 ? '#f0f6fc' : '#484f58' }}>
          <div style={{ color: step === 2 ? '#58a6ff' : step > 2 ? '#34d058' : '#484f58' }}>
            {step === 2 ? '➔' : step > 2 ? '✓' : '▫'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Requesting EIP-712 Verification</div>
            <div style={{ fontSize: '11px', color: '#f37021', fontWeight: step === 2 ? 600 : 400 }}>
              {step === 2 ? 'Awaiting user signature authorization...' : 'Signature validated'}
            </div>
          </div>
        </div>

        {/* Step 04: Block Minting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: step === 3 ? '#f0f6fc' : '#484f58' }}>
          <div style={{ color: step === 3 ? '#34d058' : '#484f58' }}>
            {step === 3 ? '✓' : '▫'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>State Invariant Locked</div>
            <div style={{ fontSize: '11px', color: '#8b949e', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
              Hash: {step === 3 ? hash : 'Pending computation...'}
            </div>
          </div>
        </div>
      </div>

      {/* Model Output Calculations Panel */}
      <div style={{ marginTop: '20px', background: 'rgba(33, 38, 45, 0.3)', border: '1px solid #21262d', borderRadius: '6px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#8b949e', fontFamily: 'monospace' }}>MODEL ESTIMATION RATE</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', color: step >= 2 ? '#34d058' : '#8b949e', marginTop: '4px' }}>
            {step >= 2 ? '0.0122 VAR' : 'CALCULATING'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#8b949e', fontFamily: 'monospace' }}>GAS CALIBRATION</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', color: step >= 1 ? '#f0f6fc' : '#8b949e', marginTop: '4px' }}>
            {step >= 1 ? '31.4 Gwei' : 'COMPUTING'}
          </div>
        </div>
      </div>
    </div>
  );
}