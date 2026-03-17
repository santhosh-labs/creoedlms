import { useEffect, useState } from 'react';
import { FileText, Plus, Trash2, Eye, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api';

// ─── Quiz Builder (full-page) ──────────────────────────────────────────────────
const emptyQ = { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', marks: 1 };

function QuizBuilder({ classes, onClose, onSaved }) {
    const [modules, setModules]   = useState([]);
    const [classId, setClassId]   = useState('');
    const [form, setForm]         = useState({ moduleId: '', title: '', description: '' });
    const [questions, setQuestions] = useState([{ ...emptyQ }]);
    const [saving, setSaving]     = useState(false);
    const [err, setErr]           = useState('');

    const lbl = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' };

    const loadModules = (cid) => { setClassId(cid); setForm(f => ({ ...f, moduleId: '' })); api.get(`/modules/${cid}`).then(r => setModules(r.data)).catch(() => setModules([])); };
    const addQ  = () => setQuestions(p => [...p, { ...emptyQ }]);
    const remQ  = (i) => setQuestions(p => p.filter((_, j) => j !== i));
    const updQ  = (i, k, v) => setQuestions(p => p.map((q, j) => j === i ? { ...q, [k]: v } : q));

    const save = async () => {
        setErr('');
        if (!form.moduleId || !form.title) return setErr('Module and Title are required');
        if (questions.some(q => !q.question || !q.optionA || !q.optionB)) return setErr('All questions need at least Question, Option A and Option B');
        setSaving(true);
        try {
            await api.post('/quizzes', { ...form, questions });
            onSaved();
        } catch (e) { setErr(e.response?.data?.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    return (
        <div className="content-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <button onClick={onClose} className="btn btn-secondary">← Back</button>
                <h2 className="page-title" style={{ margin: 0 }}>Create Quiz</h2>
            </div>

            <div className="section-card" style={{ maxWidth: '760px', margin: '0 auto', padding: '32px' }}>
                {err && (
                    <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={14}/> {err}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Meta fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={lbl}>Class *</label>
                            <select className="form-input" value={classId} onChange={e => loadModules(e.target.value)}>
                                <option value=''>Select Class</option>
                                {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.BatchName} — {c.CourseName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Module *</label>
                            <select className="form-input" value={form.moduleId} onChange={e => setForm({ ...form, moduleId: e.target.value })}>
                                <option value=''>Select Module</option>
                                {modules.map(m => <option key={m.ID} value={m.ID}>{m.Title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={lbl}>Quiz Title *</label>
                        <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Week 1 Quiz" />
                    </div>
                    <div>
                        <label style={lbl}>Description</label>
                        <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional instructions for students..." />
                    </div>

                    {/* Questions */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <strong style={{ fontSize: '15px' }}>Questions ({questions.length})</strong>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '12px' }}>Total Marks: {questions.reduce((s, q) => s + (parseInt(q.marks) || 1), 0)}</span>
                            </div>
                            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={addQ}>
                                <Plus size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Add Question
                            </button>
                        </div>

                        {questions.map((q, i) => (
                            <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>Question {i + 1}</strong>
                                    {questions.length > 1 && (
                                        <button onClick={() => remQ(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label style={lbl}>Question *</label>
                                        <textarea className="form-input" style={{ minHeight: '60px', resize: 'vertical' }} value={q.question} onChange={e => updQ(i, 'question', e.target.value)} placeholder="Enter your question..." />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {['A', 'B', 'C', 'D'].map(opt => (
                                            <div key={opt}>
                                                <label style={{ ...lbl, color: q.correctOption === opt ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                    Option {opt} {q.correctOption === opt && '✓ Correct'}
                                                </label>
                                                <input
                                                    className="form-input"
                                                    style={{ borderColor: q.correctOption === opt ? 'var(--primary)' : 'var(--border)' }}
                                                    value={q['option' + opt]}
                                                    onChange={e => updQ(i, 'option' + opt, e.target.value)}
                                                    placeholder={opt === 'C' || opt === 'D' ? 'Optional' : 'Required'}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={lbl}>Correct Answer *</label>
                                            <select className="form-input" value={q.correctOption} onChange={e => updQ(i, 'correctOption', e.target.value)}>
                                                {['A', 'B', 'C', 'D'].filter(o => o === 'A' || o === 'B' || q['option' + o]).map(o => <option key={o} value={o}>Option {o}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={lbl}>Marks</label>
                                            <input className="form-input" type="number" min="1" max="100" value={q.marks} onChange={e => updQ(i, 'marks', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create Quiz'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Assignment Form (full-page) ──────────────────────────────────────────────
const emptyForm = { moduleId: '', title: '', description: '', dueDate: '', attachmentInstructions: '' };

function AssignmentModal({ classes, onClose, onSaved }) {
    const [modules, setModules] = useState([]);
    const [form, setForm]       = useState(emptyForm);
    const [saving, setSaving]   = useState(false);
    const [err, setErr]         = useState('');
    const lbl = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' };

    const handleCreate = async (e) => {
        e.preventDefault(); setErr('');
        if (!form.moduleId || !form.title) return setErr('Module and Title are required.');
        setSaving(true);
        try { await api.post('/assignments', form); onSaved(); }
        catch (e) { setErr(e.response?.data?.message || 'Failed to create assignment'); }
        finally { setSaving(false); }
    };

    return (
        <div className="content-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <button onClick={onClose} className="btn btn-secondary">← Back</button>
                <h2 className="page-title" style={{ margin: 0 }}>New Assignment</h2>
            </div>

            <div className="section-card" style={{ maxWidth: '640px', margin: '0 auto', padding: '32px' }}>
                {err && (
                    <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={14}/> {err}
                    </div>
                )}

                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={lbl}>Class *</label>
                        <select className="form-input" onChange={e => { setForm(f => ({ ...f, moduleId: '' })); api.get(`/modules/${e.target.value}`).then(r => setModules(r.data)).catch(() => setModules([])); }} required>
                            <option value=''>Select Class</option>
                            {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.BatchName} — {c.CourseName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Module *</label>
                        <select className="form-input" value={form.moduleId} onChange={e => setForm({ ...form, moduleId: e.target.value })} required>
                            <option value=''>Select Module</option>
                            {modules.map(m => <option key={m.ID} value={m.ID}>{m.Title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Title *</label>
                        <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Week 1 Exercise" />
                    </div>
                    <div>
                        <label style={lbl}>Description</label>
                        <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this assignment..." />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={lbl}>Due Date</label>
                            <input className="form-input" type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                        </div>
                        <div>
                            <label style={lbl}>Submission Instructions</label>
                            <input className="form-input" value={form.attachmentInstructions} onChange={e => setForm({ ...form, attachmentInstructions: e.target.value })} placeholder="e.g. Upload PDF" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Assignment'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Submissions Viewer (full-page) ───────────────────────────────────────────
function SubsViewer({ assignment, onClose }) {
    const [subs, setSubs] = useState([]);
    const [grading, setGrading] = useState(null);
    const [gf, setGf] = useState({ grade: '', feedback: '' });

    useEffect(() => { api.get(`/assignments/${assignment.ID}/submissions`).then(r => setSubs(r.data)).catch(() => {}); }, [assignment.ID]);

    const saveGrade = async () => {
        await api.put(`/assignments/submissions/${grading.ID}/grade`, gf).catch(() => {});
        setGrading(null);
        api.get(`/assignments/${assignment.ID}/submissions`).then(r => setSubs(r.data));
    };

    const markRework = async () => {
        if (!gf.feedback) {
            alert('Please provide feedback/remark detailing what needs to be reworked.');
            return;
        }
        await api.put(`/assignments/submissions/${grading.ID}/rework`, { remark: gf.feedback }).catch(() => {});
        setGrading(null);
        api.get(`/assignments/${assignment.ID}/submissions`).then(r => setSubs(r.data));
    };

    return (
        <div className="content-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <button onClick={onClose} className="btn btn-secondary">← Back</button>
                <div>
                    <h2 className="page-title" style={{ margin: 0 }}>{assignment.Title}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Student Submissions</p>
                </div>
            </div>

            <div className="section-card">
                {subs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
                        <FileText size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <div style={{ fontSize: '15px', fontWeight: 500 }}>No submissions yet</div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>ID</th>
                                    <th>Submission</th>
                                    <th>Grade</th>
                                    <th>Feedback</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subs.map(s => (
                                    <tr key={s.ID}>
                                        <td><strong>{s.StudentName}</strong></td>
                                        <td><span style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>{s.StudentCode}</span></td>
                                        <td><a href={s.FileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }}>View File</a></td>
                                        <td>
                                            {s.Status === 'Rework' ? (
                                                <span style={{ color: 'var(--warning)', fontSize: '12px', fontSize: '12px', fontWeight: 600, background: 'var(--warning-bg)', padding: '2px 8px', borderRadius: '4px' }}>Rework Requested</span>
                                            ) : s.Grade != null ? (
                                                <strong style={{ color: 'var(--primary)' }}>{s.Grade}/100</strong>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not graded</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.Feedback || '—'}</td>
                                        <td>
                                            <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => { setGrading(s); setGf({ grade: s.Grade || '', feedback: s.Feedback || '' }); }}>
                                                {s.Grade != null ? 'Update Grade' : 'Grade'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {grading && (
                    <div style={{ marginTop: '24px', padding: '24px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}>
                        <strong style={{ fontSize: '15px', display: 'block', marginBottom: '16px' }}>Grading: {grading.StudentName}</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Grade /100</label>
                                <input className="form-input" type="number" min="0" max="100" value={gf.grade} onChange={e => setGf({ ...gf, grade: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Feedback</label>
                                <input className="form-input" value={gf.feedback} onChange={e => setGf({ ...gf, feedback: e.target.value })} placeholder="Comments for the student..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setGrading(null)}>Cancel</button>
                            <button className="btn btn-secondary" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' }} onClick={markRework}>Request Rework</button>
                            <button className="btn btn-primary" onClick={saveGrade}>Save Grade</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TutorAssignments() {
    const [tab, setTab]             = useState('assignments');
    const [classes, setClasses]     = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [showAssModal, setShowAssModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [viewSubs, setViewSubs]   = useState(null);

    const fetchAll = () => {
        setLoading(true);
        Promise.all([api.get('/assignments'), api.get('/quizzes')])
            .then(([a, q]) => { setAssignments(a.data); setQuizzes(q.data); })
            .catch(() => {}).finally(() => setLoading(false));
    };

    useEffect(() => { fetchAll(); api.get('/courses/classes/my').then(r => setClasses(r.data)).catch(() => {}); }, []);

    const delAssignment = async (id) => { if (!window.confirm('Delete this assignment?')) return; await api.delete(`/assignments/${id}`).catch(() => {}); fetchAll(); };
    const delQuiz       = async (id) => { if (!window.confirm('Delete this quiz?')) return; await api.delete(`/quizzes/${id}`).catch(() => {}); fetchAll(); };
    const isOverdue     = (d) => d ? new Date(d) < new Date() : false;

    // ── Full-page sub-views ────────────────────────────────────────────────────
    if (showAssModal)  return <AssignmentModal classes={classes} onClose={() => setShowAssModal(false)} onSaved={() => { setShowAssModal(false); fetchAll(); }} />;
    if (showQuizModal) return <QuizBuilder     classes={classes} onClose={() => setShowQuizModal(false)} onSaved={() => { setShowQuizModal(false); fetchAll(); }} />;
    if (viewSubs)      return <SubsViewer      assignment={viewSubs} onClose={() => setViewSubs(null)} />;

    return (
        <div className="content-wrapper">
            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title">
                        {tab === 'assignments' ? <FileText size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> : <HelpCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />}
                        {tab === 'assignments' ? 'Assignments' : 'Quizzes'}
                    </h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {tab === 'assignments'
                            ? <button className="btn btn-primary" onClick={() => setShowAssModal(true)}><Plus size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />New Assignment</button>
                            : <button className="btn btn-primary" onClick={() => setShowQuizModal(true)}><Plus size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />New Quiz</button>
                        }
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
                    {[['assignments', 'Assignments'], ['quizzes', 'Quizzes']].map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 24px', border: 'none', background: 'none', fontWeight: tab === key ? 600 : 500, color: tab === key ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: '14px', marginBottom: '-1px', transition: 'all 0.2s' }}>{label}</button>
                    ))}
                </div>

                {/* Assignments Table */}
                {tab === 'assignments' && (
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Title</th><th>Module / Course</th><th>Due Date</th><th>Submissions</th><th>Actions</th></tr></thead>
                            <tbody>
                                {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
                                : assignments.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No assignments created yet.</td></tr>
                                : assignments.map(a => (
                                    <tr key={a.ID}>
                                        <td><strong>{a.Title}</strong></td>
                                        <td>
                                            <span style={{ fontSize: '13px' }}>{a.CourseName}</span><br />
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.ModuleTitle}</span>
                                        </td>
                                        <td>
                                            <span style={{ color: isOverdue(a.DueDate) ? 'var(--danger)' : 'var(--text)', fontWeight: isOverdue(a.DueDate) ? 600 : 400 }}>
                                                {a.DueDate ? new Date(a.DueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : <span style={{ color: 'var(--text-muted)' }}>No Due Date</span>}
                                            </span>
                                            {isOverdue(a.DueDate) && <span className="status-badge danger" style={{ marginLeft: '8px' }}>Overdue</span>}
                                        </td>
                                        <td>
                                            <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', padding: '3px 10px', borderRadius: '20px' }}>{a.SubmissionCount || 0}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setViewSubs(a)}>
                                                    <Eye size={13} /> View
                                                </button>
                                                <button className="icon-button" style={{ color: 'var(--danger)', width: '32px', height: '32px' }} onClick={() => delAssignment(a.ID)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Quizzes Table */}
                {tab === 'quizzes' && (
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Title</th><th>Module / Course</th><th>Questions</th><th>Total Marks</th><th>Attempts</th><th>Actions</th></tr></thead>
                            <tbody>
                                {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</td></tr>
                                : quizzes.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No quizzes created yet.</td></tr>
                                : quizzes.map(q => (
                                    <tr key={q.ID}>
                                        <td>
                                            <strong>{q.Title}</strong>
                                            {q.Description && <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{q.Description}</p>}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '13px' }}>{q.CourseName}</span><br />
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.ModuleTitle}</span>
                                        </td>
                                        <td><span style={{ background: '#e8f0ff', color: '#6c3ccc', fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: '20px' }}>{q.QuestionCount || 0}</span></td>
                                        <td><strong>{q.TotalMarks}</strong></td>
                                        <td><span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: '20px' }}>{q.AttemptCount || 0}</span></td>
                                        <td><button className="icon-button" style={{ color: 'var(--danger)', width: '32px', height: '32px' }} onClick={() => delQuiz(q.ID)}><Trash2 size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
