// Base URL for your Flask application
//const RENDER_BASE_URL = 'https://fredai-io.onrender.com';
const RENDER_BASE_URL = 'http://127.0.0.1:5000';  // Local server URL

document.addEventListener('DOMContentLoaded', function () {
    // 1. Display greeting message when the page loads
    greetUser();  // Display greeting message when page is loaded

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

    // 3. Browse FAQs button to show/hide the predefined prompt buttons
    const showFaqsBtn = document.getElementById('show-faqs-btn');
    const promptList = document.getElementById('prompt-list');

    showFaqsBtn.addEventListener('click', function() {
        // Toggle the visibility of prompt buttons
        promptList.style.display = promptList.style.display === 'none' ? 'block' : 'none';
    });

    // 4. Adding Event Listeners for the predefined prompt buttons
    const promptButtons = document.querySelectorAll('.prompt-btn');
    promptButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the button's text and add it to the chat input
            const chatInput = document.getElementById('chat-input');
            chatInput.value = this.textContent.trim(); // Set the prompt text to chat input

            // Hide the prompt buttons after selection
            promptList.style.display = 'none';
        });
    });

    // 5. Event listener for Send button
    const sendChatBtn = document.getElementById('send-chat-btn');
    sendChatBtn.addEventListener('click', sendOpenEndedMessage);

    // 6. Event listener for Enter key press
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendOpenEndedMessage();
        }
    });

    // 7. Function to send open-ended messages to Gemini API
    async function sendOpenEndedMessage() {
        const userMessage = chatInput.value.trim();

        if (!userMessage) {
            return; // Don't send empty messages
        }

        document.getElementById('chat-area').style.display = 'flex'; // Ensure chat area is visible

        addMessage(userMessage, 'user'); // Display user's message
        chatInput.value = ''; // Clear input field

        // Optionally add a loading indicator
        const loadingMessageId = 'loading-gemini-response';
        addMessage('Thinking...', 'bot', loadingMessageId); // Add a temporary loading message

        try {
            const response = await fetch(`https://fredai-io.onrender.com/chat_gemini`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: userMessage})
            });

            const data = await response.json();

            // Remove loading message
            const loadingMsgDiv = document.getElementById(loadingMessageId);
            if (loadingMsgDiv) {
                loadingMsgDiv.remove();
            }

            if (response.ok) {
                addMessage(data.response, 'bot'); // Display Gemini's response
            } else {
                console.error("Error from Gemini API endpoint:", data.error || response.statusText);
                addMessage("Sorry, I couldn't process that. Please try again.", 'bot');
            }
        } catch (error) {
            console.error("Network or unexpected error calling Gemini API:", error);
            // Remove loading message
            const loadingMsgDiv = document.getElementById(loadingMessageId);
            if (loadingMsgDiv) {
                loadingMsgDiv.remove();
            }
            addMessage("It seems I'm having trouble connecting. Please check your internet or try again later.", 'bot');
        }
    }

    // Handle suggestion form submission
    const suggestionBtn = document.getElementById('suggestion-btn');
    suggestionBtn.addEventListener('click', sendSuggestion);

    // Handle Enter key press for suggestion form
    const suggestionInput = document.getElementById('suggestion-input');
    suggestionInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendSuggestion();
        }
    });

    // Function to send the suggestion to the backend (which will send it to email)
    async function sendSuggestion() {
        const suggestion = suggestionInput.value.trim();

        if (!suggestion) {
            return; // Don't send empty suggestions
        }

        // Optionally add a loading message
        const loadingMessageId = 'loading-suggestion-response';
        addMessage('Sending your suggestion...', 'bot', loadingMessageId);

        try {
            const response = await fetch(`${RENDER_BASE_URL}/submit_suggestion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ suggestion: suggestion }) // Send the suggestion as JSON
            });

            const data = await response.json();

            // Remove loading message
            const loadingMsgDiv = document.getElementById(loadingMessageId);
            if (loadingMsgDiv) {
                loadingMsgDiv.remove();
            }

            const suggestionMessageDiv = document.getElementById('suggestion-message'); // Get the div for displaying the message

            if (response.ok) {
                // Display success message
                suggestionMessageDiv.textContent = 'Thank you! Your suggestion has been sent to the Customer Support.';
                suggestionMessageDiv.style.color = 'green'; // Change the color for success
                suggestionInput.value = ''; // Clear the suggestion input field
            } else {
                // Display error message
                suggestionMessageDiv.textContent = "Sorry, I couldn't send your suggestion. Please try again later.";
                suggestionMessageDiv.style.color = 'red'; // Change the color for error
            }
        } catch (error) {
            console.error("Error sending suggestion:", error);
            // Remove loading message
            const loadingMsgDiv = document.getElementById(loadingMessageId);
            if (loadingMsgDiv) {
                loadingMsgDiv.remove();
            }

            const suggestionMessageDiv = document.getElementById('suggestion-message');
            suggestionMessageDiv.textContent = "It seems I'm having trouble connecting. Please try again later.";
            suggestionMessageDiv.style.color = 'red'; // Change the color for error
        }
    }



    // 8. Function to add a message bubble to the chat
    function addMessage(text, who = 'bot', id = null) {
        const chatArea = document.getElementById('chat-area');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${who}`;
        if (id) {
            msgDiv.id = id; // Set ID for loading message
        }

        // Parsing the text for markdown-like syntax and converting it to HTML
        const parsedText = parseMarkdown(text);

        if (who === 'bot') {
            msgDiv.innerHTML = `
                <img src="static/icon.png" alt="Bot Avatar" class="bot-avatar">
                <div class="bubble">${parsedText}</div>
            `;
        } else {
            msgDiv.innerHTML = `<div class="bubble">${parsedText}</div>`;
        }
        chatArea.appendChild(msgDiv);

        // Scroll to the bottom of the scrollable content
        const chatScrollableContent = document.getElementById('chat-scrollable-content');
        chatScrollableContent.scrollTop = chatScrollableContent.scrollHeight;
    }


    // Function to parse markdown-like syntax and convert it to HTML
    function parseMarkdown(text) {
        // Handle triple backticks (```) for code block
        text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');  // Multi-line code block

        // Handle bold and italic (**bold + italic**)
        text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>');  // **bold + italic**

        // Then, handle bold (**text**)
        text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Just **bold**

        // Handle italic (_text_)
        text = text.replace(/_(.*?)_/g, '<i>$1</i>');  // Italic _text_

        // Handle tables (| Header1 | Header2 | to <table><tr><th>Header1</th><th>Header2</th></tr>)
        text = text.replace(/(?:\|.*?\|(\n|$))+/g, function(match) {
            let rows = match.trim().split('\n');
            let tableHTML = '<table border="1" cellpadding="5" cellspacing="0" style="width: 100%; margin: 20px 0;">';

            rows.forEach((row, rowIndex) => {
                let columns = row.split('|').map(col => col.trim()).filter(col => col);
                if (columns.length > 0) {
                    tableHTML += '<tr>';
                    columns.forEach((col, colIndex) => {
                        if (rowIndex === 0) {
                            tableHTML += `<th>${col}</th>`;
                        } else {
                            tableHTML += `<td>${col}</td>`;
                        }
                    });
                    tableHTML += '</tr>';
                }
            });

            tableHTML += '</table>';
            return tableHTML;
        });

        return text;
    }


    // 9. Function to send the greeting message when the chat starts
    function greetUser() {
        const greetingMessage = "Hi, I am PBASC Assistant. How can I help you today? You can browse prompts to start.";
        addMessage(greetingMessage, 'bot'); // Add the greeting message to the chat area
    }

});
