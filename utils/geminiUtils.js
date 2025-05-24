const axios =require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getEmbedding(text) {
  try {
    const res = await axios.post('http://localhost:5005/embed', { text });
    return res.data.embedding;
  } catch (error) {
    console.error('Error getting embedding:', error.message);
    return null;
  }
}
function cosineSimilarity(vec1, vec2) {
  const dot = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dot / (norm1 * norm2);
}

async function callGeminiLLM(text){
    const API_KEY = process.env.GEMINI_API_KEY;

    const fullPrompt = `
  You are an AI assistant helping recruiters. Given a resume, extract only the following:
  - Technical skills
  - Relevant projects (title + description)
  - Work experience (role, company, duration, summary)
  Ignore general info like email, phone, objective, school grades, hobbies, etc.

  Resume Text:
  ${text}
  `;

    const requestBody = {
      contents: [
        {
          parts: [{ text: fullPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    };

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const parts = response.data?.candidates?.[0]?.content?.parts;
      if (parts && parts.length > 0) {
        return parts[0].text;
      }

      return "No meaningful response received.";
    } catch (error) {
      console.error("Error calling Gemini API:", error.response?.data || error.message);
      return "Error generating summary.";
    }
}

module.exports = { getEmbedding, cosineSimilarity ,callGeminiLLM };
