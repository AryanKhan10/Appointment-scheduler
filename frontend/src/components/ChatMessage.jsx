import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

export const formatMessageContent = (content) => {
  if (typeof content !== 'string') return content;
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.message) return parsed.message;
      if (parsed.action === 'BOOK_APPOINTMENT') {
        const d = parsed.scheduled_at ? new Date(parsed.scheduled_at) : null;
        const dateStr = d && !isNaN(d.getTime()) ? d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
        return `I have scheduled your ${parsed.service_name || 'appointment'}${dateStr ? ` for ${dateStr}` : ''}.`;
      }
    } catch (e) {
      // plain text
    }
  }
  return content;
};

const ChatMessage = ({ msg, businessName, onOpenBookingModal }) => {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';

  if (isSystem) {
    return (
      <div 
        className={`max-w-xl mx-auto w-full p-4 rounded-xl border animate-slide-up ${
          msg.isError
            ? 'bg-zinc-950 border-white/30 text-white shadow-lg'
            : 'bg-zinc-900/90 border-white/20 text-white shadow-md'
        }`}
      >
        <div className="flex items-start gap-3">
          {msg.isError ? (
            <div className="p-2 rounded-lg bg-white/10 text-white shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-white text-black shrink-0 mt-0.5">
              <CheckCircle2 size={18} />
            </div>
          )}
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider font-mono font-bold text-zinc-400 mb-1">
              {msg.isError ? 'Notice / Date Conflict' : 'Reservation Confirmed'}
            </div>
            <div className="text-sm font-medium leading-relaxed">
              {msg.content}
            </div>
            {msg.isError && onOpenBookingModal && (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Please choose a different date or time.</span>
                <button
                  onClick={onOpenBookingModal}
                  className="text-xs text-white underline font-semibold hover:text-zinc-300 cursor-pointer"
                >
                  View Calendar & Pick Other Date
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`max-w-[75%] p-4 rounded-2xl relative animate-slide-up leading-relaxed ${
        isUser
          ? 'self-end bg-white text-black rounded-tr-xs shadow-[0_4px_20px_rgba(255,255,255,0.1)] font-medium'
          : 'self-start bg-zinc-900/90 border border-white/10 text-zinc-100 rounded-tl-xs shadow-md'
      }`}
    >
      {!isUser && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
          <Sparkles size={11} className="text-white" />
          <span>{businessName || 'Chrono AI'}</span>
        </div>
      )}
      <div className="whitespace-pre-wrap text-sm">{formatMessageContent(msg.content)}</div>
      
      {/* Fallback to structured form if input is incomplete or ambiguous */}
      {!isUser && msg.suggest_form && onOpenBookingModal && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-3 animate-fade-in">
          <span className="text-[11px] text-zinc-400">Prefer structured selection?</span>
          <button
            onClick={onOpenBookingModal}
            className="px-2.5 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
          >
            <Calendar size={13} />
            <span>Open Booking Form</span>
          </button>
        </div>
      )}

      {msg.timestamp && (
        <span className={`text-[10px] font-mono mt-2 block ${isUser ? 'text-zinc-500 text-right' : 'text-zinc-400'}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};

export default ChatMessage;
