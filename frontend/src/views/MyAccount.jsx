import { useEffect, useState } from 'react';
import { User, AlertCircle, Edit, MapPin, Calendar, CheckCircle, X, Save, Lock } from 'lucide-react';
import api from '../api';

export default function MyAccount({ user }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ dateOfBirth: '', gender: '', city: '', country: '' });
    const [saving, setSaving] = useState(false);

    // Change Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [passAlert, setPassAlert] = useState(null);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setProfile(res.data);
            setEditData({
                dateOfBirth: res.data.DateOfBirth ? res.data.DateOfBirth.split('T')[0] : '',
                gender: res.data.Gender || '',
                city: res.data.City || '',
                country: res.data.Country || ''
            });
        } catch (err) {
            console.error('Failed to load profile', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await api.put('/users/profile', editData);
            await fetchProfile();
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (err) {
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return setPassAlert({ type: 'error', msg: 'New passwords do not match' });
        }
        setPassLoading(true);
        setPassAlert(null);
        try {
            const res = await api.put('/users/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setPassAlert({ type: 'success', msg: res.data.message });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => { setShowPasswordModal(false); setPassAlert(null); }, 2000);
        } catch (err) {
            setPassAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to change password' });
        } finally {
            setPassLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        return isNaN(d) ? 'N/A' : d.toLocaleDateString();
    };

    if (loading) return <div className="content-wrapper"><div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Profile...</div></div>;

    return (
        <div className="content-wrapper">
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <div>
                        <strong>Failed to load profile</strong>
                        <p style={{ fontSize: '13px', marginTop: '4px' }}>Unable to retrieve data from the backend server.</p>
                    </div>
                </div>
            )}

            <div className="section-header">
                <h2 className="section-title">My Account</h2>
            </div>

            {profile && (
                <div className="grid-2">
                    {/* Personal Information */}
                    <div className="section-card">
                        <div className="section-header" style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={18} color="var(--primary)" /> Personal Information
                            </h3>
                            {!isEditing ? (
                                <button className="btn btn-secondary" onClick={() => setIsEditing(true)} style={{ padding: '4px 12px', height: '28px', fontSize: '12px' }}>
                                    <Edit size={14} /> Edit
                                </button>
                            ) : (
                                <div style={{ display:'flex', gap:'8px' }}>
                                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)} style={{ padding: '4px 12px', height: '28px', fontSize: '12px' }} disabled={saving}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSaveProfile} style={{ padding: '4px 12px', height: '28px', fontSize: '12px' }} disabled={saving}>
                                        <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name <Lock size={10}/></div>
                                <div style={{ fontWeight: '500', color: 'var(--text-main)', padding:'8px 0' }}>{profile.Name || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email Address <Lock size={10}/></div>
                                <div style={{ fontWeight: '500', color: 'var(--text-main)', padding:'8px 0' }}>{profile.Email || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number <Lock size={10}/></div>
                                <div style={{ fontWeight: '500', color: 'var(--text-main)', padding:'8px 0' }}>{profile.Phone || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Gender</div>
                                {!isEditing ? (
                                    <div style={{ fontWeight: '500', color: 'var(--text-main)', padding:'8px 0' }}>{profile.Gender || 'N/A'}</div>
                                ) : (
                                    <select className="form-input" value={editData.gender} onChange={e => setEditData({...editData, gender: e.target.value})}>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date of Birth</div>
                                {!isEditing ? (
                                    <div style={{ fontWeight: '500', color: 'var(--text-main)', padding:'8px 0' }}>{formatDate(profile.DateOfBirth)}</div>
                                ) : (
                                    <input type="date" className="form-input" value={editData.dateOfBirth} onChange={e => setEditData({...editData, dateOfBirth: e.target.value})} />
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Role</div>
                                <div style={{ padding:'8px 0' }}>
                                    <span className="status-badge status-paid">{profile.RoleName || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '24px 0' }} />

                        <h3 style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <MapPin size={18} color="var(--primary)" /> Address Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>City</div>
                                {!isEditing ? (
                                    <div style={{ fontWeight: '500', color: 'var(--text-main)', padding:'8px 0' }}>{profile.City || 'N/A'}</div>
                                ) : (
                                    <input type="text" className="form-input" value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})} placeholder="Enter City" />
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Country</div>
                                {!isEditing ? (
                                    <div style={{ fontWeight: '500', color: 'var(--text-main)', padding:'8px 0' }}>{profile.Country || 'N/A'}</div>
                                ) : (
                                    <input type="text" className="form-input" value={editData.country} onChange={e => setEditData({...editData, country: e.target.value})} placeholder="Enter Country" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Account Security & Fast Settings */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="section-card">
                            <h3 style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <CheckCircle size={18} color="var(--success)" /> Account Status
                            </h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Your account is fully active and verified. No further action is required.</p>
                            <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)} style={{ width: '100%', justifyContent: 'center' }}>Change Password</button>
                        </div>

                        <div className="section-card">
                            <h3 style={{ fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Calendar size={18} color="var(--primary)" /> Platform Registration
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Join Date</span>
                                <span style={{ fontWeight: '500' }}>Active Member</span>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Change Password</h3>
                            <button className="btn-close" onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleChangePassword}>
                            <div className="modal-body">
                                {passAlert && (
                                    <div style={{ padding:'10px', borderRadius:'var(--radius-sm)', marginBottom:'15px', fontSize:'13px', background: passAlert.type==='error'?'var(--danger-bg)':'#e8f5ee', color: passAlert.type==='error'?'var(--danger)':'var(--primary)' }}>
                                        {passAlert.msg}
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
                                    <input type="password" required className="form-input" placeholder="••••••••" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input type="password" required className="form-input" placeholder="••••••••" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input type="password" required className="form-input" placeholder="••••••••" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={passLoading}>{passLoading ? 'Changing...' : 'Change Password'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
