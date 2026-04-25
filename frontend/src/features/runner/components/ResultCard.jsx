import React from 'react'
import { motion } from 'framer-motion'

export default function ResultCard({ result }){
  return (
    <motion.div className="result-card" initial={{ y:10, opacity:0 }} animate={{ y:0, opacity:1 }}>
      <h2>Output</h2>
      <pre>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
    </motion.div>
  )
}
