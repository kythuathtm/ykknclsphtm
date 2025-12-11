
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { DefectReport } from '../types';
import { XIcon, PaperAirplaneIcon, SparklesIcon, UserIcon, ArrowPathIcon } from './Icons';

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
  
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const initChat = async (isRefresh = false) => {
    setIsLoading(true);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
          setMessages([{ role: 'model', text: 'Lỗi: Không tìm thấy API Key. Vui lòng kiểm tra cấu hình môi trường.' }]);
          setIsLoading(false);
          return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const simplifiedData = dataRef.current.slice(0, 200).map(r => ({
          id: r.id,
          sp: r.maSanPham,
          ten: r.tenThuongMai,
          loi: r.noiDungPhanAnh,
          sl_loi: r.soLuongLoi,
          sl_doi: r.soLuongDoi,
          trang_thai: r.trangThai,
          ngay: r.ngayPhanAnh,
          nguyen_nhan: r.nguyenNhan,
          khac_phuc: r.huongKhacPhuc,
          npp: r.nhaPhanPhoi
      }));

      const systemInstruction = `Bạn là trợ lý AI chuyên gia phân tích chất lượng cho hệ thống quản lý khiếu nại (QMS).
Dữ liệu hiện tại (${simplifiedData.length} phiếu đang hiển thị trên màn hình):
${JSON.stringify(simplifiedData)}

QUY TẮC TRẢ LỜI:
1. **Phân tích theo dõi (Tracking)**: Khi người dùng hỏi về lịch sử, hãy tập trung vào mốc thời gian (ngày), tần suất lỗi lặp lại, và các phiếu bị chậm trễ.
2. **Ngắn gọn & Súc tích**: Trả lời trực tiếp, dùng gạch đầu dòng.
3. **Định dạng**: Dùng Markdown (**in đậm** cho từ khóa, - cho danh sách) để dễ đọc.
4. **Trung thực**: Nếu không tìm thấy thông tin trong dữ liệu được cung cấp, hãy nói "Không có thông tin trong dữ liệu hiện tại".
5. **Tiếng Việt**: Chuyên nghiệp, thân thiện.`;

      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 2048 }, 
        },
      });
      
      setChatSession(chat);
      
      if (isRefresh) {
          setMessages(prev => [...prev, { role: 'model', text: `✅ Đã cập nhật ngữ cảnh với ${simplifiedData.length} phiếu dữ liệu mới nhất.` }]);
      } else {
          setMessages([{ role: 'model', text: `Xin chào! Tôi đã sẵn sàng phân tích ${simplifiedData.length} phiếu khiếu nại đang hiển thị. Bạn muốn biết thông tin gì về lịch sử lỗi hoặc xu hướng?` }]);
      }
    } catch (error) {
      console.error("Chat init error:", error);
      setMessages([{ role: 'model', text: 'Xin lỗi, tôi không thể khởi động ngay lúc này. Vui lòng kiểm tra kết nối mạng.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setMessages(prev => [...prev, { role: 'model', text: 'Đã xảy ra lỗi khi xử lý yêu cầu (Có thể do mạng hoặc hết hạn ngạch).' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageText = (text: string) => {
      const lines = text.split('\n');
      return lines.map((line, i) => {
          const isListItem = /^\s*[\*\-]\s+(.*)/.test(line);
          const isBold = /\*\*(.*?)\*\*/g;
          
          const processInline = (str: string) => {
              const parts = str.split(isBold);
              return parts.map((part, j) => {
                  if (j % 2 === 1) return <strong key={j} className="font-bold text-slate-900">{part}</strong>;
                  return part;
              });
          };

          if (isListItem) {
              const content = line.replace(/^\s*[\*\-]\s+/, '');
              return (
                  <div key={i} className="flex gap-2 ml-1 mb-1.5 items-start">
                      <span className="text-indigo-500 mt-1.5 text-[6px] flex-shrink-0">●</span>
                      <span className="leading-relaxed">{processInline(content)}</span>
                  </div>
              );
          }

          return (
              <p key={i} className={`min-h-[1em] mb-1.5 last:mb-0 leading-relaxed ${line.trim() === '' ? 'h-2' : ''}`}>
                  {processInline(line)}
              </p>
          );
      });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[420px] h-[650px] max-h-[85vh] bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col overflow-hidden z-50 animate-pop ring-1 ring-white/50 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003DA5] to-indigo-600 p-5 flex justify-between items-center text-white shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner flex items-center justify-center border border-white/20">
                <SparklesIcon className="w-6 h-6 animate-pulse text-white" />
            </div>
            <div>
                <h3 className="font-extrabold text-base leading-tight tracking-wide drop-shadow-md">Trợ lý AI</h3>
                <p className="text-[10px] opacity-90 font-bold text-blue-100 flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/10 w-fit mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse box-shadow-glow"></span>
                    Gemini 2.5 Flash
                </p>
            </div>
        </div>
        <div className="flex items-center gap-1 relative z-10">
            <button 
                onClick={() => initChat(true)} 
                className="w-9 h-9 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors active:scale-95 text-blue-100 hover:text-white"
                title="Cập nhật ngữ cảnh"
            >
                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors active:scale-95 text-blue-100 hover:text-white">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30 scroll-smooth custom-scrollbar">
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white mt-auto mb-1 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
                    {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                </div>
                <div 
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-sm ${
                        msg.role === 'user' 
                        ? 'bg-white/90 text-slate-800 border border-slate-100 rounded-br-sm' 
                        : 'bg-white/80 text-slate-700 border border-indigo-100 rounded-bl-sm shadow-indigo-100/50'
                    }`}
                >
                    {renderMessageText(msg.text)}
                </div>
            </div>
        ))}
        {isLoading && (
            <div className="flex gap-3 animate-fade-in">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm border border-white mt-auto mb-1">
                    <SparklesIcon className="w-5 h-5 animate-spin-slow" />
                </div>
                <div className="bg-white/80 p-4 rounded-2xl border border-indigo-100 shadow-sm rounded-bl-sm flex gap-1.5 items-center h-12 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/70 backdrop-blur-xl border-t border-white/50 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2 relative bg-white/50 rounded-[1.2rem] p-1.5 border border-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
            <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi về dữ liệu, xu hướng lỗi..."
                className="flex-1 px-4 py-3 bg-transparent border-none text-sm outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                disabled={isLoading}
                autoFocus
            />
            <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-[#003DA5] text-white rounded-2xl hover:bg-[#002a70] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/10 active:scale-95 flex-shrink-0"
            >
                <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-semibold flex items-center justify-center gap-1 opacity-70">
              <SparklesIcon className="w-3 h-3 text-indigo-400"/> 
              AI có thể mắc lỗi. Vui lòng kiểm chứng.
          </p>
      </div>
    </div>
  );
};

export default ChatInterface;
