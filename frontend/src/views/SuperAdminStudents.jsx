import { useEffect, useState, useRef } from 'react';
import { Users, AlertCircle, Plus, Upload, Trash2, BookOpen, CheckSquare, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api';

export default function SuperAdminStudents({ user }) {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Change Course modal (Super Admin only)
    const [changeCourseStudent, setChangeCourseStudent] = useState(null);
    const [changeCourseData, setChangeCourseData] = useState({ courseId: '', classId: '', totalFee: '', amountPaid: '' });
    const [changeCourseLoading, setChangeCourseLoading] = useState(false);

    const isSuperAdmin = user?.role === 'Super Admin';

    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', courseId: '', classId: '', totalFee: '', feePaid: '', dob: '', gender: '', city: '', country: '' });
    const [assignData, setAssignData] = useState({ courseId: '', classId: '', totalFee: '' });
    const [filters, setFilters] = useState({ id: '', name: '', email: '', course: '', batch: '', status: '' });
    const fileInputRef = useRef(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resStudents, resCourses, resClasses] = await Promise.all([
                api.get('/users/students'),
                api.get('/courses'),
                api.get('/courses/classes/my') // Gets classes for assignment drop downs
            ]);
            setStudents(resStudents.data);
            setCourses(resCourses.data);
            setClasses(resClasses.data);
        } catch (err) {
            console.error('Failed to load data', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelect = (id) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedStudents(students.map(s => s.ID));
        else setSelectedStudents([]);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this student and all their data permanently?")) return;
        try {
            await api.delete(`/users/students/${id}`);
            fetchData();
        } catch (err) {
            alert("Error deleting student. Backend error.");
        }
    };

    const handleBulkAssign = async () => {
        if (selectedStudents.length === 0 || !assignData.classId || !assignData.courseId) {
            return alert("Please select students, a course, and a batch.");
        }
        try {
            await api.post('/users/students/bulk-assign', {
                studentIds: selectedStudents,
                classId: assignData.classId,
                courseId: assignData.courseId,
                totalFee: assignData.totalFee || 0
            });
            alert("Students assigned successfully!");
            setShowAssignModal(false);
            setSelectedStudents([]);
            fetchData();
        } catch (err) {
            alert("Bulk assign failed. Check console.");
            console.error(err);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        // Validate feePaid does not exceed totalFee
        const paid = parseFloat(formData.feePaid || 0);
        const total = parseFloat(formData.totalFee || 0);
        if (total > 0 && paid > total) {
            return alert(`Fees paid (₹${paid.toLocaleString()}) cannot exceed total course fee (₹${total.toLocaleString()}).`);
        }
        try {
            setFormLoading(true);
            const payload = { ...formData, roleId: 4 };
            await api.post('/users/register', payload);
            setShowAddModal(false);
            setFormData({ name: '', email: '', phone: '', password: '', courseId: '', classId: '', totalFee: '', feePaid: '', dob: '', gender: '', city: '', country: '' });
            fetchData();

            const banner = document.createElement('div');
            banner.textContent = '✓ Student enrolled successfully';
            Object.assign(banner.style, { position: 'fixed', top: '20px', right: '20px', background: 'var(--success)', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 9999, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' });
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add student.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length > 0) {
                    setLoading(true);
                    let successCount = 0;
                    const errors = [];
                    for (let row of data) {
                        try {
                            const courseId  = row.CourseID  || row.courseId  || row.course_id  || '';
                            const classId   = row.ClassID   || row.classId   || row.class_id   || '';
                            const feePaid   = row.FeePaid   || row.feePaid   || row.fee_paid   || 0;
                            const totalFee  = row.TotalFee  || row.totalFee  || row.total_fee  || '';

                            // Look up totalFee from courses list if not provided
                            let resolvedTotalFee = totalFee;
                            if (!resolvedTotalFee && courseId) {
                                const found = courses.find(c => c.ID == courseId);
                                if (found) resolvedTotalFee = found.TotalFee;
                            }

                            await api.post('/users/register', {
                                name:       row.Name     || row.name,
                                email:      row.Email    || row.email,
                                phone:      row.Phone    || row.phone    || '',
                                password:   row.Password || row.password || 'password123',
                                gender:     row.Gender   || row.gender   || '',
                                city:       row.City     || row.city     || '',
                                country:    row.Country  || row.country  || '',
                                dob:        row.DOB      || row.dob      || '',
                                roleId:     4,
                                courseId:   courseId  || undefined,
                                classId:    classId   || undefined,
                                totalFee:   resolvedTotalFee || undefined,
                                feePaid:    feePaid,
                            });
                            successCount++;
                        } catch (err) {
                            const errMsg = err.response?.data?.message || 'Unknown error';
                            errors.push(`Row ${data.indexOf(row)+2}: ${row.Email || row.email} — ${errMsg}`);
                            console.log('Skipped row:', row.Email || row.email, errMsg);
                        }
                    }
                    let msg = `Bulk upload completed! Imported ${successCount} out of ${data.length} records.`;
                    if (errors.length) msg += `\n\nFailed rows:\n${errors.join('\n')}`;
                    alert(msg);
                    fetchData();
                } else {
                    alert('No valid data found in sheet. Please check the file format.');
                }
            } catch (err) {
                alert('Error reading file. Make sure it is a valid .xlsx or .csv.');
                console.error(err);
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const lbl = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' };

    // ── Full-page: Bulk Assign ─────────────────────────────────────────────
    if (showAssignModal) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Bulk Assign — {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}</h2>
                </div>
                <div className="section-card" style={{ maxWidth: '560px', margin: '0 auto', padding: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={lbl}>Target Course *</label>
                            <select className="form-input" value={assignData.courseId} onChange={e => {
                                const selectedCourse = courses.find(c => c.ID == e.target.value);
                                setAssignData({ ...assignData, courseId: e.target.value, totalFee: selectedCourse ? selectedCourse.TotalFee : '' });
                            }}>
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.ID} value={c.ID}>{c.Name} — ₹{Number(c.TotalFee).toLocaleString()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Target Batch *</label>
                            <select className="form-input" value={assignData.classId} onChange={e => setAssignData({ ...assignData, classId: e.target.value })}>
                                <option value="">Select Batch</option>
                                {classes.filter(c => assignData.courseId ? c.CourseID == assignData.courseId : true).map(c => <option key={c.ClassID} value={c.ClassID}>{c.BatchName} — Tutor: {c.TutorName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Total Course Fee</label>
                            <input className="form-input" type="number" readOnly value={assignData.totalFee || ''} style={{ background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--primary)', fontWeight: 600 }} placeholder="Auto-filled from course" />
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>Automatically filled from the selected course.</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={handleBulkAssign}>Confirm Assignment</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Full-page: Change Course ──────────────────────────────────────────
    if (changeCourseStudent) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button className="btn btn-secondary" onClick={() => setChangeCourseStudent(null)}>← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Change Course Assignment</h2>
                </div>
                <div className="section-card" style={{ maxWidth: '560px', margin: '0 auto', padding: '32px' }}>
                    {/* Student info */}
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px', border: '1px solid var(--border)', fontSize: '14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Student</span>
                                <strong>{changeCourseStudent.Name}</strong>
                                {changeCourseStudent.StudentCode && <span style={{ marginLeft: '8px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>{changeCourseStudent.StudentCode}</span>}
                            </div>
                            <div>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Current Course</span>
                                <strong>{changeCourseStudent.CourseName || 'Unassigned'}</strong>
                            </div>
                        </div>
                        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--warning)', fontWeight: 500 }}>
                            Note: Changing the course will reset the student's fee record to Pending.
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={lbl}>New Course *</label>
                            <select className="form-input" value={changeCourseData.courseId} onChange={e => {
                                const selected = courses.find(c => c.ID == e.target.value);
                                setChangeCourseData({ courseId: e.target.value, classId: '', totalFee: selected ? selected.TotalFee : '', amountPaid: '' });
                            }} required>
                                <option value="">Select New Course</option>
                                {courses.map(c => <option key={c.ID} value={c.ID}>[{c.CourseCode}] {c.Name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>New Batch *</label>
                            <select className="form-input" value={changeCourseData.classId} onChange={e => setChangeCourseData({ ...changeCourseData, classId: e.target.value })} required>
                                <option value="">Select New Batch</option>
                                {classes.filter(c => changeCourseData.courseId ? c.CourseID == changeCourseData.courseId : true).map(c => <option key={c.ClassID} value={c.ClassID}>{c.BatchName} — Tutor: {c.TutorName}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={lbl}>Total Course Fee</label>
                                <input className="form-input" type="number" value={changeCourseData.totalFee || ''} readOnly placeholder="Auto-filled from course" style={{ background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--primary)', fontWeight: 700 }} />
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Auto-filled</p>
                            </div>
                            <div>
                                <label style={lbl}>Amount Paid Now (₹)</label>
                                <input className="form-input" type="number" min="0" max={changeCourseData.totalFee || undefined} placeholder="0" value={changeCourseData.amountPaid} disabled={!changeCourseData.totalFee}
                                    onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        const max = parseFloat(changeCourseData.totalFee || 0);
                                        if (max > 0 && val > max) return;
                                        setChangeCourseData({ ...changeCourseData, amountPaid: e.target.value });
                                    }}
                                    style={{ borderColor: changeCourseData.amountPaid && parseFloat(changeCourseData.amountPaid) > parseFloat(changeCourseData.totalFee) ? 'var(--danger)' : undefined }}
                                />
                                {changeCourseData.totalFee && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Max: ₹{Number(changeCourseData.totalFee).toLocaleString()}</p>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button className="btn btn-secondary" onClick={() => setChangeCourseStudent(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                disabled={changeCourseLoading || !changeCourseData.courseId || !changeCourseData.classId}
                                onClick={async () => {
                                    setChangeCourseLoading(true);
                                    try {
                                        await api.put(`/users/students/${changeCourseStudent.ID}/change-course`, {
                                            courseId: changeCourseData.courseId,
                                            classId: changeCourseData.classId,
                                            amountPaid: parseFloat(changeCourseData.amountPaid || 0)
                                        });
                                        setChangeCourseStudent(null);
                                        fetchData();
                                    } catch (err) {
                                        alert(err.response?.data?.message || 'Failed to change course.');
                                    } finally {
                                        setChangeCourseLoading(false);
                                    }
                                }}
                            >
                                {changeCourseLoading ? 'Updating...' : 'Confirm Change'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showAddModal) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'transparent' }}>
                        ← Back to Students
                    </button>
                </div>

                <div className="section-card" style={{ maxWidth: '850px', margin: '0 auto', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                    <div className="section-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                        <div>
                            <h2 className="section-title" style={{ fontSize: '20px', margin: 0 }}>Enroll New Student</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0' }}>Enter student details and assign them to a course batch.</p>
                        </div>
                    </div>

                    <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '32px' }}>
                        
                        {/* ─── Personal Information ─── */}
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                                Personal Details
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name *</label>
                            <input className="form-input" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email Address *</label>
                            <input className="form-input" type="email" placeholder="student@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Temporary Password *</label>
                            <input className="form-input" type="password" placeholder="Min. 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number</label>
                            <input className="form-input" placeholder="+91 9876543210 (Optional)" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>

                            </div>
                        </div>

                        {/* ─── Additional Info ─── */}
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                                Additional Information <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>(Optional)</span>
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Date of Birth</label>
                                    <input className="form-input" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Gender</label>
                                    <select className="form-input" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>City</label>
                                    <input className="form-input" placeholder="e.g. Mumbai" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Country</label>
                                    <input className="form-input" placeholder="e.g. India" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* ─── Enrollment Details ─── */}
                        <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                                Course Enrollment
                            </h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Active Course *</label>
                                    <select className="form-input" value={formData.courseId} onChange={e => {
                                        const selectedCourse = courses.find(c => c.ID == e.target.value);
                                        setFormData({ ...formData, courseId: e.target.value, classId: '', totalFee: selectedCourse ? selectedCourse.TotalFee : '' });
                                    }} required style={{ background: 'var(--surface)' }}>
                                        <option value="">Select Target Course</option>
                                        {courses.map(c => <option key={c.ID} value={c.ID}>{c.Name} — ₹{Number(c.TotalFee).toLocaleString()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Assigned Batch / Class *</label>
                                    <select className="form-input" value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} required style={{ background: 'var(--surface)' }}>
                                        <option value="">Select Assigned Batch</option>
                                        {classes.filter(c => formData.courseId ? c.CourseID == formData.courseId : true).map(c => <option key={c.ClassID} value={c.ClassID}>{c.BatchName} — Tutor: {c.TutorName}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px dashed var(--border)', paddingTop: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Course Fee (₹)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        value={formData.totalFee}
                                        readOnly
                                        style={{ background: 'transparent', border: '1px solid var(--border)', cursor: 'not-allowed', color: 'var(--primary)', fontWeight: 600, fontSize: '16px' }}
                                        placeholder="Auto-filled from course"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Fees Paid Now (₹)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        max={formData.totalFee || undefined}
                                        disabled={!formData.totalFee}
                                        placeholder="0"
                                        value={formData.feePaid}
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            const max = parseFloat(formData.totalFee || 0);
                                            if (max > 0 && val > max) return;
                                            setFormData({ ...formData, feePaid: e.target.value });
                                        }}
                                        style={{ background: 'var(--surface)', fontSize: '16px', fontWeight: 500, borderColor: formData.feePaid && parseFloat(formData.feePaid) > parseFloat(formData.totalFee) ? 'var(--danger)' : undefined }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--border)', margin: '0 -32px -32px -32px', padding: '24px 32px', background: 'var(--bg)', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ padding: '10px 24px' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ padding: '10px 32px' }}>
                                {formLoading ? 'Registering...' : 'Enroll Student'}
                            </button>
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
                    <div>
                        <strong>Backend Connection Failed</strong>
                        <p style={{ fontSize: '13px', marginTop: '4px' }}>The frontend cannot reach the backend API.</p>
                    </div>
                </div>
            )}

            <div className="section-card">
                <div className="section-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                    <h2 className="section-title"><Users style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />Students Management</h2>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {selectedStudents.length > 0 && (
                            <button className="btn btn-secondary" onClick={() => setShowAssignModal(true)} style={{ borderColor: 'var(--primary)' }}>
                                <CheckSquare size={16} /> Assign Selected ({selectedStudents.length})
                            </button>
                        )}
                        <button className="btn btn-secondary" onClick={() => {
                            // Build template with courses info in header comment
                            const courseInfo = courses.map(c => `CourseID ${c.ID} = ${c.Name} (Fee: ${c.TotalFee})`).join(' | ');
                            const classInfo  = classes.map(c => `ClassID ${c.ClassID} = ${c.BatchName}`).join(' | ');
                            const header = `Name,Email,Phone,Password,CourseID,ClassID,FeePaid,Gender,City,Country,DOB`;
                            const example1 = `John Doe,john@example.com,9876543210,password123,${courses[0]?.ID || 1},${classes[0]?.ClassID || 1},5000,Male,Mumbai,India,2000-01-15`;
                            const example2 = `Jane Smith,jane@example.com,9876543211,password123,${courses[0]?.ID || 1},${classes[0]?.ClassID || 1},0,Female,Delhi,India,2001-03-20`;
                            const note = `NOTE: ${courseInfo || 'No courses yet'} || ${classInfo || 'No classes yet'}`;
                            const csvContent = `data:text/csv;charset=utf-8,${header}\n${example1}\n${example2}\n# ${note}`;
                            const link = document.createElement('a');
                            link.setAttribute('href', encodeURI(csvContent));
                            link.setAttribute('download', 'Student_Import_Template.csv');
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}>
                            Download Template
                        </button>
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} ref={fileInputRef} style={{ display: 'none' }} />
                        <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                            <Upload size={16} /> Import Excel
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={16} /> Add Student
                        </button>
                    </div>
                </div>

                <div className="table-container">
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, marginRight: '8px' }}>
                            <Filter size={16} style={{ marginRight: '6px' }} /> Filters:
                        </div>
                        <div style={{ position: 'relative', width: '140px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Student ID" value={filters.id} onChange={e => setFilters({...filters, id: e.target.value})} className="form-input" style={{ width: '100%', paddingLeft: '32px', fontSize: '13px', minHeight: '36px' }} />
                        </div>
                        <div style={{ position: 'relative', width: '180px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Name" value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} className="form-input" style={{ width: '100%', paddingLeft: '32px', fontSize: '13px', minHeight: '36px' }} />
                        </div>
                        <div style={{ position: 'relative', width: '180px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Email" value={filters.email} onChange={e => setFilters({...filters, email: e.target.value})} className="form-input" style={{ width: '100%', paddingLeft: '32px', fontSize: '13px', minHeight: '36px' }} />
                        </div>
                        <div style={{ position: 'relative', width: '160px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Course" value={filters.course} onChange={e => setFilters({...filters, course: e.target.value})} className="form-input" style={{ width: '100%', paddingLeft: '32px', fontSize: '13px', minHeight: '36px' }} />
                        </div>
                        <div style={{ position: 'relative', width: '140px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Batch" value={filters.batch} onChange={e => setFilters({...filters, batch: e.target.value})} className="form-input" style={{ width: '100%', paddingLeft: '32px', fontSize: '13px', minHeight: '36px' }} />
                        </div>
                        <div style={{ width: '140px' }}>
                            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="form-input" style={{ width: '100%', fontSize: '13px', minHeight: '36px' }}>
                                <option value="">All Statuses</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" onChange={handleSelectAll} checked={students.length > 0 && selectedStudents.length === students.length} />
                                </th>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Course</th>
                                <th>Batch</th>
                                <th>Paid / Total</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                            ) : (() => {
                                const filteredStudents = students.filter(s => {
                                    return (s.StudentCode || '').toLowerCase().includes(filters.id.toLowerCase()) &&
                                           (s.Name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
                                           (s.Email || '').toLowerCase().includes(filters.email.toLowerCase()) &&
                                           (s.CourseName || '').toLowerCase().includes(filters.course.toLowerCase()) &&
                                           (s.BatchName || '').toLowerCase().includes(filters.batch.toLowerCase()) &&
                                           (s.PaymentStatus || '').toLowerCase().includes(filters.status.toLowerCase());
                                });

                                if (filteredStudents.length === 0) {
                                    return <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No students found matching your filters.</td></tr>;
                                }

                                return filteredStudents.map((s, i) => (
                                    <tr key={`${s.ID}-${i}`}>
                                        <td>
                                            <input type="checkbox" checked={selectedStudents.includes(s.ID)} onChange={() => handleSelect(s.ID)} />
                                        </td>
                                        <td>
                                            <span style={{ background: '#e8f5ee', color: 'var(--primary)', fontWeight: 700, fontSize: '11px', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                                                {s.StudentCode || '—'}
                                            </span>
                                        </td>
                                        <td><strong>{s.Name}</strong></td>
                                        <td>{s.Email}</td>
                                        <td>{s.CourseName || <span style={{ color: 'var(--warning)', fontSize: '12px' }}>Unassigned</span>}</td>
                                        <td>{s.BatchName || '—'}</td>
                                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                                            {s.AmountPaid != null ? (
                                                <span>₹{Number(s.AmountPaid).toLocaleString()} / ₹{Number(s.TotalFee).toLocaleString()}</span>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${s.PaymentStatus === 'Paid' ? 'status-paid' : 'status-pending'}`} style={{ background: s.PaymentStatus === 'Paid' ? 'var(--success-bg)' : 'var(--warning-bg)', color: s.PaymentStatus === 'Paid' ? 'var(--success)' : 'var(--warning)' }}>
                                                {s.PaymentStatus || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                {isSuperAdmin && (
                                                    <button
                                                        title="Change Course (Super Admin)"
                                                        className="btn btn-secondary"
                                                        style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--primary)', borderColor: 'var(--primary)', whiteSpace: 'nowrap' }}
                                                        onClick={() => { setChangeCourseStudent(s); setChangeCourseData({ courseId: '', classId: '', totalFee: '', amountPaid: '' }); }}
                                                    >
                                                        <BookOpen size={13} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                                                        Change Course
                                                    </button>
                                                )}
                                                <button className="icon-button" title="Delete student" style={{ color: 'var(--danger)', width: '32px', height: '32px' }} onClick={() => handleDelete(s.ID)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
