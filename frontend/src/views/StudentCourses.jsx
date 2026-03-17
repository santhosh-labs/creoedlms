import { useEffect, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Link2, CheckCircle, PlayCircle, FileText, MonitorPlay, AlertCircle, Clock } from 'lucide-react';
import api from '../api';

export default function StudentCourses({ user }) {
    const [classes, setClasses] = useState([]);
    const [modules, setModules] = useState({});
    const [expanded, setExpanded] = useState({});
    const [progress, setProgress] = useState({});
    const [loading, setLoading]  = useState(true);

    useEffect(() => {
        api.get('/courses/classes/my')
           .then(r => setClasses(r.data))
           .catch(() => {})
           .finally(() => setLoading(false));
    }, []);

    const loadModules = async (classId) => {
        if (modules[classId]) return;
        const [modRes, progRes] = await Promise.all([
            api.get(`/modules/${classId}`).catch(() => ({ data: [] })),
            api.get(`/progress/class/${classId}`).catch(() => ({ data: { completedIds:[], percentage:0 } }))
        ]);
        setModules(p => ({ ...p, [classId]: modRes.data }));
        setProgress(p => ({ ...p, [classId]: progRes.data }));
    };

    const toggle = (classId) => {
        setExpanded(p => {
            const next = !p[classId];
            if (next) loadModules(classId);
            return { ...p, [classId]: next };
        });
    };

    const toggleLesson = async (classId, lessonId, isCurrentlyCompleted) => {
        const nextState = !isCurrentlyCompleted;
        setProgress(p => {
            const cls = p[classId] || { completedIds:[], total:0 };
            const ids = nextState ? [...cls.completedIds, lessonId] : cls.completedIds.filter(id => id !== lessonId);
            const count = ids.length;
            const pct = cls.total === 0 ? 0 : Math.round((count / cls.total) * 100);
            return { ...p, [classId]: { ...cls, completedIds: ids, percentage: pct, count } };
        });

        try {
            await api.post(`/progress/lesson/${lessonId}`, { classId, isCompleted: nextState });
        } catch {
            alert('Failed to save progress.');
            loadModules(classId);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Video': return <MonitorPlay size={20} style={{ color: 'var(--primary)' }}/>;
            case 'Document': return <FileText size={20} style={{ color: '#f59e0b' }}/>;
            case 'Live Class': return <MonitorPlay size={20} style={{ color: '#ef4444' }}/>;
            case 'Link': return <Link2 size={20} style={{ color: '#6366f1' }}/>;
            default: return <PlayCircle size={20} style={{ color: 'var(--text-muted)' }}/>;
        }
    };

    return (
        <div className="content-wrapper" style={{ width: '100%', maxWidth: 'none', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                <h2 className="page-title" style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BookOpen size={24} style={{ color: 'var(--primary)' }}/>
                    My Learning Journey
                </h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {loading ? (
                    <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>Loading your learning journey...</div>
                ) : classes.length === 0 ? (
                    <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
                        <AlertCircle size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>No Active Enrollments</h3>
                        <p style={{ color: 'var(--text-muted)' }}>You are not currently enrolled in any programs.</p>
                    </div>
                ) : classes.map(cls => {
                    const prog = progress[cls.ClassID];
                    const isExpanded = expanded[cls.ClassID];
                    const isCompleted = prog?.percentage === 100;

                    return (
                        <div key={cls.ClassID} style={{ background: 'var(--surface)', border: isExpanded ? '1px solid var(--primary-light)' : '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.1)' : 'var(--shadow-sm)' }}>
                            
                            {/* Course Header Card */}
                            <div onClick={() => toggle(cls.ClassID)} style={{ padding: '24px 32px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '24px', userSelect: 'none', background: isExpanded ? 'linear-gradient(to right, rgba(26,174,100,0.05), transparent)' : 'transparent', borderBottom: isExpanded ? '1px solid var(--border)' : 'none' }}>
                                
                                <div style={{ minWidth: '56px', height: '56px', background: isExpanded ? 'var(--primary)' : 'rgba(26,174,100,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                                    <BookOpen size={28} style={{ color: isExpanded ? '#fff' : 'var(--primary)' }} />
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>{cls.CourseName}</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-light)' }} />
                                            Cohort: <strong style={{ color: 'var(--text-main)' }}>{cls.BatchName}</strong>
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-light)' }} />
                                            Instructor: <strong style={{ color: 'var(--text-main)' }}>{cls.TutorName}</strong>
                                        </span>
                                    </div>
                                </div>

                                {prog && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', minWidth: '220px' }}>
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: isCompleted ? 'var(--success)' : 'var(--text-main)', marginBottom: '6px' }}>
                                                {prog.percentage}% Completed
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '99px', overflow: 'hidden' }}>
                                                <div style={{ width: `${prog.percentage}%`, height: '100%', background: isCompleted ? 'var(--success)' : 'var(--primary)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                            </div>
                                        </div>
                                        <div style={{ padding: '6px 16px', borderRadius: '30px', background: isCompleted ? 'var(--success-bg)' : 'var(--bg)', border: `1px solid ${isCompleted ? 'rgba(26,174,100,0.2)' : 'var(--border)'}`, color: isCompleted ? 'var(--success)' : 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}>
                                            {isCompleted ? 'Completed' : 'Enrolled'}
                                        </div>
                                    </div>
                                )}
                                
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isExpanded ? 'var(--primary-light)' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isExpanded ? 'var(--primary-dark)' : 'var(--text-muted)', transition: 'all 0.3s', border: '1px solid var(--border)' }}>
                                    <ChevronDown size={20} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                </div>
                            </div>

                            {/* Accordion Content - Curriculum */}
                            {isExpanded && (
                                <div style={{ background: 'var(--bg)', padding: '32px' }}>
                                    {!modules[cls.ClassID] ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading curriculum securely...</div>
                                    ) : modules[cls.ClassID].length === 0 ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>Curriculum is currently being mapped and prepared.</div>
                                    ) : (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                                <div style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }} />
                                                <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course Curriculum</h4>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {modules[cls.ClassID].map((mod, i) => (
                                                    <div key={mod.ID} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                                        
                                                        {/* Module Header */}
                                                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)' }}>
                                                            <div style={{ minWidth: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                                                                {i + 1}
                                                            </div>
                                                            <div style={{ flex: 1, paddingTop: '4px' }}>
                                                                <strong style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.2px' }}>{mod.Title}</strong>
                                                                {mod.Description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>{mod.Description}</p>}
                                                            </div>
                                                        </div>

                                                        {/* Module Lessons */}
                                                        <div>
                                                            {(mod.lessons || []).length === 0 ? (
                                                                <div style={{ padding: '20px 24px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>No materials assigned to this module yet.</div>
                                                            ) : (
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        {mod.lessons.map((les, idx) => {
                                                                            const isPastLiveClass = String(les.Type).toUpperCase() === 'LIVE CLASS' && les.SessionDate && new Date(les.SessionDate) < new Date();
                                                                            const isLessonCompleted = isPastLiveClass || (prog?.completedIds || []).includes(les.ID);
                                                                            
                                                                            return (
                                                                                <div key={les.ID} style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', gap: '20px', borderBottom: idx !== mod.lessons.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'all 0.2s', background: isLessonCompleted ? 'rgba(26,174,100,0.02)' : 'transparent', ':hover': { background: 'var(--bg)' } }}>
                                                                                    
                                                                                    <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border-light)', opacity: isLessonCompleted ? 0.6 : 1 }}>
                                                                                        {getIcon(les.Type)}
                                                                                    </div>
                                                                                    
                                                                                    <div style={{ flex: 1 }}>
                                                                                        <div style={{ fontSize: '15px', fontWeight: 600, color: isLessonCompleted ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: isLessonCompleted ? 'line-through' : 'none', marginBottom: '4px' }}>
                                                                                            {les.Title}
                                                                                        </div>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{les.Type}</span>
                                                                                            {les.ContentUrl && les.ContentUrl !== 'TBD' && (
                                                                                                <>
                                                                                                    <span style={{ color: 'var(--border)' }}>•</span>
                                                                                                    <a href={les.ContentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                                        {String(les.Type).toUpperCase() === 'LIVE CLASS' ? 'Join Class' : 'View Material'} <ChevronRight size={14} />
                                                                                                    </a>
                                                                                                </>
                                                                                            )}
                                                                                            {les.SessionDate && String(les.Type).toUpperCase() === 'LIVE CLASS' && (
                                                                                                <>
                                                                                                    <span style={{ color: 'var(--border)' }}>•</span>
                                                                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                                                                        {new Date(les.SessionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                                                    </span>
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div>
                                                                                        {String(les.Type).toUpperCase() === 'LIVE CLASS' ? (
                                                                                            <div style={{ display: 'flex', alignItems: 'center', minWidth: '130px', justifyContent: 'center', gap: '8px', padding: '8px 16px', borderRadius: '30px', border: `1px solid ${isLessonCompleted ? 'var(--success)' : 'var(--border)'}`, background: isLessonCompleted ? 'var(--success-bg)' : 'var(--bg)', color: isLessonCompleted ? 'var(--success)' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                                                                                                {isLessonCompleted ? (
                                                                                                    <><CheckCircle size={16} /> Completed</>
                                                                                                ) : (
                                                                                                    <><Clock size={16} /> Scheduled</>
                                                                                                )}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <button 
                                                                                                onClick={() => toggleLesson(cls.ClassID, les.ID, (prog?.completedIds || []).includes(les.ID))} 
                                                                                                style={{ display: 'flex', alignItems: 'center', minWidth: '130px', justifyContent: 'center', gap: '8px', padding: '8px 16px', borderRadius: '30px', border: `1px solid ${isLessonCompleted ? 'var(--success)' : 'var(--border)'}`, background: isLessonCompleted ? 'var(--success-bg)' : 'var(--bg)', color: isLessonCompleted ? 'var(--success)' : 'var(--text-muted)', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', cursor: 'pointer', outline: 'none' }}
                                                                                            >
                                                                                                <CheckCircle size={16} />
                                                                                                {isLessonCompleted ? 'Completed' : 'Mark Done'}
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
