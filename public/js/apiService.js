// API Service
// This file should be placed in public/js/apiService.js

window.apiService = {
  // Fetch market overview
  fetchMarketOverview: async function() {
    try {
      const response = await fetch('/api/market/overview');
      const data = await response.json();
      
      if (!data.stats) {
        throw new Error('Invalid response format');
      }
      
      return data.stats;
    } catch (error) {
      console.error('Failed to fetch market overview:', error);
      throw error;
    }
  },
  
  // Fetch historical data for a specific symbol and timeframe
  fetchHistoricalData: async function(symbol, resolution, from, to) {
    try {
      const params = new URLSearchParams({
        symbol,
        resolution,
        from,
        to
      });
      
      const response = await fetch(`/api/market/history?${params}`);
      const data = await response.json();
      
      if (data.s !== 'ok') {
        throw new Error(data.error || 'Failed to fetch historical data');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      throw error;
    }
  },
  
  // Fetch market depth data for a specific symbol
  fetchMarketDepth: async function(symbol) {
    try {
      const response = await fetch(`/api/market/depth/${symbol}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // More flexible error handling to accommodate different API response formats
      if (data.status === 'error' || (data.status !== 'ok' && !data.asks && !data.bids)) {
        throw new Error(data.error || data.message || 'Failed to fetch order book data');
      }
      
      // Handle different response formats
      let depthData;
      
      if (data.depth) {
        // Format: { status: 'ok', depth: { asks: [...], bids: [...] } }
        depthData = data.depth;
      } else if (data.asks && data.bids) {
        // Format: { asks: [...], bids: [...] }
        depthData = data;
      } else if (data.data && (data.data.asks || data.data.bids)) {
        // Format: { status: 'ok', data: { asks: [...], bids: [...] } }
        depthData = data.data;
      } else {
        throw new Error('Unexpected order book data format');
      }
      
      // Ensure we have valid arrays
      if (!Array.isArray(depthData.asks) || !Array.isArray(depthData.bids)) {
        throw new Error('Invalid order book data structure');
      }
      
      return depthData;
    } catch (error) {
      console.error('Failed to fetch order book data:', error);
      
      // Return mock data as fallback so the UI doesn't break
      return {
        asks: generateMockOrderBookData(10, true),
        bids: generateMockOrderBookData(10, false)
      };
    }
  }
};

// Helper function to generate fallback data when API fails
function generateMockOrderBookData(count, isAsk) {
  const basePrice = 50000; // Example base price for BTC
  const result = [];
  
  for (let i = 0; i < count; i++) {
    const priceOffset = isAsk ? (i * 100) : -(i * 100);
    const price = basePrice + priceOffset;
    const volume = Math.random() * 2 + 0.1; // Random volume between 0.1 and 2.1
    
    result.push([price.toFixed(2), volume.toFixed(4)]);
  }
  
  return result;
}