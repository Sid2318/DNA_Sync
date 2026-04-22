import React, { useState } from 'react'
import DNAInput from './components/DNAInput'
import ResultCard from './components/ResultCard'
import axios from 'axios'
import { motion } from 'framer-motion'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleRun = async (input, options) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const resp = await axios.post('/api/run', { input, options })
      setResult(resp.data)
    } catch (err) {
      setError(err?.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <motion.header className="app-header" initial={{ y: -40, opacity: 0 }} animate={{ y:0, opacity:1 }}>
        <h1>DNA Tools — Interactive UI</h1>
        <p>Run analysis, codon, DP, Huffman and more</p>
      </motion.header>

      <main>
        <DNAInput onRun={handleRun} loading={loading} />

        {loading && (
          <motion.div className="spinner" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} />
        )}

        {error && <div className="error">{error}</div>}
        {result && <ResultCard result={result} />}
      </main>

      <footer>Built with React • Animations by Framer Motion</footer>
    </div>
  )
}
