document.addEventListener('DOMContentLoaded', () => {
    // --- Tool Definitions ---
    const AI_TOOLS = {
        ceo: { name: "Organizational GPT", description: "The main AI assistant.", placeholder: "Ask a broad, cross-departmental question..." },
        operations_chief: { name: "Operations Chief", description: "Handles all operational tasks.", placeholder: "Ask about SOPs, processes..." },
        marketing_director: { name: "Marketing Director", description: "Handles all marketing tasks.", placeholder: "Ask for a campaign idea..." },
        sales_manager: { name: "Sales Manager", description: "Handles all sales tasks.", placeholder: "Ask about lead generation..." },
        it_director: { name: "IT Director", description: "Handles all IT tasks.", placeholder: "Ask about GHL, Zapier..." },
        accounting_head: { name: "Accounting Head", description: "Handles all financial tasks.", placeholder: "Ask for a budget forecast..." },
        hr_director: { name: "HR Director", description: "Handles all HR tasks.", placeholder: "Ask about onboarding..." },
        legal_counsel: { name: "Legal Counsel", description: "Handles all legal tasks.", placeholder: "Ask about a contract clause..." },
        procurement_chief: { name: "Procurement Chief", description: "Handles all procurement tasks.", placeholder: "Ask about vendor relations..." },
    };
    
    // Start with null, it will be set from the URL
    let activeTool = null; 

    // --- Element References ---
    const chatLog = document.getElementById('chat-log');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const atPopup = document.getElementById('at-popup');
    const activeToolTag = document.getElementById('active-tool-tag');

    // --- NEW FUNCTION: Reads the tool from the URL on page load ---
    function initializeToolFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const toolKey = params.get('tool'); // e.g., 'ceo' or 'marketing_director'
        
        if (toolKey && AI_TOOLS[toolKey]) {
            // If a valid tool is found in the URL, set it as the active one
            selectTool(toolKey, true);
        } else {
            // Fallback if no valid tool is in the URL
            // We can select a default like 'ceo'
            selectTool('ceo', true);
            console.warn('No valid tool found in URL, defaulting to CEO.');
        }
    }

    // --- Event Listener for the Chat Form ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        messageInput.value = '';

        const loadingMessage = addMessage('...', 'loading');

        try {
            // Send the currently activeTool to the backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, tool: activeTool }),
            });

            if (!response.ok) {
                // This will catch the "400 Bad Request" from the server if the tool is invalid
                const errorData = await response.json();
                throw new Error(errorData.error || 'Network response was not ok.');
            }
            
            const data = await response.json();
            loadingMessage.remove();
            addMessage(data.reply, 'assistant');
        } catch (error) {
            loadingMessage.remove();
            addMessage(`Sorry, something went wrong. Please try again. (Error: ${error.message})`, 'assistant');
            console.error('Error:', error);
        }
    });

    // --- Logic for the @ Popup ---
    messageInput.addEventListener('input', () => {
        const text = messageInput.value;
        if (text.startsWith('@')) {
            const query = text.substring(1).toLowerCase();
            showAtPopup(query);
        } else {
            hideAtPopup();
        }
    });

    function showAtPopup(query = '') {
        atPopup.innerHTML = '';
        const filteredTools = Object.keys(AI_TOOLS).filter(key => 
            AI_TOOLS[key].name.toLowerCase().includes(query)
        );

        if (filteredTools.length === 0) {
            hideAtPopup();
            return;
        }

        filteredTools.forEach(key => {
            const tool = AI_TOOLS[key];
            const item = document.createElement('div');
            item.className = 'at-popup-item';
            item.innerHTML = `<span class="name">@${tool.name}</span><span class="description">${tool.description}</span>`;
            item.addEventListener('click', () => selectTool(key));
            atPopup.appendChild(item);
        });
        atPopup.style.display = 'block';
    }

    function hideAtPopup() {
        atPopup.style.display = 'none';
    }

    // --- MODIFIED FUNCTION: Sets the active tool and updates the UI ---
    function selectTool(toolKey, isInitialLoad = false) {
        const tool = AI_TOOLS[toolKey];
        if (!tool) {
            console.error(`Attempted to select invalid tool: ${toolKey}`);
            return;
        }

        activeTool = toolKey; // Set the active tool for the backend

        // Update the UI
        activeToolTag.textContent = `@${tool.name}`;
        activeToolTag.style.display = 'block';
        messageInput.placeholder = tool.placeholder;
        
        if (!isInitialLoad) {
            messageInput.value = '';
        }
        
        hideAtPopup();
        messageInput.focus();
    }

   function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    if (sender === 'assistant') {
        // If the message is from the assistant, parse it as Markdown
        // The 'marked.parse()' function converts the Markdown text to HTML
        messageElement.innerHTML = marked.parse(text);
    } else {
        // If the message is from the user, just display it as plain text
        messageElement.textContent = text;
    }

    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
    return messageElement;
}
    }

    // --- Run the initialization function when the script loads ---
    initializeToolFromUrl();
});
