import express, { Application } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';
import testRoutes from '@routes/testRoutes';
import authRoutes from '@routes/authRoutes';
import userRoutes from '@routes/userRoutes';
import taskRoutes from '@routes/taskRoutes';
import offerRoutes from '@routes/offerRoutes';
import messageRoutes from '@routes/messageRoutes';
import reviewRoutes from '@routes/reviewRoutes';
import { testConnection } from '@utils/db';
import { initSocket } from '@utils/socket';

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

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
app.use('/api/tasks', taskRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);


// Initialize Socket.IO
initSocket(io);

// Add more route imports as needed

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`,
  );
  await testConnection();
});
