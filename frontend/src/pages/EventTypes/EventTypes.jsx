import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { eventTypesApi } from "../../api/client";
import "../../components/shared.css";
import "./EventTypes.css";

const COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];

export default function EventTypes() {
    const [eventTypes, setEventTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({
        title: "", slug: "", description: "", duration_minutes: 30,
        buffer_before: 0, buffer_after: 0, is_active: true,
        availability_schedule_id: null, custom_questions: [],
        is_recurring: false, recurring_interval: "weekly", recurring_count: 4,
    });
    const navigate = useNavigate();

    const loadEventTypes = useCallback(async () => {
        try {
            setLoading(true);
            const data = await eventTypesApi.list();
            setEventTypes(data);
        } catch (err) {
            showToast("Failed to load event types");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadEventTypes(); }, [loadEventTypes]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSlugify = (title) => {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({
            title: "", slug: "", description: "", duration_minutes: 30,
            buffer_before: 0, buffer_after: 0, is_active: true,
            availability_schedule_id: null, custom_questions: [],
            is_recurring: false, recurring_interval: "weekly", recurring_count: 4,
        });
        setShowModal(true);
    };

    const openEdit = async (id) => {
        try {
            const data = await eventTypesApi.getById(id);
            setEditingId(id);
            setForm({
                title: data.title,
                slug: data.slug,
                description: data.description || "",
                duration_minutes: data.duration_minutes,
                buffer_before: data.buffer_before || 0,
                buffer_after: data.buffer_after || 0,
                is_active: data.is_active,
                availability_schedule_id: data.availability_schedule_id,
                custom_questions: data.custom_questions || [],
                is_recurring: data.is_recurring || false,
                recurring_interval: data.recurring_interval || "weekly",
                recurring_count: data.recurring_count || 4,
            });
            setShowModal(true);
        } catch (err) {
            showToast("Failed to load event type");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await eventTypesApi.update(editingId, form);
                showToast("Event type updated");
            } else {
                await eventTypesApi.create(form);
                showToast("Event type created");
            }
            setShowModal(false);
            loadEventTypes();
        } catch (err) {
            showToast(err.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event type?")) return;
        try {
            await eventTypesApi.delete(id);
            showToast("Event type deleted");
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

    if (loading) {
        return <div className="spinner"><div className="spinner__circle" /></div>;
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-header__title">Event types</h1>
                    <p className="page-header__subtitle">Configure different events for people to book on your calendar.</p>
                </div>
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                        <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: "8px 12px 8px 34px",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--color-border)",
                                background: "var(--color-bg-primary)",
                                fontSize: "var(--font-size-sm)",
                                outline: "none",
                                width: "200px"
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
                            <div className="event-type-card__info">
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

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">{editingId ? "Edit Event Type" : "New Event Type"}</h2>
                            <button className="btn btn--ghost btn--icon" onClick={() => setShowModal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal__body">
                                <div className="form-group">
                                    <label>Title *</label>
                                    <input
                                        className="form-input"
                                        value={form.title}
                                        onChange={(e) => {
                                            const title = e.target.value;
                                            setForm(prev => ({
                                                ...prev,
                                                title,
                                                slug: editingId ? prev.slug : handleSlugify(title),
                                            }));
                                        }}
                                        placeholder="e.g. 30 Minute Meeting"
                                        required
                                        id="event-title-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>URL Slug *</label>
                                    <input
                                        className="form-input"
                                        value={form.slug}
                                        onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                                        placeholder="e.g. 30min"
                                        required
                                        id="event-slug-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        className="form-input form-input--textarea"
                                        value={form.description}
                                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="A brief description of this event type..."
                                        id="event-description-input"
                                    />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)" }}>
                                    <div className="form-group">
                                        <label>Duration (min) *</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            min="5"
                                            max="480"
                                            value={form.duration_minutes}
                                            onChange={(e) => setForm(prev => ({ ...prev, duration_minutes: e.target.value === "" ? "" : parseInt(e.target.value) }))}
                                            id="event-duration-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Buffer Before</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            min="0"
                                            max="120"
                                            value={form.buffer_before}
                                            onChange={(e) => setForm(prev => ({ ...prev, buffer_before: e.target.value === "" ? "" : parseInt(e.target.value) }))}
                                            id="event-buffer-before-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Buffer After</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            min="0"
                                            max="120"
                                            value={form.buffer_after}
                                            onChange={(e) => setForm(prev => ({ ...prev, buffer_after: e.target.value === "" ? "" : parseInt(e.target.value) }))}
                                            id="event-buffer-after-input"
                                        />
                                    </div>
                                </div>

                                {/* Recurring Settings — Cal.com style */}
                                <div style={{
                                    marginTop: "var(--space-5)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-lg)",
                                    overflow: "hidden",
                                }}>
                                    {/* Header row with toggle */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "14px 16px",
                                        background: "var(--color-bg-primary)",
                                        borderBottom: form.is_recurring ? "1px solid var(--color-border)" : "none",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                <path d="M3 3v5h5" />
                                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                                <path d="M16 16h5v5" />
                                            </svg>
                                            <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}>Recurring Event</span>
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

                                    {/* Expanded settings */}
                                    {form.is_recurring && (
                                        <div style={{ padding: "16px", background: "var(--color-bg-secondary)" }}>
                                            {/* Repeats every row */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                                                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>Repeats every</span>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    min="1"
                                                    max="12"
                                                    value={1}
                                                    readOnly
                                                    style={{ width: "60px", textAlign: "center" }}
                                                />
                                                <select
                                                    className="form-input form-select"
                                                    value={form.recurring_interval}
                                                    onChange={(e) => setForm(prev => ({ ...prev, recurring_interval: e.target.value }))}
                                                    style={{ width: "130px" }}
                                                >
                                                    <option value="daily">day(s)</option>
                                                    <option value="weekly">week(s)</option>
                                                    <option value="monthly">month(s)</option>
                                                </select>
                                            </div>

                                            {/* Number of occurrences row */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                                                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>Number of occurrences</span>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    min="2"
                                                    max="52"
                                                    value={form.recurring_count}
                                                    onChange={(e) => setForm(prev => ({ ...prev, recurring_count: parseInt(e.target.value) || 2 }))}
                                                    style={{ width: "70px", textAlign: "center" }}
                                                />
                                            </div>

                                            {/* Summary line */}
                                            <div style={{
                                                fontSize: "var(--font-size-xs)",
                                                color: "var(--color-text-muted)",
                                                padding: "10px 12px",
                                                background: "var(--color-bg-primary)",
                                                borderRadius: "var(--radius-md)",
                                                border: "1px solid var(--color-border)",
                                            }}>
                                                This event will repeat every {form.recurring_interval === "daily" ? "day" : form.recurring_interval === "weekly" ? "week" : "month"} for <strong>{form.recurring_count}</strong> events.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal__footer">
                                <button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn--primary" id="save-event-type-btn">
                                    {editingId ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
