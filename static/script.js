document.addEventListener('DOMContentLoaded', function () {
    // Flag to ensure the greeting is only sent once
    let greetingHasBeenSent = false;

    // 1. Function to add a message to the chat area
    function addMessage(content, who = 'bot', id = null, type = 'text') {
        const chatArea = document.getElementById('chat-area');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${who}`;
        if (id) msgDiv.id = id;

        let messageContent;
        if (type === 'image' && who === 'bot') {
            messageContent = `<img src="${content}" alt="Generated Image" style="max-width: 100%; border-radius: 12px; display: block;">`;
        } else {
            messageContent = parseMarkdown(content);
        }

        if (who === 'bot') {
            msgDiv.innerHTML = `
                <img src="/static/icon.jpeg" alt="Bot Avatar" class="bot-avatar">
                <div class="bubble">${messageContent}</div>
            `;
        } else {
            msgDiv.innerHTML = `<div class="bubble">${parseMarkdown(content)}</div>`;
        }
        chatArea.appendChild(msgDiv);
        document.getElementById('chat-scrollable-content').scrollTop = document.getElementById('chat-scrollable-content').scrollHeight;
    }

    // 2. Function to parse markdown-like syntax
    function parseMarkdown(text) {
        // Basic parser for bold and italic
        return text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/_(.*?)_/g, '<i>$1</i>');
    }

    // 3. Function to send the initial greeting
    function greetUser() {
        // Only send the greeting if it hasn't been sent before
        if (!greetingHasBeenSent) {
            const greetingMessage = "Hi, I am PBASC Assistant. How can I help? To generate an image, start your prompt with `/imagine`.";
            addMessage(greetingMessage, 'bot');
            greetingHasBeenSent = true; // Set the flag to true
        }
    }

    // 4. Function to send messages to the backend
    async function sendOpenEndedMessage() {
        const userMessage = document.getElementById('chat-input').value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        document.getElementById('chat-input').value = '';

        const loadingMessageId = 'loading-response';
        addMessage('Thinking...', 'bot', loadingMessageId);

        try {
            const endpoint = userMessage.startsWith('/imagine') ? '/generate_image' : '/chat_gemini';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: userMessage})
            });

            document.getElementById(loadingMessageId)?.remove();

            if (response.ok) {
                const data = await response.json();
                if (data.type === 'image') {
                    addMessage(data.response, 'bot', null, 'image');
                } else {
                    addMessage(data.response, 'bot', null, 'text');
                }
            } else {
                addMessage("Sorry, I couldn't process that. An error occurred on the server.", 'bot');
            }
        } catch (error) {
            console.error("Network or fetch error:", error);
            document.getElementById(loadingMessageId)?.remove();
            addMessage("I'm having trouble connecting. Please check your internet or try again later.", 'bot');
        }
    }

    // 5. Function to handle suggestion submission
    async function sendSuggestion() {
        const suggestion = document.getElementById('suggestion-input').value.trim();
        if (!suggestion) return;

        try {
            const response = await fetch('/submit_suggestion', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ suggestion: suggestion })
            });

            const messageDiv = document.getElementById('suggestion-message');
            if (response.ok) {
                messageDiv.textContent = 'Thank you! Your suggestion has been sent.';
                messageDiv.style.color = 'green';
                document.getElementById('suggestion-input').value = '';
            } else {
                messageDiv.textContent = "Sorry, I couldn't send your suggestion. Please try again.";
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error("Error sending suggestion:", error);
            document.getElementById('suggestion-message').textContent = "Connection error. Please try again later.";
            document.getElementById('suggestion-message').style.color = 'red';
        }
    }

    // --- SETUP EVENT LISTENERS ---

    // Tabs for switching between Chat and Suggestion
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
            const activeTab = document.getElementById(this.dataset.tab + '-tab');
            activeTab.style.display = 'flex';
        });
    });

    // "Browse Prompts" button - uses classList.toggle
    document.getElementById('show-faqs-btn').addEventListener('click', function() {
        document.getElementById('prompt-list').classList.toggle('hidden');
    });

    // Predefined prompt buttons
    document.querySelectorAll('.prompt-btn').forEach(button => {
        button.addEventListener('click', function() {
            const chatInput = document.getElementById('chat-input');
            chatInput.value = this.textContent.trim();
            document.getElementById('prompt-list').classList.add('hidden'); // Hide list after selection
        });
    });

    // Send button
    document.getElementById('send-chat-btn').addEventListener('click', sendOpenEndedMessage);

    // Enter key in chat input
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendOpenEndedMessage();
        }
    });

    // Suggestion form
    document.getElementById('suggestion-btn').addEventListener('click', sendSuggestion);
    document.getElementById('suggestion-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendSuggestion();
    });

    // --- INITIALIZE CHATBOT ---
    greetUser();
});
            msgDiv.innerHTML = `<div class="bubble">${parseMarkdown(content)}</div>`;
        }
        chatArea.appendChild(msgD
