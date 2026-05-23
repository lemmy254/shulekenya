import Head from 'next/head'
import Link from 'next/link'

export default function Admissions() {
  return (
    <>
      <Head>
        <title>School Admissions Guide Kenya | ShuleKenya</title>
        <meta name="description" content="Everything you need to know about school admissions in Kenya. Timelines, required documents, and tips for parents." />
      </Head>

      <div className="hero hero-sm">
        <h1>School Admission Guide</h1>
        <p>Everything you need to know about school admissions in Kenya</p>
      </div>

      <div className="section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div className="detail-section">
              <h3>Typical Admission Calendar</h3>
              <div style={{ position: 'relative', paddingLeft: 32 }}>
                {[
                  { month: 'January', title: 'Term 1 Begins', desc: 'New academic year starts. Some schools accept late admissions.', status: 'past' },
                  { month: 'February - March', title: 'Mid-Year Intakes', desc: 'International schools often accept rolling admissions.', status: 'past' },
                  { month: 'April - May', title: 'Applications Open', desc: 'Top schools start accepting applications for the next academic year. Apply early!', status: 'current' },
                  { month: 'June - August', title: 'Entrance Exams & Interviews', desc: 'Schools conduct assessments, interviews, and tours.', status: 'upcoming' },
                  { month: 'September - October', title: 'Admission Offers', desc: 'Acceptance letters and fee structures sent out.', status: 'upcoming' },
                  { month: 'November - December', title: 'Confirm & Register', desc: 'Pay registration fee and confirm placement.', status: 'upcoming' },
                ].map((item, i) => (
                  <div key={i} style={{ position: 'relative', marginBottom: 28 }}>
                    <div style={{
                      position: 'absolute', left: -28, top: 4, width: 14, height: 14, borderRadius: '50%',
                      background: item.status === 'current' ? 'var(--accent)' : item.status === 'past' ? 'var(--border)' : 'var(--primary)',
                      border: `3px solid ${item.status === 'current' ? 'var(--accent-light)' : item.status === 'past' ? '#f0f0f0' : 'var(--primary-light)'}`,
                    }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{item.month}</div>
                    <div style={{ fontWeight: 600, margin: '4px 0' }}>{item.title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="detail-section">
              <h3>What You&apos;ll Typically Need</h3>
              <div style={{ lineHeight: 2.2 }}>
                {[
                  'Birth certificate (original + copy)',
                  'Previous school reports / transcripts',
                  'Transfer letter from previous school',
                  'Passport photos (3-4)',
                  'Immunization records',
                  'Parent/Guardian ID (national ID or passport)',
                  'Completed application form',
                  'Application fee payment receipt',
                ].map((item, i) => (
                  <div key={i}>&#x2714;&#xFE0F; {item}</div>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3>Tips for Parents Moving to a New Area</h3>
              <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text)' }}>Start early.</strong> Popular schools fill up fast, especially national schools and top-tier private institutions.</p>
                <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text)' }}>Visit in person.</strong> Nothing beats a school tour. Meet teachers, see facilities, and feel the environment.</p>
                <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text)' }}>Ask about transport.</strong> School bus routes and costs can make or break your daily routine.</p>
                <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text)' }}>Check curriculum alignment.</strong> If transferring mid-year, ensure curriculum continuity (CBC, 8-4-4, British, IB).</p>
                <p><strong style={{ color: 'var(--text)' }}>Read reviews.</strong> Parent reviews on ShuleKenya give you the inside scoop no brochure will.</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link href="/browse" className="btn btn-primary btn-lg">Browse Schools Now</Link>
        </div>
      </div>
    </>
  )
}
