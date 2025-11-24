# Ani-Mind 🧠

A powerful AI-powered document analysis and learning platform built with React, TypeScript, and Google's Gemini AI. Transform your documents into interactive learning experiences with AI-generated summaries, chat, quizzes, and flashcards.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)

## ✨ Features

### 📄 Document Analysis

- **Multi-format Support**: Upload PDF, Word documents (.doc, .docx), PowerPoint (.ppt, .pptx), images (.jpg, .jpeg, .png, .webp), and text files
- **AI-Powered Extraction**: Intelligent text extraction from all supported formats
- **Executive Summary**: Get comprehensive AI-generated summaries of your documents
- **Sectioned Analysis**: Documents automatically broken down into logical sections
- **Table of Contents**: Interactive navigation for long documents

**AI Model**: `gemini-2.5-Pro` (Fast, efficient document processing)

### 💬 Interactive Chat

- **Context-Aware Conversations**: Ask questions about your uploaded document
- **Image Support**: Upload images during chat for visual context
- **Google Search Integration**: Optional web search for real-time information
- **Source Citations**: Grounded answers with clickable source links
- **Markdown Support**: Rich text formatting in responses

**AI Model**: `gemini-2.5-flash` (Advanced reasoning and conversation)

### 📝 Smart Quizzes

- **Two Quiz Modes**:
  - **Multiple Choice**: Generate 5-question MCQ tests
  - **Open-ended Questions**: Create thought-provoking questions for deeper learning
- **Customizable Difficulty**: Easy, Medium, Hard, or Expert level
- **Instant Feedback**: See scores and correct answers immediately
- **Retry Option**: Take quizzes multiple times to improve

**AI Model**: `gemini-2.5-pro` (Quick quiz generation)

### 🎴 Flashcards

- **Auto-Generation**: Create flashcard decks from your documents
- **Interactive Review**: Flip cards to reveal answers
- **Progress Tracking**: Visual progress bar
- **Shuffle Option**: Randomize card order for better retention
- **Smart Pacing**: Navigate through cards at your own speed

**AI Model**: `gemini-2.5-flash` (Efficient Q&A pair generation)

### 🎨 Themes

Five beautiful themes to match your preference:

- **Dark Mode** 🌙 - Easy on the eyes
- **Light Mode** ☀️ - Clean and bright
- **Read Mode** 📖 - Optimized for reading
- **Black Mode** ⚫ - True black OLED-friendly
- **White Mode** ⚪ - Pure white minimalist

### 🎯 Additional Features

- **Real-time Preview**: View documents before analysis
- **Session Persistence**: Your work is saved across refreshes
- **Responsive Design**: Works beautifully on desktop and mobile
- **Copy to Clipboard**: Easy copying of AI responses
- **Progress Indicators**: Visual feedback during processing

## 🚀 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/Gongchampou/AI-analysis.git
   cd AI-analysis
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure API Key**

   Create a `.env` file in the root directory:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:1111`

## 🏗️ Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

## 🛠️ Tech Stack

- **Frontend**: React 18.3, TypeScript 5.5
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: Google Gemini API
- **File Processing**: pdf-parse, mammoth, tesseract.js

## 📋 Usage Guide

### 1. Upload a Document

- Click "Select Document" on the home page
- Choose a supported file (PDF, Word, PowerPoint, Image, or Text)
- Preview your document before analysis

### 2. Analyze

- Click "Start Analysis" to process your document
- Wait for AI to extract and analyze the content
- Review the executive summary and detailed sections

### 3. Interact

Navigate using the sidebar:

- **Analysis**: View structured document analysis
- **Chat**: Ask questions about your document
- **Quiz**: Test your knowledge
- **Flashcards**: Review key concepts

### 4. Customize

- Switch themes using the theme dropdown (top right)
- Toggle Google Search in chat mode
- Adjust quiz difficulty levels

## 🤖 AI Models Used

### Model Selection Strategy

| Feature           | Model              | Reason                                                      |
| ----------------- | ------------------ | ----------------------------------------------------------- |
| Document Analysis | `gemini-2.5-pro` | Fast processing for text extraction and summarization       |
| Chat              | `gemini-2.5-flash`   | Advanced reasoning for complex conversations and follow-ups |
| Quiz Generation   | `gemini-2.5-pro` | Quick generation of questions with good quality             |
| Flashcards        | `gemini-2.5-flash` | Efficient Q&A pair creation                                 |

**Why these choices?**

- **Pro**: Optimized for speed and cost-efficiency on straightforward tasks
- **Pro**: Reserved for complex reasoning that benefits from advanced capabilities

## 🔒 Privacy & Security

- Your documents are processed client-side before being sent to Gemini API
- No documents are stored on our servers
- API keys are stored locally and never transmitted to third parties
- Session data uses browser's sessionStorage (cleared on tab close)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language models
- React and Vite teams for excellent developer tools
- Open-source community for amazing libraries

## 📧 Contact

- For questions or support, please open an issue on GitHub.

- [Email](mailto:gongchampou9402@gmail.com)

---

**Made with ❤️ by the Gongchampou**
