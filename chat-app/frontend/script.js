const socket = io();

// Get elements
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages');
const statusContainer = document.getElementById('status');
const typingIndicator = document.getElementById('typing-indicator');
let typingTimeout;
let currentUsername = `User${Math.floor(Math.random() * 1000)}`; // Generate random username

// Handle sending messages
sendButton.addEventListener('click', () => {
  const message = messageInput.value;
  if (message.trim()) {
    socket.emit('message', { user: currentUsername, text: message });
    messageInput.value = ''; // Clear the input field

    // Add your own message to the chat
    const newMessage = document.createElement('div');
    newMessage.classList.add('message', 'sent');
    newMessage.innerHTML = `<strong>${currentUsername}: </strong>${message}`;
    messagesContainer.appendChild(newMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
  }
});

// Listen for pair notifications
socket.on('pair', (data) => {
  statusContainer.textContent = data.message;
  statusContainer.style.color = data.pair === 'red' ? 'red' : 'green';
});

// Listen for waiting status
socket.on('waiting', (data) => {
  statusContainer.textContent = data.message;
  statusContainer.style.color = 'orange';
});

// Listen for incoming messages
socket.on('message', (message) => {
  const newMessage = document.createElement('div');
  newMessage.classList.add('message', 'received');
  newMessage.innerHTML = `<strong>${message.user}: </strong>${message.text}`;
  messagesContainer.appendChild(newMessage);
  messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
});

// Typing indicator functionality
messageInput.addEventListener('input', () => {
  socket.emit('typing', true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit('typing', false), 2000);
});

socket.on('typing', (isTyping) => {
  typingIndicator.style.display = isTyping ? 'block' : 'none';
  typingIndicator.textContent = isTyping ? 'User is typing...' : '';
});

// Connection status message
socket.on('connect', () => {
  statusContainer.textContent = 'You are connected!';
  statusContainer.style.color = 'green';
});

socket.on('disconnect', () => {
  statusContainer.textContent = 'Connecting...';
  statusContainer.style.color = 'orange';
});