// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Now import app after env vars are loaded
import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 VENTECH API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});

