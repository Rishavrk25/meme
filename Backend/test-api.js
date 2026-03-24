import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY.trim();
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ parts: [{ text: `Create a funny meme text for a "Drake Hotline Bling" meme template based on this prompt: "food". The text should be witty, concise, and suitable for a meme. For a two-panel meme template, provide text for both panels separated by | character. Keep it under 100 characters total. Don't include any explanations, just the meme text.` }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 100 }
    })
});

const data = await res.json();
const raw = data.candidates[0].content.parts[0].text;
console.log("RAW OUTPUT:", JSON.stringify(raw));
console.log("SPLIT BY PIPE:", raw.split('|').map(s => s.trim()));
