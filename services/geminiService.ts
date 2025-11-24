import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FileContext, QuizQuestion, QuizSettings, ChatMessage, MindMapNode } from "../types";

// Helper to get AI instance
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing! update the API key in the .env file");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Analysis & Summarization ---
// We keep this on Gemini 3 Pro for maximum depth and reasoning capability during the initial one-time analysis
export const analyzeFileContent = async (file: FileContext): Promise<{ text: string, summary: string, sections: {title: string, content: string}[] }> => {
  const ai = getAI();
  
  const prompt = `
    You are an advanced document analyst using the Gemini 3 Pro model. 
    1. Accurately extract all text from the provided file (even if it's handwritten or an image).
    2. If the text is garbled or unclear, use your reasoning to reconstruct the missing parts logically based on context.
    3. Organize the extracted text into logical sections with descriptive titles.
    4. Provide a concise but comprehensive summary of the content.
    
    Output the result in JSON format:
    {
      "extractedText": "Full extracted text joined together...",
      "sections": [
        { "title": "Introduction", "content": "Text content..." },
        { "title": "Chapter 1", "content": "Text content..." }
      ],
      "summary": "The summary..."
    }
  `;
// gemini-2.5-pro model area.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: {
      parts: [
        { inlineData: { mimeType: file.mimeType, data: file.data } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          extractedText: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["title", "content"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["extractedText", "summary", "sections"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return {
    text: result.extractedText || "Could not extract text.",
    summary: result.summary || "Could not generate summary.",
    sections: result.sections || []
  };
};

// --- Chat Functionality ---
// Switched to gemini-2.5-flash for high speed/low latency interactions
export const sendMessageToGemini = async (
  history: ChatMessage[],
  currentMessage: string,
  file: FileContext,
  useSearch: boolean,
  chatImage?: { mimeType: string, data: string } | null
): Promise<{ text: string, groundingUrls?: Array<{title: string, uri: string}> }> => {
  const ai = getAI();

  // Construct history for the model (Stateless approach to allow toggling tools)
  // We inject the file context into the system instruction or first message
  const systemInstruction = `
    You are a helpful AI assistant named 'AniMind'.
    You are analyzing a file named "${file.name}".
    
    CONTEXT FROM FILE:
    ${file.extractedText ? file.extractedText.substring(0, 20000) : "Refer to the attached image/file."}
    
    RULES:
    1. Strictly answer based on the file content provided.
    2. If the user asks for outside information, ONLY use the Google Search tool if enabled.
    3. If Google Search is used, ensure the results are related to the file's topic.
    4. Keep the tone helpful, slightly enthusiastic (anime-inspired).
    5. If the user uploads an image in chat, analyze it in the context of the main file and the conversation.
  `;

  const contents = [];
  
  // Add history
  history.forEach(msg => {
    const parts: any[] = [{ text: msg.text }];
    if (msg.image) {
        parts.unshift({ inlineData: { mimeType: msg.image.mimeType, data: msg.image.data } });
    }
    contents.push({
      role: msg.role,
      parts: parts
    });
  });

  // Add current message
  const currentParts: any[] = [{ text: currentMessage }];

  if (chatImage) {
    currentParts.unshift({
      inlineData: { mimeType: chatImage.mimeType, data: chatImage.data }
    });
  }

  if (history.length === 0) {
    currentParts.unshift({
      inlineData: { mimeType: file.mimeType, data: file.data }
    });
  }

  contents.push({
    role: 'user',
    parts: currentParts
  });

  const tools = useSearch ? [{ googleSearch: {} }] : [];
//model fot chatting i put 2.5 flash
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
      }
    });

    // Extract grounding
    let groundingUrls: Array<{title: string, uri: string}> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
       chunks.forEach((chunk: any) => {
         if (chunk.web?.uri) {
           groundingUrls.push({ title: chunk.web.title || 'Source', uri: chunk.web.uri });
         }
       });
    }

    return {
      text: response.text || "I couldn't generate a response.",
      groundingUrls
    };
  } catch (error) {
    console.error("Chat Error", error);
    return { text: "Error communicating with the Spirit of the Machine. Please try again." };
  }
};

// --- Quiz Generation ---
// Switched to gemini-2.5-flash for faster generation of multiple questions
export const generateQuizQuestions = async (
  file: FileContext,
  settings: QuizSettings
): Promise<QuizQuestion[]> => {
  const ai = getAI();

  const prompt = `
    Generate ${settings.count} ${settings.type === 'multiple-choice' ? 'multiple choice' : 'open-ended'} quiz questions based on the provided file content.
    
    ${settings.topic ? `FOCUS TOPIC / INSTRUCTIONS: ${settings.topic}` : 'Cover the document sequentially from TOP to BOTTOM.'}

    CRITERIA:
    1. Questions must cover the specified focus topic or the whole document.
    2. Questions should sound like they are asked by a real human teacher.
    3. If multiple choice, provide 4 distinct options.
    4. Provide the correct answer and a brief, helpful explanation.
  `;

  // Define Schema based on type
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING } 
        },
        answer: { type: Type.STRING },
        explanation: { type: Type.STRING },
        type: { type: Type.STRING }
      },
      required: ["id", "question", "answer", "explanation"]
    }
  };

  const response = await ai.models.generateContent({
    //quiz quest model area
    model: 'gemini-2.5-pro',
    contents: {
      parts: [
        { inlineData: { mimeType: file.mimeType, data: file.data } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  try {
    const text = response.text || "[]";
    // Remove markdown code blocks if present to ensure JSON parsing works
    const cleanText = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanText);
    return data.map((q: any) => ({
      ...q,
      type: settings.type // Ensure type consistency
    }));
  } catch (e) {
    console.error("Quiz parse error", e);
    return [];
  }
};

// --- Mind Map / Flashcard Generation ---
export const generateMindMap = async (file: FileContext): Promise<MindMapNode[]> => {
    const ai = getAI();

    const prompt = `
      Create a hierarchical concept map (Mind Map) from the provided file content.
      
      Structure:
      - Level 1: Main Topic (The core subject)
      - Level 2: Major Themes (Consolidated chapters/sections)
      - Level 3: Detailed Concepts (Rich content, combining related facts)

      CRITICAL INSTRUCTION: Reduce the total number of nodes by consolidating information. 
      Instead of many small nodes, create fewer nodes with richer, more comprehensive 'content'.
      Do not exceed 3 levels of depth.
      
      'label' should be the concept name.
      'content' should be a detailed explanation (flashcard back) containing all relevant facts for that concept.
      
      Return a list of Root Nodes.
    `;
  
    // Recursive schema is tricky in strict mode, we will use a standard object structure
    // and define depth via descriptions, but for Type system we define a limited depth explicitly or use flexible object.
    // Gemini 2.5 Flash supports recursive-like schemas but let's use a fixed depth definition to be safe or simple object.
    // Note: For complex recursion, 'any' type or simplified prompt often works better with strict schema disabled or simple JSON.
    
    const response = await ai.models.generateContent({
      //Flash-card model area
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: file.mimeType, data: file.data } },
            { text: prompt }
          ]
        },
        config: {
            responseMimeType: "application/json",
            // We rely on the model to infer the recursive structure without a strict schema 
            // to allow infinite depth flexibility for "n8n" style nodes.
        }
    });

    try {
        const text = response.text || "[]";
        const cleanText = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanText);
        
        // Post-process to ensure unique IDs and array format
        let idCounter = 0;
        const processNodes = (nodes: any[]): MindMapNode[] => {
            return nodes.map(node => {
                const newNode: MindMapNode = {
                    ...node,
                    id: `node-${Date.now()}-${idCounter++}`, // Ensure unique ID
                    children: node.children ? processNodes(node.children) : []
                };
                return newNode;
            });
        };

        const rootNodes = Array.isArray(data) ? data : [data];
        return processNodes(rootNodes);
    } catch (e) {
        console.error("MindMap parse error", e);
        return [];
    }
}