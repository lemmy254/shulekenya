import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { counties } from '../lib/counties'
import SchoolCard from '../components/SchoolCard'

export default function Home() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [county, setCounty] = useState('')
  const [featured, setFeatured] = useState([])
  const [countyCounts, setCountyCounts] = useState({})
  const [totalSchools, setTotalSchools] = useState(0)

  useEffect(() => {
    loadFeatured()
    loadCounts()
  }, [])

  async function loadFeatured() {
    const { data } = await supabase
      .from('schools_with_ratings')
      .select('*')
      .eq('is_published', true)
      .order('avg_rating', { ascending: false })
      .limit(6)
    setFeatured(data || [])
  }

  async function loadCounts() {
    const { count } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
    setTotalSchools(count || 0)

    // Get counts per county
    const { data } = await supabase
      .from('schools')
      .select('county')
      .eq('is_published', true)
    if (data) {
      const counts = {}
      data.forEach(s => { counts[s.county] = (counts[s.county] || 0) + 1 })
      setCountyCounts(counts)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (county) params.set('county', county)
    router.push(`/browse?${params.toString()}`)
  }

  const sortedCounties = [...counties].sort((a, b) => (countyCounts[b.name] || 0) - (countyCounts[a.name] || 0))

  return (
    <>
      <Head>
        <title>ShuleKenya - Find the Perfect School for Your Child in Kenya</title>
      </Head>

      {/* Hero */}
      <div className="hero">
        <h1>Find the Perfect School<br/>for Your Child in Kenya</h1>
        <p>Search across {totalSchools > 0 ? totalSchools.toLocaleString() + '+' : ''} schools in all 47 counties. Compare fees, read parent reviews, and find the right fit.</p>

        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by school name, area, or curriculum..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={county} onChange={e => setCounty(e.target.value)}>
            <option value="">All Counties</option>
            {counties.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.slug} value={c.name}>{c.name}</option>
            ))}
          </select>
          <button type="submit">Search Schools</button>
        </form>

        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-num">{totalSchools > 0 ? totalSchools.toLocaleString() : '—'}</div>
            <div className="stat-label">Schools Listed</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">47</div>
            <div className="stat-label">Counties Covered</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">Free</div>
            <div className="stat-label">For Parents</div>
          </div>
        </div>
      </div>

      {/* Browse by County */}
      <div className="section">
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>Browse by County</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Find schools in any of Kenya's 47 counties</p>
        <div className="county-grid">
          {sortedCounties.slice(0, 16).map(c => (
            <Link key={c.slug} href={`/browse?county=${c.name}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="county-card">
                <div className="name">{c.name}</div>
                <div className="count">{countyCounts[c.name] || 0} schools</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/browse" className="btn btn-outline">View All 47 Counties</Link>
        </div>
      </div>

      {/* Featured Schools */}
      {featured.length > 0 && (
        <div className="section">
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>Featured Schools</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Top-rated schools across Kenya</p>
          <div className="school-grid">
            {featured.map(s => <SchoolCard key={s.id} school={s} />)}
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="section" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 32 }}>How ShuleKenya Works</h2>
        <div className="how-grid">
          <div style={{ padding: 32 }}>
            <div className="how-icon">&#x1F50D;</div>
            <h3 style={{ marginBottom: 8 }}>Search & Filter</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Find schools by county, curriculum, fee range, boarding options, and more.
            </p>
          </div>
          <div style={{ padding: 32 }}>
            <div className="how-icon">&#x2696;&#xFE0F;</div>
            <h3 style={{ marginBottom: 8 }}>Compare Schools</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Add schools to your list and compare fees, facilities, ratings side by side.
            </p>
          </div>
          <div style={{ padding: 32 }}>
            <div className="how-icon">&#x2705;</div>
            <h3 style={{ marginBottom: 8 }}>Apply with Confidence</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Read parent reviews, check admission timelines, and contact schools directly.
            </p>
          </div>
        </div>
      </div>

      {/* CTA for Schools */}
      <div className="cta-banner">
        <h2>Are You a School? Join ShuleKenya</h2>
        <p>Create your free listing and reach thousands of parents looking for schools like yours.</p>
        <Link href="/register" className="btn btn-white btn-lg">
          Register Your School — It&apos;s Free
        </Link>
      </div>
    </>
  )
}
