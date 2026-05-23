import '../styles/globals.css'
import Layout from '../components/Layout'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>)

  return (
    <>
      <Head>
        <title>ShuleKenya - Find the Perfect School in Kenya</title>
        <meta name="description" content="Search across 12,000+ schools in all 47 Kenyan counties. Compare fees, read parent reviews, check admission timelines, and find the right school for your child." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {getLayout(<Component {...pageProps} />)}
    </>
  )
}
