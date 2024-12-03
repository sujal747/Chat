const socket = io();

// Get elements
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages');
const statusContainer = document.getElementById('status');
let currentUsername = `User${Math.floor(Math.random() * 1000)}`;
let replyToMessage = null;

// Send message
sendButton.addEventListener('click', () => {
  const message = messageInput.value;
  if (message.trim()) {
    const data = { user: currentUsername, text: message, reply: replyToMessage };
    socket.emit('message', data);

    addMessage(data, 'sent');
    messageInput.value = ''; // Clear input
    replyToMessage = null; // Clear reply
    messageInput.placeholder = 'Type a message...'; // Reset placeholder
  }
});

// Add message to UI
function addMessage(message, type) {
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('message', type);

  // Add replied message
  if (message.reply) {
    const repliedMessage = document.createElement('div');
    repliedMessage.classList.add('replied-message');
    repliedMessage.textContent = `"${message.reply.text}" - ${message.reply.user}`;
    messageWrapper.appendChild(repliedMessage);
  }

  const messageText = document.createElement('div');
  messageText.innerHTML = `<strong>${message.user}: </strong>${message.text}`;
  messageWrapper.appendChild(messageText);

  // Add reply icon for received messages
  if (type === 'received') {
    const replyIcon = document.createElement('div');
    replyIcon.classList.add('reply-icon');
    replyIcon.innerHTML = '↩'; // Black arrow icon
    replyIcon.title = 'Reply to this message';
    replyIcon.addEventListener('click', () => {
      replyToMessage = message;
      messageInput.placeholder = `Replying to: "${message.text}"`;
      messageInput.focus();
    });
    messageWrapper.appendChild(replyIcon);
  }

  messagesContainer.appendChild(messageWrapper);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle pairing notifications
socket.on('pair', (data) => {
  statusContainer.textContent = data.message;
  statusContainer.style.color = data.pair === 'red' ? 'red' : 'green';
});

// Handle waiting status
socket.on('waiting', (data) => {
  statusContainer.textContent = data.message;
  statusContainer.style.color = 'orange';
});

// Listen for incoming messages
socket.on('message', (message) => {
  addMessage(message, 'received');
});

// Connection status
socket.on('connect', () => {
  statusContainer.textContent = 'Connected to server.';
  statusContainer.style.color = 'green';
});

socket.on('disconnect', () => {
  statusContainer.textContent = 'Disconnected. Trying to reconnect...';
  statusContainer.style.color = 'red';
});
// Handle Enter key press to send the message
messageInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    sendButton.click(); // Trigger the send button click event
  }
});
