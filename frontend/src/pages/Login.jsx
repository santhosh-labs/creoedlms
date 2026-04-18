import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../api';

const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem 0.8rem 2.8rem',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '0.95rem',
  fontFamily: FONT,
  color: '#1e293b',
  background: '#ffffff',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: '#64748b',
  marginBottom: '0.4rem',
  fontFamily: FONT,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export default function Login() {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const navigate = useNavigate();

    const [showForgot,    setShowForgot]    = useState(false);
    const [forgotEmail,   setForgotEmail]   = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('user',  JSON.stringify(res.data.user));
            localStorage.setItem('token', res.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to connect. Please ensure the server is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotMessage({ type: '', text: '' });
        try {
            const res = await api.post('/auth/forgot-password', { email: forgotEmail });
            setForgotMessage({ type: 'success', text: res.data.message });
        } catch (err) {
            setForgotMessage({ type: 'error', text: err.response?.data?.message || 'Failed to send reset link.' });
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div style={{
            background: '#f8fafc',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1rem'
        }}>
            <div style={{
                background: '#ffffff',
                border: '1px solid #ede9fe',
                borderRadius: '1.5rem',
                width: '100%',
                maxWidth: '440px',
                padding: '3rem 2.5rem',
                boxShadow: '0 8px 40px rgba(124,58,237,0.08)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/CREOED (2).png" alt="Creoed Logo" style={{ height: '40px', marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f0a2e', marginBottom: '0.5rem', fontFamily: FONT, letterSpacing: '-0.02em' }}>
                        {showForgot ? 'Reset password' : 'Welcome Back'}
                    </h2>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', fontFamily: FONT }}>
                        {showForgot ? "Enter your email for a reset link." : "Sign in to access your dashboard."}
                    </p>
                </div>

                {!showForgot ? (
                    <>
                        {error && (
                            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'flex-start', fontFamily: FONT, fontSize: '0.9rem' }}>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Email or Student ID</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
                                    <input type="text" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} onFocus={e => e.target.style.borderColor = '#7c3aed'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} placeholder="" />
                                </div>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
                                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required style={{...inputStyle, paddingRight: '2.8rem'}} onFocus={e => e.target.style.borderColor = '#7c3aed'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} placeholder="" />
                                    <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}>
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                    <button type="button" onClick={() => setShowForgot(true)}
                                        style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: FONT }}>
                                        Forgot password?
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '9999px', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, fontFamily: FONT, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
                                {loading ? 'Signing in...' : 'Sign In'} {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        {forgotMessage.text && (
                            <div style={{ background: forgotMessage.type === 'error' ? '#fef2f2' : '#dcfce7', color: forgotMessage.type === 'error' ? '#ef4444' : '#166534', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', gap: '8px', alignItems: 'flex-start', fontFamily: FONT, fontSize: '0.9rem' }}>
                                <span>{forgotMessage.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
                                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required style={inputStyle} onFocus={e => e.target.style.borderColor = '#7c3aed'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} placeholder="" />
                                </div>
                            </div>
                            
                            <button type="submit" disabled={forgotLoading} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '9999px', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, fontFamily: FONT, cursor: forgotLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: forgotLoading ? 0.7 : 1 }}>
                                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <button onClick={() => { setShowForgot(false); setForgotMessage({ type: '', text: '' }); setForgotEmail(''); }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: FONT }}>
                                <ArrowLeft size={16} /> Back to sign in
                            </button>
                        </div>
                    </>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center', fontFamily: FONT, fontSize: '0.8rem', color: '#94a3b8' }}>
                    © {new Date().getFullYear()} Creoed LMS. All rights reserved.
                </div>
            </div>
            <style>{`input::placeholder { color: #94a3b8; opacity: 1; }`}</style>
        </div>
    );
}
