import React from 'react';
import { X, Loader2, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

const BookingModal = ({
  isOpen,
  onClose,
  selectedBusiness,
  modalForm,
  setModalForm,
  availabilityState,
  submittingBooking,
  onSubmitBooking
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs">
              ◆
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                Book Appointment at {selectedBusiness?.name || 'Clinic'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Slot availability is checked specifically for {selectedBusiness?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmitBooking} className="p-6 flex flex-col gap-4">
          {/* Service Selection */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-zinc-400 mb-2">
              Select {selectedBusiness?.name} Service
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(selectedBusiness?.services || []).map(srv => (
                <button
                  key={srv.name}
                  type="button"
                  onClick={() => setModalForm({
                    ...modalForm,
                    service_name: srv.name,
                    duration_minutes: srv.duration
                  })}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    modalForm.service_name === srv.name
                      ? 'bg-white text-black border-white font-bold shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-white/30'
                  }`}
                >
                  <div className="font-semibold">{srv.name}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${modalForm.service_name === srv.name ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    {srv.duration} mins • {srv.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-zinc-400 mb-1.5">
                Appointment Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={modalForm.date}
                onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-zinc-400 mb-1.5">
                Preferred Time
              </label>
              <input
                type="time"
                required
                value={modalForm.time}
                onChange={(e) => setModalForm({ ...modalForm, time: e.target.value })}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
          </div>

          {/* REAL-TIME AVAILABILITY VERIFICATION BADGE */}
          <div className="min-h-[46px] flex items-center">
            {availabilityState.checking ? (
              <div className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl flex items-center gap-2.5 text-xs text-zinc-300 animate-fade-in">
                <Loader2 size={15} className="animate-spin text-white" />
                <span>Checking availability at {selectedBusiness?.name}...</span>
              </div>
            ) : availabilityState.checked && availabilityState.available === false ? (
              <div className="w-full p-3 bg-zinc-900 border border-white/30 rounded-xl flex items-start gap-2.5 text-xs text-white animate-slide-up">
                <AlertTriangle size={16} className="text-white shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Date Already Booked!</strong>
                  <span className="text-[11px] text-zinc-300">
                    {availabilityState.message || `This slot is already booked at ${selectedBusiness?.name}. Please pick another date.`}
                  </span>
                </div>
              </div>
            ) : availabilityState.checked && availabilityState.available === true ? (
              <div className="w-full p-2.5 bg-zinc-900 border border-white/20 rounded-xl flex items-center gap-2 text-xs text-white animate-fade-in">
                <CheckCircle2 size={16} className="text-white shrink-0" />
                <span className="font-medium">Slot is available! You can proceed to confirm.</span>
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400 font-mono">
                Select a date and time above to verify instant availability.
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-zinc-400 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={modalForm.notes}
              onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
              placeholder="Any specific requests or symptoms..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingBooking || availabilityState.checking || availabilityState.available === false || !modalForm.date || !modalForm.time}
              className="px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              {submittingBooking ? (
                <>
                  <Loader2 size={14} className="animate-spin text-black" />
                  <span>Securing Booking...</span>
                </>
              ) : availabilityState.available === false ? (
                <span>Select Other Date</span>
              ) : (
                <>
                  <span>Confirm at {selectedBusiness?.name?.split(' ')[0] || 'Clinic'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
