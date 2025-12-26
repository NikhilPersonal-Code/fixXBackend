import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';
import 'tsconfig-paths/register';
import testRoutes from '@routes/testRoutes';
import authRoutes from '@routes/authRoutes';
import userRoutes from '@routes/userRoutes';
import { testConnection } from '@utils/db';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
// app.use(apiKeyMiddleware); // Apply the API key middleware
app.use('/api', express.static('public')); // serve static files from public folder

// Routes
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Add more route imports as needed

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`,
  );
  await testConnection();
});
