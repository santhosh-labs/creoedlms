import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';

export default function StudentFees({ user }) {
    const [fee, setFee]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        api.get('/fees/my')
            .then(r => setFee(r.data))
            .catch(e => { if (e.response?.status === 404) setNotFound(true); })
            .finally(() => setLoading(false));
    }, []);

    const STATUS_COLOR = { Paid: 'var(--success)', Partial: 'var(--warning)', Pending: 'var(--danger)' };

    const pct = fee ? Math.min(Math.round((parseFloat(fee.PaidAmount) / parseFloat(fee.CourseFee)) * 100), 100) : 0;

    return (
        <div className="content-wrapper" style={{ width: '100%', maxWidth: 'none', margin: 0 }}>
            {/* Professional Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                <h2 className="page-title" style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 }}>
                    <CreditCard size={24} style={{ color: 'var(--primary)' }} />
                    Payments & Billing
                </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {loading ? (
                    <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>Loading billing data...</div>
                ) : notFound ? (
                    <div style={{ padding: '64px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                        <AlertCircle size={48} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>No Billing Records</h3>
                        <p style={{ color: 'var(--text-muted)' }}>No fee records were found for your account. Contact administration if this is an error.</p>
                    </div>
                ) : fee && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', alignItems: 'start' }}>
                        
                        {/* Summary Card */}
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enrolled Program</p>
                                <p style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>{fee.CourseName}</p>
                            </div>
                            <div style={{ padding: '24px', background: 'var(--bg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Status</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '4px', border: `1px solid ${STATUS_COLOR[fee.PaymentStatus] || 'var(--danger)'}`, color: STATUS_COLOR[fee.PaymentStatus] || 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {fee.PaymentStatus}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                                    <span>Payment Progress</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pct}%</span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        </div>

                        {/* Invoice Breakdown */}
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '24px' }}>
                            <h3 style={{ margin: '0 0 24px', fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Transaction Summary</h3>
                            
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>Total Program Fee</td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 500, color: 'var(--text-main)' }}>₹{Number(fee.CourseFee).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>Total Amount Paid</td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 500, color: 'var(--success)' }}>₹{Number(fee.PaidAmount).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '2px dashed var(--border)', background: 'var(--bg)' }}>
                                        <td style={{ padding: '16px 8px', color: 'var(--text-main)', fontWeight: 600 }}>Balance Due</td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 600, color: fee.PaidAmount >= fee.CourseFee ? 'var(--text-main)' : 'var(--danger)' }}>
                                            ₹{Number(fee.CourseFee - fee.PaidAmount).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: '12px' }}>Last Updated</td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>
                                            {new Date(fee.LastUpdated).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Notification Blocks without Emoji */}
                            {fee.PaidAmount < fee.CourseFee && (
                                <div style={{ marginTop: '32px', padding: '16px', background: 'var(--warning-bg)', borderLeft: '4px solid var(--warning)', borderRadius: '0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                                    <div>
                                        <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Pending Payment Required</strong>
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Please remit the outstanding balance of ₹{Number(fee.CourseFee - fee.PaidAmount).toLocaleString('en-IN')} to administration.</span>
                                    </div>
                                </div>
                            )}
                            {fee.PaidAmount >= fee.CourseFee && (
                                <div style={{ marginTop: '32px', padding: '16px', background: 'var(--success-bg)', borderLeft: '4px solid var(--success)', borderRadius: '0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                                    <div>
                                        <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Account Settled</strong>
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>All fees for this program have been fully paid.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
