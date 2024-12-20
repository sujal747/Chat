const express = require('express'); 
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');  // Import axios for API requests

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Hugging Face API setup
const huggingFaceAPI = 'https://api-inference.huggingface.co/models/microsoft/GODEL-v1_1-large-seq2seq';
const hfAPIKey = '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';  // Replace with your Hugging Face API key

// AI Bot Configuration
const aiBot = {
  name: 'Santosh',
  systemPrompt: `
    You are Santosh, a friendly conversational partner. 
    You respond in a casual manner, sometimes using simple words or phrases and occasionally making minor spelling mistakes or typos. 
    Your responses should not be too long; keep them short and to the point. 
    Your replies may take a little time to generate depending on the length of the input message, simulating human-like delay. 
    Don't give away that you are an AI—act like a regular person who is just having a conversation.
  `,
};

// Helper function for Hugging Face API calls
async function getBotResponse(userMessage) {
  try {
    const MAX_INPUT_LENGTH = 500;
    const trimmedMessage = userMessage.length > MAX_INPUT_LENGTH ? userMessage.substring(0, MAX_INPUT_LENGTH) : userMessage;

    const delay = Math.max(500, trimmedMessage.length * 20);
    await new Promise(resolve => setTimeout(resolve, delay));

    const response = await axios.post(huggingFaceAPI, {
      inputs: trimmedMessage
    }, {
      headers: {
        'Authorization': `Bearer ${hfAPIKey}`,
        'Content-Type': 'application/json'
      }
    });

    const botMessage = response.data[0]?.generated_text || "Sorry, I couldn't process your request.";

    // Optional: Add some random text manipulation to simulate typing error

    return botMessage;
  } catch (error) {
    console.error('Hugging Face API Error:', error.message);
    return "I apologize, but I'm having trouble processing your message right now. Please try again.";
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  if (waitingUser) {
    const user1 = waitingUser;
    const user2 = socket;

    user1.emit('pair', { message: 'You are now connected to another user!', pair: 'green' });
    user2.emit('pair', { message: 'You are now connected to another user!', pair: 'red' });

    user1.on('message', (data) => user2.emit('message', data));
    user2.on('message', (data) => user1.emit('message', data));

    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit('waiting', { message: 'Waiting for a partner...' });

    const botTimeout = setTimeout(async () => {
      if (waitingUser === socket) {
        waitingUser = null;
        socket.emit('pair', { message: `You are now connected to ${aiBot.name}!`, pair: 'blue' });

        // Handle messages with AI bot
        socket.on('message', async (data) => {
          // Send "typing" indicator
          socket.emit('botTyping', true);
          
          const botMessage = await getBotResponse(data.text);
          
          // Remove typing indicator
          socket.emit('botTyping', false);
          
          const reply = {
            user: aiBot.name,
            text: botMessage
          };
          socket.emit('message', reply);
        });
      }
    }, 5000);

    socket.on('disconnect', () => {
      clearTimeout(botTimeout);
      if (waitingUser === socket) {
        waitingUser = null;
      }
      console.log('A user disconnected:', socket.id);
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
