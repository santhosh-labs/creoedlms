import { useEffect, useState } from 'react';
import { Activity, Briefcase, BookOpen, Users, AlertCircle, X, Eye, EyeOff, Trash2 } from 'lucide-react';
import api from '../api';

const ROLES = [
    { id: 2, label: 'Admin' },
    { id: 3, label: 'Tutor' },
];

const emptyStaffForm = { name: '', email: '', phone: '', password: '', roleId: '', gender: '', city: '', country: '' };

export default function SuperAdminDashboard({ user }) {
    const [courses, setCourses] = useState([]);
    const [tutors, setTutors] = useState([]);
    const [feeSummary, setFeeSummary] = useState({ totalCollected: 0, totalPending: 0, totalStudents: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Create Staff modal
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState(emptyStaffForm);
    const [staffLoading, setStaffLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(false);
            const [courseRes, tutorRes, feeRes] = await Promise.all([
                api.get('/courses'),
                api.get('/users/tutors'),
                api.get('/fees/summary'),
            ]);
            setCourses(courseRes.data);
            setTutors(tutorRes.data);
            setFeeSummary(feeRes.data);
        } catch (err) {
            console.error('Failed to load data', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!staffForm.name || !staffForm.email || !staffForm.password || !staffForm.roleId) {
            return alert('Name, Email, Password and Role are required.');
        }
        setStaffLoading(true);
        try {
            const res = await api.post('/users/staff', staffForm);
            const code = res.data.staffCode || '';
            setStaffForm(emptyStaffForm);
            setShowStaffModal(false);
            setShowPass(false);
            fetchData();

            const banner = document.createElement('div');
            banner.textContent = `✓ Staff created${code ? ' · ID: ' + code : ''}`;
            Object.assign(banner.style, { position: 'fixed', top: '20px', right: '20px', background: 'var(--success)', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 9999, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' });
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create staff.');
        } finally {
            setStaffLoading(false);
        }
    };

    const handleDeleteStaff = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name} from the staff directory?`)) return;
        try {
            await api.delete(`/users/staff/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete staff.');
        }
    };

    const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

    const stats = [
        { title: 'Total Revenue Collected', value: loading ? '...' : fmt(feeSummary.totalCollected), icon: <Activity size={22} />, color: 'blue', sub: `${fmt(feeSummary.totalPending)} pending` },
        { title: 'Total Tutors', value: loading ? '...' : tutors.length || '0', icon: <Briefcase size={22} />, color: 'green', sub: 'Active staff' },
        { title: 'Active Courses', value: loading ? '...' : courses.length || '0', icon: <BookOpen size={22} />, color: 'yellow', sub: 'Courses registered' },
        { title: 'Students Enrolled', value: loading ? '...' : feeSummary.totalStudents || '0', icon: <Users size={22} />, color: 'purple', sub: 'Total across all courses' },
    ];

    const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' };

    if (showStaffModal) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => { setShowStaffModal(false); setStaffForm(emptyStaffForm); setShowPass(false); }} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Create Staff Member</h2>
                </div>

                <div className="section-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
                    <form onSubmit={handleCreateStaff}>
                        <div className="grid-2" style={{ gap: '20px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Role * <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>(determines system access)</span></label>
                                <select className="form-input" value={staffForm.roleId} onChange={e => setStaffForm({ ...staffForm, roleId: e.target.value })} required>
                                    <option value="">Select Role</option>
                                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Full Name *</label>
                                <input className="form-input" placeholder="e.g. Priya Sharma" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} required />
                            </div>

                            <div>
                                <label style={labelStyle}>Email Address *</label>
                                <input className="form-input" type="email" placeholder="staff@creoed.com" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} required />
                            </div>

                            <div>
                                <label style={labelStyle}>Phone Number</label>
                                <input className="form-input" type="tel" placeholder="+91 98765 43210" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} />
                            </div>

                            <div>
                                <label style={labelStyle}>Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        style={{ paddingRight: '40px' }}
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Set a secure password"
                                        value={staffForm.password}
                                        onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Gender</label>
                                <select className="form-input" value={staffForm.gender} onChange={e => setStaffForm({ ...staffForm, gender: e.target.value })}>
                                    <option value="">Select Gender</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>City</label>
                                <input className="form-input" placeholder="e.g. Bangalore" value={staffForm.city} onChange={e => setStaffForm({ ...staffForm, city: e.target.value })} />
                            </div>

                            <div>
                                <label style={labelStyle}>Country</label>
                                <input className="form-input" placeholder="e.g. India" value={staffForm.country} onChange={e => setStaffForm({ ...staffForm, country: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => { setShowStaffModal(false); setStaffForm(emptyStaffForm); }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={staffLoading}>
                                {staffLoading ? 'Creating...' : 'Create Staff Member'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            <h2 className="page-title" style={{ marginBottom: '24px' }}>Overview</h2>

            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <div>
                        <strong style={{ display: 'block' }}>Backend Connection Failed</strong>
                        <span style={{ fontSize: '13px', opacity: 0.9 }}>The frontend cannot reach the backend API.</span>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stats-card">
                        <div className="stats-info">
                            <h3>{stat.title}</h3>
                            <p>{stat.value}</p>
                            {stat.sub && <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{stat.sub}</span>}
                        </div>
                        <div className={`stats-icon-wrapper ${stat.color}`}>{stat.icon}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2">
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">Staff Directory</h2>
                        <button className="btn btn-primary" onClick={() => setShowStaffModal(true)}>+ Create Staff</button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Staff ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                                ) : tutors.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No staff registered yet</td></tr>
                                ) : (
                                    tutors.map((tut) => (
                                        <tr key={tut.ID}>
                                            <td><span className="status-badge info">{tut.StudentCode || '—'}</span></td>
                                            <td><strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{tut.Name}</strong></td>
                                            <td><span style={{ color: 'var(--text-muted)' }}>{tut.Email}</span></td>
                                            <td>
                                                <span className={`status-badge ${tut.RoleName === 'Tutor' ? 'success' : 'warning'}`}>
                                                    {tut.RoleName}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => handleDeleteStaff(tut.ID, tut.Name)}
                                                    style={{ color: 'var(--danger)', padding: '6px', borderRadius: '4px', transition: 'background 0.2s' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                    title="Delete Staff"
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

                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">Active Courses</h2>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Course Title</th>
                                    <th>Fee</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                                ) : courses.length === 0 ? (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No courses found</td></tr>
                                ) : (
                                    courses.map((c) => (
                                        <tr key={c.ID}>
                                            <td><span className="status-badge info">{c.CourseCode || '—'}</span></td>
                                            <td><strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{c.Name}</strong></td>
                                            <td><span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{Number(c.TotalFee).toLocaleString()}</span></td>
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
