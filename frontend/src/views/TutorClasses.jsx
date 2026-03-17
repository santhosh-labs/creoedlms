import { useEffect, useState } from 'react';
import { Users, ChevronRight, BarChart2, ArrowLeft, Video, BookOpen, HelpCircle, CalendarCheck, TrendingUp } from 'lucide-react';

import api from '../api';

const STATUS_OPTS = ['Present', 'Absent', 'Late'];
const STATUS_COLOR = { Present:'#1aae64', Absent:'#cc0000', Late:'#c07800' };
const STATUS_BG    = { Present:'#e8f5ee', Absent:'#fff0f0', Late:'#fff6e0' };

// ─── Student Analytics Panel ─────────────────────────────────────────────────
function StudentAnalytics({ student, classId, onBack }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/attendance/student/${student.StudentID}/class/${classId}`)
            .then(r => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
    }, [student.StudentID, classId]);

    const avgGrade = (d) => {
        const graded = d.assignments.filter(a => a.Grade !== null);
        if (!graded.length) return null;
        return Math.round(graded.reduce((s, a) => s + parseFloat(a.Grade), 0) / graded.length);
    };
    const avgQuiz = (d) => {
        const attempted = d.quizzes.filter(q => q.Score !== null);
        if (!attempted.length) return null;
        return Math.round(attempted.reduce((s, q) => s + (q.Score / q.TotalMarks) * 100, 0) / attempted.length);
    };

    // Calculate attendance ONLY from live sessions that have a status marked
    const calcAttendance = (d) => {
        const markedSessions = d.attendance.filter(a => a.Status !== null && a.Status !== undefined && a.Status !== '');
        if (!markedSessions.length) return null;
        const presentCount = markedSessions.filter(a => a.Status === 'Present').length;
        return Math.round((presentCount / markedSessions.length) * 100);
    };

    if (loading) return (
        <div style={{ textAlign:'center', padding:'64px', color:'var(--text-muted)' }}>
            <BarChart2 size={32} style={{ marginBottom:'12px', opacity:0.3 }}/>
            <p style={{ margin:0 }}>Loading analytics...</p>
        </div>
    );
    if (!data) return (
        <div style={{ textAlign:'center', padding:'64px', color:'var(--danger)' }}>
            <p style={{ margin:0 }}>Failed to load analytics for this student.</p>
        </div>
    );

    const grade   = avgGrade(data);
    const quiz    = avgQuiz(data);
    const attPct  = calcAttendance(data);

    // Only 3 KPIs — no Course Progress
    const kpis = [
        {
            label: 'Live Session Attendance',
            value: attPct !== null ? attPct + '%' : 'N/A',
            sub: attPct !== null
                ? `${data.attendance.filter(a => a.Status === 'Present').length} of ${data.attendance.filter(a => a.Status).length} sessions`
                : 'No sessions marked yet',
            icon: <CalendarCheck size={18}/>,
            color: attPct === null ? '#888' : attPct >= 75 ? '#1aae64' : '#cc0000',
            bg:    attPct === null ? 'var(--bg)' : attPct >= 75 ? 'rgba(26,174,100,0.08)' : 'rgba(204,0,0,0.06)',
            iconBg: attPct === null ? 'var(--border)' : attPct >= 75 ? 'rgba(26,174,100,0.18)' : 'rgba(204,0,0,0.14)',
        },
        {
            label: 'Avg Assignment Grade',
            value: grade !== null ? grade + '/100' : 'N/A',
            sub: grade !== null
                ? `${data.assignments.filter(a => a.Grade !== null).length} graded`
                : 'No graded assignments',
            icon: <BookOpen size={18}/>,
            color: '#0077cc',
            bg: 'rgba(0,119,204,0.07)',
            iconBg: 'rgba(0,119,204,0.15)',
        },
        {
            label: 'Avg Quiz Score',
            value: quiz !== null ? quiz + '%' : 'N/A',
            sub: quiz !== null
                ? `${data.quizzes.filter(q => q.Score !== null).length} attempted`
                : 'No quizzes attempted',
            icon: <HelpCircle size={18}/>,
            color: '#6c3ccc',
            bg: 'rgba(108,60,204,0.07)',
            iconBg: 'rgba(108,60,204,0.15)',
        },
    ];

    return (
        <div>
            {/* ── Header ─────────────────────────────────────────────── */}
            <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)', display:'inline-flex', alignItems:'center', gap:'5px', fontWeight:600, fontSize:'13px', padding:0, marginBottom:'20px' }}>
                <ArrowLeft size={15}/> Back to Students
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'28px' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'20px', flexShrink:0, boxShadow:'0 2px 10px rgba(26,174,100,0.35)' }}>
                    {student.Name.charAt(0)}
                </div>
                <div>
                    <h2 style={{ margin:0, fontSize:'20px', fontWeight:700, color:'var(--text-main)' }}>{student.Name}</h2>
                    <span style={{ fontSize:'12px', background:'var(--primary-light)', color:'var(--primary)', padding:'2px 8px', borderRadius:'4px', fontWeight:700 }}>{student.StudentCode}</span>
                </div>
            </div>

            {/* ── KPI Cards (3 only) ─────────────────────────────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginBottom:'28px' }}>
                {kpis.map(k => (
                    <div key={k.label} style={{ background: k.bg, border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'20px', display:'flex', alignItems:'center', gap:'16px', boxShadow:'var(--shadow-sm)' }}>
                        <div style={{ width:'44px', height:'44px', borderRadius:'var(--radius-md)', background: k.iconBg, display:'flex', alignItems:'center', justifyContent:'center', color: k.color, flexShrink:0 }}>
                            {k.icon}
                        </div>
                        <div style={{ minWidth:0 }}>
                            <div style={{ fontSize:'24px', fontWeight:800, color: k.color, lineHeight:1 }}>{k.value}</div>
                            <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'4px', fontWeight:500 }}>{k.label}</div>
                            <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px', opacity:0.75 }}>{k.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Assignments & Quizzes ──────────────────────────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>
                {/* Assignments */}
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
                    <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px' }}>
                        <BookOpen size={15} style={{ color:'#0077cc' }}/>
                        <span style={{ fontWeight:700, fontSize:'14px' }}>Assignments</span>
                        <span style={{ marginLeft:'auto', fontSize:'11px', background:'rgba(0,119,204,0.1)', color:'#0077cc', fontWeight:700, padding:'2px 8px', borderRadius:'20px' }}>{data.assignments.length}</span>
                    </div>
                    <div style={{ padding:'8px 0' }}>
                        {data.assignments.length === 0 ? (
                            <p style={{ color:'var(--text-muted)', fontSize:'13px', textAlign:'center', padding:'20px 0' }}>No assignments yet</p>
                        ) : data.assignments.map((a, i) => {
                            const col = a.Grade !== null ? '#1aae64' : a.SubmittedAt ? '#c07000' : 'var(--text-muted)';
                            const val = a.Grade !== null ? `${a.Grade}/100` : a.SubmittedAt ? 'Ungraded' : 'Not submitted';
                            return (
                                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px', borderBottom: i < data.assignments.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'13px', color:'var(--text-main)' }}>{a.Title}</span>
                                    <span style={{ fontWeight:700, color: col, marginLeft:'12px', fontSize:'12px', flexShrink:0, background: a.Grade !== null ? 'rgba(26,174,100,0.08)' : 'transparent', padding:'2px 8px', borderRadius:'20px' }}>{val}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quizzes */}
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
                    <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px' }}>
                        <HelpCircle size={15} style={{ color:'#6c3ccc' }}/>
                        <span style={{ fontWeight:700, fontSize:'14px' }}>Quizzes</span>
                        <span style={{ marginLeft:'auto', fontSize:'11px', background:'rgba(108,60,204,0.1)', color:'#6c3ccc', fontWeight:700, padding:'2px 8px', borderRadius:'20px' }}>{data.quizzes.length}</span>
                    </div>
                    <div style={{ padding:'8px 0' }}>
                        {data.quizzes.length === 0 ? (
                            <p style={{ color:'var(--text-muted)', fontSize:'13px', textAlign:'center', padding:'20px 0' }}>No quizzes yet</p>
                        ) : data.quizzes.map((q, i) => {
                            const pct = q.Score !== null ? Math.round((q.Score / q.TotalMarks) * 100) : null;
                            return (
                                <div key={i} style={{ padding:'10px 18px', borderBottom: i < data.quizzes.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: pct !== null ? '6px' : 0 }}>
                                        <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'13px', color:'var(--text-main)' }}>{q.Title}</span>
                                        <span style={{ fontWeight:700, color: pct !== null ? '#6c3ccc' : 'var(--text-muted)', marginLeft:'12px', fontSize:'12px', flexShrink:0 }}>
                                            {pct !== null ? `${q.Score}/${q.TotalMarks}` : 'Not attempted'}
                                        </span>
                                    </div>
                                    {pct !== null && (
                                        <div style={{ height:'4px', background:'var(--border)', borderRadius:'10px', overflow:'hidden' }}>
                                            <div style={{ width:`${pct}%`, height:'100%', background:'#6c3ccc', borderRadius:'10px' }}/>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Session Attendance Table ───────────────────────────── */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
                <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px' }}>
                    <CalendarCheck size={15} style={{ color:'var(--primary)' }}/>
                    <span style={{ fontWeight:700, fontSize:'14px' }}>Live Session Attendance</span>
                    {data.attendance.length > 0 && (() => {
                        const marked = data.attendance.filter(a => a.Status);
                        const present = marked.filter(a => a.Status === 'Present').length;
                        const pct = marked.length ? Math.round((present / marked.length) * 100) : null;
                        return (
                            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
                                <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>{present}/{marked.length} Present</span>
                                {pct !== null && (
                                    <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background: pct >= 75 ? 'rgba(26,174,100,0.12)' : 'rgba(204,0,0,0.1)', color: pct >= 75 ? '#1aae64' : '#cc0000' }}>
                                        {pct}%
                                    </span>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {data.attendance.length === 0 ? (
                    <div style={{ padding:'32px', textAlign:'center', color:'var(--text-muted)', fontSize:'13px' }}>
                        No live sessions recorded yet.
                    </div>
                ) : (
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr style={{ background:'var(--bg)' }}>
                                <th style={{ padding:'10px 18px', textAlign:'left', fontSize:'11px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', width:'140px' }}>#</th>
                                <th style={{ padding:'10px 18px', textAlign:'left', fontSize:'11px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>Session</th>
                                <th style={{ padding:'10px 18px', textAlign:'left', fontSize:'11px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', width:'140px' }}>Date</th>
                                <th style={{ padding:'10px 18px', textAlign:'center', fontSize:'11px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', width:'120px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.attendance.map((a, i) => {
                                const statusColor = a.Status ? STATUS_COLOR[a.Status] : '#888';
                                const statusBg    = a.Status ? STATUS_BG[a.Status]    : 'var(--bg)';
                                return (
                                    <tr key={i} style={{ borderBottom: i < data.attendance.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                        <td style={{ padding:'12px 18px', fontSize:'13px', color:'var(--text-muted)', fontWeight:500 }}>
                                            {String(i + 1).padStart(2, '0')}
                                        </td>
                                        <td style={{ padding:'12px 18px', fontSize:'13px', color:'var(--text-main)', fontWeight:500, maxWidth:'260px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                            {a.Title || `Session ${i + 1}`}
                                        </td>
                                        <td style={{ padding:'12px 18px', fontSize:'13px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                                            {new Date(a.SessionDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                        </td>
                                        <td style={{ padding:'12px 18px', textAlign:'center' }}>
                                            <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', background: statusBg, color: statusColor, whiteSpace:'nowrap' }}>
                                                {a.Status || 'Not marked'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}



// ─── Attendance Marking Panel ─────────────────────────────────────────────────
function AttendancePanel({ session, onClose }) {
    const [students, setStudents] = useState([]);
    const [records, setRecords]   = useState({});
    const [saving, setSaving]     = useState(false);

    useEffect(() => {
        api.get(`/attendance/session/${session.ID}`).then(r => {
            setStudents(r.data);
            const init = {};
            r.data.forEach(s => { init[s.StudentID] = s.Status || 'Present'; });
            setRecords(init);
        }).catch(() => {});
    }, [session.ID]);

    const mark = (id, status) => setRecords(p => ({ ...p, [id]: status }));
    const markAll = (status) => { const u = {}; students.forEach(s => u[s.StudentID] = status); setRecords(u); };

    const save = async () => {
        setSaving(true);
        const payload = Object.entries(records).map(([studentId, status]) => ({ studentId: parseInt(studentId), status }));
        await api.post(`/attendance/session/${session.ID}`, { records: payload }).catch(() => {});
        setSaving(false);
        onClose();
    };

    // Full-page inline attendance panel
    return (
        <div className="content-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
                <button onClick={onClose} className="btn btn-secondary">← Back</button>
                <div>
                    <h2 className="page-title" style={{ margin: 0 }}>Mark Attendance</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{session.Title} · {new Date(session.SessionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
            </div>

            <div className="section-card" style={{ padding: '24px' }}>
                {/* Quick mark all */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: '4px', fontWeight: 500 }}>Mark all as:</span>
                    {STATUS_OPTS.map(s => (
                        <button key={s} onClick={() => markAll(s)} style={{ padding: '5px 14px', fontSize: '12px', fontWeight: 700, border: 'none', borderRadius: '20px', cursor: 'pointer', background: STATUS_BG[s], color: STATUS_COLOR[s] }}>{s}</button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {students.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No students enrolled in this class</div>
                    ) : (
                        students.map(s => (
                            <div key={s.StudentID} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                                    {s.Name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.Name}</div>
                                    <div style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '3px', fontWeight: 700, display: 'inline-block', marginTop: '2px' }}>{s.StudentCode}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {STATUS_OPTS.map(st => (
                                        <button key={st} onClick={() => mark(s.StudentID, st)} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700, border: '2px solid', borderColor: records[s.StudentID] === st ? STATUS_COLOR[st] : 'var(--border)', borderRadius: '20px', cursor: 'pointer', background: records[s.StudentID] === st ? STATUS_BG[st] : 'transparent', color: records[s.StudentID] === st ? STATUS_COLOR[st] : 'var(--text-muted)' }}>{st}</button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : `Save Attendance (${students.length} students)`}</button>
                </div>
            </div>
        </div>
    );
}

// ─── Class Detail View ────────────────────────────────────────────────────────
function ClassDetail({ cls, onBack }) {
    const [sessions, setSessions]   = useState([]);
    const [students, setStudents]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [tab, setTab]             = useState('sessions');
    const [attSession, setAttSession] = useState(null);
    const [viewStudent, setViewStudent] = useState(null);

    useEffect(() => {
        // Fetch sessions — then use the first session to get the student list for this class
        api.get(`/attendance/class/${cls.ClassID}/sessions`)
            .then(r => {
                setSessions(r.data);
                if (r.data.length > 0) {
                    // Use first session's attendance roll to get enrolled students (deduped)
                    api.get(`/attendance/session/${r.data[0].ID}`)
                        .then(res => {
                            // Deduplicate by StudentID just in case
                            const seen = new Set();
                            setStudents(res.data.filter(s => {
                                if (seen.has(s.StudentID)) return false;
                                seen.add(s.StudentID);
                                return true;
                            }));
                        })
                        .catch(() => {});
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [cls.ClassID]);

    if (attSession) return <AttendancePanel session={attSession} onClose={() => { setAttSession(null); api.get(`/attendance/class/${cls.ClassID}/sessions`).then(r => setSessions(r.data)); }} />;
    if (viewStudent) return (
        <div className="content-wrapper">
            <div className="section-card" style={{ padding:'28px' }}>
                <StudentAnalytics student={viewStudent} classId={cls.ClassID} onBack={() => setViewStudent(null)} />
            </div>
        </div>
    );

    return (
        <div>
            {/* ── Page Header ─────────────────────────────────────── */}
            <div style={{ marginBottom:'28px' }}>
                {/* Breadcrumb */}
                <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)', display:'inline-flex', alignItems:'center', gap:'5px', fontWeight:600, fontSize:'13px', padding:0, marginBottom:'14px' }}>
                    <ArrowLeft size={15}/> All Classes
                </button>

                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
                    <div>
                        <h1 style={{ margin:0, fontSize:'22px', fontWeight:700, color:'var(--text-main)' }}>{cls.BatchName}</h1>
                        <p style={{ margin:'5px 0 0', fontSize:'13px', color:'var(--text-muted)' }}>{cls.CourseName}</p>
                    </div>

                    {/* Stat pills */}
                    <div style={{ display:'flex', gap:'12px', flexShrink:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'10px 18px', boxShadow:'var(--shadow-sm)' }}>
                            <div style={{ width:'36px', height:'36px', borderRadius:'var(--radius-sm)', background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Users size={16} style={{ color:'var(--primary)' }}/>
                            </div>
                            <div>
                                <div style={{ fontSize:'20px', fontWeight:800, color:'var(--primary)', lineHeight:1 }}>{cls.StudentCount || 0}</div>
                                <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>Students</div>
                            </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'10px 18px', boxShadow:'var(--shadow-sm)' }}>
                            <div style={{ width:'36px', height:'36px', borderRadius:'var(--radius-sm)', background:'rgba(108,60,204,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Video size={16} style={{ color:'#6c3ccc' }}/>
                            </div>
                            <div>
                                <div style={{ fontSize:'20px', fontWeight:800, color:'#6c3ccc', lineHeight:1 }}>{sessions.length}</div>
                                <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>Sessions</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────── */}
            <div style={{ display:'flex', gap:'4px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'5px', marginBottom:'24px', width:'fit-content', boxShadow:'var(--shadow-sm)' }}>
                {[['sessions', 'Sessions & Attendance'], ['students', 'Students & Analytics']].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        style={{
                            padding:'8px 20px',
                            border:'none',
                            borderRadius:'var(--radius-sm)',
                            fontWeight: tab === key ? 600 : 400,
                            color: tab === key ? '#fff' : 'var(--text-muted)',
                            background: tab === key ? 'var(--primary)' : 'transparent',
                            cursor:'pointer',
                            fontSize:'13px',
                            transition:'all 0.15s',
                        }}
                    >{label}</button>
                ))}
            </div>

            {/* ── Sessions Tab ─────────────────────────────────────── */}
            {tab === 'sessions' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                    {loading ? (
                        <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)', background:'var(--surface)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>Loading sessions...</div>
                    ) : sessions.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)', background:'var(--surface)', borderRadius:'var(--radius-md)', border:'1px dashed var(--border)' }}>
                            <Video size={32} style={{ marginBottom:'12px', opacity:0.3 }}/>
                            <p style={{ margin:0 }}>No sessions scheduled yet. Add sessions from the Live Sessions page.</p>
                        </div>
                    ) : (
                        <>
                            {(() => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                const upcomingSessions = [];
                                const pastSessions = [];

                                sessions.forEach(s => {
                                    const sessionDate = new Date(s.SessionDate);
                                    sessionDate.setHours(0, 0, 0, 0);

                                    if (sessionDate < today) {
                                        pastSessions.push(s);
                                    } else {
                                        upcomingSessions.push(s);
                                    }
                                });

                                // Ensure past sessions are shown in reverse chronological (most recently past is at top)
                                pastSessions.sort((a, b) => new Date(b.SessionDate) - new Date(a.SessionDate));

                                const renderSessionCard = (s) => {
                                    const pct = s.TotalStudents > 0 ? Math.round((s.PresentCount / s.TotalStudents) * 100) : null;
                                    const marked = s.PresentCount > 0 || s.TotalStudents > 0;
                                    const attendanceColor = pct !== null ? (pct >= 75 ? '#1aae64' : '#cc0000') : 'var(--text-muted)';
                                    const attendanceBg   = pct !== null ? (pct >= 75 ? '#e8f5ee' : '#fff0f0') : 'var(--bg)';
                        return (
                            <div key={s.ID} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'20px 24px', display:'flex', alignItems:'center', gap:'18px', boxShadow:'var(--shadow-sm)' }}>
                                {/* Date badge */}
                                <div style={{ width:'52px', height:'56px', borderRadius:'var(--radius-md)', background:'var(--primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(26,174,100,0.3)' }}>
                                    <span style={{ fontSize:'20px', fontWeight:800, color:'#fff', lineHeight:1 }}>{new Date(s.SessionDate).getDate()}</span>
                                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'2px' }}>
                                        {new Date(s.SessionDate).toLocaleDateString('en-IN', { month:'short' })}
                                    </span>
                                </div>

                                {/* Session info */}
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontWeight:700, fontSize:'15px', color:'var(--text-main)', marginBottom:'4px' }}>{s.Title}</div>
                                    <div style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'10px' }}>
                                        {s.SessionTime && <span style={{ marginRight:'10px' }}>🕙 {s.SessionTime}</span>}
                                        {s.TotalStudents > 0 && (
                                            <span>
                                                {s.PresentCount}/{s.TotalStudents} students present
                                            </span>
                                        )}
                                    </div>
                                    {/* Attendance progress bar */}
                                    {s.TotalStudents > 0 && (
                                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                            <div style={{ flex:1, height:'5px', background:'var(--border)', borderRadius:'10px', overflow:'hidden' }}>
                                                <div style={{ width:`${pct}%`, height:'100%', background: pct >= 75 ? 'var(--primary)' : '#cc0000', borderRadius:'10px', transition:'width 0.4s ease' }}/>
                                            </div>
                                            <span style={{ fontSize:'11px', fontWeight:700, color: attendanceColor, background: attendanceBg, padding:'2px 8px', borderRadius:'20px', flexShrink:0 }}>
                                                {pct}%
                                            </span>
                                        </div>
                                    )}
                                    {s.TotalStudents === 0 && (
                                        <span style={{ fontSize:'11px', color:'var(--text-muted)', fontStyle:'italic' }}>Attendance not yet marked</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
                                    {s.MeetingLink && (
                                        <a href={s.MeetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'13px' }}>
                                            <Video size={13}/> Join
                                        </a>
                                    )}
                                    <button
                                        className="btn btn-primary"
                                        style={{ fontSize:'13px', whiteSpace:'nowrap' }}
                                        onClick={() => setAttSession(s)}
                                    >
                                        {marked ? 'Edit Attendance' : 'Mark Attendance'}
                                    </button>
                                </div>
                            </div>
                        );
                    };

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Upcoming / Active Sessions */}
                            {upcomingSessions.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Upcoming & Active Classes</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {upcomingSessions.map(renderSessionCard)}
                                    </div>
                                </div>
                            )}

                            {/* Past Sessions */}
                            {pastSessions.length > 0 && (
                                <div style={{ opacity: upcomingSessions.length > 0 ? 0.8 : 1 }}>
                                    <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Past Classes</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {pastSessions.map(renderSessionCard)}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
                        </>
                    )}
                </div>
            )}

            {/* ── Students Tab ─────────────────────────────────────── */}
            {tab === 'students' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                    {students.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)', background:'var(--surface)', borderRadius:'var(--radius-md)', border:'1px dashed var(--border)' }}>
                            <Users size={32} style={{ marginBottom:'12px', opacity:0.3 }}/>
                            <p style={{ margin:0 }}>No students enrolled yet.</p>
                        </div>
                    ) : students.map(s => (
                        <div
                            key={s.StudentID}
                            onClick={() => setViewStudent(s)}
                            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px', cursor:'pointer', boxShadow:'var(--shadow-sm)', transition:'box-shadow 0.15s, transform 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'16px', flexShrink:0 }}>
                                {s.Name.charAt(0)}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontWeight:600, fontSize:'14px', color:'var(--text-main)' }}>{s.Name}</div>
                                <div style={{ marginTop:'3px' }}>
                                    <span style={{ fontSize:'11px', background:'var(--primary-light)', color:'var(--primary)', padding:'1px 7px', borderRadius:'4px', fontWeight:700 }}>{s.StudentCode}</span>
                                </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--primary)', fontSize:'13px', fontWeight:600, flexShrink:0 }}>
                                <BarChart2 size={15}/> View Analytics <ChevronRight size={15}/>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Classes List ────────────────────────────────────────────────────────
export default function TutorClasses({ user }) {
    const [classes, setClasses]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get('/courses/classes/my').then(r => setClasses(r.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (selected) return <div className="content-wrapper"><ClassDetail cls={selected} onBack={()=>setSelected(null)}/></div>;

    return (
        <div className="content-wrapper">
            {/* Page Header */}
            <div style={{ marginBottom:'32px' }}>
                <h1 style={{ margin:0, fontSize:'22px', fontWeight:700, color:'var(--text-main)' }}>My Classes</h1>
                <p style={{ margin:'6px 0 0', fontSize:'13px', color:'var(--text-muted)' }}>
                    {loading ? 'Loading...' : `${classes.length} class${classes.length !== 1 ? 'es' : ''} assigned to you`}
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign:'center', padding:'64px', color:'var(--text-muted)', background:'var(--surface)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                    Loading your classes...
                </div>
            ) : classes.length === 0 ? (
                <div style={{ textAlign:'center', padding:'64px', color:'var(--text-muted)', background:'var(--surface)', borderRadius:'var(--radius-md)', border:'1px dashed var(--border)' }}>
                    <Users size={36} style={{ marginBottom:'14px', opacity:0.35 }}/>
                    <p style={{ margin:0, fontWeight:500, fontSize:'15px' }}>No classes assigned yet.</p>
                </div>
            ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'24px' }}>
                    {classes.map(cls => (
                        <div
                            key={cls.ClassID}
                            onClick={() => setSelected(cls)}
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'box-shadow 0.2s, transform 0.15s',
                                boxShadow: 'var(--shadow-sm)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {/* Green accent top strip */}
                            <div style={{ height:'4px', background:'linear-gradient(90deg, var(--primary), #0d7a44)' }} />

                            <div style={{ padding:'28px 24px 20px' }}>
                                {/* Card header row */}
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
                                    <div style={{ flex:1, minWidth:0, paddingRight:'12px' }}>
                                        <h3 style={{ margin:0, fontSize:'17px', fontWeight:700, color:'var(--text-main)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                            {cls.BatchName}
                                        </h3>
                                        <p style={{ margin:'6px 0 0', fontSize:'13px', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                            {cls.CourseName}
                                        </p>
                                    </div>
                                    <span className="status-badge success" style={{ flexShrink:0 }}>Active</span>
                                </div>

                                {/* Stats chips */}
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'24px' }}>
                                    <div style={{ background:'var(--primary-light)', borderRadius:'var(--radius-md)', padding:'16px 18px' }}>
                                        <div style={{ fontSize:'28px', fontWeight:800, color:'var(--primary)', lineHeight:1 }}>
                                            {cls.StudentCount || 0}
                                        </div>
                                        <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'6px', fontWeight:500 }}>
                                            Students
                                        </div>
                                    </div>
                                    <div style={{ background:'rgba(108,60,204,0.08)', borderRadius:'var(--radius-md)', padding:'16px 18px' }}>
                                        <div style={{ fontSize:'28px', fontWeight:800, color:'#6c3ccc', lineHeight:1 }}>
                                            {cls.ModuleCount || 0}
                                        </div>
                                        <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'6px', fontWeight:500 }}>
                                            Modules
                                        </div>
                                    </div>
                                </div>

                                {/* Footer CTA */}
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px', color:'var(--primary)', fontSize:'13px', fontWeight:600, paddingTop:'14px', borderTop:'1px solid var(--border-light)' }}>
                                    View Details <ChevronRight size={15}/>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
