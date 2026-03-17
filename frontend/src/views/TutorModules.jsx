import { useEffect, useState } from 'react';
import { BookOpen, Plus, ChevronDown, ChevronRight, AlertCircle, Trash2, X, Link2 } from 'lucide-react';
import api from '../api';

const emptyModule = { title: '', description: '' };
const emptyLesson = { title: '', type: 'Video', contentUrl: '', sessionDate: '', sessionTime: '', meetingLink: '' };

export default function TutorModules({ user }) {
    const [classes, setClasses]     = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [modules, setModules]     = useState([]);
    const [loading, setLoading]     = useState(false);
    const [expanded, setExpanded]   = useState({});

    // Module modal
    const [showModMod, setShowModMod] = useState(false);
    const [modForm, setModForm]       = useState(emptyModule);
    const [modSaving, setModSaving]   = useState(false);
    const [editingModuleId, setEditingModuleId] = useState(null);

    // Lesson modal
    const [lessonModal, setLessonModal] = useState(null); // moduleId or null
    const [lesForm, setLesForm]         = useState(emptyLesson);
    const [lesSaving, setLesSaving]     = useState(false);
    const [editingLessonId, setEditingLessonId] = useState(null);

    useEffect(() => {
        api.get('/courses/classes/my').then(r => {
            setClasses(r.data);
            if (r.data.length > 0) setSelectedClass(String(r.data[0].ClassID));
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedClass) return;
        setLoading(true);
        api.get(`/modules/${selectedClass}`)
            .then(r => setModules(r.data))
            .catch(() => setModules([]))
            .finally(() => setLoading(false));
    }, [selectedClass]);

    const saveModule = async (e) => {
        e.preventDefault();
        setModSaving(true);
        try {
            if (editingModuleId) {
                await api.put(`/modules/${editingModuleId}`, modForm);
            } else {
                await api.post('/modules', { classId: selectedClass, ...modForm });
            }
            setShowModMod(false); setModForm(emptyModule); setEditingModuleId(null);
            const r = await api.get(`/modules/${selectedClass}`);
            setModules(r.data);
        } catch (err) { alert(err.response?.data?.message || 'Failed to save module'); }
        finally { setModSaving(false); }
    };

    const saveLesson = async (e) => {
        e.preventDefault();
        setLesSaving(true);
        try {
            const isLive = lesForm.type === 'Live Class';
            // For Live Class, contentUrl = meetingLink; otherwise use contentUrl
            const contentUrl = isLive ? (lesForm.meetingLink || 'TBD') : lesForm.contentUrl;
            
            if (editingLessonId) {
                await api.put(`/modules/lessons/${editingLessonId}`, {
                    title: lesForm.title, type: lesForm.type, contentUrl,
                    classId: selectedClass,
                    sessionDate: isLive ? lesForm.sessionDate : undefined,
                    sessionTime: isLive ? lesForm.sessionTime : undefined,
                    meetingLink: isLive ? (lesForm.meetingLink || null) : undefined,
                });
            } else {
                await api.post(`/modules/${lessonModal}/lessons`, { title: lesForm.title, type: lesForm.type, contentUrl });
                // Also create a Session for the class if it's a Live Class (only on creation for now)
                if (isLive && lesForm.sessionDate && lesForm.sessionTime) {
                    await api.post('/sessions', {
                        classId: selectedClass,
                        title: lesForm.title,
                        sessionDate: lesForm.sessionDate,
                        sessionTime: lesForm.sessionTime,
                        meetingLink: lesForm.meetingLink || null,
                    }).catch(() => {}); // non-fatal if session fails
                }
            }

            setLessonModal(null); setLesForm(emptyLesson); setEditingLessonId(null);
            const r = await api.get(`/modules/${selectedClass}`);
            setModules(r.data);
        } catch (err) { alert(err.response?.data?.message || 'Failed to save lesson'); }
        finally { setLesSaving(false); }
    };

    const deleteModule = async (moduleId) => {
        if (!window.confirm('Are you sure you want to delete this module and all its lessons?')) return;
        try {
            await api.delete(`/modules/${moduleId}`);
            setModules(modules.filter(m => m.ID !== moduleId));
        } catch (err) { alert('Failed to delete module'); }
    };

    const deleteLesson = async (lessonId) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await api.delete(`/modules/lessons/${lessonId}`);
            const r = await api.get(`/modules/${selectedClass}`);
            setModules(r.data);
        } catch (err) { alert('Failed to delete lesson'); }
    };

    const inp = { width:'100%', padding:'9px 13px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'14px', background:'var(--bg)', color:'var(--text)', boxSizing:'border-box' };
    const lbl = { display:'block', fontSize:'12px', fontWeight:600, color:'var(--text-muted)', marginBottom:'4px' };

    const typeColor = { Video:'#0077cc', Document:'#c07800', Link:'#6c3ccc', 'Live Class':'#e03c00' };

    if (showModMod) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => { setShowModMod(false); setEditingModuleId(null); setModForm(emptyModule); }} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>{editingModuleId ? 'Edit Module' : 'Add New Module'}</h2>
                </div>

                <div className="section-card" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
                    <form onSubmit={saveModule} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Module Title *</label>
                            <input className="form-input" value={modForm.title} onChange={e => setModForm({ ...modForm, title: e.target.value })} required placeholder="e.g. Introduction to Python" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Description</label>
                            <textarea className="form-input" style={{ minHeight: '100px', resize: 'vertical' }} value={modForm.description} onChange={e => setModForm({ ...modForm, description: e.target.value })} placeholder="Optional description" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => { setShowModMod(false); setEditingModuleId(null); setModForm(emptyModule); }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={modSaving}>{modSaving ? 'Saving...' : editingModuleId ? 'Save Changes' : 'Add Module'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (lessonModal) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => { setLessonModal(null); setEditingLessonId(null); setLesForm(emptyLesson); }} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>{editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}</h2>
                </div>

                <div className="section-card" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
                    <form onSubmit={saveLesson} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Lesson Title *</label>
                            <input className="form-input" value={lesForm.title} onChange={e => setLesForm({ ...lesForm, title: e.target.value })} required placeholder="e.g. Session 1 — Introduction" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Type *</label>
                            <select className="form-input" value={lesForm.type} onChange={e => setLesForm({ ...lesForm, type: e.target.value })}>
                                <option>Video</option>
                                <option>Document</option>
                                <option>Link</option>
                                <option>Live Class</option>
                            </select>
                        </div>

                        {lesForm.type === 'Live Class' ? (
                            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {!editingLessonId && <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--primary)' }}>Note: This will also schedule a Live Session for this class</p>}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Date {!editingLessonId && '*'}</label>
                                        <input className="form-input" type="date" value={lesForm.sessionDate} onChange={e => setLesForm({ ...lesForm, sessionDate: e.target.value })} required={!editingLessonId} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Time {!editingLessonId && '*'}</label>
                                        <input className="form-input" type="time" value={lesForm.sessionTime} onChange={e => setLesForm({ ...lesForm, sessionTime: e.target.value })} required={!editingLessonId} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Meeting Link (Google Meet / Zoom)</label>
                                    <input className="form-input" type="url" value={lesForm.meetingLink} onChange={e => setLesForm({ ...lesForm, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Content URL *</label>
                                <input className="form-input" type="url" value={lesForm.contentUrl} onChange={e => setLesForm({ ...lesForm, contentUrl: e.target.value })} required placeholder="https://..." />
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => { setLessonModal(null); setEditingLessonId(null); setLesForm(emptyLesson); }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={lesSaving}>{lesSaving ? 'Saving...' : editingLessonId ? 'Save Changes' : lesForm.type === 'Live Class' ? 'Schedule Live Class' : 'Add Lesson'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            <h2 className="page-title" style={{ marginBottom: '24px' }}>Modules & Lessons</h2>
            <div className="section-card">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
                        <select className="form-input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: '100%' }}>
                            {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.BatchName} — {c.CourseName}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModMod(true)} disabled={!selectedClass}>
                        + Add Module
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading...</div>
                ) : modules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', margin: '24px', border: '1px dashed var(--border)' }}>
                        No modules yet for this class. Click "Add Module" to get started.
                    </div>
                ) : (
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {modules.map((mod, i) => (
                                <div key={mod.ID} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <div onClick={() => setExpanded(p => ({ ...p, [mod.ID]: !p[mod.ID] }))} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer', background: 'var(--surface)', userSelect: 'none', transition: 'background 0.2s' }}>
                                        {expanded[mod.ID] ? <div style={{ color: 'var(--primary)', transform: 'rotate(90deg)' }}>▶</div> : <div style={{ color: 'var(--text-muted)' }}>▶</div>}
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 600, fontSize: '15px' }}>Module {i + 1}: {mod.Title}</span>
                                            {mod.Description && <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>{mod.Description}</span>}
                                        </div>
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{(mod.lessons || []).length} lesson{(mod.lessons || []).length !== 1 ? 's' : ''}</span>
                                        <button className="btn btn-secondary" onClick={e => { e.stopPropagation(); setLessonModal(mod.ID); setLesForm(emptyLesson); setEditingLessonId(null); }}>
                                            + Lesson
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingModuleId(mod.ID); setModForm({ title: mod.Title, description: mod.Description }); setShowModMod(true); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px', fontSize: '13px', fontWeight: 600 }}>
                                            Edit
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteModule(mod.ID); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} title="Delete Module">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    {expanded[mod.ID] && (
                                        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                                            {(mod.lessons || []).length === 0 ? (
                                                <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>No lessons yet in this module.</div>
                                            ) : (
                                                (mod.lessons || []).map((les) => (
                                                    <div key={les.ID} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{les.Type}</span>
                                                        <span style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>{les.Title}</span>
                                                        {les.ContentUrl && les.ContentUrl !== 'TBD' && (
                                                            <a href={les.ContentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                                                                {les.Type === 'Live Class' ? 'Join Class' : 'View Content'}
                                                            </a>
                                                        )}
                                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                                                            <button onClick={() => { setEditingLessonId(les.ID); setLessonModal(mod.ID); setLesForm({ title: les.Title, type: les.Type, contentUrl: les.ContentUrl !== 'TBD' && les.Type !== 'Live Class' ? les.ContentUrl : '', meetingLink: les.Type === 'Live Class' && les.ContentUrl !== 'TBD' ? les.ContentUrl : '', sessionDate: les.SessionDate ? les.SessionDate.split('T')[0] : '', sessionTime: les.SessionDate ? new Date(les.SessionDate).toTimeString().slice(0,5) : '' }); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px', fontSize: '13px', fontWeight: 600 }}>
                                                                Edit
                                                            </button>
                                                            <button onClick={() => deleteLesson(les.ID)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} title="Delete Lesson">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
