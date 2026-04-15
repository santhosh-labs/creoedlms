import { useEffect, useState } from 'react';
import { Trash2, RefreshCw, Download, Mail, Users } from 'lucide-react';
import api from '../api';

const formatDate = (s) => {
    if (!s) return '—';
    return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function SuperAdminSubscribers() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const fetchSubscribers = async () => {
        try {
            setLoading(true); setError('');
            const res = await api.get('/subscribe');
            setSubscribers(res.data);
        } catch (err) {
            setError('Failed to load subscribers. ' + (err?.response?.data?.message || ''));
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchSubscribers(); }, []);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Remove "${name}" from subscribers?`)) return;
        try {
            await api.delete(`/subscribe/${id}`);
            setSubscribers(prev => prev.filter(s => s.ID !== id));
        } catch { alert('Failed to remove subscriber.'); }
    };

    const exportCSV = () => {
        const headers = ['#', 'Full Name', 'Email', 'Subscribed At'];
        const rows = subscribers.map((s, i) => [i + 1, s.FullName, s.Email, formatDate(s.SubscribedAt)]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `subscribers-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const filtered = subscribers.filter(s =>
        s.FullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.Email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="content-wrapper">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={22} style={{ color: 'var(--primary)' }} />
                    <div>
                        <h2 className="page-title" style={{ margin: 0 }}>Newsletter Subscribers</h2>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''} from the website footer
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={fetchSubscribers} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                    <button className="btn btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Download size={13} /> Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {/* Search */}
            <div style={{ marginBottom: '14px', position: 'relative', maxWidth: '380px' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input
                    className="form-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '48px' }}>#</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Subscribed At</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '52px', color: 'var(--text-muted)' }}>Loading subscribers...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '52px', color: 'var(--text-muted)' }}>
                                    {search ? 'No subscribers match your search.' : 'No subscribers yet.'}
                                </td></tr>
                            ) : filtered.map((s, idx) => (
                                <tr key={s.ID}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{idx + 1}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', color: 'var(--primary)', flexShrink: 0 }}>
                                                {s.FullName.charAt(0).toUpperCase()}
                                            </div>
                                            <strong style={{ fontSize: '14px' }}>{s.FullName}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <a href={`mailto:${s.Email}`} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Mail size={13} />{s.Email}
                                        </a>
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(s.SubscribedAt)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDelete(s.ID, s.FullName)}
                                            style={{ width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', transition: 'background 0.15s' }}
                                            onMouseOver={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            title="Remove subscriber"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
