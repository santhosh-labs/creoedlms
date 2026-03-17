import { useState, useEffect } from 'react';
import {
    Settings, User, Palette, Bell, Shield,
    Monitor, Moon, Sun, Check, Lock, Save, Edit,
    MapPin, Eye, EyeOff, AlertCircle, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ── Theme options ──────────────────────────────────────────────
const THEMES = [
    { id: 'light',  label: 'Light',  icon: <Sun  size={20} />, desc: 'Clean white interface' },
    { id: 'dark',   label: 'Dark',   icon: <Moon size={20} />, desc: 'Easy on the eyes' },
    { id: 'system', label: 'System', icon: <Monitor size={20} />, desc: 'Match OS preference' },
];

const ACCENT_COLORS = [
    { id: 'green',  label: 'Creoed Green',   hex: '#1aae64' },
    { id: 'blue',   label: 'Ocean Blue',     hex: '#1976d2' },
    { id: 'purple', label: 'Royal Purple',   hex: '#7c3aed' },
    { id: 'orange', label: 'Sunset Orange',  hex: '#ea580c' },
    { id: 'teal',   label: 'Teal',           hex: '#0d9488' },
];

// ── Reusable toast helper ──────────────────────────────────────
const toast = (msg, color = 'var(--primary)') => {
    const b = document.createElement('div');
    b.textContent = msg;
    Object.assign(b.style, {
        position: 'fixed', top: '24px', right: '24px',
        background: color, color: '#fff', padding: '12px 22px',
        borderRadius: '10px', zIndex: 9999, fontWeight: 600,
        boxShadow: '0 6px 24px rgba(0,0,0,0.18)', fontSize: '14px',
    });
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 3000);
};

// ── Shared styles ──────────────────────────────────────────────
const card  = { background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '28px', marginBottom: '20px' };
const sh    = { fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '9px' };
const lbl   = { fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' };
const ro    = { padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' };

export default function SettingsPage({ user }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('account');

    // ── Profile state ──────────────────────────────────────────
    const [profile,   setProfile]   = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [profErr,   setProfErr]   = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData,  setEditData]  = useState({ dateOfBirth: '', gender: '', city: '', country: '', collegeName: '' });
    const [saving,    setSaving]    = useState(false);

    // ── Password state ─────────────────────────────────────────
    const [passwords,   setPasswords]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew,     setShowNew]     = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [passAlert,   setPassAlert]   = useState(null);

    // ── Appearance state ───────────────────────────────────────
    const [selTheme,  setSelTheme]  = useState(() => localStorage.getItem('creoed-theme')  || 'dark');
    const [selAccent, setSelAccent] = useState(() => localStorage.getItem('creoed-accent') || 'green');

    // ── Notification state ─────────────────────────────────────
    const [notifAnn, setNotifAnn] = useState(() => localStorage.getItem('notif-ann')  !== 'false');
    const [notifTix, setNotifTix] = useState(() => localStorage.getItem('notif-tix')  !== 'false');
    const [notifMsg, setNotifMsg] = useState(() => localStorage.getItem('notif-msg')  !== 'false');
    const [notifSaving, setNotifSaving] = useState(false);

    // ── Fetch profile ──────────────────────────────────────────
    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get('/auth/me');
            setProfile(res.data);
            setEditData({
                dateOfBirth: res.data.DateOfBirth ? res.data.DateOfBirth.split('T')[0] : '',
                gender: res.data.Gender || '',
                city:   res.data.City    || '',
                country:res.data.Country || '',
                collegeName: res.data.CollegeName || '',
            });
        } catch {
            setProfErr(true);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchProfile(); }, []);

    // ── Save profile ───────────────────────────────────────────
    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await api.put('/users/profile', editData);
            await fetchProfile();
            setIsEditing(false);
            toast('✓ Profile updated successfully');
        } catch {
            toast('✗ Failed to update profile', '#e53e3e');
        } finally {
            setSaving(false);
        }
    };

    // ── Change password ────────────────────────────────────────
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return setPassAlert({ type: 'error', msg: 'New passwords do not match.' });
        }
        if (passwords.newPassword.length < 6) {
            return setPassAlert({ type: 'error', msg: 'Password must be at least 6 characters.' });
        }
        setPassLoading(true);
        setPassAlert(null);
        try {
            const res = await api.put('/users/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword:     passwords.newPassword,
            });
            setPassAlert({ type: 'success', msg: res.data.message || 'Password changed successfully!' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPassAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to change password.' });
        } finally {
            setPassLoading(false);
        }
    };

    // ── Theme ──────────────────────────────────────────────────
    const applyTheme = (theme) => {
        setSelTheme(theme);
        localStorage.setItem('creoed-theme', theme);
        document.documentElement.setAttribute('data-theme',
            theme === 'system'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : theme
        );
        toast(`✓ Theme set to ${theme}`);
    };

    // ── Accent colour ──────────────────────────────────────────
    const applyAccent = (id) => {
        setSelAccent(id);
        localStorage.setItem('creoed-accent', id);
        const hex = ACCENT_COLORS.find(c => c.id === id)?.hex || '#1aae64';
        document.documentElement.style.setProperty('--primary', hex);
        toast(`✓ Accent colour updated`);
    };

    // ── Save notifications ─────────────────────────────────────
    const saveNotifs = async () => {
        setNotifSaving(true);
        // Save to localStorage (these are UI-level prefs)
        localStorage.setItem('notif-ann', notifAnn);
        localStorage.setItem('notif-tix', notifTix);
        localStorage.setItem('notif-msg', notifMsg);
        // Optionally persist to backend if a user-prefs endpoint exists
        try {
            await api.put('/users/profile', {}); // keeps session alive; extend this if backend has notif prefs
        } catch { /* silent */ }
        setNotifSaving(false);
        toast('✓ Notification preferences saved');
    };

    // ── Helpers ────────────────────────────────────────────────
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const Toggle = ({ val, set }) => (
        <button onClick={() => set(!val)}
            style={{ width: '48px', height: '27px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: val ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
            <div style={{ width: '21px', height: '21px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '3px', left: val ? '24px' : '3px',
                transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </button>
    );

    const PwdInput = ({ placeholder, value, onChange, show, setShow }) => (
        <div style={{ position: 'relative' }}>
            <input type={show ? 'text' : 'password'} required className="form-input"
                placeholder={placeholder} value={value} onChange={onChange}
                style={{ paddingRight: '42px' }} />
            <button type="button" onClick={() => setShow(!show)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );

    // ── Tab definitions ────────────────────────────────────────
    const TABS = [
        { id: 'account',  label: 'My Account',    icon: <User size={15} /> },
        { id: 'security', label: 'Security',       icon: <Shield size={15} /> },
        { id: 'appearance',label:'Appearance',     icon: <Palette size={15} /> },
        { id: 'notif',    label: 'Notifications',  icon: <Bell size={15} /> },
    ];

    return (
        <div className="content-wrapper" style={{ maxWidth: '100%', paddingRight: '40px' }}>

            {/* ── Page header ───────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    <Settings size={22} />
                </div>
                <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Settings</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Manage your profile, password, appearance and preferences</p>
                </div>
            </div>

            {/* ── Tab strip ─────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', borderRadius: '12px', padding: '5px', marginBottom: '26px', border: '1px solid var(--border)' }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 600,
                        background: activeTab === t.id ? 'var(--surface)' : 'transparent',
                        color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                        boxShadow: activeTab === t.id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all .15s',
                    }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ─────────────────── MY ACCOUNT ──────────────── */}
            {activeTab === 'account' && (
                <>
                    {profErr && (
                        <div style={{ display: 'flex', gap: '10px', padding: '14px 18px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '10px', marginBottom: '20px' }}>
                            <AlertCircle size={18} /> <strong>Could not load profile — backend connection failed.</strong>
                        </div>
                    )}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading profile...</div>
                    ) : profile && (
                        <>
                            {/* Avatar + name strip */}
                            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '20px', padding: '22px 28px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '26px', fontWeight: 800, flexShrink: 0 }}>
                                    {(profile.Name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{profile.Name}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{profile.Email}</div>
                                    <div style={{ marginTop: '6px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--primary)', color: '#fff', padding: '2px 10px', borderRadius: '20px' }}>
                                            {profile.StudentCode || profile.RoleName}
                                        </span>
                                    </div>
                                </div>
                                {!isEditing ? (
                                    <button className="btn btn-secondary" onClick={() => setIsEditing(true)} style={{ gap: '6px' }}>
                                        <Edit size={14} /> Edit Profile
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</button>
                                        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ gap: '6px' }}>
                                            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Personal info grid */}
                            <div style={card}>
                                <h3 style={sh}><User size={17} color="var(--primary)" /> Personal Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                                    {/* Locked fields */}
                                    <div>
                                        <label style={lbl}>Full Name <Lock size={10} /></label>
                                        <div style={ro}>{profile.Name || '—'}</div>
                                    </div>
                                    <div>
                                        <label style={lbl}>Email Address <Lock size={10} /></label>
                                        <div style={ro}>{profile.Email || '—'}</div>
                                    </div>
                                    <div>
                                        <label style={lbl}>Phone Number <Lock size={10} /></label>
                                        <div style={ro}>{profile.Phone || '—'}</div>
                                    </div>
                                    <div>
                                        <label style={lbl}>Role</label>
                                        <div style={ro}><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{profile.RoleName}</span></div>
                                    </div>

                                    {/* Editable fields */}
                                    <div>
                                        <label style={lbl}>Gender</label>
                                        {isEditing ? (
                                            <select className="form-input" value={editData.gender} onChange={e => setEditData({ ...editData, gender: e.target.value })}>
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        ) : <div style={ro}>{profile.Gender || '—'}</div>}
                                    </div>
                                    <div>
                                        <label style={lbl}>Date of Birth</label>
                                        {isEditing ? (
                                            <input type="date" className="form-input" value={editData.dateOfBirth} onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })} />
                                        ) : <div style={ro}>{fmt(profile.DateOfBirth)}</div>}
                                    </div>
                                    <div>
                                        <label style={lbl}>College / University</label>
                                        {isEditing ? (
                                            <input type="text" className="form-input" placeholder="Enter college name" value={editData.collegeName || ''} onChange={e => setEditData({ ...editData, collegeName: e.target.value })} />
                                        ) : <div style={ro}>{profile.CollegeName || '—'}</div>}
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '24px 0' }} />
                                <h3 style={{ ...sh, marginBottom: '16px' }}><MapPin size={16} color="var(--primary)" /> Address Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                                    <div>
                                        <label style={lbl}>City</label>
                                        {isEditing ? (
                                            <input type="text" className="form-input" placeholder="Enter city" value={editData.city} onChange={e => setEditData({ ...editData, city: e.target.value })} />
                                        ) : <div style={ro}>{profile.City || '—'}</div>}
                                    </div>
                                    <div>
                                        <label style={lbl}>Country</label>
                                        {isEditing ? (
                                            <input type="text" className="form-input" placeholder="Enter country" value={editData.country} onChange={e => setEditData({ ...editData, country: e.target.value })} />
                                        ) : <div style={ro}>{profile.Country || '—'}</div>}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ─────────────────── SECURITY ────────────────── */}
            {activeTab === 'security' && (
                <div style={card}>
                    <h3 style={sh}><Shield size={17} color="var(--primary)" /> Change Password</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>
                        Enter your current password then choose a new secure password (min. 6 characters).
                    </p>

                    {passAlert && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: 500,
                            background: passAlert.type === 'error' ? 'var(--danger-bg)' : '#e8f5ee',
                            color:      passAlert.type === 'error' ? 'var(--danger)'    : 'var(--primary)' }}>
                            {passAlert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {passAlert.msg}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '460px' }}>
                        <div>
                            <label style={lbl}>Current Password</label>
                            <PwdInput placeholder="Your current password" value={passwords.currentPassword}
                                onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                show={showCurrent} setShow={setShowCurrent} />
                        </div>
                        <div>
                            <label style={lbl}>New Password</label>
                            <PwdInput placeholder="New password (min 6 chars)" value={passwords.newPassword}
                                onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                show={showNew} setShow={setShowNew} />
                        </div>
                        <div>
                            <label style={lbl}>Confirm New Password</label>
                            <PwdInput placeholder="Repeat new password" value={passwords.confirmPassword}
                                onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                show={showConfirm} setShow={setShowConfirm} />
                            {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                                <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '5px' }}>Passwords do not match</p>
                            )}
                        </div>
                        <div>
                            <button type="submit" className="btn btn-primary" disabled={passLoading || passwords.newPassword !== passwords.confirmPassword}>
                                {passLoading ? 'Changing…' : 'Update Password'}
                            </button>
                        </div>
                    </form>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '28px 0' }} />
                    <h3 style={{ ...sh, marginBottom: '14px' }}><Shield size={17} color="var(--danger)" /> Session</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                        Signed in as <strong>{user?.name}</strong> · {user?.role}
                    </p>
                    <button className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => { localStorage.clear(); navigate('/login'); }}>
                        Sign Out of All Sessions
                    </button>
                </div>
            )}

            {/* ─────────────────── APPEARANCE ──────────────── */}
            {activeTab === 'appearance' && (
                <>
                    <div style={card}>
                        <h3 style={sh}><Sun size={17} color="var(--primary)" /> Theme</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                            {THEMES.map(t => (
                                <button key={t.id} onClick={() => applyTheme(t.id)} style={{
                                    padding: '18px 14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
                                    border: `2px solid ${selTheme === t.id ? 'var(--primary)' : 'var(--border)'}`,
                                    background: selTheme === t.id ? 'rgba(26,174,100,0.08)' : 'var(--bg)',
                                    position: 'relative', transition: 'all .15s' }}>
                                    <div style={{ color: 'var(--primary)', marginBottom: '10px' }}>{t.icon}</div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{t.label}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{t.desc}</div>
                                    {selTheme === t.id && (
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Check size={13} color="#fff" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={card}>
                        <h3 style={sh}><Palette size={17} color="var(--primary)" /> Accent Colour</h3>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            {ACCENT_COLORS.map(c => (
                                <button key={c.id} onClick={() => applyAccent(c.id)} title={c.label} style={{
                                    width: '44px', height: '44px', borderRadius: '50%', background: c.hex,
                                    border: `3px solid ${selAccent === c.id ? '#222' : 'transparent'}`,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all .15s' }}>
                                    {selAccent === c.id && <Check size={17} color="#fff" />}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '14px' }}>
                            Colour applies immediately across the entire platform.
                        </p>
                    </div>
                </>
            )}

            {/* ─────────────────── NOTIFICATIONS ───────────── */}
            {activeTab === 'notif' && (
                <div style={card}>
                    <h3 style={sh}><Bell size={17} color="var(--primary)" /> Notification Preferences</h3>
                    {[
                        { label: 'Announcements',  desc: 'Get notified when new announcements are posted',     val: notifAnn, set: setNotifAnn },
                        { label: 'Doubt Tickets',  desc: 'Receive alerts for ticket updates and new replies',  val: notifTix, set: setNotifTix },
                        { label: 'Direct Messages',desc: 'Get notified when you receive a new message',        val: notifMsg, set: setNotifMsg },
                    ].map((p, i, arr) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{p.label}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{p.desc}</div>
                            </div>
                            <Toggle val={p.val} set={p.set} />
                        </div>
                    ))}
                    <div style={{ marginTop: '24px' }}>
                        <button className="btn btn-primary" onClick={saveNotifs} disabled={notifSaving}>
                            {notifSaving ? 'Saving…' : 'Save Preferences'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
