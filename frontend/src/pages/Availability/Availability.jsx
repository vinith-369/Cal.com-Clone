import { useState, useEffect, useCallback } from "react";
import { availabilityApi } from "../../api/client";
import "../../components/shared.css";
import "./Availability.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_RULES = DAYS.map((_, i) => ({
    day_of_week: i,
    enabled: i < 5,
    start_time: "09:00:00",
    end_time: "17:00:00",
}));

export default function Availability() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({ name: "", timezone: "Asia/Kolkata", is_default: false, rules: [...DEFAULT_RULES] });
    const [overrideForm, setOverrideForm] = useState({ date: "", start_time: "", end_time: "", is_blocked: false });

    const loadSchedules = useCallback(async () => {
        try {
            setLoading(true);
            const data = await availabilityApi.list();
            setSchedules(data);
        } catch { showToast("Failed to load schedules"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadSchedules(); }, [loadSchedules]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const formatTime = (t) => {
        if (!t) return "";
        const [h, m] = t.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        return `${hour % 12 || 12}:${m} ${ampm}`;
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({ name: "", timezone: "Asia/Kolkata", is_default: false, rules: [...DEFAULT_RULES] });
        setShowModal(true);
    };

    const openEdit = (schedule) => {
        setEditingId(schedule.id);
        const rules = DAYS.map((_, i) => {
            const existing = schedule.rules.find((r) => r.day_of_week === i);
            return {
                day_of_week: i,
                enabled: !!existing,
                start_time: existing ? existing.start_time : "09:00:00",
                end_time: existing ? existing.end_time : "17:00:00",
            };
        });
        setForm({ name: schedule.name, timezone: schedule.timezone, is_default: schedule.is_default, rules });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const rules = form.rules
            .filter((r) => r.enabled)
            .map((r) => ({
                day_of_week: r.day_of_week,
                start_time: r.start_time,
                end_time: r.end_time,
            }));
        const payload = { name: form.name, timezone: form.timezone, is_default: form.is_default, rules };
        try {
            if (editingId) { await availabilityApi.update(editingId, payload); showToast("Schedule updated"); }
            else { await availabilityApi.create(payload); showToast("Schedule created"); }
            setShowModal(false);
            loadSchedules();
        } catch (err) { showToast(err.message || "Operation failed"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this schedule?")) return;
        try { await availabilityApi.delete(id); showToast("Schedule deleted"); loadSchedules(); }
        catch { showToast("Failed to delete"); }
    };

    const openOverride = (scheduleId) => {
        setSelectedScheduleId(scheduleId);
        setOverrideForm({ date: "", start_time: "", end_time: "", is_blocked: false });
        setShowOverrideModal(true);
    };

    const handleAddOverride = async (e) => {
        e.preventDefault();
        try {
            const timePayload = overrideForm.is_blocked
                ? { date: overrideForm.date, is_blocked: true }
                : { date: overrideForm.date, start_time: overrideForm.start_time, end_time: overrideForm.end_time, is_blocked: false };
            await availabilityApi.addOverride(selectedScheduleId, timePayload);
            showToast("Override added");
            setShowOverrideModal(false);
            loadSchedules();
        } catch (err) { showToast(err.message || "Failed"); }
    };

    const handleRemoveOverride = async (scheduleId, overrideId) => {
        try { await availabilityApi.removeOverride(scheduleId, overrideId); showToast("Override removed"); loadSchedules(); }
        catch { showToast("Failed"); }
    };

    const updateRule = (index, field, value) => {
        setForm((prev) => {
            const rules = [...prev.rules];
            rules[index] = { ...rules[index], [field]: value };
            return { ...prev, rules };
        });
    };

    if (loading) return <div className="spinner"><div className="spinner__circle" /></div>;

    return (
        <div className="animate-fade-in">
            {!showModal ? (
                <>
                <div className="page-header">
                    <div>
                        <h1 className="page-header__title">Availability</h1>
                        <p className="page-header__subtitle">Configure times when you are available for bookings.</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button className="btn btn--primary" onClick={openCreate} id="new-schedule-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            New
                        </button>
                    </div>
                </div>

            {schedules.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <h3 className="empty-state__title">No schedules yet</h3>
                    <p className="empty-state__text">Create an availability schedule to set your working hours.</p>
                    <button className="btn btn--primary" onClick={openCreate}>Create Schedule</button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {schedules.map((s, idx) => (
                        <div key={s.id} style={{
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            padding: "20px",
                            background: "var(--color-bg-primary)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            cursor: "pointer",
                            animationDelay: `${idx * 50}ms`
                        }} className="animate-fade-in" onClick={() => openEdit(s)}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "15px" }}>{s.name}</span>
                                    {s.is_default && <span style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-primary)", fontSize: "11px", padding: "2px 6px", borderRadius: "4px", fontWeight: 500 }}>Default</span>}
                                </div>
                                <div style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
                                    {s.rules.length > 0 ? `Mon - Fri, ${formatTime(s.rules[0].start_time)} - ${formatTime(s.rules[0].end_time)}` : "No working hours set"}
                                </div>
                                <div style={{ color: "var(--color-text-muted)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                    {s.timezone}
                                </div>
                            </div>
                            <button className="btn btn--ghost btn--icon" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                            </button>
                        </div>
                    ))}
                    <div style={{ textAlign: "center", marginTop: "16px" }}>
                        <a href="#" style={{ color: "var(--color-text-secondary)", fontSize: "14px", textDecoration: "none" }}>Temporarily out-of-office? <span style={{ textDecoration: "underline" }}>Add a redirect</span></a>
                    </div>
                </div>
            )}
            </>
            ) : (
                <form onSubmit={handleSubmit} className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button type="button" className="btn btn--ghost btn--icon" onClick={() => setShowModal(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                        <div>
                            <h1 style={{ fontSize: "20px", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                                {form.name || "Working hours"}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </h1>
                            <div style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                                {form.rules.length > 0 ? `Mon - Fri, 9:00 AM - 5:00 PM` : "No working hours set"}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}>Set as default</span>
                            <label className="toggle" style={{ margin: 0 }}>
                                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))} />
                                <span className="toggle__slider" />
                            </label>
                        </div>
                        <div style={{ width: "1px", height: "24px", background: "var(--color-border)" }} />
                        {!form.is_default && editingId && (
                            <button type="button" className="btn btn--ghost btn--icon" style={{ color: "var(--color-danger)" }} onClick={() => handleDelete(editingId)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        )}
                        <button type="submit" className="btn btn--primary">Save</button>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "32px", alignItems: "start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {/* Weekly Rules */}
                        <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-bg-primary)" }}>
                            {form.rules.map((rule, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", padding: "16px", borderBottom: i < 6 ? "1px solid var(--color-border)" : "none" }}>
                                    <label className="toggle" style={{ margin: 0, marginRight: "16px" }}>
                                        <input type="checkbox" checked={rule.enabled} onChange={(e) => updateRule(i, "enabled", e.target.checked)} />
                                        <span className="toggle__slider" />
                                    </label>
                                    <span style={{ width: "100px", fontWeight: 500, color: rule.enabled ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>{DAYS[i]}</span>
                                    
                                    {rule.enabled ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                                            <input type="time" className="form-input" style={{ width: "110px", padding: "8px 12px" }} value={rule.start_time.substring(0, 5)} onChange={(e) => updateRule(i, "start_time", e.target.value + ":00")} />
                                            <span style={{ color: "var(--color-text-secondary)" }}>-</span>
                                            <input type="time" className="form-input" style={{ width: "110px", padding: "8px 12px" }} value={rule.end_time.substring(0, 5)} onChange={(e) => updateRule(i, "end_time", e.target.value + ":00")} />
                                            <button type="button" className="btn btn--ghost btn--icon" style={{ marginLeft: "8px" }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            </button>
                                            <button type="button" className="btn btn--ghost btn--icon">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1 }} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Date Overrides */}
                        <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px", background: "var(--color-bg-primary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Date overrides</h3>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </div>
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: "0 0 16px 0" }}>Add dates when your availability changes from your daily hours.</p>
                            
                            {editingId && schedules.find(s => s.id === editingId)?.overrides?.map(o => (
                                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: "12px" }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: "14px" }}>{new Date(o.date).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric'})}</div>
                                        <div style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                                            {o.is_blocked ? "Unavailable" : `${formatTime(o.start_time)} - ${formatTime(o.end_time)}`}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button type="button" className="btn btn--ghost btn--icon" onClick={() => handleRemoveOverride(editingId, o.id)}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            <button type="button" className="btn btn--secondary" onClick={() => editingId ? openOverride(editingId) : alert('Save schedule first to add overrides')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px" }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Add an override
                            </button>
                        </div>
                    </div>

                    {/* Sidebar (Timezone) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Timezone</label>
                            <select className="form-input form-select" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>
                                <option>Asia/Kolkata</option>
                                <option>America/New_York</option>
                                <option>America/Chicago</option>
                                <option>America/Los_Angeles</option>
                                <option>Europe/London</option>
                                <option>Europe/Berlin</option>
                                <option>Australia/Sydney</option>
                                <option>Pacific/Auckland</option>
                            </select>
                        </div>
                        <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px", background: "var(--color-bg-primary)" }}>
                            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600 }}>Something doesn't look right?</h4>
                            <button type="button" className="btn btn--secondary" style={{ width: "100%", justifyContent: "center" }}>Launch troubleshooter</button>
                        </div>
                    </div>
                </div>
            </form>
            )}

            {/* Override Modal */}
            {showOverrideModal && (
                <div className="modal-overlay" onClick={() => setShowOverrideModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Add Date Override</h2>
                            <button className="btn btn--ghost btn--icon" onClick={() => setShowOverrideModal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddOverride}>
                            <div className="modal__body">
                                <div className="form-group">
                                    <label>Date *</label>
                                    <input type="date" className="form-input" value={overrideForm.date} onChange={(e) => setOverrideForm((p) => ({ ...p, date: e.target.value }))} required />
                                </div>
                                <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                    <input type="checkbox" checked={overrideForm.is_blocked} onChange={(e) => setOverrideForm((p) => ({ ...p, is_blocked: e.target.checked }))} />
                                    <label style={{ margin: 0 }}>Block entire day</label>
                                </div>
                                {!overrideForm.is_blocked && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                                        <div className="form-group">
                                            <label>Start Time</label>
                                            <input type="time" className="form-input" value={overrideForm.start_time} onChange={(e) => setOverrideForm((p) => ({ ...p, start_time: e.target.value + ":00" }))} required />
                                        </div>
                                        <div className="form-group">
                                            <label>End Time</label>
                                            <input type="time" className="form-input" value={overrideForm.end_time} onChange={(e) => setOverrideForm((p) => ({ ...p, end_time: e.target.value + ":00" }))} required />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal__footer">
                                <button type="button" className="btn btn--secondary" onClick={() => setShowOverrideModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn--primary">Add Override</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
