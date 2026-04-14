const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

dotenv.config();

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Socket.io Middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);
  
  // A user can join a room based on their user ID to receive targeted notifications
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);

// Basic Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Krishi Mitra API is up and running' });
});




// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
