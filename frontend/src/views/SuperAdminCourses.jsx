import { useEffect, useState } from 'react';
import { BookOpen, AlertCircle, Plus, X, Users, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import api from '../api';

// Compress image to base64 using canvas - keeps under TiDB 6MB row limit
const compressImage = (file, maxWidth, maxHeight, quality = 0.7) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
            let w = img.width, h = img.height;
            if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
            if (h > maxHeight) { w = Math.round(w * maxHeight / h); h = maxHeight; }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});

export default function SuperAdminCourses() {
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Add Course modal
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [courseForm, setCourseForm] = useState({ courseCode: '', name: '', description: '', overview: '', totalFee: '', image: '', coverImage: '', targetAudience: '', skillLevel: '', language: '', courseOutcome: '', category: '', duration: '', startingDate: '', visibility: true });
    const [courseLoading, setCourseLoading] = useState(false);

    // Edit Course
    const [showEditCourse, setShowEditCourse] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', courseCode: '', name: '', description: '', overview: '', totalFee: '', image: '', coverImage: '', targetAudience: '', skillLevel: '', language: '', courseOutcome: '', category: '', duration: '', startingDate: '', visibility: true });
    const [editLoading, setEditLoading] = useState(false);

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
                overview: courseForm.overview,
                totalFee: parseFloat(courseForm.totalFee),
                image: courseForm.image,
                coverImage: courseForm.coverImage,
                targetAudience: courseForm.targetAudience,
                skillLevel: courseForm.skillLevel,
                language: courseForm.language,
                courseOutcome: courseForm.courseOutcome,
                category: courseForm.category,
                duration: courseForm.duration,
                startingDate: courseForm.startingDate,
                visibility: courseForm.visibility ? 1 : 0
            });
            setCourseForm({ courseCode: '', name: '', description: '', overview: '', totalFee: '', image: '', coverImage: '', targetAudience: '', skillLevel: '', language: '', courseOutcome: '', category: '', duration: '', startingDate: '', visibility: true });
            setShowAddCourse(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create course.');
        } finally {
            setCourseLoading(false);
        }
    };

    const handleEditCourse = async (e) => {
        e.preventDefault();
        if (!editForm.name || !editForm.totalFee) return alert('Name and Fee are required.');
        setEditLoading(true);
        try {
            await api.put(/courses/ + editForm.id, {
                courseCode: (editForm.courseCode || '').toUpperCase().trim(),
                name: editForm.name,
                overview: editForm.overview,
                totalFee: parseFloat(editForm.totalFee),
                image: editForm.image || undefined,
                coverImage: editForm.coverImage || undefined,
                targetAudience: editForm.targetAudience,
                skillLevel: editForm.skillLevel,
                language: editForm.language,
                courseOutcome: editForm.courseOutcome,
                category: editForm.category,
                duration: editForm.duration,
                startingDate: editForm.startingDate,
                visibility: editForm.visibility ? 1 : 0
            });
            setShowEditCourse(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update course.');
        } finally {
            setEditLoading(false);
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
            banner.textContent = 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Tutor updated successfully';
            Object.assign(banner.style, { position: 'fixed', top: '20px', right: '20px', background: 'var(--primary)', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 9999, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' });
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update tutor.');
        } finally {
            setChangeTutorLoading(false);
        }
    };

    const handleDeleteCourse = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete course "${name}"? This action cannot be undone.`)) return;
        try {
            await api.delete(`/courses/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete course.');
        }
    };

    const handleDeleteBatch = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete batch "${name}"? This action cannot be undone.`)) return;
        try {
            await api.delete(`/courses/classes/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete batch.');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (showAddCourse) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setShowAddCourse(false)} className="btn btn-secondary">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Create New Course</h2>
                </div>
                <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
                    <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Code * <span style={{ fontSize: '11px', fontWeight: 400 }}>(e.g. DS101)</span></label><input className="form-input" placeholder="e.g. DS101, WEB202" value={courseForm.courseCode} onChange={e => setCourseForm({ ...courseForm, courseCode: e.target.value })} style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }} required /></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Name *</label><input className="form-input" placeholder="e.g. Full Stack Web Development" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} required /></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Description <span style={{ fontWeight: 400, fontSize: '11px' }}>— short text shown below the title on the website</span></label><textarea className="form-input" placeholder="e.g. A comprehensive course covering DevOps principles, CI/CD pipelines, Docker, Kubernetes..." value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} /></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Overview <span style={{ fontWeight: 400, fontSize: '11px' }}>— full page content</span></label><textarea className="form-input" placeholder="What is this course about?" value={courseForm.overview} onChange={e => setCourseForm({ ...courseForm, overview: e.target.value })} rows={3} style={{ resize: 'vertical' }} /></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Target Audience <span style={{ fontWeight: 400, fontSize: '11px' }}>Ã¢â‚¬â€ one point per line</span></label><textarea className="form-input" placeholder={"Freshers looking to start their career\nWorking professionals upskilling"} value={courseForm.targetAudience} onChange={e => setCourseForm({ ...courseForm, targetAudience: e.target.value })} rows={3} style={{ resize: 'vertical' }} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Skill Level</label><select className="form-input" value={courseForm.skillLevel} onChange={e => setCourseForm({ ...courseForm, skillLevel: e.target.value })}><option value="">Select level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All Levels</option></select></div><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Language</label><select className="form-input" value={courseForm.language} onChange={e => setCourseForm({ ...courseForm, language: e.target.value })}><option value="">Select language</option><option>English</option><option>Tamil</option><option>Hindi</option><option>Telugu</option><option>Malayalam</option></select></div></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Course Outcome <span style={{ fontWeight: 400, fontSize: '11px' }}>Ã¢â‚¬â€ one point per line</span></label><textarea className="form-input" placeholder={"Build real-world projects\nGet job-ready skills\nEarn industry certificate"} value={courseForm.courseOutcome} onChange={e => setCourseForm({ ...courseForm, courseOutcome: e.target.value })} rows={3} style={{ resize: 'vertical' }} /></div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Duration</label><input className="form-input" placeholder="e.g. 60 Hrs" value={courseForm.duration} onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })} /></div><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Batch Starting Date</label><input className="form-input" type="date" value={courseForm.startingDate} onChange={e => setCourseForm({ ...courseForm, startingDate: e.target.value })} /></div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" id="courseVis" checked={courseForm.visibility} onChange={e => setCourseForm({ ...courseForm, visibility: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            <label htmlFor="courseVis" style={{ fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Show on Public Website</label>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Category</label><select className="form-input" value={courseForm.category} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}><option value="">Select category</option><option>Technology</option><option>Design</option><option>Business</option><option>Health</option><option>Finance</option><option>Marketing</option></select></div><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Course Fee (₹) *</label><input className="form-input" type="number" min="0" placeholder="e.g. 25000" value={courseForm.totalFee} onChange={e => setCourseForm({ ...courseForm, totalFee: e.target.value })} required /></div></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Thumbnail <span style={{ fontWeight: 400, fontSize: '11px' }}>Ã¢â‚¬â€ card image</span></label><input className="form-input" type="file" accept="image/*" onChange={async e => { const file = e.target.files[0]; if (file) { const compressed = await compressImage(file, 800, 500, 0.7); setCourseForm(prev => ({ ...prev, image: compressed })); } }} />{courseForm.image && (<div style={{ marginTop: '10px' }}><img src={courseForm.image} alt="Preview" style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '4px' }} /><span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>&#10003; Compressed</span></div>)}</div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Large Cover Image <span style={{ fontWeight: 400, fontSize: '11px' }}>Ã¢â‚¬â€ course detail page</span></label><input className="form-input" type="file" accept="image/*" onChange={async e => { const file = e.target.files[0]; if (file) { const compressed = await compressImage(file, 1200, 400, 0.75); setCourseForm(prev => ({ ...prev, coverImage: compressed })); } }} />{courseForm.coverImage && (<div style={{ marginTop: '10px' }}><img src={courseForm.coverImage} alt="Cover Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>&#10003; Compressed</span></div>)}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}><button type="button" className="btn btn-secondary" onClick={() => setShowAddCourse(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={courseLoading}>{courseLoading ? 'Saving...' : 'Create Course'}</button></div>
                    </form>
                </div>
            </div>
        );
    }

    if (showEditCourse) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setShowEditCourse(false)} className="btn btn-secondary">? Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Edit Course</h2>
                </div>
                <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
                    <form onSubmit={handleEditCourse} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Code *</label><input className="form-input" value={editForm.courseCode} onChange={e => setEditForm({ ...editForm, courseCode: e.target.value })} style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }} required /></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Name *</label><input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Description <span style={{ fontWeight: 400, fontSize: '11px' }}>— short text shown below the title on the website</span></label><textarea className="form-input" placeholder="e.g. A comprehensive course covering DevOps principles..." value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} /></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Overview <span style={{ fontWeight: 400, fontSize: '11px' }}>— full page content</span></label><textarea className="form-input" value={editForm.overview} onChange={e => setEditForm({ ...editForm, overview: e.target.value })} rows={3} style={{ resize: 'vertical' }} /></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Target Audience</label><textarea className="form-input" value={editForm.targetAudience} onChange={e => setEditForm({ ...editForm, targetAudience: e.target.value })} rows={3} style={{ resize: 'vertical' }} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Skill Level</label><select className="form-input" value={editForm.skillLevel} onChange={e => setEditForm({ ...editForm, skillLevel: e.target.value })}><option value="">Select level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All Levels</option></select></div><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Language</label><select className="form-input" value={editForm.language} onChange={e => setEditForm({ ...editForm, language: e.target.value })}><option value="">Select language</option><option>English</option><option>Tamil</option><option>Hindi</option><option>Telugu</option><option>Malayalam</option></select></div></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Course Outcome</label><textarea className="form-input" value={editForm.courseOutcome} onChange={e => setEditForm({ ...editForm, courseOutcome: e.target.value })} rows={3} style={{ resize: 'vertical' }} /></div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Duration</label><input className="form-input" placeholder="e.g. 60 Hrs" value={editForm.duration} onChange={e => setEditForm({ ...editForm, duration: e.target.value })} /></div><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Batch Starting Date</label><input className="form-input" type="date" value={editForm.startingDate} onChange={e => setEditForm({ ...editForm, startingDate: e.target.value })} /></div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" id="editVis" checked={editForm.visibility} onChange={e => setEditForm({ ...editForm, visibility: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            <label htmlFor="editVis" style={{ fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Show on Public Website</label>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Category</label><select className="form-input" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}><option value="">Select category</option><option>Technology</option><option>Design</option><option>Business</option><option>Health</option><option>Finance</option><option>Marketing</option></select></div><div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Total Course Fee (₹) *</label><input className="form-input" type="number" min="0" value={editForm.totalFee} onChange={e => setEditForm({ ...editForm, totalFee: e.target.value })} required /></div></div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Course Thumbnail <span style={{ fontWeight: 400, fontSize: '11px' }}>â€” card image</span></label><input className="form-input" type="file" accept="image/*" onChange={async e => { const file = e.target.files[0]; if (file) { const compressed = await compressImage(file, 800, 500, 0.7); setEditForm(prev => ({ ...prev, image: compressed })); } }} />{editForm.image && (<div style={{ marginTop: '10px' }}><img src={editForm.image} alt="Preview" style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '4px' }} /><span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>&#10003; Compressed (New selection)</span></div>)}{!editForm.image && (<div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Leave empty to keep existing image.</div>)}</div>
                        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Large Cover Image <span style={{ fontWeight: 400, fontSize: '11px' }}>â€” course detail page</span></label><input className="form-input" type="file" accept="image/*" onChange={async e => { const file = e.target.files[0]; if (file) { const compressed = await compressImage(file, 1200, 400, 0.75); setEditForm(prev => ({ ...prev, coverImage: compressed })); } }} />{editForm.coverImage && (<div style={{ marginTop: '10px' }}><img src={editForm.coverImage} alt="Cover Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>&#10003; Compressed (New selection)</span></div>)}{!editForm.coverImage && (<div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Leave empty to keep existing image.</div>)}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}><button type="button" className="btn btn-secondary" onClick={() => setShowEditCourse(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={editLoading}>{editLoading ? 'Saving...' : 'Update Course'}</button></div>
                    </form>
                </div>
            </div>
        );
    }

    if (showAddBatch) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setShowAddBatch(false)} className="btn btn-secondary">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â Back</button>
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
                            <input className="form-input" placeholder="e.g. Batch A ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Jan 2025" value={batchForm.batchName} onChange={e => setBatchForm({ ...batchForm, batchName: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Assign Tutor *</label>
                            <select className="form-input" value={batchForm.tutorId} onChange={e => setBatchForm({ ...batchForm, tutorId: e.target.value })} required>
                                <option value="">Select a Tutor</option>
                                {tutors.length === 0 ? <option disabled>No tutors found ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ add tutors first</option> : tutors.map(t => <option key={t.ID} value={t.ID}>{t.Name} ({t.Email})</option>)}
                            </select>
                        </div>
                                                <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Large Cover Image (Full Length)</label>
                            <input 
                                className="form-input" 
                                type="file" 
                                accept="image/*" 
                                onChange={e => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setCourseForm({ ...courseForm, coverImage: reader.result });
                                        reader.readAsDataURL(file);
                                    }
                                }} 
                            />
                            {courseForm.coverImage && (
                                <div style={{ marginTop: '10px' }}>
                                    <img src={courseForm.coverImage} alt="Preview Cover" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                                </div>
                            )}
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
                    <button onClick={() => { setChangeTutorClass(null); setNewTutorId(''); }} className="btn btn-secondary">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â Back</button>
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
                                                <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Large Cover Image (Full Length)</label>
                            <input 
                                className="form-input" 
                                type="file" 
                                accept="image/*" 
                                onChange={e => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setCourseForm({ ...courseForm, coverImage: reader.result });
                                        reader.readAsDataURL(file);
                                    }
                                }} 
                            />
                            {courseForm.coverImage && (
                                <div style={{ marginTop: '10px' }}>
                                    <img src={courseForm.coverImage} alt="Preview Cover" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                                </div>
                            )}
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
                {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Courses Panel ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
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
                                    <th style={{ textAlign: 'right' }}>Action</th>
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
                                                    {c.CourseCode || 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â'}
                                                </span>
                                            </td>
                                            <td><strong>{c.Name}</strong></td>
                                            <td><strong style={{ color: 'var(--primary)' }}>{'\u20B9'}{Number(c.TotalFee).toLocaleString()}</strong></td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{formatDate(c.CreatedAt)}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => {
                                                        setEditForm({
                                                            id: c.ID,
                                                            courseCode: c.CourseCode || '',
                                                            name: c.Name || '',
                                                            overview: c.Overview || '',
                                                            totalFee: c.TotalFee || '',
                                                            image: c.Image || '',
                                                            coverImage: c.CoverImage || '',
                                                            targetAudience: c.TargetAudience || '',
                                                            skillLevel: c.SkillLevel || '',
                                                            language: c.Language || '',
                                                            courseOutcome: c.CourseOutcome || '',
                                                            category: c.Category || '',
                                                            duration: c.Duration || '',
                                                            startingDate: c.StartingDate ? c.StartingDate.split('T')[0] : '',
                                                            visibility: c.Visibility !== 0
                                                        });
                                                        setShowEditCourse(true);
                                                    }}
                                                    style={{ color: 'var(--primary)', padding: '6px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '8px' }}
                                                    title="Edit Course"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteCourse(c.ID, c.Name)}
                                                    style={{ color: 'var(--danger)', padding: '6px', borderRadius: '4px', transition: 'background 0.2s', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                    title="Delete Course"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Class Batches Panel ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
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
                                                    {c.TutorName || 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â'}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    onClick={() => {
                                                        setEditForm({
                                                            id: c.ID,
                                                            courseCode: c.CourseCode || '',
                                                            name: c.Name || '',
                                                            overview: c.Overview || '',
                                                            totalFee: c.TotalFee || '',
                                                            image: c.Image || '',
                                                            coverImage: c.CoverImage || '',
                                                            targetAudience: c.TargetAudience || '',
                                                            skillLevel: c.SkillLevel || '',
                                                            language: c.Language || '',
                                                            courseOutcome: c.CourseOutcome || '',
                                                            category: c.Category || '',
                                                            duration: c.Duration || '',
                                                            startingDate: c.StartingDate ? c.StartingDate.split('T')[0] : '',
                                                            visibility: c.Visibility !== 0
                                                        });
                                                        setShowEditCourse(true);
                                                    }}
                                                    style={{ color: 'var(--primary)', padding: '6px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '8px' }}
                                                    title="Edit Course"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', marginRight: '8px' }}
                                                    onClick={() => { setChangeTutorClass(c); setNewTutorId(''); }}
                                                >
                                                    <RefreshCw size={12} /> Change Tutor
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setEditForm({
                                                            id: c.ID,
                                                            courseCode: c.CourseCode || '',
                                                            name: c.Name || '',
                                                            overview: c.Overview || '',
                                                            totalFee: c.TotalFee || '',
                                                            image: c.Image || '',
                                                            coverImage: c.CoverImage || '',
                                                            targetAudience: c.TargetAudience || '',
                                                            skillLevel: c.SkillLevel || '',
                                                            language: c.Language || '',
                                                            courseOutcome: c.CourseOutcome || '',
                                                            category: c.Category || '',
                                                            duration: c.Duration || '',
                                                            startingDate: c.StartingDate ? c.StartingDate.split('T')[0] : '',
                                                            visibility: c.Visibility !== 0
                                                        });
                                                        setShowEditCourse(true);
                                                    }}
                                                    style={{ color: 'var(--primary)', padding: '6px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '8px' }}
                                                    title="Edit Course"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteBatch(c.ClassID, c.BatchName)}
                                                    style={{ color: 'var(--danger)', padding: '6px', borderRadius: '4px', transition: 'background 0.2s', background: 'transparent', border: 'none', cursor: 'pointer', verticalAlign: 'middle' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                    title="Delete Batch"
                                                >
                                                    <Trash2 size={16} />
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

