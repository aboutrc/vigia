import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'sk-fc3cf065a531918b6de89add71bc3cf8633fdcc4c225e29b',
  dangerouslyAllowBrowser: true
});

export const translateToSpanish = async (text: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the given English text to Spanish, maintaining any markdown formatting, links, and special characters. Keep URLs, technical terms, and formatting symbols (**, *, [], (), etc.) unchanged. Ensure the translation is natural and culturally appropriate."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.2,
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed. Please try again.');
  }
};