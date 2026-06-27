import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import webhookRoutes from './routes/webhook.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

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
});
