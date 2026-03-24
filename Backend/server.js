import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

console.log("Loaded API Key:", process.env.GEMINI_API_KEY ? "YES" : "NO");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post('/api/generate-meme', async (req, res) => {
    try {
        const { prompt, templateId, templateName } = req.body;

        if (!prompt || !templateId || !templateName) {
            return res.status(400).json({ error: 'Missing prompt, templateId, or templateName' });
        }

        // 1. Generate text with Gemini API
        const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

        const requestBody = {
            contents: [{
                parts: [{
                    text: `Create funny meme text for the "${templateName}" meme template based on: "${prompt}".
Rules:
- You MUST respond with EXACTLY two parts separated by the pipe character |.
- Format: TOP TEXT | BOTTOM TEXT
- Both parts must be non-empty and punchy.
- Keep each part under 60 characters.
- No explanations, no quotes, no extra text — ONLY the two parts separated by |.`
                }]
            }],
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 300
            }
        };

        const geminiApiKey = process.env.GEMINI_API_KEY.trim();
        console.log("Sending request to Gemini. Key length:", geminiApiKey.length);

        const geminiResponse = await fetch(`${geminiApiUrl}?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            throw new Error(errorData.error?.message || 'Failed to generate text with Gemini API');
        }

        const data = await geminiResponse.json();
        const generatedText = data.candidates[0].content.parts[0].text.trim();
        console.log('Gemini raw response:', generatedText);

        // Try splitting on | first, then fallback to newline
        let textParts = generatedText.split('|').map(part => part.trim());
        if (textParts.length < 2) {
            textParts = generatedText.split('\n').map(part => part.trim()).filter(Boolean);
        }

        const topText = textParts[0] || '';
        const bottomText = textParts[1] || '';
        console.log('Top text:', topText, '| Bottom text:', bottomText);

        // 2. Generate image with Imgflip API
        const formData = new FormData();
        formData.append('template_id', templateId);
        formData.append('username', process.env.IMGFLIP_USERNAME.trim());
        formData.append('password', process.env.IMGFLIP_PASSWORD.trim());
        formData.append('text0', topText);
        formData.append('text1', bottomText);

        const imgflipResponse = await fetch('https://api.imgflip.com/caption_image', {
            method: 'POST',
            body: formData
        });

        if (!imgflipResponse.ok) {
            throw new Error('Failed to reach Imgflip API');
        }

        const imgflipData = await imgflipResponse.json();

        if (!imgflipData.success) {
            throw new Error(imgflipData.error_message || 'Failed to generate meme via Imgflip API');
        }

        res.json({ success: true, url: imgflipData.data.url });

    } catch (error) {
        console.error('Error generating meme:', error.message);
        const keyLength = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim().length : 0;
        res.status(500).json({ error: error.message || 'Something went wrong.', keyLength });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
