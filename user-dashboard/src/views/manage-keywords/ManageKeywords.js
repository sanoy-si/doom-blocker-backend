import KeywordManager from 'src/components/KeywordManager'
import './frequently-blocked-keywords.theme.css'

import FrequentlyBlockedKeywordsChart from './FrequentlyBlockedKeywordsChart'



const keywordStats = [
  { keyword: 'spoiler', count: 32 },
  { keyword: 'politics', count: 25 },
  { keyword: 'prank', count: 18 },
  { keyword: 'job offer', count: 12 },
  { keyword: 'promotion', count: 10 },
  { keyword: 'hiring', count: 8 },
  { keyword: 'giveaway', count: 7 },
  { keyword: 'Other', count: 5 },
  { keyword: 'NSFW', count: 3 },
]

const ManageKeywords = () => {
  // Calculate percentages for the list only
  const total = keywordStats.reduce((sum, item) => sum + item.count, 0);
  const percentData = keywordStats.map(item => total > 0 ? ((item.count / total) * 100).toFixed(1) : 0);
  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Manage Blocked Keywords Card - full row */}
          <div
            className="card p-4 mb-4 animate-keywords-card"
            style={{
              borderRadius: 22,
              background: 'linear-gradient(135deg, rgba(108,99,255,0.13) 0%, rgba(168,237,234,0.10) 100%)',
              boxShadow: '0 6px 32px 0 rgba(31, 38, 135, 0.18)',
              border: '1.5px solid rgba(108,99,255,0.13)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              transition: 'box-shadow 0.3s',
            }}
          >
            <h4 className="fw-bold mb-3" style={{ color: '#8f7cf7', letterSpacing: 0.5, fontSize: 26 }}>Manage Blocked Keywords</h4>
            <KeywordManager keywords={["spoiler", "politics", "prank", "job offer", "promotion", "hiring", "giveaway", "crypto", "NSFW"]} />
          </div>
          {/* Frequently Blocked Keywords Card - full row */}
          <div
            className="card p-4 mb-4 animate-keywords-card frequently-blocked-theme"
            style={{
              borderRadius: 22,
              background: 'var(--fbk-card-bg, linear-gradient(135deg, rgba(108,99,255,0.13) 0%, rgba(168,237,234,0.10) 100%))',
              boxShadow: '0 6px 32px 0 rgba(31, 38, 135, 0.13)',
              border: '1.5px solid var(--fbk-card-border, rgba(108,99,255,0.13))',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              transition: 'box-shadow 0.3s',
            }}
          >
            <h4 className="fw-bold mb-3 frequently-blocked-title" style={{ letterSpacing: 0.5, fontSize: 26 }}>Frequently Blocked Keywords</h4>
            <div className="row">
              <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center mb-3 mb-lg-0">
                <div className="frequently-blocked-chart-bg" style={{ borderRadius: 18, padding: 18, boxShadow: '0 2px 12px 0 rgba(108,99,255,0.08)' }}>
                  <FrequentlyBlockedKeywordsChart data={keywordStats} />
                </div>
              </div>
              <div className="col-12 col-lg-5">
                <ul className="list-group list-group-flush bg-transparent border-0 frequently-blocked-list">
                  {keywordStats.map((item, idx) => (
                    <li
                      key={item.keyword}
                      className="list-group-item d-flex justify-content-between align-items-center border-0 mb-2 frequently-blocked-list-item"
                    >
                      <span className="frequently-blocked-keyword">{idx + 1}. {item.keyword}</span>
                      <span className="badge rounded-pill frequently-blocked-badge">{percentData[idx]}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageKeywords
