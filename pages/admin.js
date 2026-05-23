import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase, getPhotoUrl } from '../lib/supabase'

const ADMIN_EMAIL = 'daniellmajani@gmail.com'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [schools, setSchools] = useState([])
  const [filter, setFilter] = useState('pending_review')
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [msg, setMsg] = useState('')
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, draft: 0 })

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (user) loadSchools()
  }, [user, filter])

  async function checkAdmin() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u || u.email !== ADMIN_EMAIL) {
      router.push('/')
      return
    }
    setUser(u)
    setLoading(false)
  }

  async function loadSchools() {
    // Load all schools for stats
    const { data: allSchools } = await supabase.from('schools').select('id, review_status')
    if (allSchools) {
      setStats({
        total: allSchools.length,
        pending: allSchools.filter(s => s.review_status === 'pending_review').length,
        approved: allSchools.filter(s => s.review_status === 'approved').length,
        rejected: allSchools.filter(s => s.review_status === 'rejected').length,
        draft: allSchools.filter(s => s.review_status === 'draft' || !s.review_status).length,
      })
    }

    // Load filtered schools
    let query = supabase.from('schools').select('*').order('updated_at', { ascending: false })
    if (filter !== 'all') {
      query = query.eq('review_status', filter)
    }
    const { data } = await query
    setSchools(data || [])
  }

  async function approveSchool(school) {
    setProcessing(true)
    const { error } = await supabase.from('schools').update({
      review_status: 'approved',
      is_published: true,
      reviewed_at: new Date().toISOString(),
      reviewed_by: ADMIN_EMAIL,
      review_notes: null
    }).eq('id', school.id)

    if (!error) {
      setMsg(`"${school.name}" approved and published!`)
      setSelectedSchool(null)
      loadSchools()
    } else {
      setMsg('Error: ' + error.message)
    }
    setProcessing(false)
    setTimeout(() => setMsg(''), 4000)
  }

  async function rejectSchool(school) {
    if (!rejectNotes.trim()) {
      setMsg('Please provide a reason for rejection.')
      setTimeout(() => setMsg(''), 3000)
      return
    }
    setProcessing(true)
    const { error } = await supabase.from('schools').update({
      review_status: 'rejected',
      is_published: false,
      reviewed_at: new Date().toISOString(),
      reviewed_by: ADMIN_EMAIL,
      review_notes: rejectNotes.trim()
    }).eq('id', school.id)

    if (!error) {
      setMsg(`"${school.name}" rejected. School owner will see your feedback.`)
      setSelectedSchool(null)
      setRejectNotes('')
      loadSchools()
    } else {
      setMsg('Error: ' + error.message)
    }
    setProcessing(false)
    setTimeout(() => setMsg(''), 4000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>

  return (
    <>
      <Head><title>Admin Dashboard | ShuleKenya</title></Head>

      <style jsx global>{`
        :root {
          --primary: #16a34a;
          --primary-light: #dcfce7;
          --accent: #f59e0b;
          --accent-light: #fef3c7;
          --text: #1e293b;
          --text-secondary: #64748b;
          --border: #e2e8f0;
          --bg: #f8fafc;
          --danger: #dc2626;
          --danger-light: #fee2e2;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: var(--text); background: var(--bg); }
        .admin-wrap { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .admin-header h1 { font-size: 1.6rem; font-weight: 700; }
        .admin-header h1 span { color: var(--primary); }
        .badge { display: inline-block; background: var(--danger); color: #fff; border-radius: 10px; padding: 2px 10px; font-size: 0.8rem; font-weight: 600; margin-left: 8px; }

        .stat-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 16px; text-align: center; }
        .stat-card .num { font-size: 1.8rem; font-weight: 700; }
        .stat-card .lbl { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }
        .stat-card.pending .num { color: var(--accent); }
        .stat-card.approved .num { color: var(--primary); }
        .stat-card.rejected .num { color: var(--danger); }

        .filter-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .filter-btn { padding: 8px 18px; border: 1px solid var(--border); border-radius: 20px; background: #fff; cursor: pointer; font-size: 0.9rem; color: var(--text-secondary); transition: all 0.2s; }
        .filter-btn:hover { border-color: var(--primary); color: var(--primary); }
        .filter-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }

        .school-list { display: flex; flex-direction: column; gap: 12px; }
        .school-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 20px; cursor: pointer; transition: box-shadow 0.2s; }
        .school-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .school-card h3 { font-size: 1.1rem; margin-bottom: 4px; }
        .school-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }
        .status-badge.pending_review { background: var(--accent-light); color: #92400e; }
        .status-badge.approved { background: var(--primary-light); color: #166534; }
        .status-badge.rejected { background: var(--danger-light); color: #991b1b; }
        .status-badge.draft { background: #f1f5f9; color: #475569; }

        .detail-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
        .detail-modal { background: #fff; border-radius: 12px; max-width: 700px; width: 100%; max-height: 85vh; overflow-y: auto; padding: 28px; }
        .detail-modal h2 { font-size: 1.3rem; margin-bottom: 16px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .detail-item label { font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 2px; }
        .detail-item span { font-weight: 500; }

        .action-bar { display: flex; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
        .btn { padding: 10px 24px; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
        .btn-approve { background: var(--primary); color: #fff; }
        .btn-approve:hover { background: #15803d; }
        .btn-reject { background: var(--danger); color: #fff; }
        .btn-reject:hover { background: #b91c1c; }
        .btn-secondary { background: #f1f5f9; color: var(--text); }
        .btn-secondary:hover { background: #e2e8f0; }
        .btn-logout { background: none; border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; color: var(--text-secondary); }
        .btn-logout:hover { border-color: var(--danger); color: var(--danger); }

        .reject-area { margin-top: 12px; }
        .reject-area textarea { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; min-height: 80px; font-size: 0.9rem; font-family: inherit; resize: vertical; }
        .reject-area textarea:focus { outline: none; border-color: var(--danger); }

        .msg-banner { background: var(--primary-light); border: 1px solid var(--primary); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; color: var(--primary); font-weight: 600; }

        .empty-state { text-align: center; padding: 48px 20px; color: var(--text-secondary); }
        .empty-state h3 { font-size: 1.1rem; margin-bottom: 8px; color: var(--text); }

        .cover-thumb { width: 100%; height: 140px; border-radius: 8px; background-size: cover; background-position: center; background-color: var(--primary-light); margin-bottom: 16px; }

        @media (max-width: 768px) {
          .stat-row { grid-template-columns: repeat(3, 1fr); }
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="admin-wrap">
        <div className="admin-header">
          <div>
            <h1><span>ShuleKenya</span> Admin</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review and manage school listings</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user?.email}</span>
            <button className="btn-logout" onClick={handleLogout}>Log out</button>
          </div>
        </div>

        {msg && <div className="msg-banner">{msg}</div>}

        {/* Stats */}
        <div className="stat-row">
          <div className="stat-card"><div className="num">{stats.total}</div><div className="lbl">Total Schools</div></div>
          <div className="stat-card pending"><div className="num">{stats.pending}</div><div className="lbl">Pending Review</div></div>
          <div className="stat-card approved"><div className="num">{stats.approved}</div><div className="lbl">Approved</div></div>
          <div className="stat-card rejected"><div className="num">{stats.rejected}</div><div className="lbl">Rejected</div></div>
          <div className="stat-card"><div className="num">{stats.draft}</div><div className="lbl">Drafts</div></div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          {[
            { key: 'pending_review', label: 'Pending Review', count: stats.pending },
            { key: 'approved', label: 'Approved', count: stats.approved },
            { key: 'rejected', label: 'Rejected', count: stats.rejected },
            { key: 'draft', label: 'Drafts', count: stats.draft },
            { key: 'all', label: 'All', count: stats.total },
          ].map(f => (
            <button key={f.key} className={`filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* School List */}
        <div className="school-list">
          {schools.length === 0 ? (
            <div className="empty-state">
              <h3>No schools in this category</h3>
              <p>Schools will appear here when they match the selected filter.</p>
            </div>
          ) : (
            schools.map(s => (
              <div key={s.id} className="school-card" onClick={() => { setSelectedSchool(s); setRejectNotes(''); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3>{s.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.area}, {s.county}</p>
                  </div>
                  <span className={`status-badge ${s.review_status || 'draft'}`}>
                    {(s.review_status || 'draft').replace('_', ' ')}
                  </span>
                </div>
                <div className="school-meta">
                  <span>Type: {s.school_type || 'â'}</span>
                  <span>Gender: {s.gender || 'â'}</span>
                  <span>Curriculum: {(s.curriculum || []).join(', ') || 'â'}</span>
                  {s.phone && <span>Phone: {s.phone}</span>}
                  <span>Updated: {new Date(s.updated_at).toLocaleDateString('en-KE')}</span>
                </div>
                {s.review_status === 'rejected' && s.review_notes && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 6, fontSize: '0.85rem', color: '#991b1b' }}>
                    Rejection reason: {s.review_notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Detail Modal */}
        {selectedSchool && (
          <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedSchool(null); }}>
            <div className="detail-modal">
              {selectedSchool.cover_photo && (
                <div className="cover-thumb" style={{ backgroundImage: `url(${getPhotoUrl(selectedSchool.cover_photo)})` }} />
              )}
              <h2>{selectedSchool.name}</h2>
              <span className={`status-badge ${selectedSchool.review_status || 'draft'}`} style={{ marginBottom: 16, display: 'inline-block' }}>
                {(selectedSchool.review_status || 'draft').replace('_', ' ')}
              </span>

              <div className="detail-grid">
                <div className="detail-item"><label>County</label><span>{selectedSchool.county || 'â'}</span></div>
                <div className="detail-item"><label>Area</label><span>{selectedSchool.area || 'â'}</span></div>
                <div className="detail-item"><label>School Type</label><span>{selectedSchool.school_type || 'â'}</span></div>
                <div className="detail-item"><label>Gender</label><span>{selectedSchool.gender || 'â'}</span></div>
                <div className="detail-item"><label>Curriculum</label><span>{(selectedSchool.curriculum || []).join(', ') || 'â'}</span></div>
                <div className="detail-item"><label>Phone</label><span>{selectedSchool.phone || 'â'}</span></div>
                <div className="detail-item"><label>Email</label><span>{selectedSchool.email || 'â'}</span></div>
                <div className="detail-item"><label>Website</label><span>{selectedSchool.website || 'â'}</span></div>
              </div>

              {selectedSchool.about && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>About</label>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{selectedSchool.about}</p>
                </div>
              )}

              {selectedSchool.facilities && selectedSchool.facilities.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Facilities</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedSchool.facilities.map(f => (
                      <span key={f} style={{ background: 'var(--primary-light)', padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem' }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery preview */}
              {selectedSchool.photos && selectedSchool.photos.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Photos ({selectedSchool.photos.length})</label>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                    {selectedSchool.photos.slice(0, 4).map((p, i) => (
                      <div key={i} style={{ width: 100, height: 70, borderRadius: 6, backgroundImage: `url(${getPhotoUrl(p)})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                    ))}
                  </div>
                </div>
              )}

              {selectedSchool.review_status === 'rejected' && selectedSchool.review_notes && (
                <div style={{ padding: '12px 16px', background: 'var(--danger-light)', borderRadius: 8, marginBottom: 12 }}>
                  <strong style={{ fontSize: '0.85rem', color: '#991b1b' }}>Previous rejection reason:</strong>
                  <p style={{ fontSize: '0.9rem', color: '#991b1b', marginTop: 4 }}>{selectedSchool.review_notes}</p>
                </div>
              )}

              {/* Reject notes textarea */}
              {selectedSchool.review_status !== 'approved' && (
                <div className="reject-area">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Rejection reason (required if rejecting)</label>
                  <textarea
                    value={rejectNotes}
                    onChange={e => setRejectNotes(e.target.value)}
                    placeholder="Explain what needs to be fixed before the school can be approved..."
                  />
                </div>
              )}

              <div className="action-bar">
                {selectedSchool.review_status !== 'approved' && (
                  <button className="btn btn-approve" onClick={() => approveSchool(selectedSchool)} disabled={processing}>
                    {processing ? 'Processing...' : 'Approve & Publish'}
                  </button>
                )}
                {selectedSchool.review_status !== 'rejected' && (
                  <button className="btn btn-reject" onClick={() => rejectSchool(selectedSchool)} disabled={processing}>
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                )}
                {selectedSchool.review_status === 'approved' && (
                  <button className="btn btn-reject" onClick={async () => {
                    setProcessing(true)
                    await supabase.from('schools').update({ is_published: false, review_status: 'rejected', review_notes: rejectNotes || 'Listing removed by admin', reviewed_at: new Date().toISOString(), reviewed_by: ADMIN_EMAIL }).eq('id', selectedSchool.id)
                    setMsg(`"${selectedSchool.name}" unpublished.`)
                    setSelectedSchool(null)
                    loadSchools()
                    setProcessing(false)
                    setTimeout(() => setMsg(''), 4000)
                  }} disabled={processing}>
                    Unpublish
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setSelectedSchool(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
