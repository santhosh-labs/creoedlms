import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, IndianRupee, Search, Filter } from 'lucide-react';
import api from '../api';

export default function SuperAdminFees() {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [selectedFee, setSelectedFee] = useState(null);
    const [newAmountPaid, setNewAmountPaid] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);
    const [inputError, setInputError] = useState('');
    const [filters, setFilters] = useState({ id: '', name: '', phone: '', course: '', status: '' });

    const fetchFees = async () => {
        try {
            setLoading(true);
            setError(false);
            const res = await api.get('/fees');
            setFees(res.data);
        } catch (err) {
            console.error('Failed to load fees', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFees(); }, []);

    const openUpdate = (fee) => {
        setSelectedFee(fee);
        setNewAmountPaid(fee.AmountPaid);
        setInputError('');
    };

    const handleAmountChange = (val) => {
        setNewAmountPaid(val);
        const paid = parseFloat(val);
        const max = parseFloat(selectedFee?.TotalFee || 0);
        if (isNaN(paid) || paid < 0) setInputError('Please enter a valid positive amount.');
        else if (paid > max) setInputError(`Cannot exceed total fee ₹${Number(max).toLocaleString()}`);
        else setInputError('');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedFee || inputError) return;
        const paid = parseFloat(newAmountPaid);
        if (isNaN(paid) || paid < 0) return;

        setUpdateLoading(true);
        try {
            const res = await api.put(`/fees/${selectedFee.ID}`, { amountPaid: paid });
            setSelectedFee(null);
            fetchFees();
            // Quick success toast instead of blocking alert
            const banner = document.createElement('div');
            banner.textContent = `✓ Payment updated — Status: ${res.data.paymentStatus}`;
            Object.assign(banner.style, { position:'fixed', top:'20px', right:'20px', background:'var(--success)', color:'#fff', padding:'12px 20px', borderRadius:'8px', zIndex:9999, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.15)' });
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 3000);
        } catch (err) {
            setInputError(err.response?.data?.message || 'Failed to update fee.');
        } finally {
            setUpdateLoading(false);
        }
    };

    const statusColor = (status) => {
        if (status === 'Paid') return { bg: 'var(--success-bg)', color: 'var(--success)' };
        if (status === 'Partial') return { bg: 'var(--warning-bg)', color: 'var(--warning)' };
        return { bg: 'var(--danger-bg)', color: 'var(--danger)' };
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    // ── Full-page: Update Fee ──────────────────────────────────────────────────
    if (selectedFee) {
        return (
            <div className="content-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                    <button onClick={() => setSelectedFee(null)} className="btn btn-secondary">← Back</button>
                    <h2 className="page-title" style={{ margin: 0 }}>Update Payment Record</h2>
                </div>

                <div className="section-card" style={{ maxWidth: '560px', margin: '0 auto', padding: '32px' }}>
                    {/* Info Summary */}
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', border: '1px solid var(--border)' }}>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Student</span>
                            <strong>{selectedFee.StudentName}</strong>
                            {selectedFee.StudentCode && <span style={{ marginLeft: '8px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>{selectedFee.StudentCode}</span>}
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Course</span>
                            <strong>{selectedFee.CourseName}</strong>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total Fee</span>
                            <strong>₹{Number(selectedFee.TotalFee).toLocaleString()}</strong>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Currently Paid</span>
                            <strong style={{ color: 'var(--primary)' }}>₹{Number(selectedFee.AmountPaid).toLocaleString()}</strong>
                        </div>
                    </div>

                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                New Total Amount Paid (₹) *
                            </label>
                            <input
                                className="form-input"
                                type="number"
                                min="0"
                                max={selectedFee.TotalFee}
                                step="1"
                                value={newAmountPaid}
                                onChange={e => handleAmountChange(e.target.value)}
                                placeholder="Enter updated total paid amount"
                                required
                                autoFocus
                                style={{ borderColor: inputError ? 'var(--danger)' : undefined }}
                            />
                            {inputError ? (
                                <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px', fontWeight: 500 }}>{inputError}</p>
                            ) : (
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Cumulative total paid. Maximum: ₹{Number(selectedFee.TotalFee).toLocaleString()}</p>
                            )}
                        </div>

                        {/* Live preview of new status */}
                        {!inputError && newAmountPaid !== '' && (
                            <div style={{ background: 'var(--bg)', padding: '14px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', border: '1px solid var(--border)' }}>
                                New status will be:{' '}
                                <strong style={{ color: parseFloat(newAmountPaid) >= parseFloat(selectedFee.TotalFee) ? 'var(--success)' : parseFloat(newAmountPaid) > 0 ? 'var(--warning)' : 'var(--danger)' }}>
                                    {parseFloat(newAmountPaid) >= parseFloat(selectedFee.TotalFee) ? 'Paid' : parseFloat(newAmountPaid) > 0 ? 'Partial' : 'Pending'}
                                </strong>
                                {' '}· Remaining: <strong>₹{Math.max(0, parseFloat(selectedFee.TotalFee) - parseFloat(newAmountPaid || 0)).toLocaleString()}</strong>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setSelectedFee(null)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={updateLoading || !!inputError}>
                                <IndianRupee size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                                {updateLoading ? 'Saving...' : 'Save Payment'}
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
                    <strong>Backend Connection Failed</strong>
                </div>
            )}

            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title">
                        <CreditCard style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                        Fee Tracking
                    </h2>
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
                        <div style={{ position: 'relative', width: '160px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Mobile No." value={filters.phone} onChange={e => setFilters({...filters, phone: e.target.value})} className="form-input" style={{ width: '100%', paddingLeft: '32px', fontSize: '13px', minHeight: '36px' }} />
                        </div>
                        <div style={{ position: 'relative', width: '180px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Course" value={filters.course} onChange={e => setFilters({...filters, course: e.target.value})} className="form-input" style={{ width: '100%', paddingLeft: '32px', fontSize: '13px', minHeight: '36px' }} />
                        </div>
                        <div style={{ width: '140px' }}>
                            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="form-input" style={{ width: '100%', fontSize: '13px', minHeight: '36px' }}>
                                <option value="">All Statuses</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                                <option value="Partial">Partial</option>
                            </select>
                        </div>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Mobile No.</th>
                                <th>Course</th>
                                <th>Total Fee</th>
                                <th>Amount Paid</th>
                                <th>Pending</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                            ) : (() => {
                                const filteredFees = fees.filter(f => {
                                    return (f.StudentCode || '').toLowerCase().includes(filters.id.toLowerCase()) &&
                                           (f.StudentName || '').toLowerCase().includes(filters.name.toLowerCase()) &&
                                           (f.Phone || '').toLowerCase().includes(filters.phone.toLowerCase()) &&
                                           (f.CourseName || '').toLowerCase().includes(filters.course.toLowerCase()) &&
                                           (f.PaymentStatus || '').toLowerCase().includes(filters.status.toLowerCase());
                                });
                                
                                if (filteredFees.length === 0) {
                                    return <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No fee records found matching your filters.</td></tr>;
                                }

                                return filteredFees.map((f) => {
                                    const sc = statusColor(f.PaymentStatus);
                                    const pending = parseFloat(f.TotalFee) - parseFloat(f.AmountPaid);
                                    return (
                                        <tr key={f.ID}>
                                            <td>
                                                <span style={{ background: '#e8f5ee', color: 'var(--primary)', fontWeight: 700, fontSize: '11px', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                                                    {f.StudentCode || '—'}
                                                </span>
                                            </td>
                                            <td><strong>{f.StudentName}</strong></td>
                                            <td style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {f.Phone || <span style={{ color: 'var(--border)' }}>—</span>}
                                            </td>
                                            <td>{f.CourseName}</td>
                                            <td>₹{Number(f.TotalFee).toLocaleString()}</td>
                                            <td style={{ color: 'var(--primary)', fontWeight: 600 }}>₹{Number(f.AmountPaid).toLocaleString()}</td>
                                            <td style={{ color: pending > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                                                ₹{pending.toLocaleString()}
                                            </td>
                                            <td>
                                                <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                                                    {f.PaymentStatus}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatDate(f.LastUpdated)}</td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 14px', fontSize: '12px', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                                                    onClick={() => openUpdate(f)}
                                                >
                                                    Update
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
