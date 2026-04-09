import { useState, useEffect } from 'react';
import { Tag, AlertCircle, Plus, X, ToggleLeft, ToggleRight, Clock, CheckCircle } from 'lucide-react';
import api from '../api';

export default function Coupons() {
    const [coupons, setCoupons]       = useState([]);
    const [logs, setLogs]             = useState([]);
    const [activeTab, setActiveTab]   = useState('list');
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(false);
    const [showForm, setShowForm]     = useState(false);
    const [creating, setCreating]     = useState(false);
    const [formData, setFormData]     = useState({
        code: '', discountPercentage: 100, usageLimit: 1, validUntil: ''
    });

    useEffect(() => { fetchCoupons(); fetchLogs(); }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true); setError(false);
            const res = await api.get('/coupons');
            setCoupons(res.data);
        } catch (err) {
            console.error('Failed to load coupons', err);
            setError(true);
        } finally { setLoading(false); }
    };

    const fetchLogs = async () => {
        try {
            const res = await api.get('/coupons/logs');
            setLogs(res.data);
        } catch (err) { console.error('Failed to load logs', err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/coupons', formData);
            setShowForm(false);
            setFormData({ code: '', discountPercentage: 100, usageLimit: 1, validUntil: '' });
            fetchCoupons();
            toast('✓ Coupon created successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create coupon');
        } finally { setCreating(false); }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await api.put(`/coupons/${id}`, { isActive: !currentStatus });
            fetchCoupons();
        } catch { alert('Failed to update status'); }
    };

    const toast = (msg) => {
        const el = document.createElement('div');
        el.textContent = msg;
        Object.assign(el.style, {
            position: 'fixed', top: '20px', right: '20px',
            background: 'var(--success)', color: '#fff',
            padding: '12px 20px', borderRadius: '8px',
            zIndex: 9999, fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        });
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    };

    const formatDate = (d) => d
        ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Never';

    const statusInfo = (c) => {
        if (!c.IsActive) return { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'Disabled' };
        if (c.ValidUntil && new Date(c.ValidUntil) < new Date())
            return { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Expired' };
        if (c.UsageCount >= c.UsageLimit)
            return { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Exhausted' };
        return { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Active' };
    };

    return (
        <div className="content-wrapper">
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <strong>Backend Connection Failed — Cannot reach the API.</strong>
                </div>
            )}

            {/* ── Create Coupon Form ── */}
            {showForm && (
                <div className="section-card" style={{ marginBottom: '24px' }}>
                    <div className="section-header">
                        <h2 className="section-title">
                            <Plus size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                            Create New Coupon
                        </h2>
                        <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                            <X size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Cancel
                        </button>
                    </div>
                    <form onSubmit={handleCreate} style={{ padding: '0 0 8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                                Coupon Code *
                            </label>
                            <input
                                className="form-input"
                                required
                                type="text"
                                placeholder="e.g. FREE100"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                                Discount %
                            </label>
                            <input
                                className="form-input"
                                required type="number" min="1" max="100"
                                value={formData.discountPercentage}
                                onChange={e => setFormData({ ...formData, discountPercentage: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                                Usage Limit
                            </label>
                            <input
                                className="form-input"
                                required type="number" min="1"
                                value={formData.usageLimit}
                                onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                                Expiry Date (optional)
                            </label>
                            <input
                                className="form-input"
                                type="datetime-local"
                                value={formData.validUntil}
                                onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
                            <button type="submit" className="btn btn-primary" disabled={creating}>
                                {creating ? 'Creating...' : '+ Create Coupon'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Main Card ── */}
            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title">
                        <Tag size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                        Coupons Management
                    </h2>
                    {!showForm && (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            <Plus size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> New Coupon
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', padding: '0 0 0 0', borderBottom: '1px solid var(--border)', marginBottom: '0' }}>
                    {[
                        { key: 'list', label: 'Active & Expired Coupons', icon: <Tag size={14} /> },
                        { key: 'logs', label: 'Usage History Logs', icon: <Clock size={14} /> }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '12px 20px', border: 'none', cursor: 'pointer',
                                fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                                background: 'transparent',
                                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                                marginBottom: '-1px', transition: 'all 0.15s',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Coupons Table ── */}
                {activeTab === 'list' && (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th>Uses / Limit</th>
                                    <th>Expires On</th>
                                    <th>Status</th>
                                    <th>Toggle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : coupons.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No coupons created yet. Click "+ New Coupon" to get started.</td></tr>
                                ) : coupons.map(c => {
                                    const st = statusInfo(c);
                                    return (
                                        <tr key={c.ID}>
                                            <td>
                                                <span style={{
                                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                                    fontWeight: 700, fontSize: '13px', padding: '3px 10px',
                                                    borderRadius: '4px', letterSpacing: '1px', fontFamily: 'monospace'
                                                }}>
                                                    {c.Code}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '15px' }}>
                                                    {c.DiscountPercentage}%
                                                </span>
                                                {c.DiscountPercentage === 100 && (
                                                    <span style={{ marginLeft: '6px', fontSize: '11px', background: 'var(--success-bg)', color: 'var(--success)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                                        FREE
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600 }}>{c.UsageCount}</span>
                                                <span style={{ color: 'var(--text-muted)' }}> / {c.UsageLimit}</span>
                                                <div style={{ marginTop: '4px', height: '4px', background: 'var(--border)', borderRadius: '2px', width: '80px' }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: '2px',
                                                        width: `${Math.min(100, (c.UsageCount / c.UsageLimit) * 100)}%`,
                                                        background: c.UsageCount >= c.UsageLimit ? 'var(--danger)' : 'var(--primary)'
                                                    }} />
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                                {formatDate(c.ValidUntil)}
                                            </td>
                                            <td>
                                                <span style={{
                                                    background: st.bg, color: st.color,
                                                    padding: '3px 10px', borderRadius: '20px',
                                                    fontSize: '12px', fontWeight: 600
                                                }}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => toggleStatus(c.ID, c.IsActive)}
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '4px 12px', fontSize: '12px', display: 'flex',
                                                        alignItems: 'center', gap: '4px',
                                                        color: c.IsActive ? 'var(--danger)' : 'var(--success)',
                                                        borderColor: c.IsActive ? 'var(--danger)' : 'var(--success)',
                                                    }}
                                                >
                                                    {c.IsActive
                                                        ? <><ToggleRight size={14} /> Disable</>
                                                        : <><ToggleLeft size={14} /> Enable</>
                                                    }
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Logs Table ── */}
                {activeTab === 'logs' && (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Coupon Used</th>
                                    <th>Student Code</th>
                                    <th>Student Name</th>
                                    <th>Course Purchased</th>
                                    <th>Discount</th>
                                    <th>Claimed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            <CheckCircle size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
                                            No coupons have been claimed yet.
                                        </td>
                                    </tr>
                                ) : logs.map(log => (
                                    <tr key={log.ID}>
                                        <td>
                                            <span style={{
                                                background: 'var(--primary-light)', color: 'var(--primary)',
                                                fontWeight: 700, fontSize: '13px', padding: '3px 10px',
                                                borderRadius: '4px', letterSpacing: '1px', fontFamily: 'monospace'
                                            }}>
                                                {log.Code}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                background: '#e8f5ee', color: 'var(--primary)',
                                                fontWeight: 700, fontSize: '11px', padding: '2px 8px',
                                                borderRadius: '4px', letterSpacing: '0.5px'
                                            }}>
                                                {log.StudentCode}
                                            </span>
                                        </td>
                                        <td><strong>{log.StudentName}</strong></td>
                                        <td>{log.CourseName}</td>
                                        <td>
                                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                                                -{log.DiscountPercentage}%
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                            {new Date(log.UsedAt).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
