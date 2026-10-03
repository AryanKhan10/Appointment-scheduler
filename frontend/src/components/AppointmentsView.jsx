import React from 'react';
import { Calendar, Plus, Clock, Loader2, Trash2 } from 'lucide-react';

const AppointmentsView = ({
  appointments,
  loadingAppointments,
  cancellingId,
  onCancelAppointment,
  onOpenBookingModal,
  onSwitchToChat
}) => {
  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-heading">My Appointments</h2>
            <p className="text-xs text-zinc-400 mt-1">Review, manage, or cancel your scheduled sessions across providers</p>
          </div>
          <button
            onClick={onOpenBookingModal}
            className="px-4 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus size={16} />
            <span>Book New Appointment</span>
          </button>
        </div>

        {loadingAppointments ? (
          <div className="flex flex-col gap-4">
            <div className="h-24 rounded-2xl skeleton-shimmer"></div>
            <div className="h-24 rounded-2xl skeleton-shimmer"></div>
            <div className="h-24 rounded-2xl skeleton-shimmer"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30 text-white" />
            <h4 className="text-sm font-semibold text-white mb-1">No appointments found</h4>
            <p className="text-xs text-zinc-400 mb-6">Use the AI chat or the booking form to schedule a slot.</p>
            <button
              onClick={onSwitchToChat}
              className="px-4 py-2 bg-zinc-900 border border-white/20 hover:border-white text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Open AI Scheduler
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {appointments.map(apt => (
              <div 
                key={apt.id}
                className="p-5 bg-zinc-950 border border-white/10 hover:border-white/25 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 text-white">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold text-base text-white">{apt.service_name}</h4>
                      {apt.business_name && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/15 text-zinc-200">
                          {apt.business_name}
                        </span>
                      )}
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white text-black font-bold">
                        {apt.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-white" />
                        {new Date(apt.scheduled_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-mono text-zinc-400">
                        Duration: {apt.duration_minutes || 60}m
                      </span>
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-zinc-400 mt-2 italic bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    disabled={cancellingId === apt.id}
                    onClick={() => onCancelAppointment(apt.id)}
                    className="px-3.5 py-2 border border-zinc-800 hover:border-white text-zinc-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {cancellingId === apt.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    <span>Cancel Slot</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsView;
