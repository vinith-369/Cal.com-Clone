import { useSearchParams, useNavigate } from "react-router-dom";
import "../PublicBooking/PublicBooking.css";

export default function BookingConfirmation() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const isReschedule = params.get("reschedule") === "true";
    const eventTitle = params.get("event") || "Meeting";
    const startTime = params.get("time");
    const endTime = params.get("end");

    const formatDateTime = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleString("en", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
    };

    const formatTimeOnly = (iso) => {
        if (!iso) return "";
        return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    return (
        <div className="confirmation-page">
            <div className="confirmation-card">
                <div className="confirmation-card__icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <h1 className="confirmation-card__title">
                    {isReschedule ? "Booking Rescheduled" : "Booking Confirmed"}
                </h1>
                <p className="confirmation-card__subtitle">
                    {isReschedule
                        ? "Your booking has been successfully rescheduled."
                        : "You are scheduled. A confirmation email has been sent."}
                </p>

                <div className="confirmation-card__details">
                    <div className="confirmation-card__detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span><strong>{eventTitle}</strong></span>
                    </div>
                    {startTime && (
                        <div className="confirmation-card__detail">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>{formatDateTime(startTime)}</span>
                        </div>
                    )}
                    {endTime && (
                        <div className="confirmation-card__detail">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{formatTimeOnly(startTime)} – {formatTimeOnly(endTime)}</span>
                        </div>
                    )}
                </div>

                {/* Simulated Email Notification */}
                <div style={{
                    marginTop: "var(--space-6)",
                    padding: "var(--space-4)",
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "left",
                    fontSize: "var(--font-size-sm)",
                    marginBottom: "var(--space-6)"
                }}>
                    <div style={{ fontWeight: 600, marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>
                        📧 Simulated Email Notification
                    </div>
                    <div style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", color: "var(--color-text-primary)" }}>
                        Subject: Booking {isReschedule ? "Rescheduled" : "Confirmed"}: {eventTitle}
                        {"\n\n"}
                        Hi there,
                        {"\n\n"}
                        Your booking has been successfully {isReschedule ? "rescheduled" : "confirmed"}.
                        {"\n\n"}
                        Event: {eventTitle}
                        {"\n"}
                        Date: {formatDateTime(startTime)}
                        {"\n\n"}
                        To reschedule or cancel, use the booking management page.
                    </div>
                </div>

                <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
                    <button className="btn btn--secondary" onClick={() => navigate("/event-types")}>
                        Back to Dashboard
                    </button>
                    <button className="btn btn--primary" onClick={() => navigate("/bookings")}>
                        View Bookings
                    </button>
                </div>
            </div>
        </div>
    );
}
