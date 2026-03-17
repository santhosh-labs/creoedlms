import { useEffect, useState } from 'react';
import { MessageSquare, Send, X, CheckCircle, Plus } from 'lucide-react';
import api from '../api';

const STATUS_COLOR = { Open:'#cc0000', 'In Progress':'#c07800', Closed:'#1aae64' };
const STATUS_BG    = { Open:'#fff0f0', 'In Progress':'#fff6e0', Closed:'#e8f5ee' };

export default function StudentTickets({ user }) {
    const [tickets, setTickets]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [selected, setSelected]   = useState(null);
    const [replies, setReplies]     = useState([]);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending]     = useState(false);
    const [showNew, setShowNew]     = useState(false);
    const [newForm, setNewForm]     = useState({ subject:'', description:'', tutorId:'' });
    const [tutors, setTutors]       = useState([]);
    const [creating, setCreating]   = useState(false);
    const [filter, setFilter]       = useState('All');

    const fetchTickets = () => {
        setLoading(true);
        api.get('/tickets').then(r => setTickets(r.data)).catch(() => {}).finally(() => setLoading(false));
    };

    const openTicket = async (t) => {
        setSelected(t);
        const r = await api.get(`/tickets/${t.ID}/replies`).catch(() => ({ data:[] }));
        setReplies(r.data);
    };

    const sendReply = async () => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await api.post(`/tickets/${selected.ID}/replies`, { message: replyText });
            setReplyText('');
            const r = await api.get(`/tickets/${selected.ID}/replies`);
            setReplies(r.data);
        } catch { alert('Failed to send'); }
        finally { setSending(false); }
    };

    const createTicket = async () => {
        if (!newForm.subject || !newForm.description) return alert('Subject and description required');
        if (!newForm.tutorId) return alert('Please select a tutor');
        setCreating(true);
        try {
            await api.post('/tickets', newForm);
            setShowNew(false);
            setNewForm({ subject:'', description:'', tutorId: tutors.length === 1 ? tutors[0].ID : '' });
            fetchTickets();
        } catch { alert('Failed to create ticket'); }
        finally { setCreating(false); }
    };

    useEffect(() => {
        fetchTickets();
        api.get('/users/my-tutors').then(r => {
            setTutors(r.data);
            if (r.data.length === 1) {
                setNewForm(prev => ({ ...prev, tutorId: r.data[0].ID }));
            }
        }).catch(() => {});
    }, []);

    const filtered = filter === 'All' ? tickets : tickets.filter(t => t.Status === filter);
    const inp = { width:'100%', padding:'9px 13px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'14px', background:'var(--bg)', color:'var(--text)', boxSizing:'border-box' };
    const lbl = { display:'block', fontSize:'12px', fontWeight:600, color:'var(--text-muted)', marginBottom:'4px' };

    if (showNew) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setShowNew(false)} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Raise a Support Ticket</h2>
                </div>

                <div className="section-card" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Subject *</label>
                            <input className="form-input" value={newForm.subject} onChange={e => setNewForm({ ...newForm, subject: e.target.value })} placeholder="Brief description of your issue" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Description *</label>
                            <textarea className="form-input" style={{ minHeight: '120px', resize: 'vertical' }} value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} placeholder="Describe your question or issue in detail..." />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Assign to Tutor *</label>
                            <select className="form-input" value={newForm.tutorId} onChange={e => setNewForm({ ...newForm, tutorId: e.target.value })}>
                                <option value="">Select Tutor</option>
                                {tutors.map(t => <option key={t.ID} value={t.ID}>{t.Name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createTicket} disabled={creating}>{creating ? 'Submitting...' : 'Submit Ticket'}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            {/* Header */}
            <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', display:'flex', alignItems:'center', gap:'10px' }}>
                        Support Tickets
                        <span style={{ fontSize:'14px', background:'var(--primary-light)', color:'var(--primary)', padding:'4px 10px', borderRadius:'20px', fontWeight:700 }}>{tickets.length}</span>
                    </h1>
                    <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Need help? Reach out to your tutors.</p>
                </div>
                <button className="btn btn-primary" style={{ padding:'10px 20px', fontSize:'14px', display:'flex', alignItems:'center', gap:'8px', borderRadius:'var(--radius-md)' }} onClick={() => setShowNew(true)}>
                    <Plus size={18} /> New Ticket
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) 2.5fr', gap: '24px', height: 'calc(100vh - 160px)', minHeight:'600px' }}>

                {/* Left panel — ticket list */}
                <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(26,174,100,0.03)' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>My Tickets</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight:500 }}>Ticket Queue</div>
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding:'0 12px' }}>
                        {['All', 'Open', 'In Progress', 'Closed'].map(s => (
                            <button key={s} onClick={() => setFilter(s)} style={{ flex: 1, padding: '14px 4px', border: 'none', background: 'none', fontSize: '12px', fontWeight: filter === s ? 700 : 500, color: filter === s ? 'var(--primary)' : 'var(--text-muted)', borderBottom: filter === s ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>{s}</button>
                        ))}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, background: 'var(--bg)', padding: '16px' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>Loading tickets...</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>No tickets found in this category.</div>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                                {filtered.map(t => {
                                    const sc = { bg:STATUS_BG[t.Status]||STATUS_BG['Open'], color:STATUS_COLOR[t.Status]||STATUS_COLOR['Open'] };
                                    const isActive = selected?.ID === t.ID;
                                    return (
                                        <div key={t.ID} onClick={() => openTicket(t)} style={{ padding: '18px', border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: isActive ? 'var(--primary-light)' : 'var(--surface)', transition: 'all 0.2s', boxShadow: isActive ? '0 2px 12px rgba(26,174,100,0.15)' : 'var(--shadow-sm)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start', gap: '12px' }}>
                                                <strong style={{ fontSize: '14px', flex: 1, color: isActive ? 'var(--primary-dark)' : 'var(--text-main)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.Subject}</strong>
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>{t.Status}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {t.TutorName && (
                                                        <>
                                                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg)', border:'1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>{t.TutorName.charAt(0)}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>To: {t.TutorName}</div>
                                                        </>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight:500 }}>{new Date(t.CreatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel — conversation */}
                <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    {!selected ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--surface)' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow:'0 4px 16px rgba(26,174,100,0.2)' }}>
                                <MessageSquare size={36} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 10px 0' }}>Select a Ticket</h3>
                            <p style={{ fontSize: '14px', margin: 0, maxWidth: '300px', textAlign: 'center', lineHeight: 1.5 }}>Choose a ticket from the inbox on the left to view details and reply to the tutor.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.4, flex: 1, paddingRight: '20px' }}>{selected.Subject}</h2>
                                    <span style={{ fontSize:'12px', fontWeight:700, padding:'6px 14px', borderRadius:'20px', background:STATUS_BG[selected.Status]||'#eee', color:STATUS_COLOR[selected.Status]||'#888' }}>{selected.Status}</span>
                                </div>
                                {selected.TutorName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', boxShadow:'0 2px 8px rgba(26,174,100,0.3)' }}>{selected.TutorName.charAt(0)}</div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{selected.TutorName}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>Assigned Tutor</span>
                                                <span>·</span>
                                                <span>Opened {new Date(selected.CreatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Area */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg)' }}>
                                {/* Original Query Bubble */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original Query</span>
                                    <div style={{ maxWidth: '85%', padding: '18px 24px', borderRadius: '4px 20px 20px 20px', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.6', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap', boxShadow: 'var(--shadow-sm)' }}>
                                        {selected.Description}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                    <span style={{ padding: '0 16px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Replies</span>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                </div>

                                {replies.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0', fontStyle:'italic' }}>No replies yet. Your tutor will respond soon.</div>
                                ) : (
                                    replies.map(r => {
                                        const isMine = r.AuthorID === user?.id;
                                        return (
                                            <div key={r.ID} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>{isMine ? 'You' : r.AuthorName} · {new Date(r.CreatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <div style={{ maxWidth: '85%', padding: '16px 20px', borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: isMine ? 'var(--primary)' : 'var(--surface)', color: isMine ? '#fff' : 'var(--text-main)', fontSize: '14px', lineHeight: '1.6', border: isMine ? 'none' : '1px solid var(--border-light)', whiteSpace: 'pre-wrap', boxShadow: isMine ? '0 4px 12px rgba(26,174,100,0.2)' : 'var(--shadow-sm)' }}>
                                                    {r.Message}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Reply Input */}
                            {selected.Status !== 'Closed' ? (
                                <div style={{ padding: '24px 28px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', transition: 'box-shadow 0.2s, border-color 0.2s', ...(replyText.trim() ? { borderColor:'var(--primary-dark)', boxShadow:'0 0 0 2px var(--primary-light)' } : {}) }}>
                                        <textarea
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply(); }}
                                            placeholder="Type your reply here... (Ctrl + Enter to send)"
                                            style={{ flex: 1, resize: 'none', minHeight: '60px', maxHeight: '200px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none', padding: '4px 0', lineHeight: 1.5, fontFamily:'inherit' }}
                                        />
                                        <button className="btn btn-primary" style={{ height: '44px', width: '44px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end', opacity: replyText.trim() ? 1 : 0.5, pointerEvents: replyText.trim() ? 'auto' : 'none', transition:'all 0.2s' }} onClick={sendReply} disabled={sending || !replyText.trim()} title="Send Reply">
                                            <Send size={18} style={{ marginLeft: '2px' }}/>
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'right' }}>
                                        Press <kbd style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'inherit', fontWeight:600, color:'var(--text-main)' }}>Ctrl</kbd> + <kbd style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'inherit', fontWeight:600, color:'var(--text-main)' }}>Enter</kbd> to send
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '32px', borderTop: '1px solid var(--border)', background: 'var(--bg)', textAlign: 'center' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--surface)', padding: '12px 24px', borderRadius: '30px', border: '1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
                                        <CheckCircle size={18} style={{ color: 'var(--primary)' }} /> This ticket has been resolved and closed.
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
