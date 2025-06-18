document.addEventListener('DOMContentLoaded', function () {
    // 1. Display greeting message when the page loads
    greetUser();

    // 2. Tabs for switching between Chat and Suggestion
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
            let activeTab = document.getElementById(this.dataset.tab + '-tab');
            activeTab.style.display = 'flex';
        });
    });

    // 3. Browse Prompts button
    document.getElementById('show-faqs-btn').addEventListener('click', function() {
        const promptList = document.getElementById('prompt-list');
        promptList.style.display = promptList.style.display === 'none' ? 'block' : 'none';
    });

    // 4. Predefined prompt buttons
    document.querySelectorAll('.prompt-btn').forEach(button => {
        button.addEventListener('click', function() {
            const chatInput = document.getElementById('chat-input');
            chatInput.value = this.textContent.trim();
            document.getElementById('prompt-list').style.display = 'none';
        });
    });

    // 5. Send button event listener
    document.getElementById('send-chat-btn').addEventListener('click', sendOpenEndedMessage);

    // 6. Enter key press event listener
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent new line in textarea
            sendOpenEndedMessage();
        }
    });

    // 7. Function to send messages to the backend
    async function sendOpenEndedMessage() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        chatInput.value = '';

        const loadingMessageId = 'loading-response';
        addMessage('Thinking...', 'bot', loadingMessageId);

        try {
            // --- UPDATED: Use relative paths for API endpoints ---
            let endpoint = userMessage.startsWith('/imagine') ? '/generate_image' : '/chat_gemini';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: userMessage})
            });

            // Remove the loading message
            document.getElementById(loadingMessageId)?.remove();

            if (response.ok) {
                const data = await response.json();
                // Handle response based on its type (text or image)
                if (data.type === 'image') {
                    addMessage(data.response, 'bot', null, 'image');
                } else {
                    addMessage(data.response, 'bot', null, 'text');
                }
            } else {
                // Handle HTTP errors (like 500 from the server)
                addMessage("Sorry, I couldn't process that. An error occurred on the server.", 'bot');
            }
        } catch (error) {
            // This block now correctly handles genuine network errors
            console.error("Network or fetch error:", error);
            document.getElementById(loadingMessageId)?.remove();
            addMessage("I'm having trouble connecting. Please check your internet or try again later.", 'bot');
        }
    }

    // Handle suggestion form
    document.getElementById('suggestion-btn').addEventListener('click', sendSuggestion);
    document.getElementById('suggestion-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendSuggestion();
    });

    async function sendSuggestion() {
        const suggestion = document.getElementById('suggestion-input').value.trim();
        if (!suggestion) return;

        try {
            // --- UPDATED: Use relative path for suggestion endpoint ---
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

    // 8. Function to add a message to the chat area
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

    // Function to parse markdown-like syntax
    function parseMarkdown(text) {
        // Basic parser for bold and italic
        return text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/_(.*?)_/g, '<i>$1</i>');
    }

    // 9. Initial greeting message
    function greetUser() {
        const greetingMessage = "Hi, I am PBASC Assistant. How can I help? To generate an image, start your prompt with `/imagine`.";
        addMessage(greetingMessage, 'bot');
    }
});
