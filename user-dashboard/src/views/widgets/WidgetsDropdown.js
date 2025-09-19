import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

import {
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CWidgetStatsA,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartBar, CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilArrowBottom, cilArrowTop, cilOptions } from '@coreui/icons'

const WidgetsDropdown = (props) => {
  const widgetChartRef1 = useRef(null)
  const widgetChartRef2 = useRef(null)

  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (widgetChartRef1.current) {
        setTimeout(() => {
          widgetChartRef1.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
          widgetChartRef1.current.update()
        })
      }

      if (widgetChartRef2.current) {
        setTimeout(() => {
          widgetChartRef2.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
          widgetChartRef2.current.update()
        })
      }
    })
  }, [widgetChartRef1, widgetChartRef2])

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      {[0, 1, 2, 3].map((i) => (
        <CCol sm={6} xl={4} xxl={3} key={i}>
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.13, duration: 0.6, type: 'spring', stiffness: 120 }}
          >
            {i === 0 && (
              <CWidgetStatsA
                color="primary"
                value={<span>263</span>}
                title="Total Blocked Videos"
                action={null}
                chart={
                  <CChartLine
                    ref={widgetChartRef1}
                    className="mt-3 mx-3"
                    style={{ height: '70px' }}
                    data={{
                      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                      datasets: [
                        {
                          label: 'Blocked',
                          backgroundColor: 'transparent',
                          borderColor: 'rgba(255,255,255,.55)',
                          pointBackgroundColor: getStyle('--cui-primary'),
                          data: [30, 32, 38, 40, 45, 38, 40],
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                      maintainAspectRatio: false,
                      scales: { x: { display: false }, y: { display: false } },
                      elements: { line: { borderWidth: 2, tension: 0.4 }, point: { radius: 3 } },
                    }}
                  />
                }
              />
            )}
            {i === 1 && (
              <CWidgetStatsA
                color="info"
                value={<span>18h 25m</span>}
                title="Total Time Saved"
                action={null}
                chart={
                  <CChartLine
                    ref={widgetChartRef2}
                    className="mt-3 mx-3"
                    style={{ height: '70px' }}
                    data={{
                      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                      datasets: [
                        {
                          label: 'Time Saved',
                          backgroundColor: 'transparent',
                          borderColor: 'rgba(255,255,255,.55)',
                          pointBackgroundColor: getStyle('--cui-info'),
                          data: [120, 140, 160, 180, 200, 220, 240],
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                      maintainAspectRatio: false,
                      scales: { x: { display: false }, y: { display: false } },
                      elements: { line: { borderWidth: 2, tension: 0.4 }, point: { radius: 3 } },
                    }}
                  />
                }
              />
            )}
            {i === 2 && (
              <CWidgetStatsA
                color="warning"
                value={<span>17</span>}
                title="Blocked Today"
                action={null}
                chart={
                  <CChartLine
                    className="mt-3"
                    style={{ height: '70px' }}
                    data={{
                      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                      datasets: [
                        {
                          label: 'Today',
                          backgroundColor: 'rgba(255,255,255,.2)',
                          borderColor: 'rgba(255,255,255,.55)',
                          data: [10, 12, 15, 13, 14, 16, 17],
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                      maintainAspectRatio: false,
                      scales: { x: { display: false }, y: { display: false } },
                      elements: { line: { borderWidth: 2, tension: 0.4 }, point: { radius: 0 } },
                    }}
                  />
                }
              />
            )}
            {i === 3 && (
              <CWidgetStatsA
                color="danger"
                value={<span>+8.2% <span className="fs-6 fw-normal">(vs last week)</span></span>}
                title="Increase from Last Week"
                action={null}
                chart={
                  <CChartBar
                    className="mt-3 mx-3"
                    style={{ height: '70px' }}
                    data={{
                      labels: [
                        'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
                      ],
                      datasets: [
                        {
                          label: 'Increase',
                          backgroundColor: 'rgba(255,255,255,.2)',
                          borderColor: 'rgba(255,255,255,.55)',
                          data: [2, 3, 4, 5, 6, 7, 8],
                          barPercentage: 0.6,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                      scales: { x: { display: false }, y: { display: false } },
                    }}
                  />
                }
              />
            )}
          </motion.div>
        </CCol>
      ))}
    </CRow>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsDropdown
