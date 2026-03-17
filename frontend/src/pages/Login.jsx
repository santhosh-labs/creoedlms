import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from 'lucide-react';
import api from '../api';

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

    const field = (extra = {}) => ({
        width: '100%',
        boxSizing: 'border-box',
        padding: '14px 16px 14px 46px',
        fontSize: '15px',
        border: '1.5px solid var(--border)',
        borderRadius: '10px',
        background: 'var(--bg)',
        color: 'var(--text-main)',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color 0.18s, box-shadow 0.18s',
        ...extra,
    });

    const onFocus = e => {
        e.target.style.borderColor = '#1aae64';
        e.target.style.boxShadow   = '0 0 0 3px rgba(26,174,100,0.12)';
    };
    const onBlur  = e => {
        e.target.style.borderColor = 'var(--border)';
        e.target.style.boxShadow   = 'none';
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            padding: '32px 20px',
            fontFamily: "'Inter', sans-serif",
        }}>
            <div style={{
                width: '100%',
                maxWidth: '480px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '52px 52px 44px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <img
                        className="logo-dark"
                        src="/CREO.ED (7).png"
                        alt="Creoed LMS"
                        style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
                    />
                    <img
                        className="logo-light"
                        src="/CREO.ED (9).png"
                        alt="Creoed LMS"
                        style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
                    />
                </div>

                {!showForgot ? (
                    <>
                        {/* Heading */}
                        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px', letterSpacing: '-0.4px' }}>
                                Welcome back
                            </h1>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                                Sign in to your Creoed LMS account
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{ padding: '13px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '9px', marginBottom: '22px', fontSize: '14px', fontWeight: 500, border: '1px solid rgba(239,68,68,0.15)' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} autoComplete="on">
                            {/* Email */}
                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                                    Email or Student ID
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <input
                                        type="text"
                                        placeholder="name@example.com or CR261234"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoComplete="username"
                                        style={field()}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        style={field({ paddingRight: '48px' })}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                    />
                                    <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot link */}
                            <div style={{ textAlign: 'right', marginBottom: '28px' }}>
                                <button type="button" onClick={() => setShowForgot(true)}
                                    style={{ background: 'none', border: 'none', color: '#1aae64', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', padding: '2px 0', fontFamily: 'inherit' }}>
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={loading}
                                style={{
                                    width: '100%', padding: '14px',
                                    background: loading ? 'var(--border)' : '#1aae64',
                                    color: '#fff', border: 'none', borderRadius: '10px',
                                    fontSize: '15px', fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    letterSpacing: '0.1px',
                                    transition: 'background 0.18s',
                                    fontFamily: 'inherit',
                                }}
                                onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#159353'; }}
                                onMouseOut={e =>  { if (!loading) e.currentTarget.style.background = '#1aae64'; }}
                            >
                                {loading ? 'Signing in…' : 'Sign in'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        {/* Back */}
                        <button onClick={() => { setShowForgot(false); setForgotMessage({ type: '', text: '' }); setForgotEmail(''); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: '0 0 24px', fontFamily: 'inherit' }}>
                            <ArrowLeft size={14} /> Back to sign in
                        </button>

                        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>Reset password</h1>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                                Enter your registered email. We'll send a reset link.
                            </p>
                        </div>

                        {forgotMessage.text && (
                            <div style={{ padding: '13px 16px', background: forgotMessage.type === 'error' ? 'var(--danger-bg)' : 'rgba(26,174,100,0.08)', color: forgotMessage.type === 'error' ? 'var(--danger)' : '#1aae64', borderRadius: '9px', marginBottom: '20px', fontSize: '14px', fontWeight: 500, border: `1px solid ${forgotMessage.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(26,174,100,0.2)'}` }}>
                                {forgotMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleForgot}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                                    Email address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={forgotEmail}
                                        onChange={e => setForgotEmail(e.target.value)}
                                        required
                                        style={field()}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={forgotLoading}
                                style={{
                                    width: '100%', padding: '14px',
                                    background: forgotLoading ? 'var(--border)' : '#1aae64',
                                    color: '#fff', border: 'none', borderRadius: '10px',
                                    fontSize: '15px', fontWeight: 600,
                                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.18s', fontFamily: 'inherit',
                                }}>
                                {forgotLoading ? 'Sending…' : 'Send reset link'}
                            </button>
                        </form>
                    </>
                )}

                {/* Footer */}
                <p style={{ marginTop: '36px', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    © {new Date().getFullYear()} Creoed LMS. All rights reserved.
                </p>
            </div>

            <style>{`input::placeholder { color: var(--text-muted); opacity: 1; }`}</style>
        </div>
    );
}
