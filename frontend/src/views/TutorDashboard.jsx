import { useEffect, useState } from 'react';
import { Users, FileText, Video, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../api';

export default function TutorDashboard({ user }) {
    const [classes, setClasses]           = useState([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [pendingSubs, setPendingSubs]     = useState(0);
    const [openTickets, setOpenTickets]     = useState(0);
    const [recentSubs, setRecentSubs]       = useState([]);
    const [ticketList, setTicketList]       = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch all in parallel
                const [classRes, assignRes, ticketRes] = await Promise.all([
                    api.get('/courses/classes/my'),
                    api.get('/assignments'),
                    api.get('/tickets'),
                ]);

                const cls = classRes.data;
                setClasses(cls);

                // Total students = sum of StudentCount across all classes
                const studs = cls.reduce((s, c) => s + (parseInt(c.StudentCount) || 0), 0);
                setTotalStudents(studs);

                // Pending submissions = assignments with SubmissionCount > 0
                // We use SubmissionCount already returned, but also flag as "pending review" = has subs but may be ungraded
                // Better: count assignments that have ungraded submissions
                const pendingCount = assignRes.data.filter(a => (a.SubmissionCount || 0) > 0).length;
                setPendingSubs(pendingCount);

                // Fetch recent 5 submissions from all assignments
                const subPromises = assignRes.data.slice(0, 5).map(a =>
                    api.get(`/assignments/${a.ID}/submissions`).then(r => r.data.map(s => ({ ...s, AssignmentTitle: a.Title }))).catch(() => [])
                );
                const allSubs = (await Promise.all(subPromises)).flat();
                allSubs.sort((a, b) => new Date(b.SubmittedAt) - new Date(a.SubmittedAt));
                setRecentSubs(allSubs.slice(0, 5));

                // Tickets
                const tix = ticketRes.data;
                setOpenTickets(tix.filter(t => t.Status === 'Open').length);
                setTicketList(tix.filter(t => t.Status !== 'Closed').slice(0, 5));

            } catch (err) {
                console.error('Dashboard load error', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const stats = [
        { title: 'Total Students',      value: loading ? '—' : totalStudents,       icon: <Users size={20} />,        color: 'blue'   },
        { title: 'Assigned Classes',    value: loading ? '—' : classes.length,       icon: <Video size={20} />,        color: 'green'  },
        { title: 'Pending Submissions', value: loading ? '—' : pendingSubs,          icon: <FileText size={20} />,     color: 'yellow' },
        { title: 'Unresolved Doubts',   value: loading ? '—' : openTickets,          icon: <MessageSquare size={20}/>, color: 'red'    },
    ];

    const STATUS_COLOR = { Open:'#cc0000', 'In Progress':'#c07800', Closed:'#1aae64' };
    const STATUS_BG    = { Open:'#fff0f0', 'In Progress':'#fff6e0', Closed:'#e8f5ee' };

    return (
        <div className="content-wrapper">
            {error && (
                <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'16px', background:'var(--danger-bg)', color:'var(--danger)', borderRadius:'var(--radius-md)', marginBottom:'24px' }}>
                    <AlertCircle size={20}/>
                    <div><strong>Backend Connection Failed</strong><p style={{ fontSize:'13px', marginTop:'4px' }}>Could not reach the backend API. Please ensure the server is running.</p></div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="dashboard-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stats-card">
                        <div className="stats-info">
                            <h3>{stat.title}</h3>
                            <p>{stat.value}</p>
                        </div>
                        <div className={`stats-icon-wrapper ${stat.color}`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* My Classes Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title">My Assigned Classes</h2>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Batch Name</th>
                                <th>Course</th>
                                <th>Students</th>
                                <th>Modules</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign:'center', padding:'40px' }}>Loading...</td></tr>
                            ) : classes.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>No active classes assigned</td></tr>
                            ) : (
                                classes.map(cls => (
                                    <tr key={cls.ClassID}>
                                        <td><strong>{cls.BatchName}</strong></td>
                                        <td>{cls.CourseName}</td>
                                        <td>
                                            <span style={{ fontWeight:700, color:'var(--primary)' }}>{cls.StudentCount || 0}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight:700, color:'#6c3ccc' }}>{cls.ModuleCount || 0}</span>
                                        </td>
                                        <td><span className="status-badge success">Active</span></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', alignItems:'start' }}>
                {/* Recent Submissions */}
                <div className="section-card" style={{ marginBottom:0 }}>
                    <div className="section-header">
                        <h2 className="section-title">Recent Submissions</h2>
                    </div>
                    <div style={{ padding:'8px 20px' }}>
                        {loading ? (
                            <div style={{ padding:'12px 0', color:'var(--text-muted)', fontSize:'13px' }}>Loading...</div>
                        ) : recentSubs.length === 0 ? (
                            <div style={{ padding:'20px 0', textAlign:'center', color:'var(--text-muted)', border:'1px dashed var(--border)', borderRadius:'var(--radius-sm)' }}>No submissions yet.</div>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column' }}>
                                {recentSubs.map((s, i) => (
                                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 0', borderBottom: i < recentSubs.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                                        <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'13px', flexShrink:0 }}>
                                            {s.StudentName?.charAt(0) || '?'}
                                        </div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ fontWeight:600, fontSize:'13px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.StudentName}</div>
                                            <div style={{ fontSize:'11px', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.AssignmentTitle}</div>
                                        </div>
                                        <div style={{ fontSize:'11px', whiteSpace:'nowrap', flexShrink:0 }}>
                                            {s.Grade !== null
                                                ? <span style={{ fontWeight:700, color:'var(--primary)' }}>{s.Grade}/100</span>
                                                : <span style={{ color:'#c07800', fontWeight:600 }}>Ungraded</span>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Doubt Tickets */}
                <div className="section-card" style={{ marginBottom:0 }}>
                    <div className="section-header">
                        <h2 className="section-title">Doubt Tickets</h2>
                        {openTickets > 0 && (
                            <span style={{ background:'#cc0000', color:'#fff', fontWeight:700, fontSize:'11px', padding:'2px 8px', borderRadius:'20px', flexShrink:0 }}>{openTickets} Open</span>
                        )}
                    </div>
                    <div style={{ padding:'8px 20px' }}>
                        {loading ? (
                            <div style={{ padding:'12px 0', color:'var(--text-muted)', fontSize:'13px' }}>Loading...</div>
                        ) : ticketList.length === 0 ? (
                            <div style={{ padding:'20px 0', textAlign:'center', color:'var(--text-muted)', border:'1px dashed var(--border)', borderRadius:'var(--radius-sm)' }}>No active tickets. 🎉</div>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column' }}>
                                {ticketList.map((t, i) => {
                                    const sc = { bg: STATUS_BG[t.Status]||STATUS_BG['Open'], color: STATUS_COLOR[t.Status]||STATUS_COLOR['Open'] };
                                    return (
                                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 0', borderBottom: i < ticketList.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ fontWeight:600, fontSize:'13px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.Subject}</div>
                                                <div style={{ fontSize:'11px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'4px', flexWrap:'wrap', marginTop:'2px' }}>
                                                    {t.StudentCode && (
                                                        <span style={{ background:'var(--primary-light)', color:'var(--primary)', fontWeight:700, padding:'1px 5px', borderRadius:'3px', flexShrink:0 }}>{t.StudentCode}</span>
                                                    )}
                                                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.StudentName}</span>
                                                </div>
                                            </div>
                                            <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 8px', borderRadius:'20px', background:sc.bg, color:sc.color, whiteSpace:'nowrap', flexShrink:0 }}>{t.Status}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
