document.addEventListener('DOMContentLoaded', () => {
    const AI_TOOLS = {
        marketing: { name: "Marketing Guru", description: "Generates creative marketing copy.", placeholder: "Ask for ad copy..." },
        business: { name: "Business Strategist", description: "Helps with business plans.", placeholder: "Ask for a SWOT analysis..." },
        code: { name: "Code Assistant", description: "Writes and explains code.", placeholder: "Ask to write a function..." },
    };
    let activeTool = 'default';

    const chatLog = document.getElementById('chat-log');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const atPopup = document.getElementById('at-popup');
    const activeToolTag = document.getElementById('active-tool-tag');

    function getToolFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const toolKey = params.get('tool');
        if (toolKey && AI_TOOLS[toolKey]) {
            selectTool(toolKey, true);
        }
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        messageInput.value = '';

        const loadingMessage = addMessage('...', 'loading');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, tool: activeTool }),
            });

            if (!response.ok) throw new Error('Network response was not ok.');
            
            const data = await response.json();
            loadingMessage.remove();
            addMessage(data.reply, 'assistant');
        } catch (error) {
            loadingMessage.remove();
            addMessage('Sorry, something went wrong. Please try again.', 'assistant');
            console.error('Error:', error);
        }
    });

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

    function selectTool(toolKey, isInitial = false) {
        const tool = AI_TOOLS[toolKey];
        activeTool = toolKey;

        activeToolTag.textContent = `@${tool.name}`;
        activeToolTag.style.display = 'block';
        messageInput.placeholder = tool.placeholder;
        
        if (!isInitial) {
            messageInput.value = '';
        }
        
        hideAtPopup();
        messageInput.focus();
    }

    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.textContent = text;
        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight;
        return messageElement;
    }

    getToolFromUrl();
});
