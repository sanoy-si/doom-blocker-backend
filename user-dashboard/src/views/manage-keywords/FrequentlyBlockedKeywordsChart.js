import React from 'react'
import { CChartPie } from '@coreui/react-chartjs'

const FrequentlyBlockedKeywordsChart = ({ data }) => {
  return (
    <div className="mb-4">
      <h5 className="mb-3">Frequently Blocked Keywords</h5>
      <CChartPie
        data={{
          labels: data.map(item => item.keyword),
          datasets: [
            {
              data: data.map(item => item.count),
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#8BC34A', '#F44336',
              ],
              hoverOffset: 8,
            },
          ],
        }}
        options={{
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1200,
            easing: 'easeInOutQuart',
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                font: { size: 16 },
              },
            },
          },
        }}
        style={{ maxWidth: 400, margin: '0 auto' }}
      />
    </div>
  )
}

export default FrequentlyBlockedKeywordsChart
