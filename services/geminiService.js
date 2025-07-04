import env from 'dotenv';
env.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Replace with your actual Gemini API key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const getCompletion = async (promptText) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    // console.log('Gemini API response:', JSON.stringify(data, null, 2));

    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error('No candidates in Gemini response');

    // Combine text parts into a single string
    return candidate.content.parts.map(part => part.text).join(' ').trim();

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

export default { getCompletion };
