
import React, { useEffect, useRef } from 'react'

import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'


const MainChart = ({ blockedData }) => {
  const chartRef = useRef(null)

  // Helper to update chart colors for dark/light mode
  const updateChartColors = () => {
    if (chartRef.current) {
      const chart = chartRef.current;
      // Axes
      chart.options.scales.x.grid.borderColor = getStyle('--cui-border-color-translucent');
      chart.options.scales.x.grid.color = getStyle('--cui-border-color-translucent');
      chart.options.scales.x.ticks.color = getStyle('--cui-body-color');
      chart.options.scales.y.grid.borderColor = getStyle('--cui-border-color-translucent');
      chart.options.scales.y.grid.color = getStyle('--cui-border-color-translucent');
      chart.options.scales.y.ticks.color = getStyle('--cui-body-color');
      // Legend
      if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
        chart.options.plugins.legend.labels.color = getStyle('--cui-body-color');
      }
      chart.update();
    }
  };

  useEffect(() => {
    // Update on mount
    setTimeout(updateChartColors, 0);
    // Update on theme change
    const handler = () => setTimeout(updateChartColors, 0);
    document.documentElement.addEventListener('ColorSchemeChange', handler);
    return () => {
      document.documentElement.removeEventListener('ColorSchemeChange', handler);
    };
  }, [chartRef]);

  // blockedData: { youtube: [..], x: [..], linkedin: [..], labels: [...] }
  const labels = blockedData?.labels || ['January', 'February', 'March', 'April', 'May', 'June', 'July']
  const datasets = [
    {
      label: 'YouTube Blocked',
      backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
      borderColor: getStyle('--cui-info'),
      pointHoverBackgroundColor: getStyle('--cui-info'),
      borderWidth: 2,
      data: blockedData?.youtube || [0,0,0,0,0,0,0],
      fill: true,
    },
    {
      label: 'X Blocked',
      backgroundColor: 'transparent',
      borderColor: getStyle('--cui-success'),
      pointHoverBackgroundColor: getStyle('--cui-success'),
      borderWidth: 2,
      data: blockedData?.x || [0,0,0,0,0,0,0],
    },
    {
      label: 'LinkedIn Blocked',
      backgroundColor: 'transparent',
      borderColor: getStyle('--cui-danger'),
      pointHoverBackgroundColor: getStyle('--cui-danger'),
      borderWidth: 1,
      borderDash: [8, 5],
      data: blockedData?.linkedin || [0,0,0,0,0,0,0],
    },
    {
      label: 'Reddit Blocked',
      backgroundColor: 'transparent',
      borderColor: '#FF5700', // Reddit orange
      pointHoverBackgroundColor: '#FF5700',
      borderWidth: 2,
      borderDash: [2, 2],
      data: blockedData?.reddit || [0,0,0,0,0,0,0],
    },
  ]

  return (
    <CChartLine
      ref={chartRef}
      style={{ height: '300px', marginTop: '40px' }}
      data={{ labels, datasets }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              font: {
                size: 18,
                weight: 'bold',
              },
              color: getStyle('--cui-body-color'), // Will be updated by effect for theme
              padding: 24,
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: getStyle('--cui-border-color-translucent'),
              drawOnChartArea: false,
            },
            ticks: {
              color: getStyle('--cui-body-color'),
            },
          },
          y: {
            beginAtZero: true,
            border: {
              color: getStyle('--cui-border-color-translucent'),
            },
            grid: {
              color: getStyle('--cui-border-color-translucent'),
            },
            max: 250,
            ticks: {
              color: getStyle('--cui-body-color'),
              maxTicksLimit: 5,
              stepSize: Math.ceil(250 / 5),
            },
          },
        },
        elements: {
          line: {
            tension: 0.4,
          },
          point: {
            radius: 0,
            hitRadius: 10,
            hoverRadius: 4,
            hoverBorderWidth: 3,
          },
        },
      }}
    />
  )
}

export default MainChart
