import React from 'react';
import { Sparkles, Plus, ArrowRight, Loader2, Send } from 'lucide-react';
import ChatMessage from './ChatMessage';

const ChatView = ({
  selectedBusiness,
  messages,
  input,
  setInput,
  isTyping,
  isBookingInProgress,
  onSendMessage,
  onOpenBookingModal,
  onQuickPrompt,
  messagesEndRef
}) => {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <header className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-sm text-white">
                {selectedBusiness?.name || 'AI Booking Concierge'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-300">
                {selectedBusiness?.category || 'SaaS Tenant'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {selectedBusiness?.description || 'Ask in natural language to book or check availability'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenBookingModal}
            className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>Book at {selectedBusiness?.name?.split(' ')[0] || 'Clinic'}</span>
          </button>
        </div>
      </header>

      {/* Chat Messages Scrollable Feed */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-5">
        {messages.length === 0 && (
          <div className="my-auto max-w-xl mx-auto text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-5 text-white shadow-xl">
              <Sparkles size={24} />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 mb-1">
              {selectedBusiness?.category || 'Dedicated Assistant'}
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white mb-2">
              Welcome to {selectedBusiness?.name || 'our service concierge'}
            </h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed max-w-md">
              I can schedule appointments for any of our specialized services: 
              <strong className="text-white ml-1">
                {selectedBusiness?.services?.map(s => s.name).join(', ') || 'Consultations'}
              </strong>.
            </p>

            {/* Dynamic Suggestion Chips based on selected business */}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
              {selectedBusiness?.services?.slice(0, 2).map((srv, sIdx) => {
                const sampleText = sIdx === 0 
                  ? `Book a ${srv.name} for next Monday at 2:00 PM`
                  : `Schedule a ${srv.name} tomorrow at 11:00 AM`;
                return (
                  <button
                    key={srv.name}
                    onClick={() => onQuickPrompt(sampleText)}
                    className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-white/40 rounded-xl text-xs text-zinc-300 hover:text-white text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>"{sampleText}"</span>
                    <ArrowRight size={13} className="text-zinc-400 group-hover:text-white transition-colors ml-2 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages Mapping */}
        {messages.map((msg, idx) => (
          <ChatMessage 
            key={idx}
            msg={msg}
            businessName={selectedBusiness?.name}
            onOpenBookingModal={onOpenBookingModal}
          />
        ))}

        {/* AI Typing / Generating Indicator */}
        {isTyping && (
          <div className="self-start max-w-sm p-4 bg-zinc-900/80 border border-white/10 rounded-2xl rounded-tl-xs flex items-center gap-3 animate-slide-up">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white shrink-0">
              <Loader2 size={14} className="animate-spin" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-300 font-medium">
                {selectedBusiness?.name ? `${selectedBusiness.name} AI is checking schedule...` : 'Assistant is thinking...'}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Verifying availability & formulating response</span>
            </div>
            <div className="flex gap-1 ml-auto">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
            </div>
          </div>
        )}

        {/* Appointment Booking in Progress Indicator */}
        {isBookingInProgress && (
          <div className="max-w-md mx-auto p-4 bg-zinc-900 border border-white/20 rounded-xl flex items-center gap-3 text-xs text-white animate-fade-in shadow-xl">
            <Loader2 size={18} className="animate-spin text-white shrink-0" />
            <div>
              <div className="font-semibold">Verifying slot and securing booking...</div>
              <div className="text-[11px] text-zinc-400 font-mono">Ensuring no conflict exists at {selectedBusiness?.name}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 md:p-6 bg-zinc-950 border-t border-white/10">
        <form 
          onSubmit={onSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-3 bg-zinc-900/90 border border-white/15 focus-within:border-white focus-within:ring-1 focus-within:ring-white/20 p-2 rounded-2xl transition-all shadow-xl"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping || isBookingInProgress}
            placeholder={`Ask ${selectedBusiness?.name || 'to book'} (e.g. 'Book a ${selectedBusiness?.services?.[0]?.name || 'consultation'} for next Monday at 2pm')...`}
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTyping || isBookingInProgress}
            className="w-11 h-11 bg-white text-black hover:bg-zinc-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer font-bold shadow-md"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
