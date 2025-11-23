
export enum AppMode {
  UPLOAD = 'UPLOAD',
  ANALYSIS = 'ANALYSIS',
  CHAT = 'CHAT',
  QUIZ = 'QUIZ',
  FLASHCARDS = 'FLASHCARDS'
}

export type Theme = 'dark' | 'light' | 'read';

export interface DocumentSection {
  title: string;
  content: string;
}

export interface FileContext {
  name: string;
  mimeType: string;
  data: string; // Base64
  size?: string; // Display size (e.g. "2.5 MB")
  summary?: string;
  extractedText?: string;
  sections?: DocumentSection[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: { mimeType: string; data: string };
  isThinking?: boolean;
  timestamp: number;
  groundingUrls?: Array<{title: string, uri: string}>;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options?: string[]; // For multiple choice
  answer: string;
  type: 'multiple-choice' | 'open-ended';
  explanation?: string;
  userAnswer?: string; // Track what the user selected
}

export interface QuizSettings {
  count: number;
  type: 'multiple-choice' | 'open-ended';
  topic: string; // Natural language focus
}

export interface MindMapNode {
  id: string;
  label: string;
  content: string; // The flashcard back text
  children: MindMapNode[];
  // UI properties calculated after generation
  x?: number;
  y?: number;
  color?: string;
}
