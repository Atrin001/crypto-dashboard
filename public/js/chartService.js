// Chart Service - Handles all chart creation and updates
window.chartService = (function() {
  'use strict';
  
  // Private helper functions
  const getChartColors = (isDarkMode) => {
    return {
      primary: isDarkMode ? '#4878ff' : '#3861fb',
      secondary: isDarkMode ? '#6d3dfa' : '#5d2eea',
      positive: '#16c784',
      negative: '#ea3943',
      border: isDarkMode ? '#323546' : '#e0e3eb',
      background: isDarkMode ? '#1f2128' : '#ffffff',
      text: isDarkMode ? '#f8f9fa' : '#222531',
      lightText: isDarkMode ? '#a1a7bb' : '#7a7a7a',
      gridLine: isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)'
    };
  };
  const getTimeUnit = (timestamps) => {
    if (!timestamps || timestamps.length < 2) return 'hour';
  
    const firstTime = timestamps[0];
    const lastTime = timestamps[timestamps.length - 1];
    const timeSpanHours = (lastTime - firstTime) / 3600;
  
    if (timeSpanHours <= 2) return 'minute';
    if (timeSpanHours <= 48) return 'hour';
    if (timeSpanHours <= 24 * 14) return 'day';
    return 'month';
  };
  
  const getGradient = (ctx, chartArea, startColor, endColor) => {
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  };
  
  // Public methods
  return {
    // Create price history chart
    createPriceHistoryChart: function(canvasId, data, symbol, isDarkMode) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      const colors = getChartColors(isDarkMode);
      
      // Prepare data
      const timestamps = data.t.map(t => t * 1000); // Convert to milliseconds
      const prices = data.c;
      const isPositive = prices[prices.length - 1] >= prices[0];
      
      const chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: timestamps,
          datasets: [{
            label: `${symbol.toUpperCase()} Price`,
            data: prices,
            borderColor: function(context) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              
              if (!chartArea) {
                // This case happens on initial chart load
                return isPositive ? colors.positive : colors.negative;
              }
              
              // Gradient for the line
              return isPositive 
                ? getGradient(ctx, chartArea, 'rgba(22, 199, 132, 1)', 'rgba(22, 199, 132, 0.5)')
                : getGradient(ctx, chartArea, 'rgba(234, 57, 67, 1)', 'rgba(234, 57, 67, 0.5)');
            },
            pointRadius: 0,
            borderWidth: 2,
            tension: 0.1,
            fill: true,
            backgroundColor: function(context) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              
              if (!chartArea) {
                // This case happens on initial chart load
                return isPositive ? 'rgba(22, 199, 132, 0.1)' : 'rgba(234, 57, 67, 0.1)';
              }
              
              // Gradient for the area under the line
              return isPositive
                ? getGradient(ctx, chartArea, 'rgba(22, 199, 132, 0.2)', 'rgba(22, 199, 132, 0)')
                : getGradient(ctx, chartArea, 'rgba(234, 57, 67, 0.2)', 'rgba(234, 57, 67, 0)');
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: getTimeUnit(data.t),
                tooltipFormat: 'MMM dd, yyyy HH:mm'
              },
              grid: {
                display: false
              },
              ticks: {
                color: colors.lightText,
                maxRotation: 0
              }
            },
            y: {
              position: 'right',
              grid: {
                color: colors.gridLine
              },
              ticks: {
                color: colors.lightText,
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: colors.background,
              titleColor: colors.text,
              bodyColor: colors.text,
              borderColor: colors.border,
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: function(tooltipItems) {
                  const date = new Date(tooltipItems[0].parsed.x);
                  return date.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                },
                label: function(context) {
                  const price = context.parsed.y;
                  return `$${price.toLocaleString()}`;
                }
              }
            }
          }
        }
      });
      
      return chartInstance;
    },
    
    // Create volume chart
    createVolumeChart: function(canvasId, data, symbol, isDarkMode) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      const colors = getChartColors(isDarkMode);
      
      // Prepare data
      const timestamps = data.t.map(t => t * 1000); // Convert to milliseconds
      const volumes = data.v;
      
      const chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: timestamps,
          datasets: [{
            label: `${symbol.toUpperCase()} Volume`,
            data: volumes,
            backgroundColor: function(context) {
              const index = context.dataIndex;
              const value = context.dataset.data[index];
              const prevValue = index > 0 ? context.dataset.data[index - 1] : value;
              
              // Green if volume increased, red if decreased
              return value >= prevValue ? colors.positive : colors.negative;
            },
            borderColor: 'transparent',
            borderWidth: 0,
            borderRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: getTimeUnit(data.t),
                tooltipFormat: 'MMM dd, yyyy HH:mm'
              },
              grid: {
                display: false
              },
              ticks: {
                color: colors.lightText,
                maxRotation: 0
              }
            },
            y: {
              grid: {
                color: colors.gridLine
              },
              ticks: {
                color: colors.lightText,
                callback: function(value) {
                  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
                  return value;
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: colors.background,
              titleColor: colors.text,
              bodyColor: colors.text,
              borderColor: colors.border,
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: function(tooltipItems) {
                  const date = new Date(tooltipItems[0].parsed.x);
                  return date.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                },
                label: function(context) {
                  const volume = context.parsed.y;
                  if (volume >= 1e9) return `Volume: ${(volume / 1e9).toFixed(2)}B ${symbol.toUpperCase()}`;
                  if (volume >= 1e6) return `Volume: ${(volume / 1e6).toFixed(2)}M ${symbol.toUpperCase()}`;
                  if (volume >= 1e3) return `Volume: ${(volume / 1e3).toFixed(2)}K ${symbol.toUpperCase()}`;
                  return `Volume: ${volume.toLocaleString()} ${symbol.toUpperCase()}`;
                }
              }
            }
          }
        }
      });
      
      return chartInstance;
    },
    
    // Create price gauge chart
    createPriceGaugeChart: function(canvasId, currentPrice, lowPrice, highPrice, isDarkMode) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      const colors = getChartColors(isDarkMode);
      
      // Calculate where the current price is in the range (0-1)
      const range = highPrice - lowPrice;
      const position = (currentPrice - lowPrice) / range;
      
      const chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [position * 100, 100 - (position * 100)],
            backgroundColor: [
              getGradient(ctx, {top: 0, bottom: canvas.height}, colors.positive, colors.negative),
              'rgba(0,0,0,0.05)'
            ],
            borderWidth: 0,
            circumference: 180,
            rotation: 270
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '80%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          }
        },
        plugins: [{
          id: 'gaugeText',
          afterDraw: (chart) => {
            const { width, height } = chart;
            const ctx = chart.ctx;
            ctx.save();
            
            // Center text
            const centerX = width / 2;
            const centerY = height - 20;
            
            // Display current price
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = colors.text;
            ctx.fillText(`$${currentPrice.toLocaleString()}`, centerX, centerY - 10);
            
            // Display low and high values
            ctx.font = '12px Arial';
            ctx.fillStyle = colors.lightText;
            ctx.textAlign = 'left';
            ctx.fillText(`$${lowPrice.toLocaleString()}`, 20, height - 20);
            ctx.textAlign = 'right';
            ctx.fillText(`$${highPrice.toLocaleString()}`, width - 20, height - 20);
            
            // Draw pointer
            ctx.beginPath();
            ctx.moveTo(centerX, height - 50);
            ctx.lineTo(centerX - 8, height - 35);
            ctx.lineTo(centerX + 8, height - 35);
            ctx.fillStyle = colors.primary;
            ctx.fill();
            
            ctx.restore();
          }
        }]
      });
      
      return chartInstance;
    },
    
    // Create market depth chart
    createMarketDepthChart: function(canvasId, depthData, symbol, isDarkMode) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      const colors = getChartColors(isDarkMode);
      
      // Process market depth data
      const bids = depthData.bids || [];
      const asks = depthData.asks || [];
      
      // Calculate cumulative volumes
      let cumulativeBids = [];
      let cumulativeAsks = [];
      let bidSum = 0;
      let askSum = 0;
      
      bids.forEach(bid => {
        const price = parseFloat(bid[0]);
        const volume = parseFloat(bid[1]);
        bidSum += volume;
        cumulativeBids.push({ x: price, y: bidSum });
      });
      
      asks.forEach(ask => {
        const price = parseFloat(ask[0]);
        const volume = parseFloat(ask[1]);
        askSum += volume;
        cumulativeAsks.push({ x: price, y: askSum });
      });
      
      // Sort by price
      cumulativeBids.sort((a, b) => a.x - b.x);
      cumulativeAsks.sort((a, b) => a.x - b.x);
      
      const chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Bids',
              data: cumulativeBids,
              borderColor: colors.positive,
              backgroundColor: 'rgba(22, 199, 132, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.1,
              pointRadius: 0
            },
            {
              label: 'Asks',
              data: cumulativeAsks,
              borderColor: colors.negative,
              backgroundColor: 'rgba(234, 57, 67, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.1,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            x: {
              type: 'linear',
              title: {
                display: true,
                text: 'Price (USD)',
                color: colors.lightText
              },
              grid: {
                color: colors.gridLine
              },
              ticks: {
                color: colors.lightText,
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            },
            y: {
              title: {
                display: true,
                text: `Volume (${symbol.toUpperCase()})`,
                color: colors.lightText
              },
              grid: {
                color: colors.gridLine
              },
              ticks: {
                color: colors.lightText,
                callback: function(value) {
                  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
                  return value;
                }
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: colors.text,
                boxWidth: 12,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: colors.background,
              titleColor: colors.text,
              bodyColor: colors.text,
              borderColor: colors.border,
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                title: function(tooltipItems) {
                  return `Price: $${tooltipItems[0].parsed.x.toLocaleString()}`;
                },
                label: function(context) {
                  const volume = context.parsed.y;
                  let formattedVolume;
                
                  if (volume >= 1e6) {
                    formattedVolume = (volume / 1e6).toFixed(2) + 'M';
                  } else if (volume >= 1e3) {
                    formattedVolume = (volume / 1e3).toFixed(2) + 'K';
                  } else {
                    formattedVolume = volume.toLocaleString();
                  }
                
                  return `${context.dataset.label}: ${formattedVolume} ${symbol.toUpperCase()}`;
                }
                
              }
            }
          }
        }
      });
      
      return chartInstance;
    }
  };
})();
