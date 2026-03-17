import { useEffect, useState } from 'react';
import { FileText, HelpCircle, X, CheckCircle, Upload } from 'lucide-react';
import api from '../api';

export default function StudentAssignments({ user }) {
    const [tab, setTab]             = useState('assignments');
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes]     = useState([]);
    const [loading, setLoading]     = useState(true);

    // Submit modal
    const [submitModal, setSubmitModal] = useState(null);
    const [fileUrl, setFileUrl]         = useState('');
    const [submitting, setSubmitting]   = useState(false);
    const [submitMsg, setSubmitMsg]     = useState('');

    // Quiz modal
    const [quizModal, setQuizModal]     = useState(null);
    const [questions, setQuestions]     = useState([]);
    const [answers, setAnswers]         = useState({});
    const [quizResult, setQuizResult]   = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizSubmitting, setQuizSubmitting] = useState(false);

    const fetchAll = () => {
        setLoading(true);
        Promise.all([api.get('/assignments'), api.get('/quizzes')])
            .then(([a, q]) => { setAssignments(a.data); setQuizzes(q.data); })
            .catch(() => {}).finally(() => setLoading(false));
    };

    useEffect(() => { fetchAll(); }, []);

    const submitAssignment = async () => {
        if (!fileUrl.trim()) return setSubmitMsg('Please enter a file URL or link.');
        setSubmitting(true); setSubmitMsg('');
        try {
            await api.post(`/assignments/${submitModal.ID}/submit`, { fileUrl });
            setSubmitModal(null); setFileUrl('');
            fetchAll();
        } catch (e) { setSubmitMsg(e.response?.data?.message || 'Submission failed.'); }
        finally { setSubmitting(false); }
    };

    const openQuiz = async (q) => {
        if (q.AttemptID) return; // already attempted
        setQuizModal(q); setAnswers({}); setQuizResult(null);
        setQuizLoading(true);
        const r = await api.get(`/quizzes/${q.ID}/questions`).catch(() => ({ data: [] }));
        setQuestions(r.data);
        setQuizLoading(false);
    };

    const submitQuiz = async () => {
        setQuizSubmitting(true);
        const payload = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId: parseInt(questionId), selectedOption }));
        try {
            const r = await api.post(`/quizzes/${quizModal.ID}/attempt`, { answers: payload });
            setQuizResult(r.data);
            fetchAll();
        } catch (e) { alert('Quiz submission failed'); }
        finally { setQuizSubmitting(false); }
    };

    const now = new Date();
    const isOverdue = (d) => d ? new Date(d) < now : false;

    const inp = { width:'100%', padding:'9px 13px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'14px', background:'var(--bg)', color:'var(--text)', boxSizing:'border-box' };
    const lbl = { display:'block', fontSize:'12px', fontWeight:600, color:'var(--text-muted)', marginBottom:'4px' };

    if (quizModal) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setQuizModal(null)} className="btn btn-secondary">← Back</button>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{quizModal.Title}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                            {quizModal.CourseName} • {quizModal.QuestionCount} questions
                        </p>
                    </div>
                </div>

                <div className="section-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
                    {quizResult ? (
                        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: quizResult.score / quizResult.totalMarks >= 0.6 ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <CheckCircle size={40} color={quizResult.score / quizResult.totalMarks >= 0.6 ? 'var(--success)' : 'var(--danger)'} />
                            </div>
                            <h2 style={{ fontWeight: 600, fontSize: '28px', marginBottom: '8px' }}>You scored {quizResult.score} / {quizResult.totalMarks}</h2>
                            <p style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '32px' }}>
                                {Math.round(quizResult.score / quizResult.totalMarks * 100)}% Accuracy
                            </p>
                            <button className="btn btn-primary" onClick={() => { setQuizModal(null); setQuizResult(null); }}>Return to Quizzes</button>
                        </div>
                    ) : quizLoading ? (
                        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading questions...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {questions.map((q, i) => (
                                <div key={q.ID}>
                                    <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px', color: 'var(--text-main)' }}>
                                        {i + 1}. {q.Question} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '13px', marginLeft: '8px' }}>({q.Marks} mark{q.Marks !== 1 ? 's' : ''})</span>
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {['A', 'B', 'C', 'D'].filter(o => q['Option' + o]).map(opt => (
                                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${answers[q.ID] === opt ? 'var(--primary)' : 'var(--border)'}`, background: answers[q.ID] === opt ? 'var(--bg)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                <input type="radio" name={`q_${q.ID}`} value={opt} checked={answers[q.ID] === opt} onChange={() => setAnswers(p => ({ ...p, [q.ID]: opt }))} style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                                                <span style={{ fontSize: '15px' }}>{q['Option' + opt]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                                <button className="btn btn-primary" onClick={submitQuiz} disabled={quizSubmitting || Object.keys(answers).length < questions.length}>
                                    {quizSubmitting ? 'Submitting...' : `Submit Quiz (${Object.keys(answers).length}/${questions.length})`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (submitModal) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setSubmitModal(null)} className="btn btn-secondary">← Back</button>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Submit Assignment</h2>
                    </div>
                </div>

                <div className="section-card" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>{submitModal.Title}</h3>
                    {submitModal.AttachmentInstructions && <div style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', marginBottom: '24px', color: 'var(--text-muted)' }}>{submitModal.AttachmentInstructions}</div>}
                    
                    {submitMsg && <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontSize: '14px' }}>{submitMsg}</div>}
                    
                    <div style={{ marginBottom: '24px' }}>
                        <label style={lbl}>Submission Link (Google Drive, GitHub, etc.) *</label>
                        <input style={inp} type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button className="btn btn-secondary" onClick={() => setSubmitModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={submitAssignment} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Work'}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            <h2 className="page-title" style={{ marginBottom: '24px' }}>Coursework</h2>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                {[['assignments', 'Assignments'], ['quizzes', 'Quizzes']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{ padding: '12px 4px', border: 'none', background: 'none', fontWeight: tab === key ? 500 : 400, color: tab === key ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '15px', marginBottom: '-1px' }}>{label}</button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {tab === 'assignments' && (
                    <>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading assignments...</div>
                        ) : assignments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                <FileText size={48} style={{ color: 'var(--border)', marginBottom: '16px' }} />
                                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>No assignments available</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                {assignments.map(a => {
                                    const submitted = !!a.SubmissionID;
                                    const overdue = isOverdue(a.DueDate);
                                    return (
                                        <div key={a.ID} style={{ display: 'flex', flexDirection: 'column', padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', transition: 'all 0.3s', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                                            
                                            {/* Top: Icon & Title */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                                                <div style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '12px', background: 'rgba(26,174,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FileText size={20} style={{ color: 'var(--primary)' }} />
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', lineHeight: 1.4 }} title={a.Title}>{a.Title}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {a.CourseName} <span style={{ margin: '0 4px', color: 'var(--border)' }}>•</span> {a.ModuleTitle}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Stats */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px 0', borderTop: '1px dashed var(--border-light)', borderBottom: '1px dashed var(--border-light)', marginBottom: '20px' }}>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Date</span>
                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: overdue && !submitted ? 'var(--danger)' : 'var(--text-main)' }}>
                                                        {a.DueDate ? new Date(a.DueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : <span style={{ color: 'var(--text-muted)' }}>No Due Date</span>}
                                                    </span>
                                                </div>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                                                    <div>
                                                        {a.Status === 'Rework' ? <span style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '24px', fontSize: '12px', fontWeight: 600 }}>Needs Rework</span>
                                                            : submitted ? <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '4px 10px', borderRadius: '24px', fontSize: '12px', fontWeight: 600 }}>Submitted</span>
                                                                : overdue ? <span style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '4px 10px', borderRadius: '24px', fontSize: '12px', fontWeight: 600 }}>Overdue</span>
                                                                    : <span style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '24px', fontSize: '12px', fontWeight: 600 }}>Pending</span>
                                                        }
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grade</span>
                                                    <div>
                                                        {submitted && a.Grade !== null ? (
                                                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{a.Grade}<span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '2px' }}>/100</span></div>
                                                        ) : a.Status === 'Rework' ? (
                                                            <span style={{ fontSize: '13px', color: 'var(--warning)', fontWeight: 600 }}>Rework</span>
                                                        ) : submitted ? (
                                                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting</span>
                                                        ) : (
                                                            <span style={{ fontSize: '13px', color: 'var(--border)' }}>—</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                                {a.Status === 'Rework' && a.Feedback && (
                                                    <div style={{ background: 'var(--warning-bg)', border: '1px dashed var(--warning)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-main)' }}>
                                                        <strong style={{ display: 'block', color: 'var(--warning)', marginBottom: '4px' }}>Tutor Remark:</strong>
                                                        {a.Feedback}
                                                    </div>
                                                )}

                                            {/* Bottom: Action */}
                                            <div style={{ marginTop: 'auto' }}>
                                                {((!submitted && !overdue) || a.Status === 'Rework') && (
                                                    <button className="btn btn-primary" style={{ padding: '10px 0', fontSize: '14px', borderRadius: '8px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: a.Status === 'Rework' ? 'var(--warning)' : 'var(--primary)' }} onClick={() => { setSubmitModal(a); setFileUrl(''); setSubmitMsg(''); }}>
                                                        <Upload size={16} style={{ marginRight: '8px' }} />
                                                        {a.Status === 'Rework' ? 'Resubmit Work' : 'Submit Work'}
                                                    </button>
                                                )}
                                                {submitted && a.FileUrl && a.Status !== 'Rework' && (
                                                    <a href={a.FileUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 0', fontSize: '14px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 600, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg)'}>
                                                        <FileText size={16} style={{ marginRight: '8px' }} /> View File
                                                    </a>
                                                )}
                                                {overdue && !submitted && (
                                                    <button className="btn btn-secondary" style={{ padding: '10px 0', fontSize: '14px', borderRadius: '8px', width: '100%', cursor: 'not-allowed', color: 'var(--danger)', opacity: 0.8 }} disabled>
                                                        Submission Closed
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {tab === 'quizzes' && (
                    <>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading quizzes...</div>
                        ) : quizzes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                <HelpCircle size={48} style={{ color: 'var(--border)', marginBottom: '16px' }} />
                                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>No quizzes available</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                {quizzes.map(q => {
                                    const attempted = q.AttemptID !== null;
                                    const passed = attempted && (q.Score / q.TotalMarks >= 0.6);
                                    return (
                                        <div key={q.ID} style={{ display: 'flex', flexDirection: 'column', padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', transition: 'all 0.3s', boxShadow: 'var(--shadow-sm)' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                                            
                                            {/* Top: Icon & Title */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                                                <div style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '12px', background: 'rgba(26,174,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <HelpCircle size={20} style={{ color: 'var(--primary)' }} />
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', lineHeight: 1.4 }} title={q.Title}>{q.Title}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {q.CourseName} <span style={{ margin: '0 4px', color: 'var(--border)' }}>•</span> {q.ModuleTitle}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Stats */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px 0', borderTop: '1px dashed var(--border-light)', borderBottom: '1px dashed var(--border-light)', marginBottom: '20px' }}>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Questions</span>
                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                                                        {q.QuestionCount || 0}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Marks</span>
                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                                                        {q.TotalMarks} pts
                                                    </span>
                                                </div>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                                                    <div>
                                                        {attempted ? <span style={{ background: passed ? 'var(--success-bg)' : 'var(--danger-bg)', color: passed ? 'var(--success)' : 'var(--danger)', padding: '4px 10px', borderRadius: '24px', fontSize: '12px', fontWeight: 600 }}>{passed ? 'Passed' : 'Completed'}</span>
                                                                : <span style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '24px', fontSize: '12px', fontWeight: 600 }}>Unattempted</span>
                                                        }
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Score</span>
                                                    <div>
                                                        {attempted && q.Score !== null ? (
                                                            <div style={{ fontSize: '15px', fontWeight: 700, color: passed ? 'var(--success)' : 'var(--danger)' }}>{q.Score}<span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '2px' }}>/ {q.TotalMarks}</span></div>
                                                        ) : (
                                                            <span style={{ fontSize: '13px', color: 'var(--border)' }}>—</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom: Action */}
                                            <div style={{ marginTop: 'auto' }}>
                                                {!attempted ? (
                                                    <button className="btn btn-primary" style={{ padding: '10px 0', fontSize: '14px', borderRadius: '8px', width: '100%' }} onClick={() => openQuiz(q)}>
                                                        Start Quiz
                                                    </button>
                                                ) : (
                                                    <div style={{ padding: '10px 0', width: '100%', textAlign: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: passed ? 'var(--success)' : 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                        <CheckCircle size={16} /> {passed ? 'Quiz Passed' : 'Quiz Completed'}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
