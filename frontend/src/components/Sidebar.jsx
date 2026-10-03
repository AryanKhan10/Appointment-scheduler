import React from 'react';
import { 
  Building2, ChevronDown, Sparkles, Calendar, CalendarDays, 
  Plus, RefreshCw, Clock, User, LogOut 
} from 'lucide-react';

const Sidebar = ({
  businesses,
  selectedBusiness,
  onSelectBusiness,
  isBusinessDropdownOpen,
  setIsBusinessDropdownOpen,
  activeTab,
  setActiveTab,
  messagesCount,
  appointments,
  bookedSlotsCount,
  loadingAppointments,
  onRefreshAppointments,
  onOpenBookingModal,
  user,
  onLogout
}) => {
  return (
    <aside className="w-80 bg-zinc-950 border-r border-white/10 flex flex-col shrink-0">
      {/* Brand header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            ◆
          </div>
          <div>
            <h2 className="font-heading font-bold text-base tracking-tight text-white">Chrono AI</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>Multi-Tenant Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-TENANT BUSINESS SELECTOR */}
      <div className="p-4 border-b border-white/10 bg-zinc-900/40 relative">
        <div className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5 flex items-center gap-1.5">
          <Building2 size={12} className="text-white" />
          <span>Active Business Tenant</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsBusinessDropdownOpen(!isBusinessDropdownOpen)}
            className="w-full p-2.5 bg-zinc-900 border border-white/15 hover:border-white/30 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer shadow-sm group"
          >
            <div className="overflow-hidden pr-2">
              <div className="font-bold text-xs text-white truncate">
                {selectedBusiness?.name || 'Select Business'}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate">
                {selectedBusiness?.category || 'Provider'}
              </div>
            </div>
            <ChevronDown size={14} className={`text-zinc-400 group-hover:text-white transition-transform duration-200 shrink-0 ${isBusinessDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isBusinessDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-950 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up">
              {businesses.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelectBusiness(b);
                    setIsBusinessDropdownOpen(false);
                  }}
                  className={`w-full p-3 text-left border-b border-white/5 last:border-none flex items-center justify-between transition-colors cursor-pointer ${
                    selectedBusiness?.id === b.id 
                      ? 'bg-white text-black font-bold' 
                      : 'hover:bg-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{b.name}</div>
                    <div className={`text-[10px] font-mono ${selectedBusiness?.id === b.id ? 'text-zinc-700' : 'text-zinc-400'}`}>
                      {b.category}
                    </div>
                  </div>
                  {selectedBusiness?.id === b.id && (
                    <span className="text-[10px] font-mono uppercase bg-black text-white px-1.5 py-0.5 rounded">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="p-4 border-b border-white/10 flex flex-col gap-1.5">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white text-black shadow-md font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} />
            <span>AI Chat Concierge</span>
          </div>
          {messagesCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeTab === 'chat' ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300'
            }`}>
              {messagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('appointments');
            onRefreshAppointments();
          }}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-white text-black shadow-md font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Calendar size={16} />
            <span>My Appointments</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
            activeTab === 'appointments' ? 'bg-black text-white font-bold' : 'bg-zinc-800 text-zinc-300'
          }`}>
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-white text-black shadow-md font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarDays size={16} />
            <span>Occupied Slots</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
            activeTab === 'calendar' ? 'bg-black text-white font-bold' : 'bg-zinc-800 text-zinc-300'
          }`}>
            {bookedSlotsCount}
          </span>
        </button>
      </div>

      {/* Quick Direct Booking Action Button */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onOpenBookingModal}
          className="w-full py-2.5 px-4 bg-zinc-900 border border-white/20 hover:border-white text-white rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white hover:text-black cursor-pointer shadow-sm group"
        >
          <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
          <span>Direct Appointment Form</span>
        </button>
      </div>

      {/* Sidebar Middle - Mini Preview of Upcoming Appointments */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-zinc-400 mb-1 px-1">
          <span>Upcoming Reservations</span>
          <button 
            onClick={onRefreshAppointments} 
            title="Refresh appointments"
            className="hover:text-white transition-colors"
          >
            <RefreshCw size={11} className={loadingAppointments ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingAppointments ? (
          <div className="flex flex-col gap-2">
            <div className="h-16 rounded-xl skeleton-shimmer"></div>
            <div className="h-16 rounded-xl skeleton-shimmer"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-zinc-800 rounded-xl my-auto text-zinc-400 text-xs">
            <Calendar size={24} className="mx-auto mb-2 opacity-30 text-white" />
            <span>No upcoming bookings yet.</span>
          </div>
        ) : (
          appointments.slice(0, 4).map(apt => (
            <div 
              key={apt.id} 
              className="p-3 bg-zinc-900/60 border border-white/5 hover:border-white/20 rounded-xl transition-all text-xs"
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="font-semibold text-white truncate">{apt.service_name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white shrink-0">
                  {apt.status}
                </span>
              </div>
              {apt.business_name && (
                <div className="text-[10px] font-mono text-zinc-400 mb-1 truncate flex items-center gap-1">
                  <Building2 size={10} />
                  <span>{apt.business_name}</span>
                </div>
              )}
              <div className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                <Clock size={12} className="text-zinc-400" />
                <span>
                  {new Date(apt.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sidebar Footer - User Profile & Logout */}
      <div className="p-4 border-t border-white/10 bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-white font-mono text-xs">
              <User size={15} />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user.full_name || 'Member'}</div>
              <div className="text-[11px] text-zinc-400 font-mono truncate">{user.email || ''}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
