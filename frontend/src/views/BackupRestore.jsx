import { useEffect, useState } from 'react';
import { Database, Download, Trash2, RefreshCw, ShieldCheck, Archive, AlertTriangle, CheckCircle2, Clock, HardDrive } from 'lucide-react';
import api from '../api';

export default function BackupRestore({ user }) {
    const [backups, setBackups]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [creating, setCreating]   = useState(false);
    const [message, setMessage]     = useState(null); // { type: 'success'|'error', text }
    const [deletingId, setDeletingId] = useState(null);

    const isSuperAdmin = user?.role === 'Super Admin';

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const r = await api.get('/backup/list');
            setBackups(r.data);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load backups.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBackups(); }, []);

    const createBackup = async () => {
        setCreating(true);
        setMessage(null);
        try {
            const r = await api.post('/backup/create');
            setMessage({ type: 'success', text: r.data.message });
            fetchBackups();
        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.message || 'Backup creation failed.' });
        } finally {
            setCreating(false);
        }
    };

    const downloadBackup = async (filename) => {
        const token = localStorage.getItem('token');
        const link = document.createElement('a');
        link.href = `${api.defaults.baseURL}/backup/download/${filename}`;
        link.download = filename;
        // Add auth header via fetch and blob
        try {
            const res = await fetch(`${api.defaults.baseURL}/backup/download/${filename}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
        } catch {
            setMessage({ type: 'error', text: 'Download failed.' });
        }
    };

    const deleteBackup = async (filename) => {
        if (!window.confirm(`Delete backup "${filename}"? This cannot be undone.`)) return;
        setDeletingId(filename);
        try {
            await api.delete(`/backup/${filename}`);
            setMessage({ type: 'success', text: 'Backup deleted.' });
            fetchBackups();
        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to delete backup.' });
        } finally {
            setDeletingId(null);
        }
    };

    const formatSize = (bytes) => {
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${bytes} B`;
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="content-wrapper">
            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #1aae64, #0d8a4f)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(26,174,100,0.3)' }}>
                        <Database size={24} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>Backup & Restore</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Full snapshots of your database and codebase</p>
                    </div>
                </div>
                <button
                    onClick={createBackup}
                    disabled={creating}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '12px', background: creating ? 'var(--border)' : 'linear-gradient(135deg, #1aae64, #0d8a4f)', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: creating ? 'not-allowed' : 'pointer', boxShadow: creating ? 'none' : '0 4px 14px rgba(26,174,100,0.35)', transition: 'all 0.2s' }}
                >
                    {creating
                        ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating Backup...</>
                        : <><Archive size={16} /> Create Full Backup</>
                    }
                </button>
            </div>

            {/* Info Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[
                    { icon: <Database size={20} color="#1aae64"/>, label: 'Database', desc: 'Full MySQL dump of all tables and data' },
                    { icon: <Archive size={20} color="#6366f1"/>, label: 'Backend Code', desc: 'All server routes, configs and scripts' },
                    { icon: <HardDrive size={20} color="#f59e0b"/>, label: 'Frontend Code', desc: 'All React source files and pages' },
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                            {item.icon}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>Includes {item.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toast message */}
            {message && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', border: `1px solid ${message.type === 'success' ? 'rgba(26,174,100,0.25)' : 'rgba(239,68,68,0.25)'}`, color: message.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{message.text}</span>
                    <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '18px', lineHeight: 1 }}>×</button>
                </div>
            )}

            {/* Backup List */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                        Available Backups
                        <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px' }}>{backups.length}</span>
                    </h3>
                    <button onClick={fetchBackups} title="Refresh" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}>
                        <RefreshCw size={16} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading backups...</div>
                ) : backups.length === 0 ? (
                    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                        <Database size={48} style={{ color: 'var(--border)', margin: '0 auto 16px', display: 'block' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600 }}>No backups yet</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Click "Create Full Backup" to take your first snapshot</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg)' }}>
                                    {['Backup Name', 'Created At', 'Size', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '13px 24px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {backups.map((b, i) => (
                                    <tr key={b.filename} style={{ borderBottom: i !== backups.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.15s' }}
                                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(26,174,100,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Archive size={16} style={{ color: 'var(--primary)' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>{b.filename}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                                <Clock size={13} /> {formatDate(b.createdAt)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                                                {formatSize(b.sizeBytes)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={() => downloadBackup(b.filename)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--primary)', background: 'rgba(26,174,100,0.06)', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                                                >
                                                    <Download size={14} /> Download
                                                </button>
                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={() => deleteBackup(b.filename)}
                                                        disabled={deletingId === b.filename}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: '1px solid transparent', background: 'none', color: deletingId === b.filename ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 600, fontSize: '13px', cursor: deletingId === b.filename ? 'default' : 'pointer' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Restore Instructions */}
            <div style={{ marginTop: '24px', padding: '20px 24px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', display: 'flex', gap: '16px' }}>
                <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)', marginBottom: '6px' }}>Restore Instructions</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                        To restore from a backup: <strong>(1)</strong> Download the <code>.zip</code> file. <strong>(2)</strong> Extract it — you'll find a <code>database_dump.sql</code> inside. <strong>(3)</strong> Import that SQL file using <strong>phpMyAdmin</strong> or run <code>mysql -u root creoedlms &lt; database_dump.sql</code> in your terminal. <strong>(4)</strong> Replace the <code>backend/</code> and <code>frontend/</code> folders with the extracted copies and restart the server.
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
