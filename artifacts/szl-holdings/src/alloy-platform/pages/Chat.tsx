import { AlloyAppShell } from "../components/AlloyAppShell";
import { useState } from "react";
import { Send, Bot, User, Paperclip, MoreHorizontal, FileText } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const DEMO_HISTORY = [
  { id: 1, title: "Q3 Revenue Analysis", date: "Today" },
  { id: 2, title: "Vendor Risk Assessment", date: "Yesterday" },
  { id: 3, title: "Contract Extraction", date: "Previous 7 Days" },
];

const DEMO_MESSAGES = [
  { 
    id: 1, 
    role: "user", 
    content: "Can you analyze the Q3 revenue data and extract the top 3 growth regions?" 
  },
  { 
    id: 2, 
    role: "assistant", 
    content: "I've analyzed the Q3 revenue data across all operating regions. Here are the top 3 growth regions:\n\n1. **APAC (Asia Pacific)**: +24.3% YoY. Driven primarily by expansion in Japan and Australia.\n2. **EMEA (Europe, Middle East, Africa)**: +18.7% YoY. Strong performance in the UK enterprise sector.\n3. **LATAM (Latin America)**: +12.1% YoY. Accelerated adoption of our core product suite in Brazil.\n\nWould you like me to drill down into any specific region or generate a formatted report?" 
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), role: "user", content: input };
    setMessages([...messages, newMsg]);
    setInput("");
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: "I'm processing that request. This is a demo environment, so I cannot execute live queries, but I would normally route this through the appropriate data connectors."
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <AlloyAppShell title="Copilot Chat">
      <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-slate-800 bg-[#0d121c] overflow-hidden shadow-sm">
        
        {/* Sidebar History */}
        <div className="w-64 border-r border-slate-800 bg-[#0a0e17] flex flex-col hidden md:flex">
          <div className="p-3 border-b border-slate-800">
            <button className="w-full flex items-center justify-center gap-2 bg-[#4B8BDB] hover:bg-[#3A7AC9] text-white py-2 rounded-md text-sm font-medium transition-colors">
              <Bot size={16} /> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 px-2 pb-1">Today</div>
              {DEMO_HISTORY.filter(h => h.date === "Today").map(h => (
                <button key={h.id} className="w-full text-left px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 rounded truncate transition-colors bg-slate-800/50">
                  {h.title}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 px-2 pb-1">Yesterday</div>
              {DEMO_HISTORY.filter(h => h.date === "Yesterday").map(h => (
                <button key={h.id} className="w-full text-left px-2 py-1.5 text-sm text-slate-400 hover:bg-slate-800 rounded truncate transition-colors">
                  {h.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Header */}
          <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-[#0d121c]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-200">Alloy Core Model</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">v4.2</span>
            </div>
            <button className="text-slate-400 hover:text-slate-200">
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center shrink-0",
                  msg.role === "assistant" ? "bg-[#4B8BDB] text-white" : "bg-slate-700 text-slate-200"
                )}>
                  {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed",
                  msg.role === "user" ? "bg-slate-800 text-slate-200" : "bg-transparent text-slate-300"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded bg-[#4B8BDB] text-white flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="flex items-center gap-1.5 p-4">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#0d121c]">
            <div className="max-w-3xl mx-auto relative rounded-xl border border-slate-700 bg-slate-900 overflow-hidden focus-within:border-[#4B8BDB] focus-within:ring-1 focus-within:ring-[#4B8BDB] transition-all">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Alloy anything..."
                className="w-full bg-transparent text-slate-200 text-sm p-4 pr-12 min-h-[60px] max-h-[200px] outline-none resize-none"
                rows={1}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button className="p-2 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition-colors">
                  <Paperclip size={18} />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 text-white bg-[#4B8BDB] rounded-md hover:bg-[#3A7AC9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            <div className="text-center mt-2 text-xs text-slate-500">
              Alloy can make mistakes. Verify important information.
            </div>
          </div>
        </div>
      </div>
    </AlloyAppShell>
  );
}
