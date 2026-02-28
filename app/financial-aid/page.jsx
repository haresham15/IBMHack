'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

// ── Data ──────────────────────────────────────────────────────────────────────

const FAFSA_STEPS = [
  { id: 's1', label: 'Create your FSA ID', detail: 'Go to studentaid.gov and create a Federal Student Aid ID. This is your username + password for everything FAFSA-related. Takes about 5 minutes.' },
  { id: 's2', label: 'Gather your documents', detail: 'You\'ll need: Social Security Number, driver\'s license, your (and parent\'s) tax returns from 2 years ago, W-2 forms, bank statements, and records of untaxed income.' },
  { id: 's3', label: 'Open the FAFSA form', detail: 'Go to studentaid.gov/h/apply-for-aid/fafsa and click "Start New FAFSA". Log in with your FSA ID.' },
  { id: 's4', label: 'Fill in your personal info', detail: 'Enter your name, SSN, date of birth, and address exactly as they appear on official documents. Double-check every field.' },
  { id: 's5', label: 'Link your tax data (IRS DRT)', detail: 'Use the IRS Data Retrieval Tool to automatically import your tax info. This reduces errors and speeds up processing.' },
  { id: 's6', label: 'List your schools', detail: 'Add every school you\'re applying to or attending. You can list up to 20. Each school will receive your FAFSA data directly.' },
  { id: 's7', label: 'Review and submit', detail: 'Read through everything once. Then sign with your FSA ID and submit. You\'ll get a confirmation email within a few days.' },
  { id: 's8', label: 'Check your Student Aid Report (SAR)', detail: 'Within 3–5 days you\'ll receive a SAR summarising your FAFSA. Review it for errors and correct anything that\'s wrong.' },
]

const DOCUMENTS = [
  { id: 'd1', label: 'Social Security Number (SSN)' },
  { id: 'd2', label: 'Federal tax return (2 years ago)' },
  { id: 'd3', label: 'W-2 forms from employers' },
  { id: 'd4', label: 'Bank account statements' },
  { id: 'd5', label: 'FSA ID (studentaid.gov login)' },
  { id: 'd6', label: 'Driver\'s license or state ID' },
  { id: 'd7', label: 'Records of untaxed income' },
  { id: 'd8', label: 'Investment / real estate records (if any)' },
]

const GLOSSARY = [
  { term: 'FAFSA', plain: 'Free Application for Federal Student Aid — the form you fill out to apply for government money for college. Do this every year.' },
  { term: 'EFC / SAI', plain: 'Expected Family Contribution (now called Student Aid Index). A number the government calculates to estimate how much your family can pay. Lower = more aid.' },
  { term: 'COA', plain: 'Cost of Attendance — the total estimated cost of one year: tuition, fees, housing, food, books, and personal expenses.' },
  { term: 'Pell Grant', plain: 'Free money from the federal government that you never have to pay back. Only for undergraduates with financial need.' },
  { term: 'Subsidized Loan', plain: 'A government loan where the government pays the interest while you\'re in school. You only start owing interest after you graduate.' },
  { term: 'Unsubsidized Loan', plain: 'A government loan where interest starts building up immediately, even while you\'re still in school.' },
  { term: 'Work-Study', plain: 'A program that gives you a part-time job on campus to help pay for college. It\'s aid — not a regular job application.' },
  { term: 'Verification', plain: 'Sometimes schools randomly ask you to prove the info on your FAFSA is correct. They\'ll email you a list of extra documents to submit.' },
  { term: 'Disbursement', plain: 'When your school actually sends money to your account or applies it to your bill. Usually happens at the start of each semester.' },
  { term: 'Award Letter', plain: 'A letter from your school listing exactly what financial aid you\'re getting: grants, loans, work-study. Compare these between schools before deciding.' },
]

const DEADLINES = [
  { label: 'Federal FAFSA opens', date: 'Oct 1', note: 'Opens each year for the following academic year', urgent: false },
  { label: 'Ohio State priority deadline', date: 'Feb 15', note: 'Submit before this for maximum aid consideration', urgent: true },
  { label: 'Ohio State final deadline', date: 'May 1', note: 'Last chance — aid may be limited after this', urgent: true },
  { label: 'Federal FAFSA closes', date: 'Jun 30', note: 'Hard cutoff for the current academic year', urgent: false },
  { label: 'Renewal reminder', date: 'Oct 1', note: 'FAFSA resets every year — set a calendar reminder now', urgent: false },
]

const TIPS = [
  { icon: '⏰', title: 'Submit early', body: 'Financial aid is often first-come, first-served. Submitting on opening day (Oct 1) gives you the best shot at grants.' },
  { icon: '📅', title: 'Set calendar reminders', body: 'Add the priority deadline to your phone right now. Missing it by even one day can mean thousands less in aid.' },
  { icon: '🔁', title: 'Renew every year', body: 'FAFSA doesn\'t carry over. You must reapply every October for each new academic year.' },
  { icon: '🤝', title: 'Ask for help', body: 'Your school\'s Financial Aid Office is free to use. Email them any question — no question is too small or "dumb".' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function FinancialAidPage() {
  const [checkedSteps, setCheckedSteps] = useState(new Set())
  const [checkedDocs, setCheckedDocs] = useState(new Set())
  const [openGlossary, setOpenGlossary] = useState(null)
  const [activeTab, setActiveTab] = useState('checklist')
  const [expandedStep, setExpandedStep] = useState(null)

  function toggleStep(id) {
    setCheckedSteps(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleDoc(id) {
    setCheckedDocs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const stepProgress = Math.round((checkedSteps.size / FAFSA_STEPS.length) * 100)
  const docProgress = Math.round((checkedDocs.size / DOCUMENTS.length) * 100)

  const TABS = [
    { id: 'checklist', label: '✅ FAFSA Checklist' },
    { id: 'documents', label: '📁 Documents' },
    { id: 'deadlines', label: '📅 Deadlines' },
    { id: 'glossary', label: '📖 Plain English' },
    { id: 'tips', label: '💡 Tips' },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .fa-tab { border: none; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 600;
          padding: 8px 18px; border-radius: 20px; transition: all 150ms; white-space: nowrap; }
        .fa-tab.active { background: #4A90C4; color: #fff; box-shadow: 0 2px 8px rgba(74,144,196,0.3); }
        .fa-tab:not(.active) { background: #fff; color: #4A90C4; border: 1.5px solid #4A90C4; }
        .fa-tab:not(.active):hover { background: #EBF5FB; }
        .fa-card { background: #fff; border-radius: 12px; border: 1px solid #E0E0E0;
          box-shadow: 0 2px 8px rgba(26,58,82,0.06); animation: fadeUp 200ms ease; }
        .step-row { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
          border-bottom: 1px solid #F0F0F0; cursor: pointer; transition: background 120ms; }
        .step-row:last-child { border-bottom: none; }
        .step-row:hover { background: #F9FBFD; }
        .check-box { width: 22px; height: 22px; border-radius: 6px; border: 2px solid #4A90C4; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; margin-top: 1px; transition: all 150ms; }
        .check-box.checked { background: #4A90C4; border-color: #4A90C4; }
        .glossary-row { padding: 14px 16px; border-bottom: 1px solid #F0F0F0; cursor: pointer; transition: background 120ms; }
        .glossary-row:last-child { border-bottom: none; }
        .glossary-row:hover { background: #F9FBFD; }
        .progress-bar-bg { height: 8px; border-radius: 4px; background: #E0E0E0; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #4A90C4, #5BAACF); transition: width 300ms ease; }
      `}</style>

      <Navbar showNav={true} />
      <div style={{ paddingTop: '52px', minHeight: '100vh', backgroundColor: '#F4F4F4', fontFamily: 'IBM Plex Sans, sans-serif' }}>

        {/* Hero header */}
        <div style={{ background: 'linear-gradient(180deg, #3a85b8 0%, #DAEEFB 100%)', padding: '28px 32px 32px' }}>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#fff' }}>Financial Aid</h1>
            <p style={{ margin: '6px 0 0', fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              Everything you need to navigate financial aid — broken into simple steps, plain language, and clear deadlines.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {TABS.map(t => (
              <button key={t.id} className={`fa-tab${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}>{t.label}</button>
            ))}
          </div>

          {/* ── FAFSA Checklist ── */}
          {activeTab === 'checklist' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: '#1A3A52' }}>FAFSA Step-by-Step</div>
                  <div style={{ fontSize: '13px', color: '#525252', marginTop: '2px' }}>Click any step to expand. Check it off when done.</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: stepProgress === 100 ? '#198038' : '#4A90C4' }}>
                  {checkedSteps.size} / {FAFSA_STEPS.length} complete
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${stepProgress}%` }} />
                </div>
              </div>
              <div className="fa-card" style={{ overflow: 'hidden' }}>
                {FAFSA_STEPS.map((step, i) => {
                  const done = checkedSteps.has(step.id)
                  const open = expandedStep === step.id
                  return (
                    <div key={step.id}>
                      <div className="step-row" onClick={() => setExpandedStep(open ? null : step.id)}>
                        <div className={`check-box${done ? ' checked' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleStep(step.id) }}>
                          {done && <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                            <path d="M1 5l3.5 3.5L12 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#4A90C4', minWidth: '20px' }}>
                              {i + 1}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: done ? '#8D8D8D' : '#161616',
                              textDecoration: done ? 'line-through' : 'none' }}>
                              {step.label}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#8D8D8D', marginTop: '2px' }}>{open ? '▲' : '▼'}</span>
                      </div>
                      {open && (
                        <div style={{ padding: '0 16px 16px 52px', fontSize: '13px', color: '#525252', lineHeight: 1.65,
                          background: '#FAFCFF', borderBottom: i < FAFSA_STEPS.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                          {step.detail}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {stepProgress === 100 && (
                <div style={{ marginTop: '16px', background: 'color-mix(in srgb, #198038 12%, transparent)',
                  border: '1px solid #198038', borderRadius: '10px', padding: '14px 20px',
                  color: '#198038', fontWeight: '700', fontSize: '15px', textAlign: 'center' }}>
                  🎉 You've completed all FAFSA steps!
                </div>
              )}
            </div>
          )}

          {/* ── Documents ── */}
          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: '#1A3A52' }}>Documents to Gather</div>
                  <div style={{ fontSize: '13px', color: '#525252', marginTop: '2px' }}>Have these ready before you start your FAFSA.</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: docProgress === 100 ? '#198038' : '#4A90C4' }}>
                  {checkedDocs.size} / {DOCUMENTS.length} gathered
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${docProgress}%` }} />
                </div>
              </div>
              <div className="fa-card" style={{ overflow: 'hidden' }}>
                {DOCUMENTS.map(doc => {
                  const done = checkedDocs.has(doc.id)
                  return (
                    <div key={doc.id} className="step-row" onClick={() => toggleDoc(doc.id)}>
                      <div className={`check-box${done ? ' checked' : ''}`}>
                        {done && <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                          <path d="M1 5l3.5 3.5L12 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>}
                      </div>
                      <span style={{ fontSize: '14px', color: done ? '#8D8D8D' : '#161616',
                        textDecoration: done ? 'line-through' : 'none', fontWeight: '500' }}>
                        {doc.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: '16px', background: '#EBF5FB', border: '1px solid #B3D4EB', borderRadius: '10px', padding: '14px 18px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1A3A52', marginBottom: '4px' }}>📌 Pro tip</div>
                <div style={{ fontSize: '13px', color: '#2C5F7A', lineHeight: 1.6 }}>
                  Scan or photograph all documents and save them in one folder on your phone before you sit down to fill out the FAFSA. This way you won't have to stop mid-form to search for something.
                </div>
              </div>
            </div>
          )}

          {/* ── Deadlines ── */}
          {activeTab === 'deadlines' && (
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1A3A52', marginBottom: '4px' }}>Key Deadlines</div>
              <div style={{ fontSize: '13px', color: '#525252', marginBottom: '20px' }}>
                Priority deadlines are the ones that matter most — missing them can mean significantly less aid.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {DEADLINES.map((d, i) => (
                  <div key={i} className="fa-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      minWidth: '64px', textAlign: 'center',
                      background: d.urgent ? 'color-mix(in srgb, #DA1E28 10%, transparent)' : '#EBF5FB',
                      border: `1px solid ${d.urgent ? '#DA1E28' : '#B3D4EB'}`,
                      borderRadius: '8px', padding: '6px 8px',
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: d.urgent ? '#DA1E28' : '#4A90C4' }}>{d.date}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#161616', marginBottom: '3px' }}>{d.label}</div>
                      <div style={{ fontSize: '13px', color: '#525252', lineHeight: 1.5 }}>{d.note}</div>
                    </div>
                    {d.urgent && (
                      <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: '#DA1E28',
                        background: 'color-mix(in srgb, #DA1E28 10%, transparent)', border: '1px solid #DA1E28',
                        borderRadius: '12px', padding: '2px 10px', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                        Priority
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', background: '#FFF8E1', border: '1px solid #F1C21B', borderRadius: '10px', padding: '14px 18px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#6B4E00', marginBottom: '4px' }}>⚠️ Set a reminder now</div>
                <div style={{ fontSize: '13px', color: '#7A5800', lineHeight: 1.6 }}>
                  Add the Feb 15 priority deadline to your phone calendar right now — before you leave this page. It only takes 30 seconds and could save you thousands.
                </div>
              </div>
            </div>
          )}

          {/* ── Plain English Glossary ── */}
          {activeTab === 'glossary' && (
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1A3A52', marginBottom: '4px' }}>Financial Aid in Plain English</div>
              <div style={{ fontSize: '13px', color: '#525252', marginBottom: '20px' }}>
                Financial aid is full of confusing jargon. Here's what it all actually means.
              </div>
              <div className="fa-card" style={{ overflow: 'hidden' }}>
                {GLOSSARY.map((g, i) => {
                  const open = openGlossary === g.term
                  return (
                    <div key={g.term} className="glossary-row"
                      style={{ borderBottom: i < GLOSSARY.length - 1 ? '1px solid #F0F0F0' : 'none' }}
                      onClick={() => setOpenGlossary(open ? null : g.term)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#1A3A52' }}>{g.term}</span>
                        <span style={{ fontSize: '13px', color: '#8D8D8D' }}>{open ? '▲' : '▼'}</span>
                      </div>
                      {open && (
                        <div style={{ marginTop: '8px', fontSize: '13px', color: '#525252', lineHeight: 1.65, paddingRight: '20px' }}>
                          {g.plain}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Tips ── */}
          {activeTab === 'tips' && (
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1A3A52', marginBottom: '4px' }}>Tips for Success</div>
              <div style={{ fontSize: '13px', color: '#525252', marginBottom: '20px' }}>
                Small habits that make a big difference.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {TIPS.map((tip, i) => (
                  <div key={i} className="fa-card" style={{ padding: '20px 22px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>{tip.icon}</div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#1A3A52', marginBottom: '6px' }}>{tip.title}</div>
                    <div style={{ fontSize: '13px', color: '#525252', lineHeight: 1.65 }}>{tip.body}</div>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div style={{ marginTop: '28px' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1A3A52', marginBottom: '12px' }}>Official Resources</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[
                    { label: '🌐 studentaid.gov', href: 'https://studentaid.gov' },
                    { label: '🏫 OSU Financial Aid', href: 'https://sfa.osu.edu' },
                    { label: '📋 FAFSA Application', href: 'https://studentaid.gov/h/apply-for-aid/fafsa' },
                    { label: '📞 OSU Aid Office', href: 'https://sfa.osu.edu/contact' },
                  ].map(link => (
                    <a key={link.label} href={link.href} target="_blank" rel="noreferrer" style={{
                      display: 'inline-block', backgroundColor: '#FFFFFF',
                      border: '1.5px solid #4A90C4', color: '#4A90C4',
                      borderRadius: '8px', padding: '8px 16px',
                      fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                      transition: 'all 150ms'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#4A90C4'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#4A90C4' }}>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        <div style={{ textAlign: 'center', color: '#8D8D8D', fontSize: '11px', padding: '16px', borderTop: '1px solid #E0E0E0', marginTop: '16px' }}>
          Powered by IBM Granite &amp; WatsonX • IBM SkillsBuild Hackathon 2026
        </div>
      </div>
    </>
  )
}
