import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY
});

app.post('/api/advisor', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Create the system prompt
    const systemContent = `You are Sentinel AI, the core intelligent agent of Aether Flow (a Gen-Z Neo-Brutalist UPI Payment app).
You help users with predictive alerts, wealth management, and offline Tap-to-Pay vaults. 
Keep responses VERY short, practical, and punchy. Maximum 2-3 sentences.`;

    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {"role":"system","content": systemContent},
        {"role":"user","content": message || "Hello Sentinel"}
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    
    const replyText = completion.choices[0].message.content;
    res.json({ reply: replyText });
  } catch (error) {
    console.error('Error in primary model, falling back...', error.message);
    try {
      const fallbackCompletion = await client.chat.completions.create({
        model: "meta/llama3-70b-instruct",
        messages: [{"role":"user","content": req.body.message || "Hello Sentinel"}],
        temperature: 0.7,
        max_tokens: 150
      });
      res.json({ reply: fallbackCompletion.choices[0].message.content });
    } catch (fallbackError) {
       console.error('Total API Failure:', fallbackError.message);
       res.status(500).json({ error: 'Failed to process the request' });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
