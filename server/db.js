const messages = [];

module.exports = {
  addMessage: (message) => {
    messages.push(message);
    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.shift();
    }
    return message;
  },
  
  getMessages: () => {
    return messages;
  }
};