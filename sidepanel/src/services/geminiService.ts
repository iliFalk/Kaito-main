import { GoogleGenAI, Chat } from "@google/genai";

export const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const generateChatStream = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[],
  modelName: string,
  apiKey: string,
  file?: File
) => {
  const ai = new GoogleGenAI({ apiKey });
  const chat: Chat = ai.chats.create({ 
    model: modelName,
    history: history 
  });
  
  const messageParts = [];
  if(file){
    const imagePart = await fileToGenerativePart(file);
    messageParts.push(imagePart);
  }
  messageParts.push({ text: prompt });
  
  return chat.sendMessageStream({ message: messageParts });
};
