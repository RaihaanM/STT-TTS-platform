import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Translates text from a source language to a target language.
 * @param text The text to translate.
 * @param sourceLang The name of the source language (e.g., "Hindi").
 * @param targetLang The name of the target language (e.g., "English").
 * @returns The translated text.
 */
export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  try {
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only provide the translated text, without any additional explanation or preamble: "${text}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error in translateText:", error);
    throw new Error("Gemini API call failed for translation.");
  }
};

/**
 * Converts text to speech.
 * @param text The text to convert to speech.
 * @returns Base64 encoded audio data string.
 */
// FIX: Removed the `languageName` parameter as the model can infer the language from the text.
// The prompt is now just the text to be synthesized, preventing instructions from being spoken.
export const textToSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A versatile voice
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from Gemini API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error in textToSpeech:", error);
        throw new Error("Gemini API call failed for text-to-speech.");
    }
};