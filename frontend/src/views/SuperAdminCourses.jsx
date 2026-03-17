import { useEffect, useState } from 'react';
import { BookOpen, AlertCircle, Plus, X, Users, RefreshCw } from 'lucide-react';
import api from '../api';

export default function SuperAdminCourses() {
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Add Course modal
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [courseForm, setCourseForm] = useState({ courseCode: '', name: '', description: '', totalFee: '' });
    const [courseLoading, setCourseLoading] = useState(false);

    // Add Batch modal
    const [showAddBatch, setShowAddBatch] = useState(false);
    const [batchForm, setBatchForm] = useState({ courseId: '', tutorId: '', batchName: '' });
    const [batchLoading, setBatchLoading] = useState(false);

    // Change Tutor modal
    const [changeTutorClass, setChangeTutorClass] = useState(null); // holds the selected class object
    const [newTutorId, setNewTutorId] = useState('');
    const [changeTutorLoading, setChangeTutorLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [coursesRes, classesRes, tutorsRes] = await Promise.all([
                api.get('/courses'),
                api.get('/courses/classes/my'),
                api.get('/courses/tutors'),
            ]);
            setCourses(coursesRes.data);
            setClasses(classesRes.data);
            setTutors(tutorsRes.data);
        } catch (err) {
            console.error('Failed to load courses', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddCourse = async (e) => {
        e.preventDefault();
        if (!courseForm.name || !courseForm.totalFee || !courseForm.courseCode) {
            return alert('Course Code, Name and Fee are all required.');
        }
        setCourseLoading(true);
        try {
            await api.post('/courses', {
                courseCode: courseForm.courseCode.toUpperCase().trim(),
                name: courseForm.name,
                description: courseForm.description,
                totalFee: parseFloat(courseForm.totalFee),
            });
            setCourseForm({ courseCode: '', name: '', description: '', totalFee: '' });
            setShowAddCourse(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create course.');
        } finally {
            setCourseLoading(false);
        }
    };

    const handleAddBatch = async (e) => {
        e.preventDefault();
        if (!batchForm.courseId || !batchForm.tutorId || !batchForm.batchName) {
            return alert('Please fill in all batch fields.');
        }
        setBatchLoading(true);
        try {
            await api.post(`/courses/${batchForm.courseId}/classes`, {
                tutorId: parseInt(batchForm.tutorId),
                batchName: batchForm.batchName,
            });
            setBatchForm({ courseId: '', tutorId: '', batchName: '' });
            setShowAddBatch(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create batch.');
        } finally {
            setBatchLoading(false);
        }
    };

    const handleChangeTutor = async (e) => {
        e.preventDefault();
        if (!newTutorId || !changeTutorClass) return;
        setChangeTutorLoading(true);
        try {
            await api.put(`/courses/classes/${changeTutorClass.ClassID}/tutor`, { tutorId: parseInt(newTutorId) });
            setChangeTutorClass(null);
            setNewTutorId('');
            fetchData();
            const banner = document.createElement('div');
            banner.textContent = '✓ Tutor updated successfully';
            Object.assign(banner.style, { position: 'fixed', top: '20px', right: '20px', background: 'var(--primary)', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 9999, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' });
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update tutor.');
        } finally {
            setChangeTutorLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (showAddCourse) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setShowAddCourse(false)} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Create New Course</h2>
                </div>
                <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
                    <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Code * <span style={{ fontSize: '11px', fontWeight: 400 }}>(e.g. DS101)</span></label>
                            <input className="form-input" placeholder="e.g. DS101, WEB202" value={courseForm.courseCode} onChange={e => setCourseForm({ ...courseForm, courseCode: e.target.value })} style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Name *</label>
                            <input className="form-input" placeholder="e.g. Full Stack Web Development" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Description</label>
                            <textarea className="form-input" placeholder="Brief description of this course (optional)" value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} rows={4} style={{ resize: 'vertical' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Course Fee (₹) *</label>
                            <input className="form-input" type="number" min="0" placeholder="e.g. 25000" value={courseForm.totalFee} onChange={e => setCourseForm({ ...courseForm, totalFee: e.target.value })} required />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAddCourse(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={courseLoading}>{courseLoading ? 'Saving...' : 'Create Course'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (showAddBatch) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setShowAddBatch(false)} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Create New Batch</h2>
                </div>
                <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
                    <form onSubmit={handleAddBatch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course *</label>
                            <select className="form-input" value={batchForm.courseId} onChange={e => setBatchForm({ ...batchForm, courseId: e.target.value })} required>
                                <option value="">Select a Course</option>
                                {courses.map(c => <option key={c.ID} value={c.ID}>[{c.CourseCode}] {c.Name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Batch Name *</label>
                            <input className="form-input" placeholder="e.g. Batch A – Jan 2025" value={batchForm.batchName} onChange={e => setBatchForm({ ...batchForm, batchName: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Assign Tutor *</label>
                            <select className="form-input" value={batchForm.tutorId} onChange={e => setBatchForm({ ...batchForm, tutorId: e.target.value })} required>
                                <option value="">Select a Tutor</option>
                                {tutors.length === 0 ? <option disabled>No tutors found – add tutors first</option> : tutors.map(t => <option key={t.ID} value={t.ID}>{t.Name} ({t.Email})</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAddBatch(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={batchLoading}>{batchLoading ? 'Saving...' : 'Create Batch'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (changeTutorClass) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => { setChangeTutorClass(null); setNewTutorId(''); }} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Change Tutor</h2>
                </div>
                <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
                    <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)' }}>
                            Batch: <strong style={{ color: 'var(--primary)' }}>{changeTutorClass.BatchName}</strong>
                            <br/><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Course: {changeTutorClass.CourseName}</span>
                        </p>
                    </div>
                    <form onSubmit={handleChangeTutor} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Current Tutor</label>
                            <input className="form-input" disabled value={changeTutorClass.TutorName || 'Unassigned'} style={{ background: 'var(--bg)', color: 'var(--text-muted)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>New Tutor *</label>
                            <select className="form-input" value={newTutorId} onChange={e => setNewTutorId(e.target.value)} required>
                                <option value="">Select a new tutor</option>
                                {tutors.filter(t => t.Name !== changeTutorClass.TutorName).map(t => <option key={t.ID} value={t.ID}>{t.Name} ({t.Email})</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => { setChangeTutorClass(null); setNewTutorId(''); }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={changeTutorLoading}>{changeTutorLoading ? 'Saving...' : 'Update Tutor'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <strong>Backend Connection Failed</strong>
                </div>
            )}

            <div className="grid-2">
                {/* ─── Courses Panel ─── */}
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">
                            <BookOpen style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                            Courses
                        </h2>
                        <button className="btn btn-primary" onClick={() => setShowAddCourse(true)}>
                            <Plus size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Add Course
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Course Name</th>
                                    <th>Total Fee</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                                ) : courses.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No courses found</td></tr>
                                ) : (
                                    courses.map((c) => (
                                        <tr key={c.ID}>
                                            <td>
                                                <span style={{ background: 'var(--primary-light, #e8f5ee)', color: 'var(--primary)', fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                                                    {c.CourseCode || '—'}
                                                </span>
                                            </td>
                                            <td><strong>{c.Name}</strong></td>
                                            <td><strong style={{ color: 'var(--primary)' }}>₹{Number(c.TotalFee).toLocaleString()}</strong></td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{formatDate(c.CreatedAt)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── Class Batches Panel ─── */}
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">
                            <Users style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                            Class Batches
                        </h2>
                        <button className="btn btn-primary" onClick={() => setShowAddBatch(true)}>
                            <Plus size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Add Batch
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Batch ID</th>
                                    <th>Batch Name</th>
                                    <th>Course</th>
                                    <th>Current Tutor</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                                ) : classes.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No classes found</td></tr>
                                ) : (
                                    classes.map((c) => (
                                        <tr key={c.ClassID}>
                                            <td>
                                                <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                                                    {c.BatchCode || `BCH${String(c.ClassID).padStart(3,'0')}`}
                                                </span>
                                            </td>
                                            <td><strong>{c.BatchName}</strong></td>
                                            <td>{c.CourseName}</td>
                                            <td>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-light, #e8f5ee)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>
                                                        {(c.TutorName || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                    {c.TutorName || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                    onClick={() => { setChangeTutorClass(c); setNewTutorId(''); }}
                                                >
                                                    <RefreshCw size={12} /> Change Tutor
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}
