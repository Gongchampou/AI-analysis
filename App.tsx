
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, MessageSquare, BrainCircuit, Search, Play, Eye, CheckCircle, XCircle, FileType, Image as ImageIcon, Loader2, ChevronRight, ChevronDown, ChevronLeft, Paperclip, ImagePlus, Send, Moon, Sun, BookOpen, Menu, PenTool, Check, AlertCircle, RefreshCcw, HelpCircle, Clock, ArrowRight, Maximize2, Copy, Sparkles, Workflow, Settings2, ZoomIn, ZoomOut, GitBranch, Move } from 'lucide-react';
import { AppMode, FileContext, ChatMessage, QuizQuestion, QuizSettings, Theme, MindMapNode } from './types';
import { analyzeFileContent, sendMessageToGemini, generateQuizQuestions, generateMindMap } from './services/geminiService';
import { Button, Card, LoadingSpinner, Badge } from './components/UIComponents';

// Helper Component for Copy Functionality
const CopyButton = ({ text, className = "" }: { text: string, className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button 
      onClick={handleCopy} 
      className={`p-2 rounded-lg transition-all duration-200 hover:bg-anime-surface ${copied ? 'text-green-400' : 'text-anime-text-muted hover:text-anime-accent'} ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
};

// Premium AI Loader Component
const PremiumLoader = ({ text }: { text: string }) => (
  <div className="absolute inset-0 z-50 bg-anime-bg flex flex-col items-center justify-center overflow-hidden">
     {/* Ambient Background Effects */}
     <div className="absolute inset-0 bg-gradient-to-b from-anime-bg via-anime-surface/50 to-anime-bg pointer-events-none"></div>
     <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-anime-primary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
     <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-anime-secondary/10 rounded-full blur-[100px] animate-float"></div>

     {/* The Spinner Core */}
     <div className="relative w-40 h-40 flex items-center justify-center mb-12">
        {/* Glowing Orb Backdrop */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-anime-primary to-anime-secondary blur-2xl animate-pulse opacity-60"></div>
        
        {/* Spinning Rings */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-anime-text-main/50 border-l-anime-text-main/50 animate-spin duration-[3s] linear"></div>
        <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-anime-accent border-r-anime-accent animate-spin duration-[2s] direction-reverse linear"></div>
        <div className="absolute inset-4 rounded-full border-[2px] border-anime-text-main/10"></div>
        
        {/* Center Core */}
        <div className="absolute inset-0 m-auto w-28 h-28 bg-anime-bg rounded-full flex items-center justify-center shadow-2xl border border-anime-text-main/5 z-10">
           <Sparkles size={48} className="text-anime-accent animate-pulse" />
        </div>
        
        {/* Orbiting Particles */}
        <div className="absolute inset-0 animate-spin duration-[4s] linear">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-anime-text-main rounded-full blur-[1px] shadow-[0_0_10px_rgba(var(--text-main-rgb),1)]"></div>
        </div>
     </div>
     
     {/* Text */}
     <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-anime-text-main to-anime-text-muted tracking-widest uppercase animate-pulse mb-2">
        Processing
     </h3>
     <p className="text-anime-accent/70 font-mono text-sm">{text}</p>
  </div>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.UPLOAD);
  const [file, setFile] = useState<FileContext | null>(null);
  const [previewFile, setPreviewFile] = useState<FileContext | null>(null); // New state for preview
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [useSearch, setUseSearch] = useState(false);
  const [chatImage, setChatImage] = useState<{ mimeType: string; data: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Quiz State
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({ count: 5, type: 'multiple-choice', topic: '' });
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizPhase, setQuizPhase] = useState<'SETUP' | 'ACTIVE' | 'REVIEW'>('SETUP');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizDuration, setQuizDuration] = useState<number>(0);

  // Flashcard Workflow State
  const [mindMapData, setMindMapData] = useState<MindMapNode[]>([]);
  const [lineStyle, setLineStyle] = useState<'straight' | 'curved' | 'step'>('step');
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  // Analysis State
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0])); // Default first section open

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Theme Effect
  useEffect(() => {
    console.log(`Theme changing to: ${theme}`);
    document.documentElement.className = `theme-${theme} ${theme === 'dark' ? 'dark' : ''}`;
  }, [theme]);

  // Quiz Timer Effect
  useEffect(() => {
    let interval: any;
    if (quizPhase === 'ACTIVE' && quizStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setQuizDuration(Math.floor((now - quizStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizPhase, quizStartTime]);

  // Load state from sessionStorage on mount
  useEffect(() => {
    console.log('🔄 Loading state from sessionStorage...');
    try {
      const savedState = sessionStorage.getItem('animind-state');
      console.log('📦 Saved state:', savedState ? 'Found' : 'Not found');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        console.log('✅ Parsed state:', parsed);
        if (parsed.file) setFile(parsed.file);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.quizQuestions) setQuizQuestions(parsed.quizQuestions);
        if (parsed.quizPhase) setQuizPhase(parsed.quizPhase);
        if (parsed.quizStartTime) setQuizStartTime(parsed.quizStartTime);
        if (parsed.quizSettings) setQuizSettings(parsed.quizSettings);
        if (parsed.mindMapData) setMindMapData(parsed.mindMapData);
      }
    } catch (e) {
      console.error('❌ Failed to load session state:', e);
    }
  }, []);

  // Save state to sessionStorage when key state changes
  useEffect(() => {
    // Don't save if we're still on initial load (no file uploaded yet)
    if (!file) return;
    
    console.log('💾 Saving state to sessionStorage...');
    try {
      const state = {
        file,
        mode,
        messages,
        quizQuestions,
        quizPhase,
        quizStartTime,
        quizSettings,
        mindMapData
      };
      sessionStorage.setItem('animind-state', JSON.stringify(state));
      console.log('✅ State saved successfully');
    } catch (e) {
      console.error('❌ Failed to save session state:', e);
    }
  }, [file, mode, messages, quizQuestions, quizPhase, quizStartTime, quizSettings, mindMapData]);

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'read';
      return 'dark';
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- File Upload & Preview ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const sizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
    const sizeStr = `${sizeInMB} MB`;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];

      const newFile: FileContext = {
        name: selectedFile.name,
        mimeType: selectedFile.type,
        data: base64Data,
        size: sizeStr
      };
      
      setPreviewFile(newFile);
      // Clear input so same file can be selected again if needed
      e.target.value = '';
    };
    reader.readAsDataURL(selectedFile);
  };

  const startProcessing = async () => {
    if (!previewFile) return;
    
    setLoading(true);
    setLoadingText("Analyzing Structure...");
    
    try {
      // Artificial delay to show off the animation if response is too fast
      // await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      const analysis = await analyzeFileContent(previewFile);
      const processedFile = {
          ...previewFile,
          summary: analysis.summary,
          extractedText: analysis.text,
          sections: analysis.sections
      };
      
      setFile(processedFile);
      setPreviewFile(null); // Clear preview
      setMode(AppMode.ANALYSIS);
      if (analysis.sections) {
          setExpandedSections(new Set(analysis.sections.map((_, i) => i)));
      }
    } catch (error) {
      console.error(error);
      alert("Failed to analyze file. Ensure your API Key is valid.");
    } finally {
      setLoading(false);
    }
  };

  const cancelPreview = () => {
      setPreviewFile(null);
  };

  // --- Chat Logic ---
  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setChatImage({ mimeType: file.type, data: base64Data });
    };
    reader.readAsDataURL(file);
    // Reset input
    if (chatFileInputRef.current) chatFileInputRef.current.value = '';
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !chatImage) || !file) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      image: chatImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setChatImage(null); // Clear after sending
    setLoading(true);

    const response = await sendMessageToGemini(messages, inputMessage, file, useSearch, chatImage);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      groundingUrls: response.groundingUrls,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  // --- Quiz Logic ---
  const handleGenerateQuiz = async () => {
    if (!file) return;
    setLoading(true);
    setLoadingText(`Generating ${quizSettings.count} questions...`);
    
    const questions = await generateQuizQuestions(file, quizSettings);
    
    if (!questions || questions.length === 0) {
        setLoading(false);
        alert("Failed to generate questions. Please try a smaller number or a different topic.");
        return;
    }

    setQuizQuestions(questions);
    setQuizPhase('ACTIVE');
    setQuizStartTime(Date.now());
    setQuizDuration(0);
    setLoading(false);
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
      if (quizPhase !== 'ACTIVE') return;
      setQuizQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...q, userAnswer: answer } : q
      ));
  };

  const handleSubmitQuiz = () => {
      setShowSubmitConfirm(true);
  };

  const confirmSubmit = () => {
      setShowSubmitConfirm(false);
      setQuizPhase('REVIEW');
      // Duration freezes automatically as phase changes
  };

  const resetQuiz = () => {
      setQuizPhase('SETUP');
      setQuizQuestions([]);
      setQuizStartTime(null);
      setQuizDuration(0);
  }

  const calculateScore = () => {
      if (quizQuestions.length === 0) return 0;
      const correct = quizQuestions.filter(q => q.answer === q.userAnswer).length;
      return correct;
  };

  const getUnansweredCount = () => {
      return quizQuestions.filter(q => !q.userAnswer).length;
  };

  // --- Workflow / Mind Map Logic ---
  const handleGenerateMindMap = async () => {
    if (!file) return;
    setLoading(true);
    setLoadingText("Constructing Concept Graph...");
    const nodes = await generateMindMap(file);
    
    // Helper to calculate layout (Simple Right Angle Tree)
    const processNodes = (nodeList: MindMapNode[], depth: number, startY: number): { nodes: MindMapNode[], totalHeight: number } => {
       let currentY = startY;
       let processed: MindMapNode[] = [];
       const x = depth * 350; // Horizontal spacing

       // Colors based on depth
       const colors = [
         'bg-anime-primary', 
         'bg-anime-secondary', 
         'bg-anime-accent', 
         'bg-purple-500',
         'bg-pink-500'
       ];

       for (let node of nodeList) {
           let childHeight = 0;
           let childrenProcessed: MindMapNode[] = [];
           
           if (node.children && node.children.length > 0) {
               const childResult = processNodes(node.children, depth + 1, currentY);
               childrenProcessed = childResult.nodes;
               childHeight = childResult.totalHeight;
           } else {
               childHeight = 150; // Base height for leaf (slightly larger to prevent overlap)
           }

           // Center node relative to its children block
           const nodeY = currentY + (childHeight / 2) - 75; // -75 is half of 150 roughly

           processed.push({
               ...node,
               x,
               y: nodeY,
               children: childrenProcessed,
               color: colors[depth % colors.length]
           });
           
           currentY += childHeight; // Add gap logic if needed, usually implied by height
       }
       return { nodes: processed, totalHeight: currentY - startY };
    };

    const { nodes: layoutNodes } = processNodes(nodes, 0, 0); // Start from 0,0
    
    setMindMapData(layoutNodes);
    // Center the view roughly
    setPan({ x: 100, y: 100 });
    setScale(1);
    setLoading(false);
  };

  // Pan & Zoom Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
      // Only drag if clicking background
      if ((e.target as HTMLElement).closest('.node-card')) return;
      
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
      // e.preventDefault(); // React synthetic event might not support preventing default easily for passive listeners, but visual zoom works
      
      const zoomSensitivity = 0.1;
      const delta = e.deltaY > 0 ? -1 : 1; // Scroll Down (positive delta) -> Zoom Out (-1), Scroll Up -> Zoom In
      
      // Calculate new scale
      const newScale = Math.max(0.2, Math.min(4, scale + (delta * zoomSensitivity * scale)));
      
      // Calculate mouse position relative to the container (viewport)
      const container = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - container.left;
      const mouseY = e.clientY - container.top;

      // Calculate the point in "world space" that is under the mouse
      // worldX = (mouseX - panX) / oldScale
      const worldX = (mouseX - pan.x) / scale;
      const worldY = (mouseY - pan.y) / scale;

      // Adjust pan so that the world point remains under the mouse at the new scale
      // newPanX = mouseX - (worldX * newScale)
      const newPanX = mouseX - (worldX * newScale);
      const newPanY = mouseY - (worldY * newScale);

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
  };

  // Render Lines for Workflow
  const renderConnections = (nodes: MindMapNode[]): JSX.Element[] => {
      return nodes.flatMap((node) => {
          const childConnections = node.children ? renderConnections(node.children) : [];
          const currentConnections = node.children ? node.children.map((child) => {
             // Anchor points: 
             // Start: Node Right side, fixed vertical offset of 50px
             const startX = (node.x || 0) + 280; // Width of card
             const startY = (node.y || 0) + 50; // Fixed Port Position
             
             // End: Child Left side, fixed vertical offset of 50px
             const endX = (child.x || 0);
             const endY = (child.y || 0) + 50; // Fixed Port Position

             let d = '';
             if (lineStyle === 'straight') {
                 d = `M ${startX} ${startY} L ${endX} ${endY}`;
             } else if (lineStyle === 'curved') {
                 const midX = (startX + endX) / 2;
                 d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
             } else {
                 // Step (N8N style)
                 const midX = (startX + endX) / 2;
                 d = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
             }

             return (
                 <g key={`${node.id}-${child.id}`}>
                     <path d={d} fill="none" stroke="rgb(var(--border-rgb))" strokeOpacity="0.4" strokeWidth="2" />
                     {/* Connection Dots */}
                     <circle cx={startX} cy={startY} r="3" fill="rgb(var(--accent-rgb))" />
                     <circle cx={endX} cy={endY} r="3" fill="rgb(var(--accent-rgb))" />
                 </g>
             );
          }) : [];
          return [...currentConnections, ...childConnections];
      });
  };

  const renderNodes = (nodes: MindMapNode[]): JSX.Element[] => {
      return nodes.flatMap((node) => {
          const children = node.children ? renderNodes(node.children) : [];
          return [
              <div 
                key={node.id} 
                style={{ 
                    position: 'absolute', 
                    left: node.x, 
                    top: node.y, 
                    width: '280px',
                }}
                className="node-card group"
              >
                 <div 
                    onClick={() => setSelectedNode(node)}
                    className={`
                        relative bg-anime-surface border hover:border-anime-accent transition-all duration-200 rounded-xl shadow-lg p-4 cursor-pointer overflow-hidden select-none
                        ${selectedNode?.id === node.id ? 'border-anime-accent ring-2 ring-anime-accent/20' : 'border-anime-border/10'}
                    `}
                 >
                    {/* Header Stripe */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${node.color || 'bg-gray-500'}`}></div>
                    
                    <div className="pl-3">
                        <h4 className="font-bold text-anime-text-main mb-2 text-sm leading-tight">{node.label}</h4>
                        <p className="text-xs text-anime-text-muted line-clamp-3">{node.content}</p>
                    </div>
                    
                    {/* N8N Style 'Ports' - Fixed Position at 50px from top to align with wires */}
                    <div className="absolute -right-1.5 top-[50px] -translate-y-1/2 w-3 h-3 bg-anime-surface border-2 border-anime-accent rounded-full z-10"></div>
                    <div className="absolute -left-1.5 top-[50px] -translate-y-1/2 w-3 h-3 bg-anime-surface border-2 border-anime-accent rounded-full z-10"></div>
                 </div>
              </div>,
              ...children
          ];
      });
  };

  // --- TOC Logic ---
  const toggleSection = (index: number) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(index)) {
        newSet.delete(index);
    } else {
        newSet.add(index);
    }
    setExpandedSections(newSet);
  };

  const scrollToSection = (index: number) => {
    const element = document.getElementById(`section-${index}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setExpandedSections(prev => new Set(prev).add(index));
    }
  };

  // --- Helper Components ---
  const SidebarItem = ({ 
    icon: Icon, 
    label, 
    isActive, 
    onClick, 
    colorClass 
  }: { icon: any, label: string, isActive: boolean, onClick: () => void, colorClass: string }) => (
    <button 
      onClick={onClick}
      className={`
        relative group flex items-center gap-3 p-3 rounded-xl transition-all duration-200
        ${isActive 
          ? `bg-gradient-to-r from-anime-primary/20 to-anime-secondary/20 text-anime-text-main border-l-4 ${colorClass}` 
          : 'text-anime-text-muted hover:bg-anime-border/5 hover:text-anime-text-main'
        }
        ${isSidebarCollapsed ? 'justify-center' : ''}
      `}
    >
      <Icon size={20} className={`${isActive ? colorClass.replace('border-', 'text-') : ''} shrink-0 transition-colors`} /> 
      
      {!isSidebarCollapsed && (
        <span className="font-medium truncate animate-in fade-in duration-200">{label}</span>
      )}

      {/* Tooltip for collapsed state */}
      {isSidebarCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-anime-surface border border-anime-border/10 text-anime-text-main text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          {label}
          {/* Little arrow */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-r-anime-surface border-r-anime-border/10"></div>
        </div>
      )}
    </button>
  );

  const renderSidebar = () => (
    <div 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-anime-surface border-r border-anime-border/20 flex flex-col py-6 gap-2 z-30 shrink-0 shadow-2xl transition-[width] duration-300 ease-in-out relative`}
    >
      {/* Toggle Button */}
      <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute top-8 -right-3 bg-anime-surface border border-anime-border/20 rounded-full p-1.5 shadow-md text-anime-text-muted hover:text-anime-accent transition-colors z-50 hover:scale-110"
        >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className="flex items-center justify-center h-12 mb-6 overflow-hidden">
        {isSidebarCollapsed ? (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-anime-primary to-anime-secondary flex items-center justify-center text-white font-bold shadow-lg text-xl">
                A
            </div>
        ) : (
            <div className="text-center whitespace-nowrap animate-in fade-in duration-300">
                <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-anime-primary to-anime-accent filter drop-shadow-sm">
                AniMind
                </h1>
                <p className="text-[10px] text-anime-text-muted tracking-widest uppercase opacity-70">Gemini 3 Pro</p>
            </div>
        )}
      </div>

      <div className="flex flex-col gap-2 px-3 w-full flex-1">
        {file && (
          <>
            <SidebarItem 
                icon={FileText} 
                label="Analysis" 
                isActive={mode === AppMode.ANALYSIS} 
                onClick={() => setMode(AppMode.ANALYSIS)} 
                colorClass="border-anime-primary"
            />
            <SidebarItem 
                icon={MessageSquare} 
                label="Chat" 
                isActive={mode === AppMode.CHAT} 
                onClick={() => setMode(AppMode.CHAT)} 
                colorClass="border-anime-secondary"
            />
            <SidebarItem 
                icon={BrainCircuit} 
                label="Quiz" 
                isActive={mode === AppMode.QUIZ} 
                onClick={() => setMode(AppMode.QUIZ)} 
                colorClass="border-anime-accent"
            />
            <SidebarItem 
                icon={Workflow} 
                label="Flashcards" 
                isActive={mode === AppMode.FLASHCARDS} 
                onClick={() => setMode(AppMode.FLASHCARDS)} 
                colorClass="border-green-400"
            />
          </>
        )}
      </div>
      
      <div className="px-3 mt-auto">
         <SidebarItem 
            icon={XCircle} 
            label="Reset File" 
            isActive={false}
            onClick={() => { 
              sessionStorage.removeItem('animind-state'); // Clear session storage
              setFile(null); 
              setPreviewFile(null); 
              setMode(AppMode.UPLOAD); 
              setMessages([]); 
              resetQuiz(); 
              setMindMapData([]); 
            }}
            colorClass="border-red-400 text-red-400 hover:bg-red-400/10"
         />
      </div>
    </div>
  );

  // --- Main Content Renders ---

  if (mode === AppMode.UPLOAD) {
    // Handle Preview State separately for Full Screen Layout
    if (previewFile) {
      return (
        <div className="h-screen w-full bg-anime-bg flex flex-col lg:flex-row relative overflow-hidden transition-colors duration-500">
             {/* Loading Overlay */}
             {loading && <PremiumLoader text={loadingText} />}

             {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-50">
                 <button onClick={cycleTheme} className="p-3 rounded-full bg-anime-surface border border-anime-border/10 hover:bg-anime-border/20 transition-colors shadow-xl">
                     {theme === 'dark' && <Moon size={24} className="text-anime-accent" />}
                     {theme === 'light' && <Sun size={24} className="text-orange-500" />}
                     {theme === 'read' && <BookOpen size={24} className="text-amber-700" />}
                 </button>
            </div>

             {/* Left Controls (25%) */}
             <div className="w-full lg:w-1/4 h-full bg-anime-surface border-r border-anime-border/20 p-8 flex flex-col justify-center z-20 shadow-2xl relative">
                <div className="mb-auto">
                   <Badge>Preview Mode</Badge>
                </div>
                
                <div className="my-8 animate-in slide-in-from-left-4 duration-500">
                    <div className="w-24 h-24 bg-gradient-to-br from-anime-primary to-anime-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-anime-primary/20 ring-4 ring-anime-border/5">
                        {previewFile.mimeType.startsWith('image/') ? <ImageIcon size={48} className="text-white"/> : <FileText size={48} className="text-white"/>}
                    </div>
                    
                    <h3 className="text-3xl font-bold text-anime-text-main leading-tight mb-4 break-words">{previewFile.name}</h3>
                    
                    <div className="flex flex-wrap items-center gap-3 text-anime-text-muted text-sm font-mono uppercase tracking-wide">
                        <span className="px-3 py-1 bg-anime-bg rounded border border-anime-border/10">{previewFile.mimeType.split('/')[1]}</span>
                        {previewFile.size && (
                          <span className="px-3 py-1 bg-anime-bg rounded border border-anime-border/10">{previewFile.size}</span>
                        )}
                    </div>
                </div>

                <div className="space-y-4 mt-auto pb-4 animate-in slide-in-from-bottom-4 duration-700 delay-100">
                    {/* Compact, Pill-Shaped Start Button */}
                    <Button onClick={startProcessing} className="w-full py-3 text-sm shadow-lg shadow-anime-primary/20 justify-center gap-2 group bg-gradient-to-r from-anime-primary to-anime-accent hover:to-anime-primary border-none rounded-full">
                        <span className="font-bold tracking-wide">Start Analysis</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <div className="flex flex-col gap-3">
                      <Button variant="secondary" onClick={() => document.getElementById('preview-upload-input')?.click()} className="w-full py-3 border-anime-border/10 text-sm rounded-full">
                          <Upload size={16} /> Import Different File
                      </Button>
                      <input 
                          id="preview-upload-input"
                          type="file" 
                          className="hidden" 
                          onChange={handleFileUpload} 
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp" 
                      />
                      
                      <Button variant="ghost" onClick={cancelPreview} className="w-full py-3 text-red-400 hover:bg-red-400/10 hover:text-red-500 text-sm rounded-full">
                          <XCircle size={16} /> Cancel Preview
                      </Button>
                    </div>
                </div>
             </div>

             {/* Right Preview (75%) - Full Screen, No Padding */}
             <div className="w-full lg:w-3/4 h-full bg-anime-bg/50 relative flex flex-col">
                 <div className="w-full h-full bg-white/5 backdrop-blur-sm relative flex flex-col">
                     {previewFile.mimeType === 'application/pdf' ? (
                        <iframe
                            src={`data:application/pdf;base64,${previewFile.data}`}
                            className="w-full h-full bg-white"
                            title="PDF Preview"
                        />
                    ) : previewFile.mimeType.startsWith('image/') ? (
                        <div className="w-full h-full overflow-auto flex items-center justify-center bg-black/5">
                            <img 
                                src={`data:${previewFile.mimeType};base64,${previewFile.data}`} 
                                alt="Preview" 
                                className="max-w-full max-h-full object-contain" 
                            />
                        </div>
                    ) : previewFile.mimeType === 'text/plain' ? (
                        <div className="w-full h-full overflow-auto p-10 bg-white text-slate-900 font-mono text-base whitespace-pre-wrap leading-relaxed">
                            {atob(previewFile.data)}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-anime-text-muted p-8 text-center">
                            <div className="w-32 h-32 bg-anime-surface rounded-full flex items-center justify-center mb-6 shadow-inner border border-anime-border/10">
                                <FileType size={64} className="text-anime-primary opacity-50"/>
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-anime-text-main">Preview Not Available</h3>
                            <p className="max-w-xs mx-auto opacity-70">The content of this file cannot be displayed in the browser, but our AI can still analyze it perfectly.</p>
                        </div>
                    )}
                 </div>
             </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-anime-bg transition-colors duration-500">
        {/* Decorative background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-anime-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-anime-secondary/10 rounded-full blur-3xl animate-float"></div>
        
        {/* Theme Toggle in Upload Mode */}
        <div className="absolute top-6 right-6 z-50">
             <button onClick={cycleTheme} className="p-3 rounded-full bg-anime-surface border border-anime-border/10 hover:bg-anime-border/20 transition-colors shadow-xl">
                 {theme === 'dark' && <Moon size={24} className="text-anime-accent" />}
                 {theme === 'light' && <Sun size={24} className="text-orange-500" />}
                 {theme === 'read' && <BookOpen size={24} className="text-amber-700" />}
             </button>
        </div>

        <Card className="z-10 border-anime-primary/20 bg-anime-surface/90 backdrop-blur-xl shadow-2xl w-full max-w-2xl relative overflow-hidden transition-all duration-500 ease-out p-0">
          {/* Decorative grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full p-8">
             {loading ? (
               <PremiumLoader text={loadingText} />
             ) : (
               <div>
                 <div className="text-center mb-10 pt-10">
                   <h2 className="text-5xl font-extrabold text-anime-text-main mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-anime-text-main to-anime-text-muted">
                       AniMind
                   </h2>
                   <p className="text-lg text-anime-text-muted font-light">
                       Advanced AI Document Analysis & Learning Environment
                   </p>
                 </div>
                 <div className="border-2 border-dashed border-anime-border/20 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-anime-primary/50 transition-all duration-500 bg-anime-bg/20 group hover:bg-anime-bg/40 mx-8 mb-8">
                   <div className="w-24 h-24 bg-gradient-to-br from-anime-surface to-anime-bg rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-anime-primary/25 border border-anime-border/10">
                     <Upload className="text-anime-primary group-hover:text-anime-accent transition-colors" size={40} />
                   </div>
                   <label className="cursor-pointer relative group-hover:-translate-y-1 transition-transform">
                     <span className="bg-gradient-to-r from-anime-primary to-anime-secondary text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-anime-primary/25 hover:shadow-anime-primary/50 transition-all text-lg">
                       Select Document
                     </span>
                     <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp" />
                   </label>
                   <div className="mt-8 flex gap-4 text-anime-text-muted text-sm">
                     <span className="flex items-center gap-1"><FileType size={14}/> PDF</span>
                     <span className="flex items-center gap-1"><FileType size={14}/> Word</span>
                     <span className="flex items-center gap-1"><ImageIcon size={14}/> Images</span>
                     <span className="flex items-center gap-1"><FileText size={14}/> Text</span>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-anime-bg text-anime-text-main font-sans transition-colors duration-500">
      {renderSidebar()}

      <main className="flex-1 relative overflow-hidden flex flex-col bg-anime-bg transition-colors duration-500">
        {/* Header */}
        <header className="h-20 border-b border-anime-border/20 bg-anime-surface/80 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0 transition-colors duration-500">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-anime-primary to-anime-secondary flex items-center justify-center shrink-0 shadow-lg">
               <FileType className="text-white" size={20} />
            </div>
            <div className="flex flex-col min-w-0">
               <span className="font-bold text-lg truncate text-anime-text-main">{file?.name}</span>
               <span className="text-xs text-anime-text-muted flex items-center gap-1">
                 <CheckCircle size={10} className="text-green-400"/> AI Ready
               </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Badge>{mode}</Badge>
             <button onClick={cycleTheme} className="p-2.5 rounded-full bg-anime-surface border border-anime-border/10 hover:bg-anime-border/20 transition-colors shadow-sm">
                 {theme === 'dark' && <Moon size={18} className="text-anime-accent" />}
                 {theme === 'light' && <Sun size={18} className="text-orange-500" />}
                 {theme === 'read' && <BookOpen size={18} className="text-amber-700" />}
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* Analysis View with TOC */}
          {mode === AppMode.ANALYSIS && file && (
             <div className="h-full flex flex-col md:flex-row overflow-hidden">
                {/* Table of Contents Sidebar */}
                {file.sections && file.sections.length > 0 && (
                    <div className="w-full md:w-72 bg-anime-surface/50 border-r border-anime-border/20 overflow-y-auto p-6 hidden md:block shrink-0 transition-colors duration-500">
                        <h3 className="text-sm font-bold text-anime-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText size={14}/> Outline
                        </h3>
                        <div className="space-y-2">
                            {file.sections.map((section, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => scrollToSection(idx)}
                                    className="w-full text-left text-sm p-3 rounded-lg hover:bg-anime-border/5 text-anime-text-muted hover:text-anime-accent transition-colors truncate flex items-center gap-2 group"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-anime-text-muted group-hover:bg-anime-accent"></div>
                                    {section.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth bg-gradient-to-b from-anime-bg to-anime-bg/90">
                   <div className="max-w-4xl mx-auto space-y-8">
                      {/* Summary Card */}
                      <Card className="border-l-4 border-l-anime-primary bg-gradient-to-r from-anime-surface to-anime-surface/50 relative group">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-2xl font-bold flex items-center gap-3 text-anime-text-main">
                              <div className="p-2 bg-anime-primary/20 rounded-lg">
                                <BrainCircuit className="text-anime-primary" size={24} /> 
                              </div>
                              Executive Summary
                            </h3>
                            {file.summary && <CopyButton text={file.summary} />}
                        </div>
                        <div className="prose prose-invert max-w-none text-anime-text-main/90 leading-relaxed text-lg">
                          {file.summary}
                        </div>
                      </Card>

                      {/* Visual Context */}
                      <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                             <Card className="h-full border-anime-border/5">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-anime-accent">
                                  <ImageIcon size={20} /> Visual Source
                                </h3>
                                <div className="rounded-xl overflow-hidden border border-anime-border/10 bg-black/5 flex items-center justify-center min-h-[200px]">
                                    {file.mimeType.startsWith('image') ? (
                                        <img src={`data:${file.mimeType};base64,${file.data}`} alt="source" className="max-h-64 object-contain" />
                                    ) : (
                                        <div className="text-center p-8">
                                            <FileText size={48} className="mx-auto text-anime-text-muted mb-2"/>
                                            <p className="text-anime-text-muted text-sm">Document Preview Not Available</p>
                                        </div>
                                    )}
                                </div>
                             </Card>
                          </div>
                      </div>

                      {/* Sections Loop */}
                      <div className="space-y-4">
                          <h3 className="text-xl font-bold text-anime-text-main mb-6 flex items-center gap-2">
                              <FileText className="text-anime-secondary"/> Detailed Analysis
                          </h3>
                          {file.sections && file.sections.length > 0 ? (
                              file.sections.map((section, idx) => (
                                  <div key={idx} id={`section-${idx}`} className="scroll-mt-24">
                                      <button 
                                        onClick={() => toggleSection(idx)}
                                        className="w-full flex items-center justify-between bg-anime-surface p-4 rounded-xl border border-anime-border/10 hover:border-anime-accent/30 transition-all group shadow-sm"
                                      >
                                          <span className="font-bold text-lg text-anime-text-main group-hover:text-anime-accent transition-colors text-left">{section.title}</span>
                                          {expandedSections.has(idx) ? <ChevronDown className="text-anime-text-muted"/> : <ChevronRight className="text-anime-text-muted"/>}
                                      </button>
                                      
                                      {expandedSections.has(idx) && (
                                          <div className="bg-anime-bg/50 border-x border-b border-anime-border/10 rounded-b-xl p-6 animate-slide-in relative group">
                                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <CopyButton text={section.content} />
                                              </div>
                                              <p className="text-anime-text-main/90 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                                          </div>
                                      )}
                                  </div>
                              ))
                          ) : (
                              // Fallback if no sections (e.g., older/failed parse)
                              <Card className="relative group">
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     {file.extractedText && <CopyButton text={file.extractedText} />}
                                  </div>
                                  <div className="whitespace-pre-wrap text-anime-text-main">{file.extractedText}</div>
                              </Card>
                          )}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* Chat View */}
          {mode === AppMode.CHAT && (
            <div className="max-w-5xl mx-auto h-full flex flex-col relative">
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {messages.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-full text-anime-text-muted opacity-50">
                      <MessageSquare size={64} className="mb-4"/>
                      <p>Start a conversation about your document</p>
                   </div>
                )}
                {messages.map((msg) => (
                   <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Image in message */}
                        {msg.image && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-anime-border/10 w-48">
                                <img src={`data:${msg.image.mimeType};base64,${msg.image.data}`} alt="uploaded" className="w-full h-auto" />
                            </div>
                        )}
                        
                        <div className={`relative p-5 rounded-2xl shadow-lg backdrop-blur-sm border ${msg.role === 'user' ? 'bg-gradient-to-br from-anime-primary to-pink-600 text-white border-transparent rounded-br-none' : 'bg-anime-surface border-anime-border/10 rounded-bl-none text-anime-text-main'}`}>
                            {/* Copy Button for Model messages */}
                            {msg.role === 'model' && (
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <CopyButton text={msg.text} className="bg-anime-bg/50 hover:bg-anime-bg text-anime-text-main hover:text-anime-accent" />
                              </div>
                            )}

                            <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</p>
                            
                            {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-white/20">
                                <p className="text-xs font-bold text-anime-accent mb-2 flex items-center gap-1 uppercase tracking-wider"><Search size={10}/> Cited Sources</p>
                                <div className="flex flex-wrap gap-2">
                                {msg.groundingUrls.map((url, idx) => (
                                    <a key={idx} href={url.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-black/30 hover:bg-anime-accent/20 px-3 py-1.5 rounded-full text-blue-300 transition-colors border border-white/5 hover:border-anime-accent/30 max-w-full truncate">
                                        <Search size={10} />
                                        <span className="truncate max-w-[150px]">{url.title}</span>
                                    </a>
                                ))}
                                </div>
                            </div>
                            )}
                        </div>
                        <span className="text-[10px] text-anime-text-muted mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                   </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                     <div className="bg-anime-surface border border-anime-border/10 p-4 rounded-2xl rounded-bl-none flex items-center gap-3 text-anime-text-muted shadow-lg">
                        <div className="relative">
                            <div className="w-3 h-3 bg-anime-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        </div>
                        <div className="relative">
                            <div className="w-3 h-3 bg-anime-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        </div>
                        <div className="relative">
                            <div className="w-3 h-3 bg-anime-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs ml-2 font-medium">Analyzing...</span>
                     </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-6 bg-gradient-to-t from-anime-bg via-anime-bg to-transparent z-10 shrink-0">
                <div className="bg-anime-surface/90 backdrop-blur-xl rounded-3xl border border-anime-border/20 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 hover:border-anime-border/40 focus-within:border-anime-primary/50 focus-within:shadow-[0_0_20px_rgba(244,114,182,0.15)]">
                   
                   {/* Tools Bar */}
                   <div className="flex items-center justify-between px-5 py-2.5 bg-anime-bg/30 border-b border-anime-border/20">
                      <label className={`flex items-center gap-2 text-xs cursor-pointer transition-all select-none group ${useSearch ? 'text-anime-accent font-bold' : 'text-anime-text-muted hover:text-anime-text-main'}`}>
                        <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${useSearch ? 'bg-anime-accent/20' : 'bg-slate-700/50 group-hover:bg-slate-700'}`}>
                            <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-current transition-transform duration-300 ${useSearch ? 'translate-x-4 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'translate-x-0'}`}></div>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={useSearch} 
                            onChange={(e) => setUseSearch(e.target.checked)}
                            className="hidden"
                        />
                        <span>Google Search</span>
                      </label>
                      
                      {chatImage && (
                          <div className="flex items-center gap-2 bg-anime-primary/10 text-anime-primary px-3 py-1 rounded-full text-[10px] font-bold border border-anime-primary/20 animate-in fade-in slide-in-from-bottom-2">
                              <ImageIcon size={12} /> 
                              <span className="max-w-[100px] truncate">IMAGE ATTACHED</span>
                              <button onClick={() => setChatImage(null)} className="hover:text-anime-text-main transition-colors bg-anime-primary/20 rounded-full p-0.5"><XCircle size={10}/></button>
                          </div>
                      )}
                   </div>

                   <div className="flex items-end gap-3 p-3">
                      <button 
                        onClick={() => chatFileInputRef.current?.click()}
                        className="p-3 text-anime-text-muted hover:text-anime-accent hover:bg-anime-accent/10 rounded-2xl transition-all duration-200 shrink-0 active:scale-95"
                        title="Upload Image"
                      >
                         <ImagePlus size={22} />
                      </button>
                      <input 
                        type="file" 
                        ref={chatFileInputRef}
                        onChange={handleChatImageUpload}
                        accept="image/*" 
                        className="hidden" 
                      />
                      
                      <div className="flex-1 relative flex items-center">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Ask a question or type 'quiz'..."
                            className="w-full bg-transparent border-none focus:ring-0 text-anime-text-main placeholder-anime-text-muted resize-none max-h-32 py-3 text-sm md:text-base leading-relaxed scrollbar-hide"
                            rows={1}
                            style={{ minHeight: '48px' }}
                        />
                        {/* Character Counter */}
                        <div className="absolute bottom-2 right-0 text-[10px] text-anime-text-muted font-mono pointer-events-none select-none">
                           {inputMessage.length} chars
                        </div>
                      </div>

                      <button 
                        onClick={handleSendMessage} 
                        disabled={loading || (!inputMessage.trim() && !chatImage)}
                        className="p-3.5 rounded-2xl bg-gradient-to-tr from-anime-primary to-anime-secondary text-white shadow-lg shadow-anime-primary/20 hover:shadow-anime-primary/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none transition-all duration-300 shrink-0 flex items-center justify-center group"
                      >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} fill="currentColor" className="ml-0.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Flashcard Workflow Mode */}
          {mode === AppMode.FLASHCARDS && (
              <div className="w-full h-full relative bg-anime-bg overflow-hidden flex flex-col">
                  {/* Controls Bar */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                      <div className="pointer-events-auto bg-anime-surface/90 backdrop-blur shadow-lg border border-anime-border/10 rounded-xl p-3 flex gap-4 items-center">
                           <Button onClick={handleGenerateMindMap} disabled={loading || mindMapData.length > 0} className="text-xs h-9 shadow-md">
                               {mindMapData.length > 0 ? <span className="flex gap-2 items-center"><RefreshCcw size={12}/> Regenerate Graph</span> : <span className="flex gap-2 items-center"><GitBranch size={12}/> Generate Workflow</span>}
                           </Button>
                           <div className="h-6 w-px bg-anime-border/20"></div>
                           <div className="flex items-center gap-2 bg-anime-bg/50 p-1 rounded-lg border border-anime-border/10">
                               <button onClick={() => setLineStyle('step')} className={`p-1.5 rounded ${lineStyle === 'step' ? 'bg-anime-accent text-white' : 'text-anime-text-muted hover:text-anime-text-main'}`} title="N8N Style"><Workflow size={16}/></button>
                               <button onClick={() => setLineStyle('curved')} className={`p-1.5 rounded ${lineStyle === 'curved' ? 'bg-anime-accent text-white' : 'text-anime-text-muted hover:text-anime-text-main'}`} title="Bezier"><Share2Icon size={16}/></button>
                               <button onClick={() => setLineStyle('straight')} className={`p-1.5 rounded ${lineStyle === 'straight' ? 'bg-anime-accent text-white' : 'text-anime-text-muted hover:text-anime-text-main'}`} title="Straight"><ArrowRight size={16}/></button>
                           </div>
                           <div className="flex items-center gap-2 bg-anime-bg/50 p-1 rounded-lg border border-anime-border/10">
                               <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-anime-border/10 rounded"><ZoomOut size={16}/></button>
                               <span className="text-xs w-8 text-center">{Math.round(scale * 100)}%</span>
                               <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1.5 hover:bg-anime-border/10 rounded"><ZoomIn size={16}/></button>
                           </div>
                           {mindMapData.length > 0 && (
                             <div className="px-3 text-xs text-anime-text-muted flex items-center gap-1">
                                <Move size={12} /> Drag to Pan
                             </div>
                           )}
                      </div>
                  </div>

                  {/* Canvas Area */}
                  {mindMapData.length === 0 && !loading ? (
                      <div className="flex flex-col items-center justify-center h-full text-anime-text-muted opacity-70">
                          <Workflow size={64} className="mb-4 text-anime-primary" />
                          <h3 className="text-xl font-bold text-anime-text-main">Flashcard Workflow</h3>
                          <p className="max-w-md text-center mt-2">Generate a hierarchical node graph (Parent → Child → Grandchild) to visualize concepts.</p>
                          <Button onClick={handleGenerateMindMap} className="mt-6">Create Graph</Button>
                      </div>
                  ) : (
                    <div 
                        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-anime-surface/30 to-anime-bg relative"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    >
                         {/* Infinite Grid Background (moves with pan) */}
                         <div 
                             className="absolute inset-0 pointer-events-none opacity-10" 
                             style={{ 
                                 backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
                                 backgroundSize: '20px 20px',
                                 backgroundPosition: `${pan.x}px ${pan.y}px`
                             }}
                         ></div>
                         
                         {/* Container for Scaled Content */}
                         <div 
                            style={{ 
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, 
                                transformOrigin: '0 0',
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0
                            }}
                         >
                             {/* SVG Layer for Wires (overflow visible ensures lines are drawn even if nodes are far) */}
                             <svg style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                                 {renderConnections(mindMapData)}
                             </svg>
                             
                             {/* Nodes Layer */}
                             <div style={{ zIndex: 10, position: 'relative' }}>
                                 {renderNodes(mindMapData)}
                             </div>
                         </div>
                    </div>
                  )}

                  {/* Detail Panel (Sidebar for selected node) */}
                  {selectedNode && (
                      <div className="absolute right-0 top-0 h-full w-80 bg-anime-surface/95 backdrop-blur border-l border-anime-border/20 shadow-2xl p-6 z-30 animate-slide-in-from-right">
                          <div className="flex justify-between items-start mb-6">
                              <Badge>Flashcard Details</Badge>
                              <button onClick={() => setSelectedNode(null)} className="text-anime-text-muted hover:text-red-400"><XCircle size={20}/></button>
                          </div>
                          <div className={`w-full h-2 mb-4 rounded-full ${selectedNode.color || 'bg-gray-500'}`}></div>
                          <h2 className="text-2xl font-bold text-anime-text-main mb-4">{selectedNode.label}</h2>
                          <div className="prose prose-invert text-sm leading-relaxed opacity-90 max-h-[60vh] overflow-y-auto">
                              {selectedNode.content}
                          </div>
                          <div className="mt-6 pt-6 border-t border-anime-border/10">
                              <p className="text-xs text-anime-text-muted uppercase tracking-widest mb-2">Connections</p>
                              <div className="flex gap-2 flex-wrap">
                                  {selectedNode.children?.map((c, i) => (
                                      <span key={i} className="text-xs px-2 py-1 bg-anime-bg rounded border border-anime-border/20 text-anime-text-main">{c.label}</span>
                                  ))}
                                  {(!selectedNode.children || selectedNode.children.length === 0) && <span className="text-xs text-anime-text-muted">End Node (Leaf)</span>}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* Quiz View */}
          {mode === AppMode.QUIZ && (
            <div className="max-w-3xl mx-auto h-full overflow-y-auto p-6 md:p-10 pb-20 scroll-smooth relative">
              
              {/* SETUP PHASE */}
              {quizPhase === 'SETUP' && (
                 <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                         <div className="absolute inset-0 bg-anime-accent/20 blur-3xl rounded-full"></div>
                         <BrainCircuit size={80} className="relative text-anime-text-main drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-anime-text-main">Test Your Knowledge</h2>
                    </div>
                    
                    <Card className="w-full max-w-md bg-anime-surface/80 border-anime-primary/20">
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-anime-text-muted uppercase">Number of Questions</label>
                                <div className="relative">
                                  <input 
                                      type="number" 
                                      value={quizSettings.count}
                                      onChange={(e) => setQuizSettings(prev => ({...prev, count: Math.max(1, parseInt(e.target.value) || 0)}))}
                                      className="w-full bg-anime-bg border border-anime-border/20 rounded-xl p-3 pl-12 text-anime-text-main focus:border-anime-primary outline-none transition-colors"
                                      placeholder="Unlimited"
                                  />
                                  <span className="absolute left-4 top-3.5 text-anime-text-muted text-xs font-bold">QTY</span>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-anime-text-muted uppercase">Focus Topic (Optional)</label>
                                <textarea 
                                    value={quizSettings.topic}
                                    onChange={(e) => setQuizSettings(prev => ({...prev, topic: e.target.value}))}
                                    placeholder="E.g., 'Focus on Chapter 3' or 'Hard questions about biology'..."
                                    className="w-full bg-anime-bg border border-anime-border/20 rounded-xl p-3 text-anime-text-main focus:border-anime-primary outline-none transition-colors h-24 resize-none"
                                />
                             </div>
                             
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-anime-text-muted uppercase">Question Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setQuizSettings(prev => ({...prev, type: 'multiple-choice'}))}
                                        className={`py-3 rounded-xl text-sm font-semibold transition-all border ${quizSettings.type === 'multiple-choice' ? 'bg-anime-primary/20 border-anime-primary text-anime-primary' : 'bg-anime-bg border-transparent text-anime-text-muted hover:text-anime-text-main'}`}
                                    >
                                        Quiz
                                    </button>
                                    <button 
                                        onClick={() => setQuizSettings(prev => ({...prev, type: 'open-ended'}))}
                                        className={`py-3 rounded-xl text-sm font-semibold transition-all border ${quizSettings.type === 'open-ended' ? 'bg-anime-primary/20 border-anime-primary text-anime-primary' : 'bg-anime-bg border-transparent text-anime-text-muted hover:text-anime-text-main'}`}
                                    >
                                        Question
                                    </button>
                                </div>
                             </div>

                             <Button onClick={handleGenerateQuiz} disabled={loading} className="w-full py-4 text-lg shadow-xl shadow-anime-primary/20">
                                 {loading ? <Loader2 className="animate-spin" /> : 'Start Quiz'}
                             </Button>
                        </div>
                    </Card>
                 </div>
              )}

              {/* ACTIVE & REVIEW PHASES */}
              {(quizPhase === 'ACTIVE' || quizPhase === 'REVIEW') && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-end border-b border-anime-border/10 pb-4 sticky top-0 bg-anime-bg/95 backdrop-blur-sm z-20 pt-4">
                    <div>
                        <h2 className="text-3xl font-bold text-anime-text-main flex items-center gap-3">
                          Quiz Session 
                          {quizPhase === 'REVIEW' && (
                            <span className={`text-lg px-3 py-1 rounded-full border ${calculateScore() / quizQuestions.length > 0.7 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                              Score: {calculateScore()} / {quizQuestions.length}
                            </span>
                          )}
                        </h2>
                        <p className="text-anime-text-muted text-sm mt-1 flex items-center gap-4">
                           <span>{quizPhase === 'ACTIVE' ? 'Select your answers below.' : 'Review your results and explanations.'}</span>
                           <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-anime-surface border border-anime-border/10">
                               <Clock size={12} className="text-anime-accent"/>
                               <span className="font-mono">{formatTime(quizDuration)}</span>
                           </span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                      {quizPhase === 'ACTIVE' && (
                        <Button onClick={handleSubmitQuiz} className="text-xs h-10 gap-2 bg-anime-primary hover:bg-anime-primary/80">
                           Submit <CheckCircle size={14} />
                        </Button>
                      )}
                      {quizPhase === 'REVIEW' && (
                         <Button variant="primary" onClick={resetQuiz} className="text-xs h-10 gap-2">
                            <RefreshCcw size={14}/> New Quiz
                         </Button>
                      )}
                      <Button variant="secondary" onClick={resetQuiz} className="text-xs h-10">Exit</Button>
                    </div>
                  </div>
                  
                  <div className="grid gap-8">
                    {quizQuestions.map((q, idx) => {
                        const isReview = quizPhase === 'REVIEW';
                        const isCorrect = q.userAnswer === q.answer;

                        return (
                          <Card key={idx} className={`relative overflow-hidden group transition-all duration-500 ${isReview ? (isCorrect ? 'border-green-500/30' : 'border-red-500/30') : 'hover:border-anime-primary/30'}`}>
                          {isReview && (
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          )}
                          {!isReview && (
                             <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-anime-primary to-anime-secondary"></div>
                          )}
                          
                          <div className="pl-6">
                              <div className="flex justify-between mb-6">
                                  <span className="text-anime-accent/80 font-black text-4xl opacity-20 absolute top-2 right-4 pointer-events-none">#{String(idx + 1).padStart(2, '0')}</span>
                                  <Badge>Question {idx + 1}</Badge>
                              </div>
                              
                              <h3 className="text-xl font-medium mb-8 leading-relaxed text-anime-text-main">{q.question}</h3>
                              
                              {q.type === 'multiple-choice' && q.options && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                  {q.options.map((opt, oIdx) => {
                                      const isSelected = q.userAnswer === opt;
                                      
                                      // Style Logic
                                      let wrapperStyle = "bg-anime-bg/30 border-anime-border/5 text-anime-text-main hover:bg-anime-bg/50 cursor-pointer";
                                      let markerStyle = "border-anime-text-muted text-anime-text-muted";

                                      if (!isReview) {
                                        if (isSelected) {
                                            // Active State - Stronger glow
                                            wrapperStyle = "bg-anime-primary/20 border-anime-primary text-white shadow-[0_0_15px_rgba(244,114,182,0.3)] ring-1 ring-anime-primary";
                                            markerStyle = "border-anime-primary bg-anime-primary text-white scale-110";
                                        }
                                      } else {
                                        // Review Mode Styles
                                        wrapperStyle += " cursor-default"; // Disable pointer events conceptually
                                        
                                        if (opt === q.answer) {
                                            // This is the correct answer
                                            wrapperStyle = "bg-green-500/20 border-green-500/50 text-green-100 ring-1 ring-green-500/50";
                                            markerStyle = "border-green-500 bg-green-500 text-black";
                                        } else if (isSelected && opt !== q.answer) {
                                            // User selected wrong answer
                                            wrapperStyle = "bg-red-500/20 border-red-500/50 text-red-100";
                                            markerStyle = "border-red-500 bg-red-500 text-white";
                                        } else {
                                            // Unselected, incorrect option
                                            wrapperStyle = "opacity-40 bg-black/20";
                                        }
                                      }
                                      
                                      return (
                                      <div 
                                          key={oIdx} 
                                          onClick={() => !isReview && handleAnswerSelect(q.id, opt)}
                                          className={`p-4 rounded-xl border transition-all duration-200 ${wrapperStyle} active:scale-[0.99]`}
                                      >
                                          <div className="flex items-center gap-3">
                                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-transform duration-200 ${markerStyle}`}>
                                                  {String.fromCharCode(65 + oIdx)}
                                              </div>
                                              <span>{opt}</span>
                                              
                                              {isReview && opt === q.answer && <CheckCircle size={16} className="ml-auto text-green-500"/>}
                                              {isReview && isSelected && opt !== q.answer && <XCircle size={16} className="ml-auto text-red-500"/>}
                                          </div>
                                      </div>
                                      )
                                  })}
                                  </div>
                              )}

                              {q.type === 'open-ended' && (
                                <div className="mb-6">
                                    <textarea 
                                        value={q.userAnswer || ''}
                                        onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                                        disabled={isReview}
                                        placeholder="Type your answer here..."
                                        className="w-full bg-anime-bg border border-anime-border/20 rounded-xl p-4 min-h-[100px] text-anime-text-main focus:border-anime-primary outline-none disabled:opacity-70"
                                    />
                                </div>
                              )}

                              {isReview && (
                                  <div className="bg-gradient-to-r from-anime-surface to-anime-bg border border-anime-border/10 p-6 rounded-xl animate-slide-in mt-6">
                                      <div className="flex items-start gap-3">
                                          <div className="p-2 bg-anime-accent/10 rounded-lg shrink-0">
                                             <BrainCircuit className="text-anime-accent" size={20} />
                                          </div>
                                          <div>
                                              <p className="font-bold text-anime-accent mb-2 uppercase text-xs tracking-widest">Explanation</p>
                                              {q.type === 'open-ended' && (
                                                  <p className="font-bold text-green-400 mb-2">Model Answer: {q.answer}</p>
                                              )}
                                              <p className="text-anime-text-main leading-relaxed opacity-90">{q.explanation}</p>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                          </Card>
                        );
                    })}
                  </div>
                </div>
              )}
          
          {/* Confirmation Modal */}
          {showSubmitConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-anime-bg/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                  <Card className="w-full max-w-sm border-anime-primary/50 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                      <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-anime-primary/20 rounded-full flex items-center justify-center mx-auto text-anime-primary mb-2">
                              <HelpCircle size={32} />
                          </div>
                          <h3 className="text-2xl font-bold text-anime-text-main">Submit Quiz?</h3>
                          <div className="text-anime-text-muted">
                              {getUnansweredCount() > 0 ? (
                                  <p className="text-red-400 font-semibold">You have {getUnansweredCount()} unanswered questions.</p>
                              ) : (
                                  <p>Are you ready to see your results?</p>
                              )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4">
                              <Button variant="secondary" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
                              <Button onClick={confirmSubmit}>Yes, Submit</Button>
                          </div>
                      </div>
                  </Card>
              </div>
          )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
// Helper component needed for icon in new menu item
function Share2Icon({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
    )
}
