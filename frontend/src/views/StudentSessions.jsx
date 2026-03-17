import { useEffect, useState } from 'react';
import { Calendar, Video } from 'lucide-react';
import api from '../api';

export default function StudentSessions({ user }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [tab, setTab]           = useState('upcoming');

    useEffect(() => {
        api.get('/sessions').then(r => setSessions(r.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const upcoming = sessions.filter(s => new Date(s.SessionDate + 'T' + s.SessionTime) >= now);
    const past     = sessions.filter(s => new Date(s.SessionDate + 'T' + s.SessionTime) < now);
    const display  = tab === 'upcoming' ? upcoming : past;

    const fmt = (d, t) => {
        const dt = new Date(d + 'T' + t);
        return dt.toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }) + ' · ' + dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
    };

    return (
        <div className="content-wrapper">
            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title"><Calendar size={18} style={{ marginRight:'8px', verticalAlign:'middle' }}/>Live Sessions</h2>
                </div>

                <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:'20px' }}>
                    {[['upcoming', `Upcoming (${upcoming.length})`], ['past', `Past (${past.length})`]].map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)} style={{ padding:'8px 20px', border:'none', background:'none', fontWeight:tab===key?700:400, color:tab===key?'var(--primary)':'var(--text-muted)', borderBottom:tab===key?'2px solid var(--primary)':'2px solid transparent', cursor:'pointer', fontSize:'14px', marginBottom:'-1px' }}>{label}</button>
                    ))}
                </div>

                {loading ? <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)' }}>Loading...</div>
                : display.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)', border:'1px dashed var(--border)', borderRadius:'var(--radius-md)' }}>
                        {tab === 'upcoming' ? 'No upcoming sessions scheduled yet.' : 'No past sessions found.'}
                    </div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                        {display.map(s => {
                            const isPast = new Date(s.SessionDate + 'T' + s.SessionTime) < now;
                            return (
                                <div key={s.ID} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 18px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', opacity: isPast ? 0.7 : 1 }}>
                                    <div style={{ width:'52px', height:'52px', borderRadius:'var(--radius-sm)', background: isPast ? '#ccc' : 'var(--primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        <span style={{ fontSize:'20px', fontWeight:800, color:'#fff', lineHeight:1 }}>{new Date(s.SessionDate).getDate()}</span>
                                        <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.85)', textTransform:'uppercase' }}>{new Date(s.SessionDate).toLocaleDateString('en-IN',{month:'short'})}</span>
                                    </div>
                                    <div style={{ flex:1 }}>
                                        <div style={{ fontWeight:700, fontSize:'15px' }}>{s.Title}</div>
                                        <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'3px' }}>{s.BatchName} · {s.CourseName} · {fmt(s.SessionDate, s.SessionTime)}</div>
                                    </div>
                                    {s.MeetingLink && !isPast && (
                                        <a href={s.MeetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'7px 16px', fontSize:'13px', textDecoration:'none', fontWeight:700 }}>
                                            <Video size={14}/>Join Now
                                        </a>
                                    )}
                                    {isPast && <span style={{ fontSize:'12px', color:'var(--text-muted)', fontStyle:'italic' }}>Completed</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
