
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { DefectReport } from '../types';
import { XIcon, PaperAirplaneIcon, SparklesIcon, UserIcon, ChatBubbleLeftIcon } from './Icons';

interface ChatInterfaceProps {
  onClose: () => void;
  data: DefectReport[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, data }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  // Initialize Chat Session on Mount
  useEffect(() => {
    const initChat = async () => {
      try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            setMessages([{ role: 'model', text: 'Lỗi: Không tìm thấy API Key. Vui lòng kiểm tra cấu hình môi trường.' }]);
            return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Prepare context from data (simplified to save tokens)
        const simplifiedData = data.slice(0, 100).map(r => ({
            id: r.id,
            sp: r.maSanPham,
            ten: r.tenThuongMai,
            loi: r.noiDungPhanAnh,
            sl_loi: r.soLuongLoi,
            trang_thai: r.trangThai,
            ngay: r.ngayPhanAnh,
            nguyen_nhan: r.nguyenNhan
        }));

        const systemInstruction = `Bạn là trợ lý AI chuyên gia phân tích chất lượng cho hệ thống quản lý khiếu nại (QMS).
Dữ liệu hiện tại (100 phiếu gần nhất):
${JSON.stringify(simplifiedData)}

Quy tắc trả lời:
1.  **Phân tích sâu sắc**: Đừng chỉ liệt kê, hãy tìm xu hướng (ví dụ: sản phẩm nào lỗi nhiều nhất, lỗi nào lặp lại).
2.  **Ngắn gọn & Súc tích**: Trả lời trực tiếp vào vấn đề, sử dụng gạch đầu dòng nếu cần.
3.  **Định dạng**: Sử dụng Markdown đơn giản (in đậm **text**, danh sách - item) để dễ đọc.
4.  **Trung thực**: Nếu không tìm thấy thông tin trong dữ liệu được cung cấp, hãy nói rõ "Không có thông tin trong dữ liệu hiện tại".
5.  **Tiếng Việt**: Luôn trả lời bằng tiếng Việt chuyên ngành quản lý chất lượng.`;

        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: systemInstruction,
            thinkingConfig: { thinkingBudget: 1024 }, // Enable mild thinking for better reasoning
          },
        });
        
        setChatSession(chat);
        setMessages([{ role: 'model', text: 'Xin chào! Tôi là trợ lý AI phân tích chất lượng. Tôi có thể giúp bạn thống kê lỗi, tìm xu hướng hoặc tra cứu phiếu cụ thể.' }]);
      } catch (error) {
        console.error("Chat init error:", error);
        setMessages([{ role: 'model', text: 'Xin lỗi, tôi không thể khởi động ngay lúc này. Vui lòng kiểm tra kết nối mạng hoặc API Key.' }]);
      }
    };

    initChat();
  }, [data]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !chatSession || isLoading) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessageStream({ message: userMsg });
      
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]); 

      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
            fullText += chunkText;
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'model', text: fullText };
                return newMsgs;
            });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn (Có thể do mạng hoặc hết hạn ngạch).' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Markdown Renderer
  const renderMessageText = (text: string) => {
      return text.split('\n').map((line, i) => {
          // Bold formatting
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
              <p key={i} className="min-h-[1.2em] mb-1">
                  {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                  })}
              </p>
          );
      });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-[95vw] sm:w-[420px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 animate-fade-in-up ring-1 ring-black/5 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003DA5] to-blue-600 p-4 flex justify-between items-center text-white shrink-0 shadow-md">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <SparklesIcon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
                <h3 className="font-bold text-sm leading-tight">Trợ lý Chất lượng AI</h3>
                <p className="text-[10px] opacity-80 font-medium">Powered by Gemini 2.5</p>
            </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95">
            <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50 scroll-smooth custom-scrollbar">
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
                    {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                </div>
                <div 
                    className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-white text-slate-800 border border-slate-100 rounded-tr-none' 
                        : 'bg-blue-600 text-white rounded-tl-none shadow-blue-200'
                    }`}
                >
                    {renderMessageText(msg.text)}
                </div>
            </div>
        ))}
        {isLoading && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <SparklesIcon className="w-4 h-4 animate-spin-slow" />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm rounded-tl-none flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2 relative bg-slate-100 rounded-2xl p-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
            <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi về dữ liệu, xu hướng lỗi..."
                className="flex-1 px-4 py-2.5 bg-transparent border-none text-sm outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                disabled={isLoading}
                autoFocus
            />
            <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-[#003DA5] text-white rounded-xl hover:bg-[#002a70] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex-shrink-0"
            >
                <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">AI có thể mắc lỗi. Vui lòng kiểm chứng thông tin quan trọng.</p>
      </div>
    </div>
  );
};

export default ChatInterface;
