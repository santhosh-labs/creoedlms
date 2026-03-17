import { useEffect, useState } from 'react';
import { MessageSquare, AlertCircle, Trash2, ExternalLink, Plus, Send } from 'lucide-react';
import api from '../api';

const TARGET_OPTIONS = [
    { value: 'All',     label: 'Everyone (All Roles)',  color: '#6c3ccc', bg: '#f0ebff' },
    { value: 'Student', label: 'Students Only',          color: '#1aae64', bg: '#e8f5ee' },
    { value: 'Tutor',   label: 'Tutors Only',            color: '#c07800', bg: '#fff6e0' },
    { value: 'Admin',   label: 'Admins Only',            color: '#0077cc', bg: '#e6f2ff' },
];

const emptyForm = { title: '', message: '', targetType: 'All', actionLabel: '', actionLink: '' };

export default function SuperAdminAnnouncements({ user }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const isSuperAdmin = user?.role === 'Super Admin';
    const canPost = ['Super Admin', 'Admin'].includes(user?.role);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            setError(false);
            const res = await api.get('/announcements');
            setAnnouncements(res.data);
        } catch (err) {
            console.error('Failed to load announcements', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.title.trim() || !form.message.trim()) {
            return setFormError('Title and Message are required.');
        }
        setSubmitting(true);
        try {
            await api.post('/announcements', form);
            setForm(emptyForm);
            setShowModal(false);
            fetchAnnouncements();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to post announcement.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            fetchAnnouncements();
        } catch {
            alert('Failed to delete announcement.');
        }
    };

    const getTarget = (type) => TARGET_OPTIONS.find(t => t.value === type) || TARGET_OPTIONS[0];
    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' };

    // ── Full-page: New Announcement ──────────────────────────────────────────────
    if (showModal) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => { setShowModal(false); setForm(emptyForm); setFormError(''); }} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>New Announcement</h2>
                </div>

                <div className="section-card" style={{ maxWidth: '680px', margin: '0 auto', padding: '32px' }}>
                    {formError && (
                        <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={14}/> {formError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Target Audience */}
                        <div>
                            <label style={labelStyle}>Send To *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {TARGET_OPTIONS.map(t => (
                                    <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: `2px solid ${form.targetType === t.value ? t.color : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: form.targetType === t.value ? t.bg : 'var(--bg)', transition: 'all 0.15s', userSelect: 'none' }}>
                                        <input type="radio" name="targetType" value={t.value} checked={form.targetType === t.value} onChange={e => setForm({ ...form, targetType: e.target.value })} style={{ accentColor: t.color, width: '16px', height: '16px' }} />
                                        <span style={{ fontSize: '13px', fontWeight: form.targetType === t.value ? 700 : 500, color: form.targetType === t.value ? t.color : 'var(--text)' }}>{t.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label style={labelStyle}>Title *</label>
                            <input className="form-input" placeholder="e.g. Holiday Notice, Exam Schedule Update" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required maxLength={150} />
                        </div>

                        {/* Message */}
                        <div>
                            <label style={labelStyle}>Message *</label>
                            <textarea
                                className="form-input"
                                style={{ minHeight: '140px', resize: 'vertical', lineHeight: 1.6 }}
                                placeholder="Type your announcement here..."
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                required
                            />
                        </div>

                        {/* Optional Action Button */}
                        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px dashed var(--border)' }}>
                            <label style={{ ...labelStyle, marginBottom: '14px' }}>
                                Action Button <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '12px' }}>(optional — adds a clickable button to the announcement)</span>
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ ...labelStyle, fontWeight: 400 }}>Button Label</label>
                                    <input className="form-input" placeholder='e.g. "View Schedule"' value={form.actionLabel} onChange={e => setForm({ ...form, actionLabel: e.target.value })} maxLength={100} />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, fontWeight: 400 }}>Button URL</label>
                                    <input className="form-input" type="url" placeholder="https://..." value={form.actionLink} onChange={e => setForm({ ...form, actionLink: e.target.value })} />
                                </div>
                            </div>
                            {form.actionLabel && (
                                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Preview: <a href={form.actionLink || '#'} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 14px', fontSize: '12px', textDecoration: 'none', marginLeft: '8px' }}>
                                        <ExternalLink size={12} />{form.actionLabel}
                                    </a>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setForm(emptyForm); }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                <Send size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                {submitting ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <strong>Backend Connection Failed</strong>
                </div>
            )}

            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title">
                        <MessageSquare style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                        Notice Board
                    </h2>
                    {canPost && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            New Announcement
                        </button>
                    )}
                </div>

                {/* Announcements as cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading announcements...</div>
                    ) : announcements.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg)' }}>
                            <MessageSquare size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)' }}>No announcements yet</div>
                            {canPost && <div style={{ fontSize: '13px', marginTop: '8px' }}>Click "+ New Announcement" to post one.</div>}
                        </div>
                    ) : (
                        announcements.map((a) => {
                            const tgt = getTarget(a.TargetType);
                            return (
                                <div key={a.ID} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', position: 'relative', borderLeft: '4px solid ' + tgt.color }}>
                                    {/* Header row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>{a.Title}</h3>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: tgt.bg, color: tgt.color, whiteSpace: 'nowrap' }}>
                                                    {tgt.label}
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    By <strong>{a.AuthorName}</strong> · {formatDate(a.CreatedAt)}
                                                </span>
                                            </div>
                                        </div>
                                        {isSuperAdmin && (
                                            <button
                                                title="Delete announcement"
                                                onClick={() => handleDelete(a.ID)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px', borderRadius: '4px', flexShrink: 0 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Message body */}
                                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{a.Message}</p>

                                    {/* Optional action button */}
                                    {a.ActionLabel && (
                                        <a
                                            href={a.ActionLink || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}
                                        >
                                            <ExternalLink size={14} />
                                            {a.ActionLabel}
                                        </a>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
