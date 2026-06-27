import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import webhookRoutes from './routes/webhook.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import cron from 'node-cron';
import https from 'https';

// Connect to database
connectDB();

const app = express();

// Webhook endpoint needs raw body, register it before express.json()
app.use('/api/webhooks', webhookRoutes);

// Middlewares for API
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Base route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  // Self-ping cron job — har 2 minute mein Render server ko alive rakhta hai
  const SERVER_URL = 'https://raga-music-player-node.onrender.com';

  cron.schedule('*/2 * * * *', () => {
    https.get(SERVER_URL, (res) => {
      console.log(`[Cron] Server pinged — Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`[Cron] Ping failed: ${err.message}`);
    });
  });

  console.log('[Cron] Self-ping job scheduled every 2 minutes.');
});
