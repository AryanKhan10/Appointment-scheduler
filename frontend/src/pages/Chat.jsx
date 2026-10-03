import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../api';

import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import AppointmentsView from '../components/AppointmentsView';
import OccupiedSlotsView from '../components/OccupiedSlotsView';
import BookingModal from '../components/BookingModal';

const DEFAULT_SERVICES = [
  { name: 'General Consultation', duration: 45, desc: 'Initial health or advisory session' }
];

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [socket, setSocket] = useState(null);
  
  // Multi-Tenancy: Businesses
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false);

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'appointments' | 'calendar'
  
  // Appointments state
  const [appointments, setAppointments] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusNotice, setStatusNotice] = useState(null);

  // Manual Booking Modal & Live Availability Check
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    service_name: '',
    date: '',
    time: '',
    duration_minutes: 30,
    notes: ''
  });
  const [availabilityState, setAvailabilityState] = useState({
    checking: false,
    checked: false,
    available: null,
    message: ''
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Load Businesses Directory
  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await api.get('/businesses');
      if (res.data && res.data.length > 0) {
        setBusinesses(res.data);
        setSelectedBusiness(prev => prev || res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    }
  }, []);

  // Load customer's appointments
  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  // Load booked slots scoped by selected business
  const fetchBookedSlots = useCallback(async (businessId) => {
    try {
      const params = businessId ? { business_id: businessId } : {};
      const res = await api.get('/appointments/booked', { params });
      setBookedSlots(res.data || []);
    } catch (err) {
      console.error('Failed to fetch booked slots:', err);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchBusinesses();
    fetchAppointments();
  }, [token, navigate, fetchBusinesses, fetchAppointments]);

  // When selected business changes, refresh slots, form defaults, and session
  useEffect(() => {
    if (selectedBusiness) {
      fetchBookedSlots(selectedBusiness.id);
      const firstService = selectedBusiness.services?.[0] || DEFAULT_SERVICES[0];
      setModalForm(prev => ({
        ...prev,
        service_name: firstService.name,
        duration_minutes: firstService.duration || 30
      }));
      setSessionId(null);
      setMessages([]);
    }
  }, [selectedBusiness, fetchBookedSlots]);

  // Handle appointment cancellation
  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.filter(a => a.id !== id));
      if (selectedBusiness) fetchBookedSlots(selectedBusiness.id);
      setStatusNotice({ type: 'success', text: 'Appointment cancelled successfully.' });
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err) {
      setStatusNotice({ type: 'error', text: err.response?.data?.error || 'Failed to cancel appointment.' });
    } finally {
      setCancellingId(null);
    }
  };

  // Live Availability Check when date/time changes in booking form
  useEffect(() => {
    if (!modalForm.date || !modalForm.time) {
      setAvailabilityState({ checking: false, checked: false, available: null, message: '' });
      return;
    }

    const timer = setTimeout(async () => {
      setAvailabilityState({ checking: true, checked: false, available: null, message: '' });
      const scheduledAt = `${modalForm.date}T${modalForm.time}:00`;

      try {
        const res = await api.get('/appointments/check', {
          params: { 
            date: scheduledAt, 
            duration: modalForm.duration_minutes,
            business_id: selectedBusiness?.id 
          }
        });

        if (res.data.available) {
          setAvailabilityState({
            checking: false,
            checked: true,
            available: true,
            message: `This slot is open at ${selectedBusiness?.name || 'this business'}!`
          });
        } else {
          setAvailabilityState({
            checking: false,
            checked: true,
            available: false,
            message: res.data.message || 'This date is already booked. Please select another date.'
          });
        }
      } catch (err) {
        setAvailabilityState({
          checking: false,
          checked: true,
          available: false,
          message: 'Error verifying date availability. Please try another slot.'
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [modalForm.date, modalForm.time, modalForm.duration_minutes, selectedBusiness]);

  // Handle Manual Booking Submit
  const handleModalBookingSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.date || !modalForm.time) return;

    if (availabilityState.available === false) {
      alert('This date is already booked! Please select another date or time slot.');
      return;
    }

    setSubmittingBooking(true);
    const scheduledAt = `${modalForm.date}T${modalForm.time}:00`;

    try {
      const res = await api.post('/appointments', {
        service_name: modalForm.service_name,
        scheduled_at: scheduledAt,
        duration_minutes: modalForm.duration_minutes,
        notes: modalForm.notes,
        business_id: selectedBusiness?.id,
        chat_session_id: sessionId
      });

      setAppointments(prev => [res.data, ...prev]);
      if (selectedBusiness) fetchBookedSlots(selectedBusiness.id);
      setIsBookingModalOpen(false);

      setMessages(prev => [...prev, {
        role: 'system',
        isConfirmed: true,
        content: `Appointment Confirmed: ${modalForm.service_name} at ${selectedBusiness?.name || 'our clinic'} on ${new Date(scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`,
        timestamp: new Date().toISOString()
      }]);

      setStatusNotice({ type: 'success', text: 'Appointment booked successfully!' });
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err) {
      if (err.response?.status === 409) {
        setAvailabilityState({
          checking: false,
          checked: true,
          available: false,
          message: err.response.data.error || 'This date is already booked. Please select another date.'
        });
      } else {
        alert(err.response?.data?.error || 'Failed to book appointment');
      }
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Socket connection
  useEffect(() => {
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('newMessage', (data) => {
      if (data.session_id) setSessionId(data.session_id);
      
      setMessages(prev => {
        const msgExists = prev.some(m => m.timestamp === data.message.timestamp && m.content === data.message.content);
        if (!msgExists) {
          return [...prev, data.message];
        }
        return prev;
      });
      
      if (data.message.role === 'assistant') {
        setIsTyping(false);
      }
      
      if (data.command && data.command.action === 'BOOK_APPOINTMENT') {
        handleAppointmentBooking(data.command);
      }
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
      setIsTyping(false);
      setIsBookingInProgress(false);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isBookingInProgress]);

  // AI-Triggered Appointment Booking
  const handleAppointmentBooking = async (command) => {
    setIsBookingInProgress(true);
    try {
      const res = await api.post('/appointments', {
        service_name: command.service_name,
        scheduled_at: command.scheduled_at,
        business_id: command.business_id || selectedBusiness?.id,
        chat_session_id: sessionId
      });

      setAppointments(prev => [res.data, ...prev]);
      if (selectedBusiness) fetchBookedSlots(selectedBusiness.id);

      const formattedDate = new Date(command.scheduled_at).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      setMessages(prev => [...prev, {
        role: 'system',
        isConfirmed: true,
        content: `Appointment Confirmed: ${command.service_name} at ${command.business_name || selectedBusiness?.name || 'our clinic'} on ${formattedDate}`,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error("Booking error:", err);
      const isBooked = err.response?.status === 409;
      const formattedDate = new Date(command.scheduled_at).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      setMessages(prev => [...prev, {
        role: 'system',
        isError: true,
        content: isBooked 
          ? `Booking Failed: That date and time (${formattedDate}) is already booked for this business! Please select another date.`
          : (err.response?.data?.error || 'Unable to book appointment at this time.'),
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsBookingInProgress(false);
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim() || !socket || isTyping) return;

    const messageContent = input.trim();
    
    // User local timezone offset e.g. "+05:00"
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0');
    const tz_offset = `${sign}${pad(offsetMinutes / 60)}:${pad(offsetMinutes % 60)}`;

    socket.emit('sendMessage', {
      session_id: sessionId,
      message: messageContent,
      tz_offset: tz_offset,
      business_id: selectedBusiness?.id
    }, (response) => {
      if (response && response.session_id) setSessionId(response.session_id);
    });
    
    setInput('');
    setIsTyping(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white select-none">
      {/* SIDEBAR COMPONENT */}
      <Sidebar 
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onSelectBusiness={setSelectedBusiness}
        isBusinessDropdownOpen={isBusinessDropdownOpen}
        setIsBusinessDropdownOpen={setIsBusinessDropdownOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        messagesCount={messages.length}
        appointments={appointments}
        bookedSlotsCount={bookedSlots.length}
        loadingAppointments={loadingAppointments}
        onRefreshAppointments={fetchAppointments}
        onOpenBookingModal={() => setIsBookingModalOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-black relative overflow-hidden">
        {/* Status notice toast */}
        {statusNotice && (
          <div className={`p-3 text-xs font-medium flex items-center justify-center gap-2 transition-all ${
            statusNotice.type === 'success' 
              ? 'bg-zinc-900 border-b border-white/20 text-white' 
              : 'bg-zinc-900 border-b border-zinc-700 text-zinc-300'
          }`}>
            {statusNotice.type === 'success' ? <CheckCircle2 size={15} className="text-white" /> : <AlertTriangle size={15} className="text-white" />}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {/* TAB 1: AI CHAT VIEW */}
        {activeTab === 'chat' && (
          <ChatView 
            selectedBusiness={selectedBusiness}
            messages={messages}
            input={input}
            setInput={setInput}
            isTyping={isTyping}
            isBookingInProgress={isBookingInProgress}
            onSendMessage={handleSendMessage}
            onOpenBookingModal={() => setIsBookingModalOpen(true)}
            onQuickPrompt={(prompt) => setInput(prompt)}
            messagesEndRef={messagesEndRef}
          />
        )}

        {/* TAB 2: MY APPOINTMENTS VIEW */}
        {activeTab === 'appointments' && (
          <AppointmentsView 
            appointments={appointments}
            loadingAppointments={loadingAppointments}
            cancellingId={cancellingId}
            onCancelAppointment={handleCancelAppointment}
            onOpenBookingModal={() => setIsBookingModalOpen(true)}
            onSwitchToChat={() => setActiveTab('chat')}
          />
        )}

        {/* TAB 3: BOOKED / OCCUPIED SLOTS VIEW */}
        {activeTab === 'calendar' && (
          <OccupiedSlotsView 
            selectedBusiness={selectedBusiness}
            bookedSlots={bookedSlots}
            onRefreshBookedSlots={() => selectedBusiness && fetchBookedSlots(selectedBusiness.id)}
          />
        )}
      </main>

      {/* DIRECT BOOKING MODAL COMPONENT */}
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedBusiness={selectedBusiness}
        modalForm={modalForm}
        setModalForm={setModalForm}
        availabilityState={availabilityState}
        submittingBooking={submittingBooking}
        onSubmitBooking={handleModalBookingSubmit}
      />
    </div>
  );
};

export default Chat;
