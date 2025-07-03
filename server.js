require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');
const marked = require('marked'); // Add this line


const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Top-Level Assistant Map ---
const assistantMap = {
    'ceo': process.env.CEO_ASSISTANT_ID,
    'operations_chief': process.env.OPERATIONS_CHIEF_ASSISTANT_ID,
    'marketing_director': process.env.MARKETING_DIRECTOR_ASSISTANT_ID,
    'sales_manager': process.env.SALES_MANAGER_ASSISTANT_ID,
    'it_director': process.env.IT_DIRECTOR_ASSISTANT_ID,
    'accounting_head': process.env.ACCOUNTING_HEAD_ASSISTANT_ID,
    'hr_director': process.env.HR_DIRECTOR_ASSISTANT_ID,
    'legal_counsel': process.env.LEGAL_COUNSEL_ASSISTANT_ID,
    'procurement_chief': process.env.PROCUREMENT_CHIEF_ASSISTANT_ID,
};
// --- End of Map ---

// Make marked available to the frontend globally
app.get('/marked.min.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'marked', 'marked.min.js'));
});
app.post('/api/chat', async (req, res) => {
  try {
    const { message, tool } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const assistantId = assistantMap[tool];
    if (!assistantId) {
      console.error(`Assistant ID not found for tool: ${tool}`);
      return res.status(400).json({ error: `Configuration error: Assistant for '${tool}' not found.` });
    }

    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, { role: "user", content: message });
    const run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistantId });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) throw new Error(`Run failed with status: ${runStatus.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantResponse = messages.data.find(msg => msg.role === 'assistant');
    const reply = assistantResponse ? assistantResponse.content[0].text.value : "I couldn't generate a response.";
    res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

