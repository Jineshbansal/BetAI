import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runHederaAgent } from './hedera_agent.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.HEDERA_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Main endpoint for processing prompts
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    console.log(`📨 Processing prompt: ${prompt}`);
    
    // Process the prompt with the Hedera agent
    const result = await runHederaAgent(prompt);
    console.log("result", result);
    
    console.log(`✅ Prompt processed successfully`);
    
    // Return the result
    res.json({
      success: result.success,
      message: result.result?.output || result.result || result.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing prompt:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Hedera Agent Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
