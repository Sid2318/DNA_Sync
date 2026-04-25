import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function DNAInput({ onRun, loading }){
  const [input, setInput] = useState('')
  const [tool, setTool] = useState('analysis')
  const [options, setOptions] = useState('')

  const submit = (e) => {
    e.preventDefault()
    onRun(input, { tool, options })
  }

  return (
    <motion.form className="dna-form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste DNA sequence or input data here" />
      <div className="controls">
        <select value={tool} onChange={(e)=>setTool(e.target.value)}>
          <option value="analysis">Analysis</option>
          <option value="codon">Codon</option>
          <option value="dp">DP Module</option>
          <option value="huffman">Huffman</option>
          <option value="z_module">Z Module</option>
        </select>
        <input value={options} onChange={(e)=>setOptions(e.target.value)} placeholder="Extra options" />
        <motion.button whileTap={{ scale: 0.96 }} disabled={loading}>{loading? 'Running...':'Run'}</motion.button>
      </div>
    </motion.form>
  )
}
