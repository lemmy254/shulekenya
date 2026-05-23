import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { counties, schoolTypes, curricula, boardingOptions } from '../lib/counties'
import SchoolCard from '../components/SchoolCard'

export default function Browse() {
  const router = useRouter()
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    county: '', type: '', curriculum: '', boarding: '', maxFee: '', q: ''
  })

  useEffect(() => {
    if (router.isReady) {
      const q = router.query
      setFilters({
        county: q.county || '',
        type: q.type || '',
        curriculum: q.curriculum || '',
        boarding: q.boarding || '',
        maxFee: q.maxFee || '',
        q: q.q || '',
      })
    }
  }, [router.isReady, router.query])

  useEffect(() => {
    if (router.isReady) loadSchools()
  }, [filters, router.isReady])

  async function loadSchools() {
    setLoading(true)
    let query = supabase
      .from('schools_with_ratings')
      .select('*')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('avg_rating', { ascending: false })
      .limit(50)

    if (filters.county) query = query.eq('county', filters.county)
    if (filters.type) query = query.eq('school_type', filters.type)
    if (filters.boarding) query = query.eq('boarding', filters.boarding)
    if (filters.curriculum) query = query.contains('curriculum', [filters.curriculum])
    if (filters.q) query = query.ilike('name', `%${filters.q}%`)

    const { data } = await query
    setSchools(data || [])
    setLoading(false)
  }

  function updateFilter(key, value) {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
    // Update URL
    const params = new URLSearchParams()
    Object.entries(updated).forEach(([k, v]) => { if (v) params.set(k, v) })
    router.replace(`/browse?${params.toString()}`, undefined, { shallow: true })
  }

  const title = filters.county ? `Schools in ${filters.county}` : 'Browse All Schools'

  return (
    <>
      <Head>
        <title>{title} | ShuleKenya</title>
        <meta name="description" content={`Find and compare ${filters.county || 'Kenyan'} schools. Filter by curriculum, fees, boarding options and more.`} />
      </Head>

      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>{title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {loading ? 'Searching...' : `Showing ${schools.length} schools`}
            </p>
          </div>
        </div>

        <div className="filters-bar">
          <div className="filter-group">
            <label>County</label>
            <select value={filters.county} onChange={e => updateFilter('county', e.target.value)}>
              <option value="">All Counties</option>
              {counties.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                <option key={c.slug} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>School Type</label>
            <select value={filters.type} onChange={e => updateFilter('type', e.target.value)}>
              <option value="">All Types</option>
              {schoolTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Curriculum</label>
            <select value={filters.curriculum} onChange={e => updateFilter('curriculum', e.target.value)}>
              <option value="">All Curricula</option>
              {curricula.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Boarding</label>
            <select value={filters.boarding} onChange={e => updateFilter('boarding', e.target.value)}>
              <option value="">Any</option>
              {boardingOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Max Fee (KES/term)</label>
            <select value={filters.maxFee} onChange={e => updateFilter('maxFee', e.target.value)}>
              <option value="">Any Budget</option>
              <option value="20000">Under 20,000</option>
              <option value="50000">Under 50,000</option>
              <option value="100000">Under 100,000</option>
              <option value="250000">Under 250,000</option>
              <option value="500000">Under 500,000</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading schools...</div>
        ) : schools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>&#x1F50D;</div>
            <h3 style={{ marginBottom: 8 }}>No schools found</h3>
            <p>Try adjusting your filters or search in a different county.</p>
          </div>
        ) : (
          <div className="school-grid">
            {schools.map(s => <SchoolCard key={s.id} school={s} />)}
          </div>
        )}
      </div>
    </>
  )
}
