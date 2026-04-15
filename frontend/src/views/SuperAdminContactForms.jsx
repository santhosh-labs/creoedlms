import { useEffect, useState } from 'react';
import { Trash2, RefreshCw, Download, CheckCircle2, Clock3, Mail, MessageSquare } from 'lucide-react';
import api from '../api';

const formatDate = (s) => {
    if (!s) return '—';
    return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function SuperAdminContactForms() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Per-column filters
    const [filters, setFilters] = useState({ name: '', email: '', phone: '', domain: '', status: '' });

    const fetchSubmissions = async () => {
        try {
            setLoading(true); setError('');
            const res = await api.get('/contact');
            setSubmissions(res.data);
        } catch (err) {
            setError('Failed to load contact submissions. ' + (err?.response?.data?.message || ''));
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchSubmissions(); }, []);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete submission from "${name}"?`)) return;
        try {
            await api.delete(`/contact/${id}`);
            setSubmissions(prev => prev.filter(s => s.ID !== id));
        } catch { alert('Failed to delete.'); }
    };

    const handleToggleStatus = async (row) => {
        const newStatus = row.Status === 'Contacted' ? 'Not Contacted' : 'Contacted';
        try {
            await api.patch(`/contact/${row.ID}/status`, { status: newStatus });
            setSubmissions(prev => prev.map(s => s.ID === row.ID ? { ...s, Status: newStatus } : s));
        } catch { alert('Failed to update status.'); }
    };

    const exportCSV = () => {
        const headers = ['#', 'Full Name', 'Email', 'Phone', 'Interested Domain', 'Message', 'Status', 'Submitted At'];
        const rows = submissions.map((s, i) => [
            i + 1, s.FullName, s.Email, s.ContactNumber || '', s.InterestedDomain || '',
            (s.Message || '').replace(/\n/g, ' '), s.Status || 'Not Contacted', formatDate(s.CreatedAt)
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `contact-submissions-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const filtered = submissions.filter(s =>
        s.FullName?.toLowerCase().includes(filters.name.toLowerCase()) &&
        s.Email?.toLowerCase().includes(filters.email.toLowerCase()) &&
        (s.ContactNumber || '').toLowerCase().includes(filters.phone.toLowerCase()) &&
        (s.InterestedDomain || '').toLowerCase().includes(filters.domain.toLowerCase()) &&
        (filters.status === '' || (s.Status || 'Not Contacted') === filters.status)
    );

    const filterInput = (key, placeholder) => (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)', flexShrink: 0 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input
                className="form-input"
                style={{ paddingLeft: '26px', height: '32px', fontSize: '13px', background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 0 }}
                placeholder={placeholder}
                value={filters[key]}
                onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
            />
        </div>
    );

    const contacted = submissions.filter(s => (s.Status || 'Not Contacted') === 'Contacted').length;
    const notContacted = submissions.length - contacted;

    return (
        <div className="content-wrapper">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquare size={22} style={{ color: 'var(--primary)' }} />
                    <div>
                        <h2 className="page-title" style={{ margin: 0 }}>Contact Form Submissions</h2>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {submissions.length} total · <span style={{ color: 'var(--success, #22c55e)' }}>{contacted} contacted</span> · <span style={{ color: 'var(--warning, #f59e0b)' }}>{notContacted} pending</span>
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={fetchSubmissions} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
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

            <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Filter Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr 1.2fr 0.9fr 120px', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary, var(--bg))', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                        Filters:
                    </div>
                    {filterInput('name', 'Name')}
                    {filterInput('email', 'Email')}
                    {filterInput('phone', 'Phone')}
                    {filterInput('domain', 'Domain')}
                    <select
                        className="form-input"
                        style={{ height: '32px', fontSize: '13px', padding: '0 8px', background: 'var(--bg)', border: '1px solid var(--border)' }}
                        value={filters.status}
                        onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    >
                        <option value="">All Statuses</option>
                        <option value="Not Contacted">Not Contacted</option>
                        <option value="Contacted">Contacted</option>
                    </select>
                </div>

                {/* Table */}
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Interested Domain</th>
                                <th>Message</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '52px', color: 'var(--text-muted)' }}>Loading submissions...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '52px', color: 'var(--text-muted)' }}>
                                    {Object.values(filters).some(Boolean) ? 'No submissions match your filters.' : 'No contact form submissions yet.'}
                                </td></tr>
                            ) : filtered.map((s, idx) => {
                                const isContacted = (s.Status || 'Not Contacted') === 'Contacted';
                                return (
                                    <tr key={s.ID}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{idx + 1}</td>
                                        <td><strong style={{ fontSize: '14px' }}>{s.FullName}</strong></td>
                                        <td>
                                            <a href={`mailto:${s.Email}`} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '13px' }}>
                                                {s.Email}
                                            </a>
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.ContactNumber || '—'}</td>
                                        <td>
                                            {s.InterestedDomain
                                                ? <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{s.InterestedDomain}</span>
                                                : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                                            }
                                        </td>
                                        <td style={{ maxWidth: '180px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
                                                {s.Message || '—'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(s.CreatedAt)}</td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                background: isContacted ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                                                color: isContacted ? '#22c55e' : '#f59e0b',
                                                fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
                                            }}>
                                                {isContacted ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                                                {isContacted ? 'Contacted' : 'Not Contacted'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                {/* Toggle status */}
                                                <button
                                                    onClick={() => handleToggleStatus(s)}
                                                    style={{
                                                        padding: '5px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', border: '1px solid',
                                                        borderColor: isContacted ? 'var(--border)' : 'var(--primary)',
                                                        color: isContacted ? 'var(--text-muted)' : 'var(--primary)',
                                                        background: 'transparent', transition: 'all 0.15s', whiteSpace: 'nowrap',
                                                    }}
                                                    onMouseOver={e => { e.currentTarget.style.background = isContacted ? 'var(--bg)' : 'var(--primary-light)'; }}
                                                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                                                    title={isContacted ? 'Mark as Not Contacted' : 'Mark as Contacted'}
                                                >
                                                    {isContacted ? 'Unmark' : 'Mark Contacted'}
                                                </button>
                                                {/* Reply */}
                                                <a
                                                    href={`mailto:${s.Email}`}
                                                    style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    title="Reply via Email"
                                                >
                                                    <Mail size={12} /> Reply
                                                </a>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(s.ID, s.FullName)}
                                                    style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', transition: 'background 0.15s' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
