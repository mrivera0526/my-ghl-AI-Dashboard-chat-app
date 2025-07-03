require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// This is the crucial part: Serve the frontend files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, tool } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const toolInstructions = {
      'marketing': 'You are an expert marketing copywriter. Generate creative and persuasive copy for ads, emails, and social media.',
      'business': 'You are a strategic business consultant. Create structured and insightful business plan sections, SWOT analyses, and answer strategic questions.',
      'code': 'You are a helpful code assistant. Provide clear, well-explained code snippets in various programming languages.',
      'default': 'You are a helpful general assistant.'
    };

    const systemPrompt = toolInstructions[tool] || toolInstructions['default'];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to get a response from the AI.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
