import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, User, Bot, MessageSquareQuote, ShieldAlert } from 'lucide-react';
import { createAIChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface ChatBotProps {
  currentTab: string;
  contextSummary?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ currentTab, contextSummary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'ai', text: 'Hello! I am your Red Command AI Concierge. How can I assist you with clinical coordination or donor logistics today?' }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // If the user switches tabs, we reset the session to refresh the AI's "sight" (context)
  useEffect(() => {
    if (chatSession) {
      setChatSession(null); 
      // Keep message history but next message will re-init with new SITREP
    }
  }, [currentTab]);

  const handleSendMessage = async (e?: React.FormEvent, presetMessage?: string) => {
    e?.preventDefault();
    const textToSend = presetMessage || input;
    if (!textToSend.trim() || isStreaming) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    let session = chatSession;
    if (!session) {
      // Initialize session with current view context SITREP
      const sitrep = `User is viewing the "${currentTab}" tab. ${contextSummary || ""}`;
      session = createAIChatSession(sitrep);
      setChatSession(session);
    }

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', text: '' }]);

    try {
      const result = await session.sendMessageStream({ message: textToSend });
      let fullText = '';
      
      for await (const chunk of result) {
        const chunkResponse = chunk as GenerateContentResponse;
        const textChunk = chunkResponse.text || '';
        fullText += textChunk;
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: fullText } : msg
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, text: 'I apologize, but I encountered an error. Please try again.' } : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const quickPrompts = [
    "Who can donate?",
    "Rare blood types",
    "Emergency protocols"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[550px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-900/40">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Concierge</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Gemini 3 Pro</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {/* CONTEXT STATUS BAR */}
          <div className="bg-indigo-600 px-6 py-2 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <ShieldAlert className="w-3 h-3 text-indigo-200" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">SITREP Synchronized: {currentTab}</span>
             </div>
             <div className="flex gap-0.5">
                <div className="w-0.5 h-1.5 bg-indigo-300 rounded-full"></div>
                <div className="w-0.5 h-1.5 bg-indigo-100 rounded-full animate-pulse"></div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-slate-50/30">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-red-50 text-red-600' : 'bg-white border border-slate-100 shadow-sm text-slate-500'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] p-3.5 rounded-2xl text-[13px] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'}`}>
                  {msg.text || (isStreaming && <Loader2 className="w-4 h-4 animate-spin opacity-50" />)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 pt-0 space-y-4 bg-white">
            {!isStreaming && messages.length < 3 && (
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map(p => (
                  <button key={p} onClick={() => handleSendMessage(undefined, p)} className="text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-red-50 hover:text-red-600 transition-all uppercase tracking-widest">{p}</button>
                ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="relative">
              <input type="text" placeholder="Type a message..." className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium" value={input} onChange={(e) => setInput(e.target.value)} disabled={isStreaming} />
              <button type="submit" disabled={!input.trim() || isStreaming} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white rounded-xl disabled:opacity-50 hover:bg-slate-800 transition-all shadow-lg"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group bg-red-600 border-2 border-white text-white ${isOpen ? 'rotate-90' : ''}`}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageSquareQuote className="w-7 h-7" />}
      </button>
    </div>
  );
};

export default ChatBot;