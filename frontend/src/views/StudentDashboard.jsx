import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Clock, HelpCircle, AlertCircle, MessageSquare, CreditCard, Calendar, LayoutDashboard } from 'lucide-react';
import api from '../api';

export default function StudentDashboard({ user }) {
    const [courses, setCourses]       = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [tickets, setTickets]       = useState([]);
    const [feeData, setFeeData]       = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [analytics, setAnalytics]   = useState({ avgGrade: null, avgQuiz: null, attendancePct: null });
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [classRes, assRes, ticketRes, feeRes, annRes, analyticsRes] = await Promise.all([
                    api.get('/courses/classes/my'),
                    api.get('/assignments'),
                    api.get('/tickets'),
                    api.get('/fees/my').catch(() => ({ data: null })),
                    api.get('/announcements').catch(() => ({ data: [] })),
                    api.get('/attendance/student/my_analytics').catch(() => ({ data: { avgGrade: null, avgQuiz: null, attendancePct: null } })),
                ]);
                setCourses(classRes.data);
                setAssignments(assRes.data);
                setTickets(ticketRes.data);
                setFeeData(feeRes.data);
                setAnnouncements(annRes.data.slice(0, 3));
                setAnalytics(analyticsRes.data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const now = new Date();
    const pending  = assignments.filter(a => !a.SubmissionID && new Date(a.DueDate) >= now);
    const openTickets = tickets.filter(t => t.Status === 'Open');

    const stats = [
        { title: 'Enrolled Classes',     value: loading ? '—' : courses.length,    icon: <BookOpen size={20}/>,     color:'blue'   },
        { title: 'Pending Assignments',  value: loading ? '—' : pending.length,     icon: <Clock size={20}/>,        color:'yellow' },
        { title: 'Unresolved Doubts',    value: loading ? '—' : openTickets.length, icon: <HelpCircle size={20}/>,   color:'green'  },
        { title: 'Announcements',        value: loading ? '—' : announcements.length, icon: <MessageSquare size={20}/>, color:'red' },
    ];

    const feeTotal   = feeData?.CourseFee  || 0;
    const feePaid    = feeData?.PaidAmount || 0;
    const feePending = feeTotal - feePaid;

    return (
        <div className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: 'none', margin: 0 }}>
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)' }}>
                    <AlertCircle size={20} />
                    <div>
                        <strong>Backend Connection Failed</strong>
                        <p style={{ fontSize: '13px', marginTop: '4px', margin: 0 }}>Ensure the Node server is running on port 5000.</p>
                    </div>
                </div>
            )}

            {/* Title */}
            <div>
                <h2 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LayoutDashboard size={24} style={{ color: 'var(--primary)' }} />
                    Student Dashboard
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Welcome back! Here's an overview of your progress.</p>
            </div>

            {/* KPIs Grid (3x2) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                    { title: 'Enrolled Classes',     value: loading ? '—' : courses.length,      icon: <BookOpen size={20}/>,     bg: 'rgba(0,119,204,0.08)', color: '#0077cc' },
                    { title: 'Pending Assignments',  value: loading ? '—' : pending.length,       icon: <Clock size={20}/>,        bg: 'rgba(192,112,0,0.08)', color: '#c07800' },
                    { title: 'Unresolved Doubts',    value: loading ? '—' : openTickets.length,   icon: <HelpCircle size={20}/>,   bg: 'rgba(26,174,100,0.08)', color: '#1aae64' },
                    { title: 'Announcements',        value: loading ? '—' : announcements.length, icon: <MessageSquare size={20}/>,bg: 'rgba(204,0,0,0.08)', color: '#cc0000' },
                    { title: 'Avg Assignment Grade', value: loading ? '—' : (analytics.avgGrade !== null ? `${analytics.avgGrade}/100` : 'N/A'), icon: <CheckCircle size={20}/>, bg: 'rgba(108,60,204,0.08)', color: '#6c3ccc' },
                    { title: 'Avg Quiz Score',       value: loading ? '—' : (analytics.avgQuiz !== null ? `${analytics.avgQuiz}%` : 'N/A'), icon: <CheckCircle size={20}/>, bg: 'rgba(224,40,140,0.08)', color: '#e0288c' }
                ].map((s, i) => (
                    <div key={i} style={{ padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                        <div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight:600 }}>{s.title}</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: s.color, lineHeight:1 }}>{s.value}</div>
                        </div>
                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                            {s.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Layout (Left: Content, Right: Summary/Fees) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
                
                {/* ─── LEFT COLUMN ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* My Enrolled Classes */}
                    <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>My Enrolled Classes</h2>
                            <span style={{ fontSize: '12px', background: 'var(--bg)', border: '1px solid var(--border)', padding: '2px 10px', borderRadius: '20px', fontWeight: 600 }}>{courses.length} Active</span>
                        </div>
                        {loading ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                        ) : courses.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>Not enrolled in any class yet.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {courses.map(c => (
                                    <div key={c.ClassID} style={{ padding: '16px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>{c.CourseName}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cohort: {c.BatchName} &bull; Tutor: {c.TutorName}</div>
                                        </div>
                                        <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>Enrolled</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pending Assignments Table */}
                    {!loading && pending.length > 0 && (
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display:'flex', alignItems:'center', gap:'8px' }}>
                                    <Clock size={18} style={{ color:'#c07800' }}/>
                                    Pending Assignments
                                </h2>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg)' }}>
                                            <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Title</th>
                                            <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Course / Module</th>
                                            <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Due Date</th>
                                            <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign:'right' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.map(a => {
                                            const isOverdue = a.DueDate ? new Date(a.DueDate) < new Date() : false;
                                            return (
                                                <tr key={a.ID} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{a.Title}</td>
                                                    <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                        <span style={{ color:'var(--text-main)', fontWeight:500 }}>{a.CourseName}</span><br/>
                                                        {a.ModuleTitle}
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <span style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-main)', fontWeight: 600, fontSize: '13px', padding:'4px 10px', background: isOverdue ? 'var(--danger-bg)' : 'transparent', borderRadius:'20px' }}>
                                                            {a.DueDate ? new Date(a.DueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>No Due Date</span>}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign:'right' }}>
                                                        <span style={{ background: 'var(--warning-bg)', color: 'var(--warning)', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', display:'inline-block' }}>Action Required</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── RIGHT COLUMN ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Fee Status Card */}
                    <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px', color: 'var(--text-main)' }}>Fee Status</h2>
                        {loading ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Loading fees...</div>
                        ) : !feeData ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>No fee records found.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Total Fee</span>
                                    <strong style={{ fontSize: '15px' }}>₹{Number(feeTotal).toLocaleString('en-IN')}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                                    <span style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: 600 }}>Paid</span>
                                    <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>₹{Number(feePaid).toLocaleString('en-IN')}</strong>
                                </div>
                                <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '99px', overflow: 'hidden', margin: '4px 0' }}>
                                    <div style={{ height: '100%', background: 'var(--primary)', borderRadius: '99px', width: feeTotal > 0 ? `${Math.min((feePaid/feeTotal)*100,100)}%` : '0%', transition:'width 1s ease-in-out' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: feePending > 0 ? 'var(--danger-bg)' : 'var(--bg)', border: feePending > 0 ? '1px solid rgba(204,0,0,0.1)' : '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                                    <span style={{ color: feePending > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Balance Due</span>
                                    <strong style={{ color: feePending > 0 ? 'var(--danger)' : 'var(--text-main)', fontSize: '15px' }}>₹{Number(feePending).toLocaleString('en-IN')}</strong>
                                </div>
                                
                                {feePending === 0 && (
                                    <div style={{ textAlign:'center', marginTop:'8px', fontSize:'13px', color:'var(--primary)', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                                        <CheckCircle size={14} /> Fees Fully Paid
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
