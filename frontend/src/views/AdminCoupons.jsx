import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api'; // Adjusted import path depending on project structure

export default function Coupons() {
    const [coupons, setCoupons] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'logs'
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discountPercentage: 100,
        usageLimit: 1,
        validUntil: ''
    });

    useEffect(() => {
        fetchCoupons();
        fetchLogs();
    }, []);

    const fetchCoupons = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/coupons', {
                headers: { 'x-auth-token': token }
            });
            setCoupons(res.data);
        } catch (err) {
            console.error('Error fetching coupons', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/coupons/logs', {
                headers: { 'x-auth-token': token }
            });
            setLogs(res.data);
        } catch (err) {
            console.error('Error fetching logs', err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await api.post('/coupons', formData, {
                headers: { 'x-auth-token': token }
            });
            setShowForm(false);
            setFormData({ code: '', discountPercentage: 100, usageLimit: 1, validUntil: '' });
            fetchCoupons();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create coupon');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            await api.put(`/coupons/${id}`, { isActive: !currentStatus }, {
                headers: { 'x-auth-token': token }
            });
            fetchCoupons();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Coupons Management</h2>
                <button onClick={() => setShowForm(!showForm)} style={btnStyle}>
                    {showForm ? 'Cancel' : '+ New Coupon'}
                </button>
            </div>

            {showForm && (
                <div style={{ padding: 20, background: '#f8f9fa', borderRadius: 8, marginBottom: 20, border: '1px solid #ddd' }}>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        <div>
                            <label>Coupon Code (e.g. FREE100)</label>
                            <input 
                                required type="text" 
                                value={formData.code} 
                                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label>Discount %</label>
                            <input 
                                required type="number" max="100" min="1"
                                value={formData.discountPercentage} 
                                onChange={e => setFormData({...formData, discountPercentage: e.target.value})}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label>Usage Limit (Total times code can be claimed)</label>
                            <input 
                                required type="number" min="1"
                                value={formData.usageLimit} 
                                onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label>Valid Until</label>
                            <input 
                                type="datetime-local" 
                                value={formData.validUntil} 
                                onChange={e => setFormData({...formData, validUntil: e.target.value})}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" style={btnStyle}>Create Coupon</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                <button 
                    onClick={() => setActiveTab('list')} 
                    style={{ ...tabStyle, background: activeTab === 'list' ? '#338cf0' : '#e0e0e0', color: activeTab === 'list' ? 'white' : 'black' }}>
                    Active & Expired Coupons
                </button>
                <button 
                    onClick={() => setActiveTab('logs')} 
                    style={{ ...tabStyle, background: activeTab === 'logs' ? '#338cf0' : '#e0e0e0', color: activeTab === 'logs' ? 'white' : 'black' }}>
                    Usage History Logs
                </button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e1e4e8', borderRadius: 8 }}>
                    {activeTab === 'list' ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f5f7f9', borderBottom: '2px solid #e1e4e8' }}>
                                    <th style={thStyle}>Code</th>
                                    <th style={thStyle}>Discount (%)</th>
                                    <th style={thStyle}>Uses Count</th>
                                    <th style={thStyle}>Max Limit</th>
                                    <th style={thStyle}>Expires On</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map(c => (
                                    <tr key={c.ID} style={{ borderBottom: '1px solid #e1e4e8' }}>
                                        <td style={tdStyle}><b>{c.Code}</b></td>
                                        <td style={tdStyle}>{c.DiscountPercentage}%</td>
                                        <td style={tdStyle}>{c.UsageCount}</td>
                                        <td style={tdStyle}>{c.UsageLimit}</td>
                                        <td style={tdStyle}>{c.ValidUntil ? new Date(c.ValidUntil).toLocaleDateString() : 'Never'}</td>
                                        <td style={tdStyle}>
                                            <span style={{ 
                                                padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem',
                                                background: c.IsActive ? '#d1e7dd' : '#f8d7da', 
                                                color: c.IsActive ? '#0f5132' : '#842029' 
                                            }}>
                                                {c.IsActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button onClick={() => toggleStatus(c.ID, c.IsActive)} style={{ cursor: 'pointer', padding: '4px 8px' }}>
                                                {c.IsActive ? 'Disable' : 'Enable'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f5f7f9', borderBottom: '2px solid #e1e4e8' }}>
                                    <th style={thStyle}>Coupon Used</th>
                                    <th style={thStyle}>Student Code</th>
                                    <th style={thStyle}>Student Name</th>
                                    <th style={thStyle}>Course Purchased</th>
                                    <th style={thStyle}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.ID} style={{ borderBottom: '1px solid #e1e4e8' }}>
                                        <td style={tdStyle}><b>{log.Code}</b> <span style={{fontSize:'0.8rem'}}>(-{log.DiscountPercentage}%)</span></td>
                                        <td style={tdStyle}>{log.StudentCode}</td>
                                        <td style={tdStyle}>{log.StudentName}</td>
                                        <td style={tdStyle}>{log.CourseName}</td>
                                        <td style={tdStyle}>{new Date(log.UsedAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && <tr><td colSpan="5" style={{padding: 20, textAlign:'center'}}>No coupons have been claimed yet.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

const btnStyle = { padding: '8px 16px', background: '#338cf0', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const tabStyle = { padding: '10px 20px', border: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', borderRadius: 4, border: '1px solid #ccc' };
const thStyle = { padding: '12px 15px', color: '#555', fontWeight: 600 };
const tdStyle = { padding: '12px 15px', color: '#111' };
