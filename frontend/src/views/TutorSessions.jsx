import { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2, Video, AlertCircle } from 'lucide-react';
import api from '../api';

const emptyForm = { classId: '', title: '', sessionDate: '', sessionTime: '', meetingLink: '' };

export default function TutorSessions({ user }) {
    const [sessions, setSessions]   = useState([]);
    const [classes, setClasses]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm]           = useState(emptyForm);
    const [saving, setSaving]       = useState(false);
    const [formErr, setFormErr]     = useState('');
    const [tab, setTab]             = useState('upcoming'); // upcoming | past

    const fetchSessions = () => {
        setLoading(true);
        api.get('/sessions').then(r => setSessions(r.data)).catch(() => {}).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSessions();
        api.get('/courses/classes/my').then(r => setClasses(r.data)).catch(() => {});
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormErr('');
        if (!form.classId || !form.title || !form.sessionDate || !form.sessionTime) {
            return setFormErr('Class, Title, Date and Time are required.');
        }
        setSaving(true);
        try {
            await api.post('/sessions', form);
            setShowModal(false); setForm(emptyForm);
            fetchSessions();
        } catch (err) { setFormErr(err.response?.data?.message || 'Failed to create session.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this session?')) return;
        await api.delete(`/sessions/${id}`).catch(() => {});
        fetchSessions();
    };

    const now = new Date();
    const upcoming = sessions.filter(s => new Date(s.SessionDate + 'T' + s.SessionTime) >= now);
    const past     = sessions.filter(s => new Date(s.SessionDate + 'T' + s.SessionTime) < now);
    const display  = tab === 'upcoming' ? upcoming : past;

    const lbl = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' };

    const fmtDate = (d, t) => {
        const dt = new Date(d + 'T' + t);
        return dt.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    // ── Full-page: Schedule Session ───────────────────────────────────────────
    if (showModal) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setShowModal(false)} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Schedule Live Session</h2>
                </div>
                <div className="section-card" style={{ maxWidth: '580px', margin: '0 auto', padding: '32px' }}>
                    {formErr && (
                        <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={14}/> {formErr}
                        </div>
                    )}
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={lbl}>Class *</label>
                            <select className="form-input" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} required>
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.BatchName} — {c.CourseName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Session Title *</label>
                            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Week 3 Live Q&A" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div><label style={lbl}>Date *</label><input className="form-input" type="date" value={form.sessionDate} onChange={e => setForm({ ...form, sessionDate: e.target.value })} required /></div>
                            <div><label style={lbl}>Time *</label><input className="form-input" type="time" value={form.sessionTime} onChange={e => setForm({ ...form, sessionTime: e.target.value })} required /></div>
                        </div>
                        <div>
                            <label style={lbl}>Meeting Link <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — Zoom/Google Meet/Teams)</span></label>
                            <input className="form-input" type="url" value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Scheduling...' : 'Schedule Session'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title"><Calendar size={18} style={{ marginRight:'8px', verticalAlign:'middle' }}/>Live Sessions</h2>
                    <button className="btn btn-primary" onClick={() => { setShowModal(true); setFormErr(''); setForm(emptyForm); }}>
                        <Plus size={15} style={{ marginRight:'4px', verticalAlign:'middle' }}/>Schedule Session
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display:'flex', gap:'4px', marginBottom:'20px', borderBottom:'1px solid var(--border)', paddingBottom:'0' }}>
                    {[['upcoming', `Upcoming (${upcoming.length})`], ['past', `Past (${past.length})`]].map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)} style={{ padding:'8px 18px', border:'none', background:'none', fontWeight: tab===key ? 700 : 400, color: tab===key ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab===key ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer', fontSize:'14px', marginBottom:'-1px' }}>
                            {label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)' }}>Loading...</div>
                ) : display.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)', border:'1px dashed var(--border)', borderRadius:'var(--radius-md)' }}>
                        No {tab} sessions. {tab === 'upcoming' ? 'Schedule one using the button above.' : ''}
                    </div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                        {display.map(s => {
                            const isPast = new Date(s.SessionDate + 'T' + s.SessionTime) < now;
                            return (
                                <div key={s.ID} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 18px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', opacity: isPast ? 0.7 : 1 }}>
                                    {/* Date block */}
                                    <div style={{ width:'52px', height:'52px', borderRadius:'var(--radius-sm)', background: isPast ? 'var(--border)' : 'var(--primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        <span style={{ fontSize:'20px', fontWeight:800, color:'#fff', lineHeight:1 }}>{new Date(s.SessionDate).getDate()}</span>
                                        <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.85)', textTransform:'uppercase' }}>{new Date(s.SessionDate).toLocaleDateString('en-IN', { month:'short' })}</span>
                                    </div>

                                    <div style={{ flex:1 }}>
                                        <div style={{ fontWeight:700, fontSize:'15px' }}>{s.Title}</div>
                                        <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'3px' }}>
                                            {s.BatchName} · {s.CourseName} · {fmtDate(s.SessionDate, s.SessionTime)}
                                        </div>
                                    </div>

                                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                                        {s.MeetingLink && (
                                            <a href={s.MeetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'6px 14px', fontSize:'12px', textDecoration:'none' }}>
                                                <Video size={13}/>Join
                                            </a>
                                        )}
                                        <button className="icon-button" style={{ color:'var(--danger)', width:'32px', height:'32px' }} onClick={() => handleDelete(s.ID)}>
                                            <Trash2 size={15}/>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
