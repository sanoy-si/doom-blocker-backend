import React, { useState } from 'react'
import { CCard, CCardBody, CCardHeader, CListGroup, CListGroupItem, CRow, CCol } from '@coreui/react'
import AnimatedButton from './AnimatedButton'
import AnimatedInput from './AnimatedInput'

const KeywordManager = ({ keywords: initialKeywords = [], onChange }) => {
  const [keywords, setKeywords] = useState(initialKeywords)
  const [input, setInput] = useState('')

  const addKeyword = (e) => {
    e.preventDefault()
    if (input.trim() && !keywords.includes(input.trim())) {
      const newKeywords = [...keywords, input.trim()]
      setKeywords(newKeywords)
      setInput('')
      onChange && onChange(newKeywords)
    }
  }

  const removeKeyword = (kw) => {
    const newKeywords = keywords.filter((k) => k !== kw)
    setKeywords(newKeywords)
    onChange && onChange(newKeywords)
  }

  return (
    <CCard className="mb-4 border-0 bg-transparent">
      <CCardBody className="p-0">
        <form className="mb-4 d-flex gap-2 flex-wrap align-items-center" onSubmit={addKeyword}>
          <AnimatedInput
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add new keyword..."
            className="me-2"
            style={{
              background: 'rgba(30,32,60,0.92)',
              color: '#e0e0e0',
              border: '1.5px solid #6C63FF',
              minWidth: 220,
              fontSize: 17,
              fontWeight: 500,
              borderRadius: 10,
              boxShadow: '0 2px 8px 0 rgba(108,99,255,0.08)',
              transition: 'border 0.2s, box-shadow 0.2s',
            }}
          />
          <AnimatedButton
            type="submit"
            color="primary"
            style={{
              background: 'linear-gradient(90deg, #6C63FF 0%, #43cea2 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 8,
              boxShadow: '0 2px 8px 0 rgba(108,99,255,0.10)',
              padding: '6px 22px',
              letterSpacing: 0.5,
            }}
          >Add</AnimatedButton>
        </form>
        <CListGroup className="bg-transparent border-0">
          {keywords.length === 0 && <CListGroupItem className="bg-dark text-light border-0">No keywords yet.</CListGroupItem>}
          {keywords.map((kw, i) => (
            <CListGroupItem
              key={i}
              className="d-flex justify-content-between align-items-center border-0 mb-2"
              style={{
                background: 'rgba(30,32,60,0.92)',
                color: '#e0e0e0',
                borderRadius: 10,
                fontSize: 17,
                fontWeight: 500,
                boxShadow: '0 1px 4px 0 rgba(108,99,255,0.06)',
                padding: '10px 18px',
              }}
            >
              <span>{kw}</span>
              <AnimatedButton
                color="danger"
                size="sm"
                onClick={() => removeKeyword(kw)}
                style={{
                  background: 'linear-gradient(90deg, #ff5858 0%, #f09819 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 15,
                  borderRadius: 7,
                  boxShadow: '0 1px 4px 0 rgba(255,88,88,0.10)',
                  padding: '4px 16px',
                  letterSpacing: 0.2,
                }}
              >Remove</AnimatedButton>
            </CListGroupItem>
          ))}
        </CListGroup>
      </CCardBody>
    </CCard>
  )
}

export default KeywordManager
