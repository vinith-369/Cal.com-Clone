import { useState, useEffect, useCallback } from "react";
import { bookingsApi } from "../../api/client";
import "../../components/shared.css";
import "./Bookings.css";

const TABS = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
];

export default function Bookings() {
    const [tab, setTab] = useState("upcoming");
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const [view, setView] = useState("list");
    const [calendarDate, setCalendarDate] = useState(new Date());

    const loadBookings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await bookingsApi.list(tab);
            setBookings(data);
        } catch (err) {
            showToast("Failed to load bookings");
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Cancel this booking?")) return;
        try {
            await bookingsApi.cancel(id);
            showToast("Booking cancelled");
            loadBookings();
        } catch (err) {
            showToast(err.message || "Failed to cancel");
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return { month: d.toLocaleString("en", { month: "short" }), day: d.getDate() };
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const formatFullDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    const weekStart = new Date(calendarDate);
    weekStart.setDate(calendarDate.getDate() - calendarDate.getDay());
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });

    const getWeekBookings = () => {
        return bookings.filter(b => {
            const d = new Date(b.start_time);
            const endOfWeek = new Date(weekDays[6]);
            endOfWeek.setHours(23, 59, 59, 999);
            return d >= weekDays[0] && d <= endOfWeek;
        });
    };

    const getEventStyles = (booking) => {
        const d = new Date(booking.start_time);
        const dayIndex = d.getDay();
        const startHour = d.getHours() + d.getMinutes() / 60;
        
        const top = startHour * 60;
        const durationMins = booking.event_duration || 30;
        const height = (durationMins / 60) * 60;
        
        const left = `calc(60px + ${dayIndex} * ((100% - 60px) / 7))`;
        const width = `calc((100% - 60px) / 7 - 10px)`;
        
        return {
            top: `${top}px`,
            left,
            width,
            height: `${Math.max(20, height)}px`
        };
    };

    const formatDateRange = () => {
        return `${weekDays[0].toLocaleString('en', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleString('en', { day: 'numeric', year: 'numeric' })}`;
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: "40px" }}>
            <div className="page-header" style={{ marginBottom: "24px" }}>
                <div>
                    <h1 className="page-header__title">Bookings</h1>
                    <p className="page-header__subtitle">See upcoming and past events booked through your event type links.</p>
                </div>
            </div>

            {view === "calendar" ? (
                <div className="bookings-controls">
                    <div className="calendar-header-controls">
                        <label style={{ position: "relative", padding: "4px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 500, marginRight: "16px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            {formatDateRange()}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <input 
                                type="date" 
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                                value={calendarDate.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setCalendarDate(new Date(e.target.value));
                                    }
                                }}
                            />
                        </label>
                    </div>
                    
                    <div className="calendar-header-controls">
                        <button className="calendar-today-btn" onClick={() => setCalendarDate(new Date())}>Today</button>
                        <div style={{ display: "flex", gap: "4px" }}>
                            <button className="calendar-nav-btn" onClick={() => {
                                const d = new Date(calendarDate);
                                d.setDate(d.getDate() - 7);
                                setCalendarDate(d);
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <button className="calendar-nav-btn" onClick={() => {
                                const d = new Date(calendarDate);
                                d.setDate(d.getDate() + 7);
                                setCalendarDate(d);
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                        
                        <div className="view-toggles" style={{ marginLeft: "16px" }}>
                            <button className={`view-toggle-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            </button>
                            <button className={`view-toggle-btn ${view === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bookings-controls" style={{ marginBottom: 0 }}>
                    <div className="bookings-tabs" style={{ marginBottom: 0, border: "none" }}>
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                className={`bookings-tab ${tab === t.key ? "bookings-tab--active" : ""}`}
                                onClick={() => setTab(t.key)}
                                id={`tab-${t.key}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="calendar-header-controls">
                        <button className="btn btn--secondary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", padding: "6px 12px", background: "var(--color-bg-primary)" }} onClick={() => alert("Filter dropdown goes here")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                            Filter
                        </button>
                        <div className="view-toggles" style={{ marginLeft: "16px" }}>
                            <button className={`view-toggle-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            </button>
                            <button className={`view-toggle-btn ${view === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {view === "list" && <div style={{ borderBottom: "1px solid var(--color-border)", marginBottom: "24px", marginTop: "12px" }} />}

            {loading ? (
                <div className="spinner" style={{ margin: "40px auto" }}><div className="spinner__circle" /></div>
            ) : view === "calendar" ? (
                <div className="calendar-grid">
                    <div className="calendar-grid-header">
                        <div className="calendar-grid-header-cell tz">GMT +5.5</div>
                        {weekDays.map(d => (
                            <div key={d.toISOString()} className="calendar-grid-header-cell">
                                {d.toLocaleString('en', { weekday: 'short' })} {String(d.getDate()).padStart(2, '0')}
                            </div>
                        ))}
                    </div>
                    <div className="calendar-grid-body">
                        {Array.from({ length: 24 }).map((_, h) => (
                            <div className="calendar-grid-row" key={h}>
                                <div className="calendar-time-label">{String(h).padStart(2, '0')}:00</div>
                                {weekDays.map(d => (
                                    <div className="calendar-cell" key={d.toISOString() + h}></div>
                                ))}
                            </div>
                        ))}
                        
                        {getWeekBookings().map(b => (
                            <div key={b.id} className="calendar-event" style={getEventStyles(b)} title={`${b.event_title} (${formatTime(b.start_time)})`}>
                                <div style={{ fontWeight: 600 }}>{b.event_title || "Meeting"}</div>
                                <div style={{ opacity: 0.8 }}>{b.booker_name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : bookings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <h3 className="empty-state__title">No {tab} bookings</h3>
                    <p className="empty-state__text">
                        {tab === "upcoming" ? "You don't have any upcoming bookings." :
                            tab === "past" ? "You don't have any past bookings." :
                                "You don't have any cancelled bookings."}
                    </p>
                </div>
            ) : (
                <div>
                    {bookings.map((b, index) => {
                        const { month, day } = formatDate(b.start_time);
                        return (
                            <div key={b.id} className="booking-card" style={{ animationDelay: `${index * 60}ms` }}>
                                <div className="booking-card__date-badge">
                                    <span className="booking-card__date-month">{month}</span>
                                    <span className="booking-card__date-day">{day}</span>
                                </div>
                                <div className="booking-card__info">
                                    <div className="booking-card__title">{b.event_title || "Meeting"}</div>
                                    <div className="booking-card__details">
                                        <span className="booking-card__detail">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            {formatTime(b.start_time)} – {formatTime(b.end_time)} • {b.event_duration || 30}m
                                        </span>
                                        <span className="booking-card__detail">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                            {b.booker_name} ({b.booker_email})
                                        </span>
                                        <span className="booking-card__detail">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                            {formatFullDate(b.start_time)}
                                        </span>
                                    </div>
                                </div>
                                <div className="booking-card__actions">
                                    <span className={`booking-card__status booking-card__status--${b.status}`}>
                                        {b.status}
                                    </span>
                                    {b.status === "confirmed" && tab === "upcoming" && (
                                        <>
                                            <button className="btn btn--secondary btn--sm" onClick={() => window.location.href = `/booking/${b.id}/reschedule`} id={`reschedule-${b.id}`}>
                                                Reschedule
                                            </button>
                                            <button className="btn btn--danger btn--sm" onClick={() => handleCancel(b.id)} id={`cancel-${b.id}`}>
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
