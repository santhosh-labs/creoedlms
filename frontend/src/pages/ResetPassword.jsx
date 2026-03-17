import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleReset = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return setMessage({ type: 'error', text: 'Passwords do not match.' });
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.post('/auth/reset-password', { token, newPassword: password });
            setMessage({ type: 'success', text: res.data.message });
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo-icon">C</div>
                    <h2>Set New Password</h2>
                    <p className="subtitle">Enter your new secure password</p>
                </div>

                {message.text && (
                    <div style={{ padding: '12px', background: message.type === 'error' ? 'var(--danger-bg)' : '#e8f5ee', color: message.type === 'error' ? 'var(--danger)' : 'var(--primary)', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleReset}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>New Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Confirm New Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '32px' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || message.type === 'success'}>
                            {loading ? 'Saving...' : 'Reset Password'}
                        </button>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '500', cursor: 'pointer', fontSize: '13px' }}>
                            Back to login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
