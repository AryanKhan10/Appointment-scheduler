import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

const OccupiedSlotsView = ({
  selectedBusiness,
  bookedSlots,
  onRefreshBookedSlots
}) => {
  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
              Booked Schedule: {selectedBusiness?.name || 'All Businesses'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Occupied slots for {selectedBusiness?.name || 'this provider'}. Other businesses maintain independent availability.
            </p>
          </div>
          <button
            onClick={onRefreshBookedSlots}
            className="px-3 py-2 bg-zinc-900 border border-white/20 text-white hover:border-white rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Refresh Slots</span>
          </button>
        </div>

        {bookedSlots.length === 0 ? (
          <div className="p-10 text-center border border-zinc-800 rounded-2xl text-zinc-400 text-xs">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-white opacity-40" />
            <span>All dates and time slots are currently open for {selectedBusiness?.name}!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookedSlots.map(slot => {
              const slotDate = new Date(slot.scheduled_at);
              return (
                <div 
                  key={slot.id}
                  className="p-4 bg-zinc-950 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/40"></div>
                    <div>
                      <div className="font-semibold text-white">{slot.service_name}</div>
                      {slot.business_name && (
                        <div className="text-[10px] font-mono text-zinc-400">{slot.business_name}</div>
                      )}
                      <div className="text-zinc-400 font-mono text-[11px] mt-0.5">
                        {slotDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-zinc-400 font-mono text-[11px]">
                        {slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({slot.duration_minutes || 60} mins)
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/15 text-zinc-300">
                    Occupied
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OccupiedSlotsView;
