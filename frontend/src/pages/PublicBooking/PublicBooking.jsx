import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { eventTypesApi, bookingsApi } from "../../api/client";
import "../../components/shared.css";
import "./PublicBooking.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PublicBooking() {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const rescheduleId = searchParams.get("reschedule");
    const navigate = useNavigate();

    const [eventType, setEventType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [bookingForm, setBookingForm] = useState({ name: "vinith", email: "vinithlankireddy@gmail.com", custom_responses: {} });
    const [error, setError] = useState(null);
    const [availableDates, setAvailableDates] = useState(new Set());

    useEffect(() => {
        async function load() {
            try {
                const data = await eventTypesApi.getBySlug(slug);
                setEventType(data);
            } catch { setError("Event type not found"); }
            finally { setLoading(false); }
        }
        load();
    }, [slug]);

    // Fetch which dates have availability for the current month
    useEffect(() => {
        if (!eventType) return;
        async function loadMonthAvailability() {
            try {
                const year = currentMonth.getFullYear();
                const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
                const monthStr = `${year}-${month}`;
                const dates = await bookingsApi.getMonthAvailability(slug, monthStr);
                setAvailableDates(new Set(dates));
            } catch { setAvailableDates(new Set()); }
        }
        loadMonthAvailability();
    }, [currentMonth, slug, eventType]);

    useEffect(() => {
        if (!selectedDate) return;
        async function loadSlots() {
            setSlotsLoading(true);
            try {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const data = await bookingsApi.getSlots(slug, dateStr, rescheduleId);
                setSlots(data);
            } catch { setSlots([]); }
            finally { setSlotsLoading(false); }
        }
        loadSlots();
    }, [selectedDate, slug, rescheduleId]);

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPad = firstDay.getDay();
        const days = [];
        for (let i = 0; i < startPad; i++) days.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
        return days;
    }, [currentMonth]);

    const isToday = (d) => {
        if (!d) return false;
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    };

    const isPast = (d) => {
        if (!d) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d < today;
    };

    const isAvailable = (d) => {
        if (!d) return false;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return availableDates.has(`${year}-${month}-${day}`);
    };

    const isSelected = (d) => {
        if (!d || !selectedDate) return false;
        return d.toDateString() === selectedDate.toDateString();
    };

    const formatTime = (isoStr) => {
        return new Date(isoStr).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const handleSelectSlot = (slot) => {
        setSelectedSlot(slot);
        setShowForm(true);
    };

    const handleSubmitBooking = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (rescheduleId) {
                await bookingsApi.reschedule(rescheduleId, {
                    start_time: selectedSlot.start,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                });
                navigate(`/booking/confirmed?reschedule=true&event=${encodeURIComponent(eventType.title)}&time=${encodeURIComponent(selectedSlot.start)}`);
            } else {
                const result = await bookingsApi.create({
                    event_type_id: eventType.id,
                    booker_name: bookingForm.name,
                    booker_email: bookingForm.email,
                    start_time: selectedSlot.start,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    custom_responses: bookingForm.custom_responses,
                });
                navigate(`/booking/confirmed?id=${result.id}&event=${encodeURIComponent(eventType.title)}&time=${encodeURIComponent(selectedSlot.start)}&end=${encodeURIComponent(selectedSlot.end)}`);
            }
        } catch (err) {
            setError(err.message || "Booking failed");
            setSubmitting(false);
        }
    };

    if (loading) return <div className="booking-page"><div className="spinner"><div className="spinner__circle" /></div></div>;
    if (error && !eventType) return (
        <div className="booking-page">
            <div className="confirmation-card" style={{ maxWidth: "400px" }}>
                <h2 style={{ marginBottom: "var(--space-4)" }}>Event Not Found</h2>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>{error}</p>
                <button className="btn btn--primary" onClick={() => navigate("/")}>Go Home</button>
            </div>
        </div>
    );

    return (
        <div className="booking-page">
            <div className="booking-container">
                {/* Left: Event Info */}
                <div className="booking-container__sidebar">
                    <div style={{ fontWeight: 500, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
                        Default User
                    </div>
                    <div className="booking-container__event-title">{eventType.title}</div>
                    <div className="booking-container__event-duration">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        {eventType.duration_minutes} min
                    </div>
                    {eventType.description && (
                        <div className="booking-container__event-description">{eventType.description}</div>
                    )}

                    {eventType.is_recurring && !rescheduleId && (
                        <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)", color: "var(--color-primary-dark)", borderLeft: "4px solid var(--color-primary)" }}>
                            <strong>↻ Recurring Event</strong><br />
                            By booking this, you are scheduling <strong>{eventType.recurring_count}</strong> {eventType.recurring_interval} sessions.
                        </div>
                    )}

                    {rescheduleId && (
                        <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "#fffbeb", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)", color: "#92400e" }}>
                            ✏️ Rescheduling booking #{rescheduleId}
                        </div>
                    )}
                </div>

                {/* Right: Calendar + Slots + Form */}
                <div className="booking-container__main">
                    {!showForm ? (
                        <div className="booking-content-layout">
                            {/* Calendar */}
                            <div className="calendar">
                                <div className="calendar__header">
                                    <button className="calendar__nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>
                                    <span className="calendar__month-label">
                                        {currentMonth.toLocaleString("en", { month: "long", year: "numeric" })}
                                    </span>
                                    <button className="calendar__nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                                <div className="calendar__weekdays">
                                    {WEEKDAYS.map((d) => <div key={d} className="calendar__weekday">{d}</div>)}
                                </div>
                                <div className="calendar__days">
                                    {calendarDays.map((day, i) => (
                                        <button
                                            key={i}
                                            className={`calendar__day ${!day ? "calendar__day--other-month" : ""} ${day && isToday(day) ? "calendar__day--today" : ""} ${day && isSelected(day) ? "calendar__day--selected" : ""} ${day && isPast(day) ? "calendar__day--disabled" : ""} ${day && !isPast(day) && isAvailable(day) && !isSelected(day) ? "calendar__day--available" : ""}`}
                                            onClick={() => day && !isPast(day) && setSelectedDate(day)}
                                            disabled={!day || isPast(day)}
                                        >
                                            {day?.getDate()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Slots */}
                            {selectedDate && (
                                <div className="time-slots-panel">
                                    <div className="time-slots__date-label">
                                        {selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
                                    </div>
                                    {slotsLoading ? (
                                        <div className="spinner" style={{ padding: "var(--space-8)" }}><div className="spinner__circle" /></div>
                                    ) : slots.length === 0 ? (
                                        <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", padding: "var(--space-8)", textAlign: "center" }}>
                                            No available slots for this date
                                        </div>
                                    ) : (
                                        <div className="time-slots-grid">
                                            {slots.map((slot, i) => (
                                                <button
                                                    key={i}
                                                    className={`time-slot-btn ${selectedSlot?.start === slot.start ? "time-slot-btn--selected" : ""}`}
                                                    onClick={() => handleSelectSlot(slot)}
                                                >
                                                    {formatTime(slot.start)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Booking Form
                        <div className="booking-form animate-fade-in">
                            <div className="booking-form__selected">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                {selectedDate?.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })} at {formatTime(selectedSlot.start)}
                                <button className="btn btn--ghost btn--sm" onClick={() => { setShowForm(false); setSelectedSlot(null); }} style={{ marginLeft: "auto" }}>Change</button>
                            </div>

                            {error && <div style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-4)" }}>{error}</div>}

                            {!rescheduleId && (
                                <form onSubmit={handleSubmitBooking}>
                                    <div className="form-group">
                                        <label>Your Name *</label>
                                        <input
                                            className="form-input"
                                            value={bookingForm.name}
                                            onChange={(e) => setBookingForm((p) => ({ ...p, name: e.target.value }))}
                                            placeholder="John Doe"
                                            required
                                            id="booker-name-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={bookingForm.email}
                                            onChange={(e) => setBookingForm((p) => ({ ...p, email: e.target.value }))}
                                            placeholder="john@example.com"
                                            required
                                            id="booker-email-input"
                                        />
                                    </div>

                                    <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                                        <button type="button" className="btn btn--secondary" onClick={() => { setShowForm(false); setSelectedSlot(null); }}>Back</button>
                                        <button type="submit" className="btn btn--primary" disabled={submitting} id="confirm-booking-btn">
                                            {submitting ? "Booking..." : "Confirm Booking"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {rescheduleId && (
                                <div>
                                    <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
                                        Your booking will be rescheduled to the selected time.
                                    </p>
                                    <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                                        <button className="btn btn--secondary" onClick={() => { setShowForm(false); setSelectedSlot(null); }}>Back</button>
                                        <button className="btn btn--primary" onClick={handleSubmitBooking} disabled={submitting}>
                                            {submitting ? "Rescheduling..." : "Confirm Reschedule"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}







// import { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// import { eventTypesApi, bookingsApi } from "../../api/client";
// import "../../components/shared.css";
// import "./PublicBooking.css";

// const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// export default function PublicBooking() {
//     const { slug } = useParams();
//     const [searchParams] = useSearchParams();
//     const rescheduleId = searchParams.get("reschedule");
//     const navigate = useNavigate();

//     const [eventType, setEventType] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [currentMonth, setCurrentMonth] = useState(new Date());
//     const [selectedDate, setSelectedDate] = useState(null);
//     const [slots, setSlots] = useState([]);
//     const [slotsLoading, setSlotsLoading] = useState(false);
//     const [selectedSlot, setSelectedSlot] = useState(null);
//     const [showForm, setShowForm] = useState(false);
//     const [submitting, setSubmitting] = useState(false);
//     const [bookingForm, setBookingForm] = useState({ name: "vinith", email: "vinithlankireddy@gmail.com", custom_responses: {} });
//     const [error, setError] = useState(null);
//     const [availableDates, setAvailableDates] = useState(new Set());

//     useEffect(() => {
//         async function load() {
//             try {
//                 const data = await eventTypesApi.getBySlug(slug);
//                 setEventType(data);
//             } catch { setError("Event type not found"); }
//             finally { setLoading(false); }
//         }
//         load();
//     }, [slug]);

//     // Fetch which dates have availability for the current month
//     useEffect(() => {
//         if (!eventType) return;
//         async function loadMonthAvailability() {
//             try {
//                 const year = currentMonth.getFullYear();
//                 const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
//                 const monthStr = `${year}-${month}`;
//                 const dates = await bookingsApi.getMonthAvailability(slug, monthStr);
//                 setAvailableDates(new Set(dates));
//             } catch { setAvailableDates(new Set()); }
//         }
//         loadMonthAvailability();
//     }, [currentMonth, slug, eventType]);

//     useEffect(() => {
//         if (!selectedDate) return;
//         async function loadSlots() {
//             setSlotsLoading(true);
//             try {
//                 const year = selectedDate.getFullYear();
//                 const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
//                 const day = String(selectedDate.getDate()).padStart(2, '0');
//                 const dateStr = `${year}-${month}-${day}`;
//                 const data = await bookingsApi.getSlots(slug, dateStr, rescheduleId);
//                 setSlots(data);
//             } catch { setSlots([]); }
//             finally { setSlotsLoading(false); }
//         }
//         loadSlots();
//     }, [selectedDate, slug, rescheduleId]);

//     const calendarDays = useMemo(() => {
//         const year = currentMonth.getFullYear();
//         const month = currentMonth.getMonth();
//         const firstDay = new Date(year, month, 1);
//         const lastDay = new Date(year, month + 1, 0);
//         const startPad = firstDay.getDay();
//         const days = [];
//         for (let i = 0; i < startPad; i++) days.push(null);
//         for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
//         return days;
//     }, [currentMonth]);

//     const isToday = (d) => {
//         if (!d) return false;
//         const today = new Date();
//         return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
//     };

//     const isPast = (d) => {
//         if (!d) return false;
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         return d < today;
//     };

//     const isAvailable = (d) => {
//         if (!d) return false;
//         const year = d.getFullYear();
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         return availableDates.has(`${year}-${month}-${day}`);
//     };

//     const isSelected = (d) => {
//         if (!d || !selectedDate) return false;
//         return d.toDateString() === selectedDate.toDateString();
//     };

//     const formatTime = (isoStr) => {
//         return new Date(isoStr).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
//     };

//     const handleSelectSlot = (slot) => {
//         setSelectedSlot(slot);
//         setShowForm(true);
//     };

//     const handleSubmitBooking = async (e) => {
//         e.preventDefault();
//         setSubmitting(true);
//         try {
//             if (rescheduleId) {
//                 await bookingsApi.reschedule(rescheduleId, {
//                     start_time: selectedSlot.start,
//                     timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//                 });
//                 navigate(`/booking/confirmed?reschedule=true&event=${encodeURIComponent(eventType.title)}&time=${encodeURIComponent(selectedSlot.start)}`);
//             } else {
//                 const result = await bookingsApi.create({
//                     event_type_id: eventType.id,
//                     booker_name: bookingForm.name,
//                     booker_email: bookingForm.email,
//                     start_time: selectedSlot.start,
//                     timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//                     custom_responses: bookingForm.custom_responses,
//                 });
//                 navigate(`/booking/confirmed?id=${result.id}&event=${encodeURIComponent(eventType.title)}&time=${encodeURIComponent(selectedSlot.start)}&end=${encodeURIComponent(selectedSlot.end)}`);
//             }
//         } catch (err) {
//             setError(err.message || "Booking failed");
//             setSubmitting(false);
//         }
//     };

//     if (loading) return <div className="booking-page"><div className="spinner"><div className="spinner__circle" /></div></div>;
//     if (error && !eventType) return (
//         <div className="booking-page">
//             <div className="confirmation-card" style={{ maxWidth: "400px" }}>
//                 <h2 style={{ marginBottom: "var(--space-4)" }}>Event Not Found</h2>
//                 <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>{error}</p>
//                 <button className="btn btn--primary" onClick={() => navigate("/")}>Go Home</button>
//             </div>
//         </div>
//     );

//     return (
//         <div className="booking-page">
//             <div className="booking-container">
//                 {/* Left: Event Info */}
//                 <div className="booking-container__sidebar">
//                     <div style={{ fontWeight: 500, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
//                         Default User
//                     </div>
//                     <div className="booking-container__event-title">{eventType.title}</div>
//                     <div className="booking-container__event-duration">
//                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
//                         {eventType.duration_minutes} min
//                     </div>
//                     {eventType.description && (
//                         <div className="booking-container__event-description">{eventType.description}</div>
//                     )}

//                     {eventType.is_recurring && !rescheduleId && (
//                         <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)", color: "var(--color-primary-dark)", borderLeft: "4px solid var(--color-primary)" }}>
//                             <strong>↻ Recurring Event</strong><br />
//                             By booking this, you are scheduling <strong>{eventType.recurring_count}</strong> {eventType.recurring_interval} sessions.
//                         </div>
//                     )}

//                     {rescheduleId && (
//                         <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "#fffbeb", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)", color: "#92400e" }}>
//                             ✏️ Rescheduling booking #{rescheduleId}
//                         </div>
//                     )}
//                 </div>

//                 {/* Right: Calendar + Slots + Form */}
//                 <div className="booking-container__main">
//                     {!showForm ? (
//                         <div className="booking-content-layout">
//                             {/* Calendar */}
//                             <div className="calendar">
//                                 <div className="calendar__header">
//                                     <button className="calendar__nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
//                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
//                                     </button>
//                                     <span className="calendar__month-label">
//                                         {currentMonth.toLocaleString("en", { month: "long", year: "numeric" })}
//                                     </span>
//                                     <button className="calendar__nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
//                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
//                                     </button>
//                                 </div>
//                                 <div className="calendar__weekdays">
//                                     {WEEKDAYS.map((d) => <div key={d} className="calendar__weekday">{d}</div>)}
//                                 </div>
//                                 <div className="calendar__days">
//                                     {calendarDays.map((day, i) => (
//                                         <button
//                                             key={i}
//                                             className={`calendar__day ${!day ? "calendar__day--other-month" : ""} ${day && isToday(day) ? "calendar__day--today" : ""} ${day && isSelected(day) ? "calendar__day--selected" : ""} ${day && isPast(day) ? "calendar__day--disabled" : ""} ${day && !isPast(day) && isAvailable(day) && !isSelected(day) ? "calendar__day--available" : ""}`}
//                                             onClick={() => day && !isPast(day) && setSelectedDate(day)}
//                                             disabled={!day || isPast(day)}
//                                         >
//                                             {day?.getDate()}
//                                         </button>
//                                     ))}
//                                 </div>
//                             </div>

//                             {/* Time Slots */}
//                             {selectedDate && (
//                                 <div className="time-slots-panel">
//                                     <div className="time-slots__date-label">
//                                         {selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
//                                     </div>
//                                     {slotsLoading ? (
//                                         <div className="spinner" style={{ padding: "var(--space-8)" }}><div className="spinner__circle" /></div>
//                                     ) : slots.length === 0 ? (
//                                         <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", padding: "var(--space-8)", textAlign: "center" }}>
//                                             No available slots for this date
//                                         </div>
//                                     ) : (
//                                         <div className="time-slots-grid">
//                                             {slots.map((slot, i) => (
//                                                 <button
//                                                     key={i}
//                                                     className={`time-slot-btn ${selectedSlot?.start === slot.start ? "time-slot-btn--selected" : ""}`}
//                                                     onClick={() => handleSelectSlot(slot)}
//                                                 >
//                                                     {formatTime(slot.start)}
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </div>
//                             )}
//                         </div>
//                     ) : (
//                         // Booking Form
//                         <div className="booking-form animate-fade-in">
//                             <div className="booking-form__selected">
//                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
//                                 {selectedDate?.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })} at {formatTime(selectedSlot.start)}
//                                 <button className="btn btn--ghost btn--sm" onClick={() => { setShowForm(false); setSelectedSlot(null); }} style={{ marginLeft: "auto" }}>Change</button>
//                             </div>

//                             {error && <div style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-4)" }}>{error}</div>}

//                             {!rescheduleId && (
//                                 <form onSubmit={handleSubmitBooking}>
//                                     <div className="form-group">
//                                         <label>Your Name *</label>
//                                         <input
//                                             className="form-input"
//                                             value={bookingForm.name}
//                                             onChange={(e) => setBookingForm((p) => ({ ...p, name: e.target.value }))}
//                                             placeholder="John Doe"
//                                             required
//                                             id="booker-name-input"
//                                         />
//                                     </div>
//                                     <div className="form-group">
//                                         <label>Email Address *</label>
//                                         <input
//                                             type="email"
//                                             className="form-input"
//                                             value={bookingForm.email}
//                                             onChange={(e) => setBookingForm((p) => ({ ...p, email: e.target.value }))}
//                                             placeholder="john@example.com"
//                                             required
//                                             id="booker-email-input"
//                                         />
//                                     </div>

//                                     {/* Custom Questions */}
//                                     {eventType.custom_questions?.map((q) => (
//                                         <div key={q.id} className="form-group">
//                                             <label>{q.label} {q.required && "*"}</label>
//                                             {q.type === "textarea" ? (
//                                                 <textarea
//                                                     className="form-input form-input--textarea"
//                                                     value={bookingForm.custom_responses[q.label] || ""}
//                                                     onChange={(e) => setBookingForm((p) => ({
//                                                         ...p,
//                                                         custom_responses: { ...p.custom_responses, [q.label]: e.target.value },
//                                                     }))}
//                                                     required={q.required}
//                                                 />
//                                             ) : q.type === "select" ? (
//                                                 <select
//                                                     className="form-input form-select"
//                                                     value={bookingForm.custom_responses[q.label] || ""}
//                                                     onChange={(e) => setBookingForm((p) => ({
//                                                         ...p,
//                                                         custom_responses: { ...p.custom_responses, [q.label]: e.target.value },
//                                                     }))}
//                                                     required={q.required}
//                                                 >
//                                                     <option value="">Select...</option>
//                                                     {q.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
//                                                 </select>
//                                             ) : (
//                                                 <input
//                                                     className="form-input"
//                                                     value={bookingForm.custom_responses[q.label] || ""}
//                                                     onChange={(e) => setBookingForm((p) => ({
//                                                         ...p,
//                                                         custom_responses: { ...p.custom_responses, [q.label]: e.target.value },
//                                                     }))}
//                                                     required={q.required}
//                                                 />
//                                             )}
//                                         </div>
//                                     ))}

//                                     <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
//                                         <button type="button" className="btn btn--secondary" onClick={() => { setShowForm(false); setSelectedSlot(null); }}>Back</button>
//                                         <button type="submit" className="btn btn--primary" disabled={submitting} id="confirm-booking-btn">
//                                             {submitting ? "Booking..." : "Confirm Booking"}
//                                         </button>
//                                     </div>
//                                 </form>
//                             )}

//                             {rescheduleId && (
//                                 <div>
//                                     <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
//                                         Your booking will be rescheduled to the selected time.
//                                     </p>
//                                     <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
//                                         <button className="btn btn--secondary" onClick={() => { setShowForm(false); setSelectedSlot(null); }}>Back</button>
//                                         <button className="btn btn--primary" onClick={handleSubmitBooking} disabled={submitting}>
//                                             {submitting ? "Rescheduling..." : "Confirm Reschedule"}
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
