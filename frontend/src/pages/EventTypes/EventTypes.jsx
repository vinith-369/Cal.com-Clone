import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { eventTypesApi, availabilityApi } from "../../api/client";
import "../../components/shared.css";
import "./EventTypes.css";

const COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];

export default function EventTypes() {
    const [eventTypes, setEventTypes] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState("basics");
    const [copiedId, setCopiedId] = useState(null);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({
        title: "", slug: "", description: "", duration_minutes: 30,
        buffer_before: 0, buffer_after: 0, is_active: true,
        availability_schedule_id: null,
        is_recurring: false, recurring_interval: "weekly", recurring_count: 4,
    });
    const navigate = useNavigate();

    const showEditor = editingId !== null || isCreating;

    const loadEventTypes = useCallback(async () => {
        try {
            setLoading(true);
            const [etData, schedData] = await Promise.all([
                eventTypesApi.list(),
                availabilityApi.list(),
            ]);
            setEventTypes(etData);
            setSchedules(schedData);
        } catch (err) {
            showToast("Failed to load event types");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadEventTypes(); }, [loadEventTypes]);

    const formatTime12 = (t) => {
        if (!t) return "";
        const [h, m] = t.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "pm" : "am";
        return `${hour % 12 || 12}:${m} ${ampm}`;
    };

    const getSelectedSchedule = () => {
        if (form.availability_schedule_id) {
            return schedules.find(s => s.id === form.availability_schedule_id);
        }
        return schedules.find(s => s.is_default) || schedules[0] || null;
    };

    const getSelectedScheduleName = () => {
        const s = getSelectedSchedule();
        return s ? s.name : "Working hours";
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSlugify = (title) => {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };

    const openCreate = () => {
        setEditingId(null);
        setIsCreating(true);
        setActiveTab("basics");
        setForm({
            title: "", slug: "", description: "", duration_minutes: 30,
            buffer_before: 0, buffer_after: 0, is_active: true,
            availability_schedule_id: null,
            is_recurring: false, recurring_interval: "weekly", recurring_count: 4,
        });
    };

    const openEdit = async (id) => {
        try {
            const data = await eventTypesApi.getById(id);
            setEditingId(id);
            setIsCreating(false);
            setActiveTab("basics");
            setForm({
                title: data.title,
                slug: data.slug,
                description: data.description || "",
                duration_minutes: data.duration_minutes,
                buffer_before: data.buffer_before || 0,
                buffer_after: data.buffer_after || 0,
                is_active: data.is_active,
                availability_schedule_id: data.availability_schedule_id,
                is_recurring: data.is_recurring || false,
                recurring_interval: data.recurring_interval || "weekly",
                recurring_count: data.recurring_count || 4,
            });
        } catch (err) {
            showToast("Failed to load event type");
        }
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await eventTypesApi.update(editingId, form);
                showToast("Event type updated");
            } else {
                await eventTypesApi.create(form);
                showToast("Event type created");
            }
            closeEditor();
            loadEventTypes();
        } catch (err) {
            showToast(err.message || "Operation failed");
        }
    };

    const closeEditor = () => {
        setEditingId(null);
        setIsCreating(false);
        setActiveTab("basics");
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event type?")) return;
        try {
            await eventTypesApi.delete(id);
            showToast("Event type deleted");
            closeEditor();
            loadEventTypes();
        } catch (err) {
            showToast("Failed to delete");
        }
    };

    const handleToggleActive = async (et) => {
        try {
            await eventTypesApi.update(et.id, { is_active: !et.is_active });
            loadEventTypes();
        } catch (err) {
            showToast("Failed to update");
        }
    };

    const copyLink = (slug) => {
        const url = `${window.location.origin}/book/${slug}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedId(slug);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    // ── Sidebar tabs config ──
    const tabs = [
        {
            id: "basics",
            label: "Basics",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.36-5.36l-4.24 4.24M7.88 16.12l-4.24 4.24m0-12.72l4.24 4.24m4.24 4.24l4.24 4.24" /></svg>,
            subtitle: `${form.duration_minutes} mins`,
        },
        {
            id: "availability",
            label: "Availability",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
            subtitle: getSelectedScheduleName(),
        },
        {
            id: "recurring",
            label: "Recurring",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>,
            subtitle: "Set up a repeating schedule",
        },
    ];

    if (loading) {
        return <div className="spinner"><div className="spinner__circle" /></div>;
    }

    // ── Full-page Editor View ──
    if (showEditor) {
        const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const displayOrder = [6, 0, 1, 2, 3, 4, 5]; // Sun, Mon...Sat

        return (
            <div className="animate-fade-in">
                {/* Top Bar */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingBottom: "16px", borderBottom: "1px solid var(--color-border)", marginBottom: "24px"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button type="button" className="btn btn--ghost btn--icon" onClick={closeEditor}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                        </button>
                        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
                            {form.title || "New Event Type"}
                        </h1>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {editingId && (
                            <>
                                <label className="toggle" style={{ margin: 0 }}>
                                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                                    <span className="toggle__slider" />
                                </label>
                                <div style={{ width: "1px", height: "24px", background: "var(--color-border)", margin: "0 4px" }} />
                                <button className="btn btn--ghost btn--icon" onClick={() => navigate(`/book/${form.slug}`)} title="Preview">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </button>
                                <button className="btn btn--ghost btn--icon" onClick={() => copyLink(form.slug)} title="Copy link">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                </button>
                                <button className="btn btn--ghost btn--icon" title="Embed">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                                </button>
                                <button className="btn btn--ghost btn--icon" style={{ color: "var(--color-danger)" }} onClick={() => handleDelete(editingId)} title="Delete">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                </button>
                                <div style={{ width: "1px", height: "24px", background: "var(--color-border)", margin: "0 4px" }} />
                            </>
                        )}
                        <button className="btn btn--primary" onClick={handleSave} id="save-event-type-btn">Save</button>
                    </div>
                </div>

                {/* Main Layout: Sidebar + Content */}
                <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "32px", alignItems: "start" }}>
                    {/* Left Sidebar Tabs */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    padding: "12px 16px", borderRadius: "var(--radius-md)",
                                    border: "none", cursor: "pointer", textAlign: "left",
                                    background: activeTab === tab.id ? "var(--color-bg-secondary)" : "transparent",
                                    transition: "background 0.15s",
                                }}
                            >
                                <span style={{ color: activeTab === tab.id ? "var(--color-accent)" : "var(--color-text-secondary)", flexShrink: 0 }}>
                                    {tab.icon}
                                </span>
                                <div>
                                    <div style={{
                                        fontWeight: 600, fontSize: "14px",
                                        color: activeTab === tab.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                                    }}>{tab.label}</div>
                                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{tab.subtitle}</div>
                                </div>
                                {activeTab === tab.id && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ marginLeft: "auto" }}><polyline points="9 18 15 12 9 6" /></svg>
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Right Content Area */}
                    <div style={{ maxWidth: "640px" }}>
                        {/* ── Basics Tab ── */}
                        {activeTab === "basics" && (
                            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", background: "var(--color-bg-primary)" }}>
                                    <div className="form-group">
                                        <label>Title</label>
                                        <input
                                            className="form-input"
                                            value={form.title}
                                            onChange={(e) => {
                                                const title = e.target.value;
                                                setForm(prev => ({
                                                    ...prev, title,
                                                    slug: editingId ? prev.slug : handleSlugify(title),
                                                }));
                                            }}
                                            placeholder="e.g. 30 Minute Meeting"
                                            required
                                            id="event-title-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            className="form-input form-input--textarea"
                                            value={form.description}
                                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="A quick video meeting."
                                            id="event-description-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>URL</label>
                                        <input
                                            className="form-input"
                                            value={form.slug}
                                            onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                                            placeholder="e.g. 30min"
                                            required
                                            id="event-slug-input"
                                            style={{ color: "var(--color-text-muted)" }}
                                        />
                                    </div>
                                </div>

                                {/* Duration */}
                                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", background: "var(--color-bg-primary)" }}>
                                    <label style={{ display: "block", fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Duration</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <input
                                            className="form-input"
                                            type="number" min="5" max="480"
                                            value={form.duration_minutes}
                                            onChange={(e) => setForm(prev => ({ ...prev, duration_minutes: e.target.value === "" ? "" : parseInt(e.target.value) }))}
                                            style={{ flex: 1 }}
                                            id="event-duration-input"
                                        />
                                        <span style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>Minutes</span>
                                    </div>
                                </div>

                                {/* Buffers & Limits */}
                                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", background: "var(--color-bg-primary)" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "8px", display: "block" }}>Before event</label>
                                            <select
                                                className="form-input form-select"
                                                value={form.buffer_before}
                                                onChange={(e) => setForm(prev => ({ ...prev, buffer_before: parseInt(e.target.value) }))}
                                                id="event-buffer-before-input"
                                            >
                                                <option value={0}>No buffer time</option>
                                                <option value={5}>5 mins</option>
                                                <option value={10}>10 mins</option>
                                                <option value={15}>15 mins</option>
                                                <option value={20}>20 mins</option>
                                                <option value={30}>30 mins</option>
                                                <option value={45}>45 mins</option>
                                                <option value={60}>60 mins</option>
                                                <option value={90}>90 mins</option>
                                                <option value={120}>120 mins</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "8px", display: "block" }}>After event</label>
                                            <select
                                                className="form-input form-select"
                                                value={form.buffer_after}
                                                onChange={(e) => setForm(prev => ({ ...prev, buffer_after: parseInt(e.target.value) }))}
                                                id="event-buffer-after-input"
                                            >
                                                <option value={0}>No buffer time</option>
                                                <option value={5}>5 mins</option>
                                                <option value={10}>10 mins</option>
                                                <option value={15}>15 mins</option>
                                                <option value={20}>20 mins</option>
                                                <option value={30}>30 mins</option>
                                                <option value={45}>45 mins</option>
                                                <option value={60}>60 mins</option>
                                                <option value={90}>90 mins</option>
                                                <option value={120}>120 mins</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Availability Tab ── */}
                        {activeTab === "availability" && (
                            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-bg-primary)" }}>
                                    <div style={{ padding: "20px 24px" }}>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>Availability</label>
                                        <select
                                            className="form-input form-select"
                                            value={form.availability_schedule_id || ""}
                                            onChange={(e) => setForm(prev => ({ ...prev, availability_schedule_id: e.target.value ? parseInt(e.target.value) : null }))}
                                            id="availability-schedule-select"
                                        >
                                            {schedules.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}{s.is_default ? " (Default)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Schedule Preview */}
                                    {(() => {
                                        const sched = getSelectedSchedule();
                                        if (!sched) return null;
                                        const ruleMap = {};
                                        (sched.rules || []).forEach(r => { ruleMap[r.day_of_week] = r; });
                                        return (
                                            <div style={{ borderTop: "1px solid var(--color-border)", padding: "20px 24px" }}>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    {displayOrder.map((dayIdx, i) => {
                                                        const rule = ruleMap[dayIdx];
                                                        return (
                                                            <div key={dayIdx} style={{
                                                                display: "flex", alignItems: "center", padding: "10px 0",
                                                                borderBottom: i < 6 ? "1px solid var(--color-border-light, #f3f4f6)" : "none",
                                                            }}>
                                                                <span style={{
                                                                    width: "120px", fontSize: "14px", fontWeight: 500,
                                                                    color: rule ? "var(--color-text-primary)" : "var(--color-text-muted)",
                                                                }}>{dayLabels[dayIdx]}</span>
                                                                {rule ? (
                                                                    <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
                                                                        <span>{formatTime12(rule.start_time)}</span>
                                                                        <span>-</span>
                                                                        <span>{formatTime12(rule.end_time)}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ fontSize: "14px", color: "var(--color-text-muted)", fontStyle: "italic" }}>Unavailable</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--color-border)",
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                                        {sched.timezone}
                                                    </div>
                                                    <a
                                                        href="/availability"
                                                        onClick={(e) => { e.preventDefault(); navigate("/availability"); }}
                                                        style={{ fontSize: "13px", color: "var(--color-text-secondary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                                                    >
                                                        Edit availability
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* ── Recurring Tab ── */}
                        {activeTab === "recurring" && (
                            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                <div style={{
                                    border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                                    overflow: "hidden", background: "var(--color-bg-primary)",
                                }}>
                                    {/* Recurring toggle header */}
                                    <div style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "18px 24px",
                                        borderBottom: form.is_recurring ? "1px solid var(--color-border)" : "none",
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "15px" }}>Recurring event</div>
                                            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                                                People can subscribe to recurring events. <a href="#" style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Learn more</a>
                                            </div>
                                        </div>
                                        <label className="toggle" style={{ margin: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={form.is_recurring}
                                                onChange={(e) => setForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
                                            />
                                            <span className="toggle__slider" />
                                        </label>
                                    </div>

                                    {form.is_recurring && (
                                        <div style={{ padding: "20px 24px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                                                <span style={{ fontSize: "14px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>Repeats every</span>
                                                <input className="form-input" type="number" min="1" max="12" value={1} readOnly style={{ width: "60px", textAlign: "center" }} />
                                                <select
                                                    className="form-input form-select"
                                                    value={form.recurring_interval}
                                                    onChange={(e) => setForm(prev => ({ ...prev, recurring_interval: e.target.value }))}
                                                    style={{ width: "110px" }}
                                                >
                                                    <option value="daily">d...</option>
                                                    <option value="weekly">w...</option>
                                                    <option value="monthly">m...</option>
                                                </select>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ fontSize: "14px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>For a maximum of</span>
                                                <input
                                                    className="form-input"
                                                    type="number" min="2" max="52"
                                                    value={form.recurring_count}
                                                    onChange={(e) => setForm(prev => ({ ...prev, recurring_count: parseInt(e.target.value) || 2 }))}
                                                    style={{ width: "70px", textAlign: "center" }}
                                                />
                                                <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>Events</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {toast && <div className="toast">{toast}</div>}
            </div>
        );
    }

    // ── List View ──
    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-header__title">Event types</h1>
                    <p className="page-header__subtitle">Configure different events for people to book on your calendar.</p>
                </div>
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                        <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                            type="text" placeholder="Search" value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: "8px 12px 8px 34px", borderRadius: "var(--radius-md)",
                                border: "1px solid var(--color-border)", background: "var(--color-bg-primary)",
                                fontSize: "var(--font-size-sm)", outline: "none", width: "200px"
                            }}
                        />
                    </div>
                    <button className="btn btn--primary" onClick={openCreate} id="new-event-type-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        New
                    </button>
                </div>
            </div>

            {eventTypes.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    </div>
                    <h3 className="empty-state__title">No event types yet</h3>
                    <p className="empty-state__text">Create your first event type to start accepting bookings.</p>
                    <button className="btn btn--primary" onClick={openCreate}>Create Event Type</button>
                </div>
            ) : (
                <div className="event-types-list">
                    {eventTypes.filter(et => et.title.toLowerCase().includes(searchQuery.toLowerCase()) || et.slug.toLowerCase().includes(searchQuery.toLowerCase())).map((et, index) => (
                        <div key={et.id} className="event-type-card" style={{ animationDelay: `${index * 50}ms` }}>
                            <div
                                className="event-type-card__color-bar"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="event-type-card__info" onClick={() => openEdit(et.id)} style={{ cursor: "pointer" }}>
                                <div className={`event-type-card__title ${!et.is_active ? "event-type-card__title--inactive" : ""}`}>
                                    {et.title}
                                </div>
                                <div className="event-type-card__meta">
                                    <span className="event-type-card__duration">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        {et.duration_minutes}m
                                    </span>
                                    {et.is_recurring && (
                                        <span className="event-type-card__duration" style={{ color: "var(--color-primary-dark)", background: "var(--color-primary-light)", padding: "2px 6px", borderRadius: "10px" }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21v-5h5" /></svg>
                                            Recurring
                                        </span>
                                    )}
                                    <span className="event-type-card__slug">/{et.slug}</span>
                                    {!et.is_active && <span className="event-type-card__badge">Disabled</span>}
                                </div>
                            </div>
                            <div className="event-type-card__actions">
                                <div className="copy-link-btn">
                                    <button className="btn btn--ghost btn--icon" onClick={() => copyLink(et.slug)} title="Copy link" id={`copy-link-${et.slug}`}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    </button>
                                    {copiedId === et.slug && <span className="copy-link-tooltip">Copied!</span>}
                                </div>
                                <label className="toggle" title={et.is_active ? "Active" : "Inactive"}>
                                    <input type="checkbox" checked={et.is_active} onChange={() => handleToggleActive(et)} />
                                    <span className="toggle__slider" />
                                </label>
                                <button className="btn btn--ghost btn--icon" onClick={() => openEdit(et.id)} title="Edit" id={`edit-${et.id}`}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                <button className="btn btn--ghost btn--icon" onClick={() => navigate(`/book/${et.slug}`)} title="Preview" id={`preview-${et.slug}`}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </button>
                                <button className="btn btn--danger btn--sm" onClick={() => handleDelete(et.id)} title="Delete" id={`delete-${et.id}`}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}




// import { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { eventTypesApi, availabilityApi } from "../../api/client";
// import "../../components/shared.css";
// import "./EventTypes.css";

// const COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];

// export default function EventTypes() {
//     const [eventTypes, setEventTypes] = useState([]);
//     const [schedules, setSchedules] = useState([]);
//     const [searchQuery, setSearchQuery] = useState("");
//     const [loading, setLoading] = useState(true);
//     const [editingId, setEditingId] = useState(null);
//     const [isCreating, setIsCreating] = useState(false);
//     const [activeTab, setActiveTab] = useState("basics");
//     const [copiedId, setCopiedId] = useState(null);
//     const [toast, setToast] = useState(null);
//     const [form, setForm] = useState({
//         title: "", slug: "", description: "", duration_minutes: 30,
//         buffer_before: 0, buffer_after: 0, is_active: true,
//         availability_schedule_id: null, custom_questions: [],
//         is_recurring: false, recurring_interval: "weekly", recurring_count: 4,
//     });
//     const navigate = useNavigate();

//     const showEditor = editingId !== null || isCreating;

//     const loadEventTypes = useCallback(async () => {
//         try {
//             setLoading(true);
//             const [etData, schedData] = await Promise.all([
//                 eventTypesApi.list(),
//                 availabilityApi.list(),
//             ]);
//             setEventTypes(etData);
//             setSchedules(schedData);
//         } catch (err) {
//             showToast("Failed to load event types");
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => { loadEventTypes(); }, [loadEventTypes]);

//     const formatTime12 = (t) => {
//         if (!t) return "";
//         const [h, m] = t.split(":");
//         const hour = parseInt(h);
//         const ampm = hour >= 12 ? "pm" : "am";
//         return `${hour % 12 || 12}:${m} ${ampm}`;
//     };

//     const getSelectedSchedule = () => {
//         if (form.availability_schedule_id) {
//             return schedules.find(s => s.id === form.availability_schedule_id);
//         }
//         return schedules.find(s => s.is_default) || schedules[0] || null;
//     };

//     const getSelectedScheduleName = () => {
//         const s = getSelectedSchedule();
//         return s ? s.name : "Working hours";
//     };

//     const showToast = (message) => {
//         setToast(message);
//         setTimeout(() => setToast(null), 3000);
//     };

//     const handleSlugify = (title) => {
//         return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
//     };

//     const openCreate = () => {
//         setEditingId(null);
//         setIsCreating(true);
//         setActiveTab("basics");
//         setForm({
//             title: "", slug: "", description: "", duration_minutes: 30,
//             buffer_before: 0, buffer_after: 0, is_active: true,
//             availability_schedule_id: null, custom_questions: [],
//             is_recurring: false, recurring_interval: "weekly", recurring_count: 4,
//         });
//     };

//     const openEdit = async (id) => {
//         try {
//             const data = await eventTypesApi.getById(id);
//             setEditingId(id);
//             setIsCreating(false);
//             setActiveTab("basics");
//             setForm({
//                 title: data.title,
//                 slug: data.slug,
//                 description: data.description || "",
//                 duration_minutes: data.duration_minutes,
//                 buffer_before: data.buffer_before || 0,
//                 buffer_after: data.buffer_after || 0,
//                 is_active: data.is_active,
//                 availability_schedule_id: data.availability_schedule_id,
//                 custom_questions: data.custom_questions || [],
//                 is_recurring: data.is_recurring || false,
//                 recurring_interval: data.recurring_interval || "weekly",
//                 recurring_count: data.recurring_count || 4,
//             });
//         } catch (err) {
//             showToast("Failed to load event type");
//         }
//     };

//     const handleSave = async () => {
//         try {
//             if (editingId) {
//                 await eventTypesApi.update(editingId, form);
//                 showToast("Event type updated");
//             } else {
//                 await eventTypesApi.create(form);
//                 showToast("Event type created");
//             }
//             closeEditor();
//             loadEventTypes();
//         } catch (err) {
//             showToast(err.message || "Operation failed");
//         }
//     };

//     const closeEditor = () => {
//         setEditingId(null);
//         setIsCreating(false);
//         setActiveTab("basics");
//     };

//     const handleDelete = async (id) => {
//         if (!window.confirm("Are you sure you want to delete this event type?")) return;
//         try {
//             await eventTypesApi.delete(id);
//             showToast("Event type deleted");
//             closeEditor();
//             loadEventTypes();
//         } catch (err) {
//             showToast("Failed to delete");
//         }
//     };

//     const handleToggleActive = async (et) => {
//         try {
//             await eventTypesApi.update(et.id, { is_active: !et.is_active });
//             loadEventTypes();
//         } catch (err) {
//             showToast("Failed to update");
//         }
//     };

//     const copyLink = (slug) => {
//         const url = `${window.location.origin}/book/${slug}`;
//         navigator.clipboard.writeText(url).then(() => {
//             setCopiedId(slug);
//             setTimeout(() => setCopiedId(null), 2000);
//         });
//     };

//     // ── Sidebar tabs config ──
//     const tabs = [
//         {
//             id: "basics",
//             label: "Basics",
//             icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.36-5.36l-4.24 4.24M7.88 16.12l-4.24 4.24m0-12.72l4.24 4.24m4.24 4.24l4.24 4.24" /></svg>,
//             subtitle: `${form.duration_minutes} mins`,
//         },
//         {
//             id: "availability",
//             label: "Availability",
//             icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
//             subtitle: getSelectedScheduleName(),
//         },
//         {
//             id: "recurring",
//             label: "Recurring",
//             icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>,
//             subtitle: "Set up a repeating schedule",
//         },
//     ];

//     if (loading) {
//         return <div className="spinner"><div className="spinner__circle" /></div>;
//     }

//     // ── Full-page Editor View ──
//     if (showEditor) {
//         const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
//         const displayOrder = [6, 0, 1, 2, 3, 4, 5]; // Sun, Mon...Sat

//         return (
//             <div className="animate-fade-in">
//                 {/* Top Bar */}
//                 <div style={{
//                     display: "flex", alignItems: "center", justifyContent: "space-between",
//                     paddingBottom: "16px", borderBottom: "1px solid var(--color-border)", marginBottom: "24px"
//                 }}>
//                     <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//                         <button type="button" className="btn btn--ghost btn--icon" onClick={closeEditor}>
//                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
//                         </button>
//                         <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
//                             {form.title || "New Event Type"}
//                         </h1>
//                     </div>
//                     <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                         {editingId && (
//                             <>
//                                 <label className="toggle" style={{ margin: 0 }}>
//                                     <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))} />
//                                     <span className="toggle__slider" />
//                                 </label>
//                                 <div style={{ width: "1px", height: "24px", background: "var(--color-border)", margin: "0 4px" }} />
//                                 <button className="btn btn--ghost btn--icon" onClick={() => navigate(`/book/${form.slug}`)} title="Preview">
//                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
//                                 </button>
//                                 <button className="btn btn--ghost btn--icon" onClick={() => copyLink(form.slug)} title="Copy link">
//                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
//                                 </button>
//                                 <button className="btn btn--ghost btn--icon" title="Embed">
//                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
//                                 </button>
//                                 <button className="btn btn--ghost btn--icon" style={{ color: "var(--color-danger)" }} onClick={() => handleDelete(editingId)} title="Delete">
//                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
//                                 </button>
//                                 <div style={{ width: "1px", height: "24px", background: "var(--color-border)", margin: "0 4px" }} />
//                             </>
//                         )}
//                         <button className="btn btn--primary" onClick={handleSave} id="save-event-type-btn">Save</button>
//                     </div>
//                 </div>

//                 {/* Main Layout: Sidebar + Content */}
//                 <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "32px", alignItems: "start" }}>
//                     {/* Left Sidebar Tabs */}
//                     <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
//                         {tabs.map(tab => (
//                             <button
//                                 key={tab.id}
//                                 onClick={() => setActiveTab(tab.id)}
//                                 style={{
//                                     display: "flex", alignItems: "center", gap: "12px",
//                                     padding: "12px 16px", borderRadius: "var(--radius-md)",
//                                     border: "none", cursor: "pointer", textAlign: "left",
//                                     background: activeTab === tab.id ? "var(--color-bg-secondary)" : "transparent",
//                                     transition: "background 0.15s",
//                                 }}
//                             >
//                                 <span style={{ color: activeTab === tab.id ? "var(--color-accent)" : "var(--color-text-secondary)", flexShrink: 0 }}>
//                                     {tab.icon}
//                                 </span>
//                                 <div>
//                                     <div style={{
//                                         fontWeight: 600, fontSize: "14px",
//                                         color: activeTab === tab.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
//                                     }}>{tab.label}</div>
//                                     <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{tab.subtitle}</div>
//                                 </div>
//                                 {activeTab === tab.id && (
//                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ marginLeft: "auto" }}><polyline points="9 18 15 12 9 6" /></svg>
//                                 )}
//                             </button>
//                         ))}
//                     </nav>

//                     {/* Right Content Area */}
//                     <div style={{ maxWidth: "640px" }}>
//                         {/* ── Basics Tab ── */}
//                         {activeTab === "basics" && (
//                             <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
//                                 <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", background: "var(--color-bg-primary)" }}>
//                                     <div className="form-group">
//                                         <label>Title</label>
//                                         <input
//                                             className="form-input"
//                                             value={form.title}
//                                             onChange={(e) => {
//                                                 const title = e.target.value;
//                                                 setForm(prev => ({
//                                                     ...prev, title,
//                                                     slug: editingId ? prev.slug : handleSlugify(title),
//                                                 }));
//                                             }}
//                                             placeholder="e.g. 30 Minute Meeting"
//                                             required
//                                             id="event-title-input"
//                                         />
//                                     </div>
//                                     <div className="form-group">
//                                         <label>Description</label>
//                                         <textarea
//                                             className="form-input form-input--textarea"
//                                             value={form.description}
//                                             onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
//                                             placeholder="A quick video meeting."
//                                             id="event-description-input"
//                                         />
//                                     </div>
//                                     <div className="form-group">
//                                         <label>URL</label>
//                                         <input
//                                             className="form-input"
//                                             value={form.slug}
//                                             onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
//                                             placeholder="e.g. 30min"
//                                             required
//                                             id="event-slug-input"
//                                             style={{ color: "var(--color-text-muted)" }}
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Duration */}
//                                 <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", background: "var(--color-bg-primary)" }}>
//                                     <label style={{ display: "block", fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Duration</label>
//                                     <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                                         <input
//                                             className="form-input"
//                                             type="number" min="5" max="480"
//                                             value={form.duration_minutes}
//                                             onChange={(e) => setForm(prev => ({ ...prev, duration_minutes: e.target.value === "" ? "" : parseInt(e.target.value) }))}
//                                             style={{ flex: 1 }}
//                                             id="event-duration-input"
//                                         />
//                                         <span style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>Minutes</span>
//                                     </div>
//                                 </div>

//                                 {/* Buffers & Limits */}
//                                 <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", background: "var(--color-bg-primary)" }}>
//                                     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
//                                         <div className="form-group" style={{ marginBottom: 0 }}>
//                                             <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "8px", display: "block" }}>Before event</label>
//                                             <select
//                                                 className="form-input form-select"
//                                                 value={form.buffer_before}
//                                                 onChange={(e) => setForm(prev => ({ ...prev, buffer_before: parseInt(e.target.value) }))}
//                                                 id="event-buffer-before-input"
//                                             >
//                                                 <option value={0}>No buffer time</option>
//                                                 <option value={5}>5 mins</option>
//                                                 <option value={10}>10 mins</option>
//                                                 <option value={15}>15 mins</option>
//                                                 <option value={20}>20 mins</option>
//                                                 <option value={30}>30 mins</option>
//                                                 <option value={45}>45 mins</option>
//                                                 <option value={60}>60 mins</option>
//                                                 <option value={90}>90 mins</option>
//                                                 <option value={120}>120 mins</option>
//                                             </select>
//                                         </div>
//                                         <div className="form-group" style={{ marginBottom: 0 }}>
//                                             <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "8px", display: "block" }}>After event</label>
//                                             <select
//                                                 className="form-input form-select"
//                                                 value={form.buffer_after}
//                                                 onChange={(e) => setForm(prev => ({ ...prev, buffer_after: parseInt(e.target.value) }))}
//                                                 id="event-buffer-after-input"
//                                             >
//                                                 <option value={0}>No buffer time</option>
//                                                 <option value={5}>5 mins</option>
//                                                 <option value={10}>10 mins</option>
//                                                 <option value={15}>15 mins</option>
//                                                 <option value={20}>20 mins</option>
//                                                 <option value={30}>30 mins</option>
//                                                 <option value={45}>45 mins</option>
//                                                 <option value={60}>60 mins</option>
//                                                 <option value={90}>90 mins</option>
//                                                 <option value={120}>120 mins</option>
//                                             </select>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}

//                         {/* ── Availability Tab ── */}
//                         {activeTab === "availability" && (
//                             <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
//                                 <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-bg-primary)" }}>
//                                     <div style={{ padding: "20px 24px" }}>
//                                         <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>Availability</label>
//                                         <select
//                                             className="form-input form-select"
//                                             value={form.availability_schedule_id || ""}
//                                             onChange={(e) => setForm(prev => ({ ...prev, availability_schedule_id: e.target.value ? parseInt(e.target.value) : null }))}
//                                             id="availability-schedule-select"
//                                         >
//                                             {schedules.map(s => (
//                                                 <option key={s.id} value={s.id}>
//                                                     {s.name}{s.is_default ? " (Default)" : ""}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     </div>

//                                     {/* Schedule Preview */}
//                                     {(() => {
//                                         const sched = getSelectedSchedule();
//                                         if (!sched) return null;
//                                         const ruleMap = {};
//                                         (sched.rules || []).forEach(r => { ruleMap[r.day_of_week] = r; });
//                                         return (
//                                             <div style={{ borderTop: "1px solid var(--color-border)", padding: "20px 24px" }}>
//                                                 <div style={{ display: "flex", flexDirection: "column" }}>
//                                                     {displayOrder.map((dayIdx, i) => {
//                                                         const rule = ruleMap[dayIdx];
//                                                         return (
//                                                             <div key={dayIdx} style={{
//                                                                 display: "flex", alignItems: "center", padding: "10px 0",
//                                                                 borderBottom: i < 6 ? "1px solid var(--color-border-light, #f3f4f6)" : "none",
//                                                             }}>
//                                                                 <span style={{
//                                                                     width: "120px", fontSize: "14px", fontWeight: 500,
//                                                                     color: rule ? "var(--color-text-primary)" : "var(--color-text-muted)",
//                                                                 }}>{dayLabels[dayIdx]}</span>
//                                                                 {rule ? (
//                                                                     <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
//                                                                         <span>{formatTime12(rule.start_time)}</span>
//                                                                         <span>-</span>
//                                                                         <span>{formatTime12(rule.end_time)}</span>
//                                                                     </div>
//                                                                 ) : (
//                                                                     <span style={{ fontSize: "14px", color: "var(--color-text-muted)", fontStyle: "italic" }}>Unavailable</span>
//                                                                 )}
//                                                             </div>
//                                                         );
//                                                     })}
//                                                 </div>
//                                                 <div style={{
//                                                     display: "flex", alignItems: "center", justifyContent: "space-between",
//                                                     marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--color-border)",
//                                                 }}>
//                                                     <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-muted)", fontSize: "13px" }}>
//                                                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
//                                                         {sched.timezone}
//                                                     </div>
//                                                     <a
//                                                         href="/availability"
//                                                         onClick={(e) => { e.preventDefault(); navigate("/availability"); }}
//                                                         style={{ fontSize: "13px", color: "var(--color-text-secondary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
//                                                     >
//                                                         Edit availability
//                                                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
//                                                     </a>
//                                                 </div>
//                                             </div>
//                                         );
//                                     })()}
//                                 </div>
//                             </div>
//                         )}

//                         {/* ── Recurring Tab ── */}
//                         {activeTab === "recurring" && (
//                             <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
//                                 <div style={{
//                                     border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
//                                     overflow: "hidden", background: "var(--color-bg-primary)",
//                                 }}>
//                                     {/* Recurring toggle header */}
//                                     <div style={{
//                                         display: "flex", alignItems: "center", justifyContent: "space-between",
//                                         padding: "18px 24px",
//                                         borderBottom: form.is_recurring ? "1px solid var(--color-border)" : "none",
//                                     }}>
//                                         <div>
//                                             <div style={{ fontWeight: 600, fontSize: "15px" }}>Recurring event</div>
//                                             <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
//                                                 People can subscribe to recurring events. <a href="#" style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Learn more</a>
//                                             </div>
//                                         </div>
//                                         <label className="toggle" style={{ margin: 0 }}>
//                                             <input
//                                                 type="checkbox"
//                                                 checked={form.is_recurring}
//                                                 onChange={(e) => setForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
//                                             />
//                                             <span className="toggle__slider" />
//                                         </label>
//                                     </div>

//                                     {form.is_recurring && (
//                                         <div style={{ padding: "20px 24px" }}>
//                                             <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
//                                                 <span style={{ fontSize: "14px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>Repeats every</span>
//                                                 <input className="form-input" type="number" min="1" max="12" value={1} readOnly style={{ width: "60px", textAlign: "center" }} />
//                                                 <select
//                                                     className="form-input form-select"
//                                                     value={form.recurring_interval}
//                                                     onChange={(e) => setForm(prev => ({ ...prev, recurring_interval: e.target.value }))}
//                                                     style={{ width: "110px" }}
//                                                 >
//                                                     <option value="daily">d...</option>
//                                                     <option value="weekly">w...</option>
//                                                     <option value="monthly">m...</option>
//                                                 </select>
//                                             </div>
//                                             <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//                                                 <span style={{ fontSize: "14px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>For a maximum of</span>
//                                                 <input
//                                                     className="form-input"
//                                                     type="number" min="2" max="52"
//                                                     value={form.recurring_count}
//                                                     onChange={(e) => setForm(prev => ({ ...prev, recurring_count: parseInt(e.target.value) || 2 }))}
//                                                     style={{ width: "70px", textAlign: "center" }}
//                                                 />
//                                                 <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>Events</span>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {toast && <div className="toast">{toast}</div>}
//             </div>
//         );
//     }

//     // ── List View ──
//     return (
//         <div className="animate-fade-in">
//             <div className="page-header">
//                 <div>
//                     <h1 className="page-header__title">Event types</h1>
//                     <p className="page-header__subtitle">Configure different events for people to book on your calendar.</p>
//                 </div>
//                 <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
//                     <div style={{ position: "relative" }}>
//                         <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
//                         <input
//                             type="text" placeholder="Search" value={searchQuery}
//                             onChange={(e) => setSearchQuery(e.target.value)}
//                             style={{
//                                 padding: "8px 12px 8px 34px", borderRadius: "var(--radius-md)",
//                                 border: "1px solid var(--color-border)", background: "var(--color-bg-primary)",
//                                 fontSize: "var(--font-size-sm)", outline: "none", width: "200px"
//                             }}
//                         />
//                     </div>
//                     <button className="btn btn--primary" onClick={openCreate} id="new-event-type-btn">
//                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
//                         New
//                     </button>
//                 </div>
//             </div>

//             {eventTypes.length === 0 ? (
//                 <div className="empty-state">
//                     <div className="empty-state__icon">
//                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
//                             <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
//                             <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
//                         </svg>
//                     </div>
//                     <h3 className="empty-state__title">No event types yet</h3>
//                     <p className="empty-state__text">Create your first event type to start accepting bookings.</p>
//                     <button className="btn btn--primary" onClick={openCreate}>Create Event Type</button>
//                 </div>
//             ) : (
//                 <div className="event-types-list">
//                     {eventTypes.filter(et => et.title.toLowerCase().includes(searchQuery.toLowerCase()) || et.slug.toLowerCase().includes(searchQuery.toLowerCase())).map((et, index) => (
//                         <div key={et.id} className="event-type-card" style={{ animationDelay: `${index * 50}ms` }}>
//                             <div
//                                 className="event-type-card__color-bar"
//                                 style={{ backgroundColor: COLORS[index % COLORS.length] }}
//                             />
//                             <div className="event-type-card__info" onClick={() => openEdit(et.id)} style={{ cursor: "pointer" }}>
//                                 <div className={`event-type-card__title ${!et.is_active ? "event-type-card__title--inactive" : ""}`}>
//                                     {et.title}
//                                 </div>
//                                 <div className="event-type-card__meta">
//                                     <span className="event-type-card__duration">
//                                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
//                                         {et.duration_minutes}m
//                                     </span>
//                                     {et.is_recurring && (
//                                         <span className="event-type-card__duration" style={{ color: "var(--color-primary-dark)", background: "var(--color-primary-light)", padding: "2px 6px", borderRadius: "10px" }}>
//                                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21v-5h5" /></svg>
//                                             Recurring
//                                         </span>
//                                     )}
//                                     <span className="event-type-card__slug">/{et.slug}</span>
//                                     {!et.is_active && <span className="event-type-card__badge">Disabled</span>}
//                                 </div>
//                             </div>
//                             <div className="event-type-card__actions">
//                                 <div className="copy-link-btn">
//                                     <button className="btn btn--ghost btn--icon" onClick={() => copyLink(et.slug)} title="Copy link" id={`copy-link-${et.slug}`}>
//                                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
//                                     </button>
//                                     {copiedId === et.slug && <span className="copy-link-tooltip">Copied!</span>}
//                                 </div>
//                                 <label className="toggle" title={et.is_active ? "Active" : "Inactive"}>
//                                     <input type="checkbox" checked={et.is_active} onChange={() => handleToggleActive(et)} />
//                                     <span className="toggle__slider" />
//                                 </label>
//                                 <button className="btn btn--ghost btn--icon" onClick={() => openEdit(et.id)} title="Edit" id={`edit-${et.id}`}>
//                                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
//                                 </button>
//                                 <button className="btn btn--ghost btn--icon" onClick={() => navigate(`/book/${et.slug}`)} title="Preview" id={`preview-${et.slug}`}>
//                                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
//                                 </button>
//                                 <button className="btn btn--danger btn--sm" onClick={() => handleDelete(et.id)} title="Delete" id={`delete-${et.id}`}>
//                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
//                                 </button>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}

//             {toast && <div className="toast">{toast}</div>}
//         </div>
//     );
// }
