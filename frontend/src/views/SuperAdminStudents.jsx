import { useEffect, useState, useRef } from 'react';
import {
  Users, AlertCircle, Plus, Upload, BookOpen, CheckSquare,
  Search, Filter, ShieldCheck, ShieldAlert, KeyRound, Trash2, MoreVertical,
  Tag, X, RefreshCw, Lock, Unlock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api';

/* ── Reusable 3-dot Action Dropdown ────────────────────────────── */
function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="action-dropdown-wrapper" ref={ref}>
      <button
        className="action-kebab-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="action-dropdown-menu">
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} className="action-dropdown-divider" />
            ) : (
              <button
                key={i}
                className={`action-dropdown-item${item.danger ? ' danger' : ''}`}
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
              >
                {item.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ── Bulk Action Dropdown ───────────────────────────────────────── */
function BulkActionMenu({ selectedCount, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items = [
    { label: 'Change Course', value: 'assign' },
    { label: 'Bulk Activate', value: 'activate' },
    { label: 'Bulk Deactivate', value: 'deactivate' },
    { label: 'Bulk Lock', value: 'lock' },
    { label: 'Send Password Reset', value: 'reset_password' },
    'divider',
    { label: 'Bulk Delete', value: 'delete', danger: true }
  ];

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button 
        className="btn btn-secondary" 
        style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
        onClick={() => setOpen(!open)}
      >
        <CheckSquare size={14} /> Bulk Action ({selectedCount})
      </button>
      {open && (
        <div className="action-dropdown-menu" style={{ top: '100%', right: 'auto', left: 0, marginTop: '6px', minWidth: '190px' }}>
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} className="action-dropdown-divider" />
            ) : (
              <button
                key={i}
                className={`action-dropdown-item${item.danger ? ' danger' : ''}`}
                onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(item.value); }}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function DomainChips({ domains }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!domains) return <span className="status-badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>Not Noted</span>;
  const list = Array.isArray(domains) ? domains : domains.split(',').map(d => d.trim()).filter(Boolean);
  if (!list.length) return <span className="status-badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>Not Noted</span>;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button 
        className="status-badge" 
        style={{ background: 'var(--primary-light)', color: 'var(--primary)', cursor: 'pointer', border: 'none', padding: '4px 10px' }}
        onClick={() => setOpen(!open)}
      >
        Noted
      </button>
      {open && (
        <div style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: '6px', background: '#0f172a', border: '1px solid #1e293b', padding: '10px 12px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '190px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, marginBottom: '2px', letterSpacing: '0.05em' }}>Interested Domains</div>
          {list.map((d, i) => (
            <span key={i} style={{ fontSize: '12.5px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 500 }}>
              <Tag size={11} color="var(--primary)"/> {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function SuperAdminStudents({ user }) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [changeCourseStudent, setChangeCourseStudent] = useState(null);
  const [changeCourseData, setChangeCourseData] = useState({ courseId: '', classId: '', totalFee: '', amountPaid: '' });
  const [changeCourseLoading, setChangeCourseLoading] = useState(false);

  const isSuperAdmin = user?.role === 'Super Admin';

  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', courseId: '',
    classId: '', totalFee: '', feePaid: '', dob: '', gender: '', city: '', country: ''
  });
  const [assignData, setAssignData] = useState({ courseId: '', classId: '', totalFee: '' });
  const [filters, setFilters] = useState({ id: '', name: '', email: '', course: '', batch: '', status: '', designation: '', phone: '' });
  const fileInputRef = useRef(null);

  /* ── Data fetching ──────────────────────────────────────────── */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resStudents, resCourses, resClasses] = await Promise.all([
        api.get('/users/students'),
        api.get('/courses'),
        api.get('/courses/classes/my')
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

  useEffect(() => { fetchData(); }, []);

  /* ── Selection helpers ──────────────────────────────────────── */
  const handleSelect = (id) => setSelectedStudents(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedStudents(students.map(s => s.ID));
    else setSelectedStudents([]);
  };

  /* ── Actions ────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student and all their data permanently?')) return;
    try { await api.delete(`/users/students/${id}`); fetchData(); }
    catch { alert('Error deleting student.'); }
  };

  const handleActivateAccount = async (id) => {
    if (!window.confirm('Activate this account? The user will be able to log in immediately.')) return;
    try { await api.put(`/users/students/${id}/activate`); fetchData(); }
    catch { alert('Failed to activate account.'); }
  };

  const handleDeactivateAccount = async (id) => {
    if (!window.confirm('Deactivate this account? The user will not be able to log in.')) return;
    try { await api.put(`/users/students/${id}/deactivate`); fetchData(); }
    catch { alert('Failed to deactivate account.'); }
  };

  const handleSendResetPassword = async (email) => {
    if (!window.confirm(`Send a password reset link to ${email}?`)) return;
    try {
      await api.post('/auth/forgot-password', { email });
      alert('Password reset link sent to ' + email);
    } catch { alert('Failed to send reset link.'); }
  };

  const handleLockAccount = async (id) => {
    if (!window.confirm('Lock this account? They will be logged out and cannot sign in until unlocked.')) return;
    try { await api.put(`/users/students/${id}/lock`); fetchData(); }
    catch { alert('Failed to lock account.'); }
  };

  const handleUnlockAccount = async (id) => {
    if (!window.confirm('Unlock this account? They will be able to sign in again.')) return;
    try { await api.put(`/users/students/${id}/unlock`); fetchData(); }
    catch { alert('Failed to unlock account.'); }
  };

  const handleBulkAction = async (action) => {
    if (!selectedStudents.length) return;
    if (action === 'assign') {
      setShowAssignModal(true);
      return;
    }
    
    if (!window.confirm(`Are you sure you want to perform this bulk action on ${selectedStudents.length} students?`)) return;
    
    setLoading(true);
    let successCount = 0;
    try {
      if (action === 'delete') {
         await Promise.all(selectedStudents.map(id => api.delete(`/users/students/${id}`).then(() => successCount++).catch(e => console.error(e))));
      } else if (action === 'activate') {
         await Promise.all(selectedStudents.map(id => api.put(`/users/students/${id}/activate`).then(() => successCount++).catch(e => console.error(e))));
      } else if (action === 'deactivate') {
         await Promise.all(selectedStudents.map(id => api.put(`/users/students/${id}/deactivate`).then(() => successCount++).catch(e => console.error(e))));
      } else if (action === 'lock') {
         await Promise.all(selectedStudents.map(id => api.put(`/users/students/${id}/lock`).then(() => successCount++).catch(e => console.error(e))));
      } else if (action === 'reset_password') {
         const list = students.filter(s => selectedStudents.includes(s.ID));
         await Promise.all(list.map(s => api.post('/auth/forgot-password', { email: s.Email }).then(() => successCount++).catch(e => console.error(e))));
      }
      alert(`Bulk action completed! Successful: ${successCount}/${selectedStudents.length}`);
    } catch (err) {
      alert('Error performing bulk action');
    }
    setSelectedStudents([]);
    fetchData();
  };

  const handleBulkAssign = async () => {
    if (!selectedStudents.length || !assignData.classId || !assignData.courseId)
      return alert('Please select students, a course, and a batch.');
    try {
      await api.post('/users/students/bulk-assign', {
        studentIds: selectedStudents,
        classId: assignData.classId,
        courseId: assignData.courseId,
        totalFee: assignData.totalFee || 0
      });
      alert('Students assigned successfully!');
      setShowAssignModal(false);
      setSelectedStudents([]);
      fetchData();
    } catch (err) { alert('Bulk assign failed.'); console.error(err); }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const paid = parseFloat(formData.feePaid || 0);
    const total = parseFloat(formData.totalFee || 0);
    if (total > 0 && paid > total)
      return alert(`Fees paid (₹${paid.toLocaleString()}) cannot exceed total fee (₹${total.toLocaleString()}).`);
    try {
      setFormLoading(true);
      await api.post('/users/register', { ...formData, roleId: 4 });
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', password: '', courseId: '', classId: '', totalFee: '', feePaid: '', dob: '', gender: '', city: '', country: '' });
      fetchData();
      const banner = document.createElement('div');
      banner.textContent = '✓ Student enrolled successfully';
      Object.assign(banner.style, { position: 'fixed', top: '20px', right: '20px', background: 'var(--success)', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 9999, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' });
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add student.');
    } finally { setFormLoading(false); }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (!data.length) return alert('No valid data found.');
        setLoading(true);
        let successCount = 0;
        const errors = [];
        for (let row of data) {
          try {
            const courseId = row.CourseID || row.courseId || row.course_id || '';
            const classId = row.ClassID || row.classId || row.class_id || '';
            const feePaid = row.FeePaid || row.feePaid || row.fee_paid || 0;
            let totalFee = row.TotalFee || row.totalFee || row.total_fee || '';
            if (!totalFee && courseId) {
              const found = courses.find(c => c.ID == courseId);
              if (found) totalFee = found.TotalFee;
            }
            await api.post('/users/register', {
              name: row.Name || row.name, email: row.Email || row.email,
              phone: row.Phone || row.phone || '', password: row.Password || row.password || 'password123',
              gender: row.Gender || row.gender || '', city: row.City || row.city || '',
              country: row.Country || row.country || '', dob: row.DOB || row.dob || '',
              roleId: 4, courseId: courseId || undefined, classId: classId || undefined,
              totalFee: totalFee || undefined, feePaid,
            });
            successCount++;
          } catch (err) {
            errors.push(`Row ${data.indexOf(row) + 2}: ${row.Email || row.email} — ${err.response?.data?.message || 'Unknown error'}`);
          }
        }
        let msg = `Bulk upload completed! Imported ${successCount}/${data.length}.`;
        if (errors.length) msg += `\n\nFailed rows:\n${errors.join('\n')}`;
        alert(msg);
        fetchData();
      } catch { alert('Error reading file. Make sure it is a valid .xlsx or .csv.'); }
      finally { setLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsBinaryString(file);
  };

  const lbl = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' };

  /* ══════════════════════════════════════════════════════════════
     BULK ASSIGN PAGE
  ══════════════════════════════════════════════════════════════ */
  if (showAssignModal) return (
    <div className="content-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '14px' }}>
        <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>← Back</button>
        <h2 className="page-title">Bulk Assign — {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}</h2>
      </div>
      <div className="section-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div className="section-header">
          <span className="section-title">Assign to Course & Batch</span>
        </div>
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={lbl}>Target Course *</label>
            <select className="form-input" value={assignData.courseId} onChange={e => {
              const s = courses.find(c => c.ID == e.target.value);
              setAssignData({ ...assignData, courseId: e.target.value, totalFee: s ? s.TotalFee : '' });
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
            <label style={lbl}>Total Fee</label>
            <input className="form-input" type="number" readOnly value={assignData.totalFee || ''} style={{ cursor: 'not-allowed', color: 'var(--primary)', fontWeight: 600 }} placeholder="Auto-filled from course" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBulkAssign}>Confirm Assignment</button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     CHANGE COURSE PAGE
  ══════════════════════════════════════════════════════════════ */
  if (changeCourseStudent) return (
    <div className="content-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '14px' }}>
        <button className="btn btn-secondary" onClick={() => setChangeCourseStudent(null)}>← Back</button>
        <h2 className="page-title">Change Course Assignment</h2>
      </div>
      <div className="section-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div className="section-header">
          <div>
            <span className="section-title">{changeCourseStudent.Name}</span>
            {changeCourseStudent.StudentCode && <span style={{ marginLeft: '10px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{changeCourseStudent.StudentCode}</span>}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current: {changeCourseStudent.CourseName || 'Unassigned'}</span>
        </div>
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '12.5px', color: 'var(--warning-text)', fontWeight: 500 }}>
            ⚠ Changing the course will reset the student's fee record to Pending.
          </div>
          <div>
            <label style={lbl}>New Course *</label>
            <select className="form-input" value={changeCourseData.courseId} onChange={e => {
              const s = courses.find(c => c.ID == e.target.value);
              setChangeCourseData({ courseId: e.target.value, classId: '', totalFee: s ? s.TotalFee : '', amountPaid: '' });
            }} required>
              <option value="">Select New Course</option>
              {courses.map(c => <option key={c.ID} value={c.ID}>[{c.CourseCode}] {c.Name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>New Batch *</label>
            <select className="form-input" value={changeCourseData.classId} onChange={e => setChangeCourseData({ ...changeCourseData, classId: e.target.value })} required>
              <option value="">Select New Batch</option>
              {classes.filter(c => changeCourseData.courseId ? c.CourseID == changeCourseData.courseId : true).map(c => <option key={c.ClassID} value={c.ClassID}>{c.BatchName} — {c.TutorName}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={lbl}>Total Course Fee</label>
              <input className="form-input" type="number" value={changeCourseData.totalFee || ''} readOnly style={{ cursor: 'not-allowed', color: 'var(--primary)', fontWeight: 700 }} placeholder="Auto-filled" />
            </div>
            <div>
              <label style={lbl}>Amount Paid Now (₹)</label>
              <input className="form-input" type="number" min="0" max={changeCourseData.totalFee || undefined} placeholder="0"
                value={changeCourseData.amountPaid} disabled={!changeCourseData.totalFee}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  if (parseFloat(changeCourseData.totalFee) > 0 && val > parseFloat(changeCourseData.totalFee)) return;
                  setChangeCourseData({ ...changeCourseData, amountPaid: e.target.value });
                }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setChangeCourseStudent(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={changeCourseLoading || !changeCourseData.courseId || !changeCourseData.classId}
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
                } catch (err) { alert(err.response?.data?.message || 'Failed to change course.'); }
                finally { setChangeCourseLoading(false); }
              }}>
              {changeCourseLoading ? 'Updating...' : 'Confirm Change'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     ADD STUDENT PAGE
  ══════════════════════════════════════════════════════════════ */
  if (showAddModal) return (
    <div className="content-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '14px' }}>
        <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>← Back to Students</button>
        <h2 className="page-title">Enroll New Student</h2>
      </div>
      <div className="section-card" style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div className="section-header">
          <div>
            <span className="section-title">Student Registration</span>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Enter student details and assign them to a course batch.</p>
          </div>
        </div>
        <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '28px' }}>
          {/* Personal */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 6, height: 6, background: 'var(--primary)', borderRadius: '50%', display: 'inline-block' }} /> Personal Details
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[['Full Name *', 'name', 'text', 'John Doe', true], ['Email Address *', 'email', 'email', 'student@example.com', true], ['Temporary Password *', 'password', 'password', 'Min. 6 characters', true], ['Phone Number', 'phone', 'tel', '+91 9876543210', false]].map(([label, key, type, ph, req]) => (
                <div key={key}>
                  <label style={lbl}>{label}</label>
                  <input className="form-input" type={type} placeholder={ph} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} required={req} />
                </div>
              ))}
            </div>
          </div>

          {/* Additional */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 6, height: 6, background: 'var(--primary)', borderRadius: '50%', display: 'inline-block' }} /> Additional Info <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none' }}>(Optional)</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div><label style={lbl}>Date of Birth</label><input className="form-input" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} /></div>
              <div>
                <label style={lbl}>Gender</label>
                <select className="form-input" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
              </div>
              <div><label style={lbl}>City</label><input className="form-input" placeholder="e.g. Mumbai" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
              <div><label style={lbl}>Country</label><input className="form-input" placeholder="e.g. India" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} /></div>
            </div>
          </div>

          {/* Enrollment */}
          <div style={{ background: 'var(--bg)', padding: '22px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 6, height: 6, background: 'var(--primary)', borderRadius: '50%', display: 'inline-block' }} /> Course Enrollment
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={lbl}>Active Course *</label>
                <select className="form-input" value={formData.courseId} onChange={e => {
                  const s = courses.find(c => c.ID == e.target.value);
                  setFormData({ ...formData, courseId: e.target.value, classId: '', totalFee: s ? s.TotalFee : '' });
                }} required>
                  <option value="">Select Target Course</option>
                  {courses.map(c => <option key={c.ID} value={c.ID}>{c.Name} — ₹{Number(c.TotalFee).toLocaleString()}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Assigned Batch *</label>
                <select className="form-input" value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} required>
                  <option value="">Select Batch</option>
                  {classes.filter(c => formData.courseId ? c.CourseID == formData.courseId : true).map(c => <option key={c.ClassID} value={c.ClassID}>{c.BatchName} — {c.TutorName}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
              <div>
                <label style={lbl}>Total Course Fee (₹)</label>
                <input className="form-input" type="number" value={formData.totalFee} readOnly style={{ cursor: 'not-allowed', color: 'var(--primary)', fontWeight: 600 }} placeholder="Auto-filled from course" />
              </div>
              <div>
                <label style={lbl}>Fees Paid Now (₹)</label>
                <input className="form-input" type="number" min="0" max={formData.totalFee || undefined} disabled={!formData.totalFee} placeholder="0"
                  value={formData.feePaid}
                  onChange={e => {
                    const v = parseFloat(e.target.value), m = parseFloat(formData.totalFee || 0);
                    if (m > 0 && v > m) return;
                    setFormData({ ...formData, feePaid: e.target.value });
                  }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ minWidth: '130px' }}>
              {formLoading ? 'Registering...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     MAIN TABLE VIEW
  ══════════════════════════════════════════════════════════════ */
  const filteredStudents = students.filter(s => {
    const enrollmentsStr = (s.Enrollments || []).map(e => e.CourseName).join(' ').toLowerCase();
    const batchStr = (s.Enrollments || []).map(e => e.BatchName).join(' ').toLowerCase();
    const statusStr = (s.Enrollments || []).map(e => e.PaymentStatus).join(' ').toLowerCase();

    return (
      (s.StudentCode || '').toLowerCase().includes(filters.id.toLowerCase()) &&
      (s.Name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
      (s.Email || '').toLowerCase().includes(filters.email.toLowerCase()) &&
      (s.Phone || '').toLowerCase().includes(filters.phone.toLowerCase()) &&
      (s.Designation || '').toLowerCase().includes(filters.designation.toLowerCase()) &&
      (enrollmentsStr.includes(filters.course.toLowerCase()) || (filters.course === '' && s.Enrollments?.length === 0)) &&
      (batchStr.includes(filters.batch.toLowerCase()) || (filters.batch === '' && s.Enrollments?.length === 0)) &&
      (statusStr.includes(filters.status.toLowerCase()) || (filters.status === '' && s.Enrollments?.length === 0))
    );
  });

  return (
    <div className="content-wrapper">
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '13px' }}>
          <AlertCircle size={18} />
          <div><strong>Backend Connection Failed</strong> — The frontend cannot reach the backend API.</div>
        </div>
      )}

      <div className="section-card">
        {/* Header */}
        <div className="section-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Users size={18} />
            </div>
            <div>
              <h2 className="section-title">User Management</h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} {selectedStudents.length > 0 ? `· ${selectedStudents.length} selected` : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedStudents.length > 0 && (
              <BulkActionMenu 
                selectedCount={selectedStudents.length} 
                onAction={handleBulkAction} 
              />
            )}
            <button className="btn btn-secondary" onClick={() => {
              const courseInfo = courses.map(c => `CourseID ${c.ID}=${c.Name}`).join(' | ');
              const classInfo = classes.map(c => `ClassID ${c.ClassID}=${c.BatchName}`).join(' | ');
              const header = `Name,Email,Phone,Password,CourseID,ClassID,FeePaid,Gender,City,Country,DOB`;
              const ex1 = `John Doe,john@example.com,9876543210,password123,${courses[0]?.ID || 1},${classes[0]?.ClassID || 1},5000,Male,Mumbai,India,2000-01-15`;
              const ex2 = `Jane Smith,jane@example.com,9876543211,password123,${courses[0]?.ID || 1},${classes[0]?.ClassID || 1},0,Female,Delhi,India,2001-03-20`;
              const csvContent = `data:text/csv;charset=utf-8,${header}\n${ex1}\n${ex2}\n# ${courseInfo || 'No courses yet'} || ${classInfo || 'No classes yet'}`;
              const a = document.createElement('a');
              a.setAttribute('href', encodeURI(csvContent));
              a.setAttribute('download', 'Student_Import_Template.csv');
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }}>
              Template
            </button>
            <button className="btn btn-secondary" onClick={fetchData} title="Refresh Table Data">
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> Import
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add Student
            </button>
          </div>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, marginRight: '6px', gap: '4px' }}>
            <Filter size={13} /> Filters
          </div>
          {[['id', 'ID', 100], ['name', 'Name', 130], ['email', 'Email', 140], ['phone', 'Phone', 120], ['designation', 'Designation', 130], ['course', 'Course', 120], ['batch', 'Batch', 110]].map(([key, ph, w]) => (
            <div key={key} style={{ position: 'relative', width: w }}>
              <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder={ph} value={filters[key]} onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                className="form-input" style={{ paddingLeft: '28px', fontSize: '11px', height: '34px', padding: '0 10px 0 28px' }} />
            </div>
          ))}
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="form-input" style={{ width: '130px', fontSize: '12px', height: '34px', padding: '0 10px' }}>
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
          </select>
          {Object.values(filters).some(Boolean) && (
            <button className="btn btn-ghost" onClick={() => setFilters({ id: '', name: '', email: '', course: '', batch: '', status: '', designation: '', phone: '' })} style={{ height: '34px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '12px' }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" onChange={handleSelectAll} checked={students.length > 0 && selectedStudents.length === students.length} />
                </th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Paid / Total</th>
                <th>Interests</th>
                <th>Acct.</th>
                <th>Payment</th>
                <th style={{ width: 50 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 28, height: 28, border: '2.5px solid var(--border)', borderTop: '2.5px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Loading students...
                  </div>
                </td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No students found matching your filters.
                </td></tr>
              ) : filteredStudents.map((s, i) => {
                const menuItems = [
                  isSuperAdmin && !s.IsActive && {
                    label: 'Activate Account',
                    icon: <ShieldCheck size={14} />,
                    onClick: () => handleActivateAccount(s.ID)
                  },
                  isSuperAdmin && s.IsActive && {
                    label: 'Deactivate Account',
                    icon: <ShieldAlert size={14} />,
                    danger: true,
                    onClick: () => handleDeactivateAccount(s.ID)
                  },
                  isSuperAdmin && !s.IsLocked && {
                    label: 'Lock Account',
                    icon: <Lock size={14} />,
                    danger: true,
                    onClick: () => handleLockAccount(s.ID)
                  },
                  isSuperAdmin && s.IsLocked && {
                    label: 'Unlock Account',
                    icon: <Unlock size={14} />,
                    onClick: () => handleUnlockAccount(s.ID)
                  },
                  isSuperAdmin && {
                    label: 'Send Password Reset',
                    icon: <KeyRound size={14} />,
                    onClick: () => handleSendResetPassword(s.Email)
                  },
                  isSuperAdmin && {
                    label: 'Change Course',
                    icon: <BookOpen size={14} />,
                    onClick: () => { setChangeCourseStudent(s); setChangeCourseData({ courseId: '', classId: '', totalFee: '', amountPaid: '' }); }
                  },
                  isSuperAdmin && 'divider',
                  {
                    label: 'Delete Student',
                    icon: <Trash2 size={14} />,
                    danger: true,
                    onClick: () => handleDelete(s.ID)
                  }
                ].filter(Boolean);

                return (
                  <tr key={`${s.ID}-${i}`}>
                    <td><input type="checkbox" checked={selectedStudents.includes(s.ID)} onChange={() => handleSelect(s.ID)} /></td>
                    <td>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        {s.StudentCode || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                          {(s.Name || '?')[0].toUpperCase()}
                        </div>
                        <strong style={{ fontSize: '13.5px' }}>{s.Name}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-sub)', fontSize: '12.5px' }}>{s.Email}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.Designation || '—'}</td>
                    <td style={{ padding: 0 }}>
                      {s.Enrollments && s.Enrollments.length > 0 ? s.Enrollments.map((en, idx) => (
                        <div key={idx} style={{ padding: '12px 14px', borderBottom: idx < s.Enrollments.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '13px' }}>
                          {en.CourseName || <span style={{ color: 'var(--warning)', fontSize: '12px', fontWeight: 500 }}>Unassigned</span>}
                        </div>
                      )) : <div style={{ padding: '12px 14px' }}><span style={{ color: 'var(--warning)', fontSize: '12px', fontWeight: 500 }}>Unassigned</span></div>}
                    </td>
                    <td style={{ padding: 0 }}>
                      {s.Enrollments && s.Enrollments.length > 0 ? s.Enrollments.map((en, idx) => (
                        <div key={idx} style={{ padding: '12px 14px', borderBottom: idx < s.Enrollments.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '12.5px' }}>
                          {en.BatchName || '—'}
                        </div>
                      )) : <div style={{ padding: '12px 14px' }}>—</div>}
                    </td>
                    <td style={{ padding: 0 }}>
                      {s.Enrollments && s.Enrollments.length > 0 ? s.Enrollments.map((en, idx) => (
                        <div key={idx} style={{ padding: '12px 14px', borderBottom: idx < s.Enrollments.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                          {en.AmountPaid != null
                            ? <span>₹{Number(en.AmountPaid).toLocaleString()} <span style={{ color: 'var(--text-muted)' }}>/ ₹{Number(en.TotalFee).toLocaleString()}</span></span>
                            : '—'}
                        </div>
                      )) : <div style={{ padding: '12px 14px' }}>—</div>}
                    </td>
                    <td><DomainChips domains={s.InterestedDomains} /></td>
                    <td>
                      {s.IsLocked ? (
                        <span className="status-badge danger"><Lock size={10} style={{ marginRight: 4 }}/> Locked</span>
                      ) : s.IsActive ? (
                        <span className="status-badge success">Active</span>
                      ) : (
                        <span className="status-badge danger">Inactive</span>
                      )}
                    </td>
                    <td style={{ padding: 0 }}>
                      {s.Enrollments && s.Enrollments.length > 0 ? s.Enrollments.map((en, idx) => (
                        <div key={idx} style={{ padding: '11px 14px', borderBottom: idx < s.Enrollments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <span className={`status-badge ${en.PaymentStatus === 'Paid' ? 'success' : en.PaymentStatus === 'Partial' ? 'warning' : 'danger'}`}>
                            {en.PaymentStatus || 'N/A'}
                          </span>
                        </div>
                      )) : <div style={{ padding: '11px 14px' }}><span className="status-badge danger">N/A</span></div>}
                    </td>
                    <td>
                      <ActionMenu items={menuItems} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
}
