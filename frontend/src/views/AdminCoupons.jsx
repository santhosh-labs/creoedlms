import { useState, useEffect } from 'react';
import { Tag, AlertCircle, Plus, X, ToggleLeft, ToggleRight, Clock, CheckCircle, Trash2 } from 'lucide-react';
import api from '../api';

export default function Coupons() {
    const [coupons, setCoupons]       = useState([]);
    const [logs, setLogs]             = useState([]);
    const [activeTab, setActiveTab]   = useState('list');
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(false);
    const [showForm, setShowForm]     = useState(false);
    const [creating, setCreating]     = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [formData, setFormData]     = useState({
        code: '', discountPercentage: 100, usageLimit: 1, validUntil: ''
    });

    useEffect(() => { fetchCoupons(); fetchLogs(); }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true); setError(false);
            const res = await api.get('/coupons');
            setCoupons(res.data);
            setSelectedIds([]);
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

    const handleDelete = async (id) => {
        if (!process.env.REACT_APP_LMS_PROD && !window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await api.delete(`/coupons/${id}`);
            fetchCoupons();
            toast('✓ Coupon deleted successfully!');
        } catch { alert('Failed to delete coupon'); }
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;
        if (action === 'delete' && !window.confirm(`Are you sure you want to delete ${selectedIds.length} coupons?`)) return;
        
        try {
            await api.post('/coupons/bulk-action', { ids: selectedIds, action });
            fetchCoupons();
            toast(`✓ Bulk ${action} successful!`);
            setSelectedIds([]);
        } catch { alert(`Failed to bulk ${action}`); }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === coupons.length) setSelectedIds([]);
        else setSelectedIds(coupons.map(c => c.ID));
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
            <style>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(-24px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)  scale(1); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .coupon-modal-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                    padding: 24px;
                }
                .coupon-modal {
                    background: var(--card-bg, #1e2130);
                    border: 1px solid var(--border, rgba(255,255,255,0.08));
                    border-radius: 16px;
                    width: 100%; max-width: 540px;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.45);
                    animation: modalSlideIn 0.22s ease;
                    overflow: hidden;
                }
                .coupon-modal-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 22px 28px 20px;
                    border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
                }
                .coupon-modal-title {
                    display: flex; align-items: center; gap: 12px;
                    font-size: 16px; font-weight: 700;
                    color: var(--text-primary, #fff); margin: 0;
                }
                .coupon-modal-title-icon {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: var(--primary-light, rgba(99,102,241,0.12));
                    display: flex; align-items: center; justify-content: center;
                    color: var(--primary, #6366f1); flex-shrink: 0;
                }
                .coupon-modal-close {
                    width: 32px; height: 32px; border-radius: 8px;
                    border: 1px solid var(--border, rgba(255,255,255,0.1));
                    background: transparent; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--text-muted, #888);
                    transition: background 0.15s, color 0.15s;
                }
                .coupon-modal-close:hover { background: var(--danger-bg); color: var(--danger); }
                .coupon-modal-body { padding: 28px; }
                .coupon-field-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 22px 20px;
                }
                .coupon-field { display: flex; flex-direction: column; gap: 8px; }
                .coupon-field-full { grid-column: 1 / -1; }
                .coupon-label {
                    font-size: 11.5px; font-weight: 700; letter-spacing: 0.6px;
                    text-transform: uppercase; color: var(--text-muted, #888);
                    display: flex; align-items: center; gap: 5px;
                }
                .coupon-label .req { color: var(--danger, #ef4444); font-size: 13px; }
                .coupon-label .opt {
                    font-size: 10px; font-weight: 500; color: var(--text-muted);
                    text-transform: none; letter-spacing: 0; opacity: 0.7;
                }
                .coupon-hint {
                    font-size: 11px; color: var(--text-muted, #888);
                    margin-top: 1px; line-height: 1.4; opacity: 0.8;
                }
                .date-input-wrap { position: relative; }
                .date-input-wrap .form-input {
                    width: 100%; box-sizing: border-box;
                    padding-right: 40px;
                    color-scheme: dark;
                    cursor: pointer;
                }
                .date-input-wrap .cal-icon {
                    position: absolute; right: 12px; top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                    color: var(--text-muted, #888);
                    display: flex;
                }
                .coupon-modal-footer {
                    display: flex; align-items: center; justify-content: flex-end; gap: 12px;
                    padding: 18px 28px 24px;
                    border-top: 1px solid var(--border, rgba(255,255,255,0.08));
                    margin-top: 4px;
                }
                .spin-ring {
                    width: 14px; height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff; border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
            `}</style>

            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <strong>Backend Connection Failed — Cannot reach the API.</strong>
                </div>
            )}

            {/* ── Create Coupon Modal ── */}
            {showForm && (
                <div className="coupon-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="coupon-modal">
                        {/* Header */}
                        <div className="coupon-modal-header">
                            <h2 className="coupon-modal-title">
                                <span className="coupon-modal-title-icon"><Tag size={17} /></span>
                                Create New Coupon
                            </h2>
                            <button className="coupon-modal-close" onClick={() => setShowForm(false)}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleCreate}>
                            <div className="coupon-modal-body">
                                <div className="coupon-field-grid">

                                    {/* Coupon Code — full width */}
                                    <div className="coupon-field coupon-field-full">
                                        <label className="coupon-label">
                                            Coupon Code <span className="req">*</span>
                                        </label>
                                        <input
                                            className="form-input"
                                            required
                                            type="text"
                                            placeholder="e.g. WELCOME50"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, fontSize: '15px' }}
                                        />
                                        <span className="coupon-hint">Auto-uppercased. Use letters and numbers only.</span>
                                    </div>

                                    {/* Discount % */}
                                    <div className="coupon-field">
                                        <label className="coupon-label">Discount %</label>
                                        <input
                                            className="form-input"
                                            required type="number" min="1" max="100"
                                            value={formData.discountPercentage}
                                            onChange={e => setFormData({ ...formData, discountPercentage: e.target.value })}
                                        />
                                        <span className="coupon-hint">Set 100 for a fully free enrolment.</span>
                                    </div>

                                    {/* Usage Limit */}
                                    <div className="coupon-field">
                                        <label className="coupon-label">Usage Limit</label>
                                        <input
                                            className="form-input"
                                            required type="number" min="1"
                                            value={formData.usageLimit}
                                            onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                                        />
                                        <span className="coupon-hint">Max students who can redeem this code.</span>
                                    </div>

                                    {/* Expiry Date — full width, styled date picker */}
                                    <div className="coupon-field coupon-field-full">
                                        <label className="coupon-label">
                                            Expiry Date &nbsp;<span className="opt">(optional)</span>
                                        </label>
                                        <div className="date-input-wrap">
                                            <input
                                                className="form-input"
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={formData.validUntil}
                                                onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                                            />
                                            <span className="cal-icon">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                                    <line x1="8"  y1="2" x2="8"  y2="6"/>
                                                    <line x1="3"  y1="10" x2="21" y2="10"/>
                                                </svg>
                                            </span>
                                        </div>
                                        <span className="coupon-hint">A browser calendar will open when you click the field. Leave blank for no expiry.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="coupon-modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating} style={{ minWidth: 148 }}>
                                    {creating ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span className="spin-ring" /> Creating…
                                        </span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Plus size={15} /> Create Coupon
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
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
                <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '0' }}>
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
                    <div className="table-container" style={{ paddingBottom: selectedIds.length ? '80px' : '0' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40, textAlign: 'center' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={coupons.length > 0 && selectedIds.length === coupons.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th>Uses / Limit</th>
                                    <th>Expires On</th>
                                    <th>Status</th>
                                    <th>Actions</th>
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
                                        <tr key={c.ID} style={{ background: selectedIds.includes(c.ID) ? 'var(--primary-light)' : undefined }}>
                                            <td style={{ textAlign: 'center' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.includes(c.ID)}
                                                    onChange={() => {
                                                        if (selectedIds.includes(c.ID)) setSelectedIds(selectedIds.filter(id => id !== c.ID));
                                                        else setSelectedIds([...selectedIds, c.ID]);
                                                    }}
                                                />
                                            </td>
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                                    <button
                                                        onClick={() => handleDelete(c.ID)}
                                                        className="btn btn-secondary"
                                                        style={{
                                                            padding: '4px 8px', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            color: 'var(--danger)', borderColor: 'var(--danger)',
                                                            background: 'transparent'
                                                        }}
                                                        title="Delete Coupon"
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
                )}
                
                {/* Bulk Actions Bar */}
                {selectedIds.length > 0 && activeTab === 'list' && (
                    <div style={{
                        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                        background: 'var(--card-bg)', border: '1px solid var(--border)',
                        padding: '12px 24px', borderRadius: 12, display: 'flex', gap: 16,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 100, alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 13 }}>
                            {selectedIds.length} selected
                        </span>
                        <div style={{ height: 20, width: 1, background: 'var(--border)' }}></div>
                        <button className="btn btn-secondary" onClick={() => handleBulkAction('enable')} style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
                            <ToggleRight size={14} style={{ marginRight: 6 }}/> Enable
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleBulkAction('disable')} style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}>
                            <ToggleLeft size={14} style={{ marginRight: 6 }}/> Disable
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleBulkAction('delete')} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                            <Trash2 size={14} style={{ marginRight: 6 }}/> Delete
                        </button>
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
