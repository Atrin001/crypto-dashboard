const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Market Overview
app.get('/api/market/overview', async (req, res) => {
  try {
    const response = await axios.get('https://api.nobitex.ir/market/stats');
    res.json({ stats: response.data.stats });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Historical Data
app.get('/api/market/history', async (req, res) => {
  try {
    const { symbol, resolution, from, to } = req.query;
    if (!symbol || !resolution || !from || !to) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const response = await axios.get('https://api.nobitex.ir/market/udf/history', {
      params: {
        symbol: `${symbol}usdt`,
        resolution,
        from,
        to
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Order Book
app.get('/api/market/depth/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get('https://api.nobitex.ir/v2/orderbook/depth', {
      params: { symbol: `${symbol}-usdt` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching order book:', error);
    res.status(500).json({ error: 'Failed to fetch order book data' });
  }
});


// Views
app.get('/', (req, res) => {
  res.render('index', { title: 'Crypto Market Tracker' });
});

app.get('/market/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.render('market-detail', {
    title: `${symbol.toUpperCase()} Market`,
    symbol
  });
});

app.get('/portfolio', (req, res) => {
  res.render('portfolio', {
    title: 'Your Portfolio'
  });
});

// 404
app.use((req, res) => {
  res.status(404).send('404 - Not Found');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});