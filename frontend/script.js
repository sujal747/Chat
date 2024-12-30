// Configuration and constants
const CONFIG = {
  RANDOM_USERNAME_PREFIX: 'User',
  USERNAME_MAX_NUMBER: 1000
};

// DOM Element Selectors
const SELECTORS = {
  MESSAGE_INPUT: '#message-input',
  SEND_BUTTON: '#send-button',
  MESSAGES_CONTAINER: '#messages',
  STATUS_CONTAINER: '#status',
  NOTIFICATION_SOUND: '#notification-sound'
};

// Main Chat Application Class
class ChatApplication {
  constructor() {
    this.socket = io();
    this.initializeElements();
    this.currentUsername = this.generateUsername();
    this.replyToMessage = null;
    this.attachEventListeners();
    this.setupSocketHandlers();
  }

  // Generate a random username
  generateUsername() {
    return `${CONFIG.RANDOM_USERNAME_PREFIX}${Math.floor(Math.random() * CONFIG.USERNAME_MAX_NUMBER)}`;
  }

  // Initialize DOM elements
  initializeElements() {
    this.messageInput = document.querySelector(SELECTORS.MESSAGE_INPUT);
    this.sendButton = document.querySelector(SELECTORS.SEND_BUTTON);
    this.messagesContainer = document.querySelector(SELECTORS.MESSAGES_CONTAINER);
    this.statusContainer = document.querySelector(SELECTORS.STATUS_CONTAINER);
    this.notificationSound = document.querySelector(SELECTORS.NOTIFICATION_SOUND);
  }

  // Attach event listeners
  attachEventListeners() {
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.messageInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.sendMessage();
      }
    });
  }

  // Send message logic
  sendMessage() {
    const message = this.messageInput.value.trim();
    if (message) {
      const messageData = { 
        user: this.currentUsername, 
        text: message, 
        reply: this.replyToMessage 
      };

      this.socket.emit('message', messageData);
      this.addMessage(messageData, 'sent');
      this.resetMessageInput();
    }
  }

  // Reset message input and reply state
  resetMessageInput() {
    this.messageInput.value = '';
    this.replyToMessage = null;
    this.messageInput.placeholder = 'Type a message...';
  }

  // Create message element
  createMessageElement(message, type) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message', type);

    // Add replied message section
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
      const replyIcon = this.createReplyIcon(message);
      messageWrapper.appendChild(replyIcon);
    }

    return messageWrapper;
  }

  // Create reply icon
  createReplyIcon(message) {
    const replyIcon = document.createElement('div');
    replyIcon.classList.add('reply-icon');
    replyIcon.innerHTML = '↩';
    replyIcon.title = 'Reply to this message';
    replyIcon.addEventListener('click', () => {
      this.replyToMessage = message;
      this.messageInput.placeholder = `Replying to: "${message.text}"`;
      this.messageInput.focus();
    });
    return replyIcon;
  }

  // Add message to UI
  addMessage(message, type) {
    const messageElement = this.createMessageElement(message, type);
    this.messagesContainer.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  // Socket event handlers
  setupSocketHandlers() {
    this.socket.on('pair', this.handlePairNotification.bind(this));
    this.socket.on('waiting', this.handleWaitingStatus.bind(this));
    this.socket.on('message', this.handleIncomingMessage.bind(this));
    this.socket.on('connect', this.handleConnection.bind(this));
    this.socket.on('disconnect', this.handleDisconnection.bind(this));
  }

  // Handle pair notification
  handlePairNotification(data) {
    this.updateStatus(data.message, data.pair === 'red' ? 'red' : 'green');
  }

  // Handle waiting status
  handleWaitingStatus(data) {
    this.updateStatus(data.message, 'orange');
  }

  // Handle incoming messages
  handleIncomingMessage(message) {
    this.addMessage(message, 'received');
    
    // Play notification sound if tab is not active
    if (document.hidden) {
      this.notificationSound.play();
    }
  }

  // Handle connection
  handleConnection() {
    this.updateStatus('Connected to server.', 'green');
  }

  // Handle disconnection
  handleDisconnection() {
    this.updateStatus('Disconnected. Trying to reconnect...', 'red');
  }

  // Update status container
  updateStatus(message, color) {
    this.statusContainer.textContent = message;
    this.statusContainer.style.color = color;
  }
}

// Initialize the chat application
document.addEventListener('DOMContentLoaded', () => {
  new ChatApplication();
});

// Next-button
document.getElementById('next-button').addEventListener('click', function () {
  location.reload();
});
