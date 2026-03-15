import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from 'lucide-react';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
    const [tempToken, setTempToken] = useState(null);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password }),
            });
            if (!response.ok) throw new Error('Invalid credentials. Please try again.');
            const data = await response.json();
            if (data.requires_password_change) {
                setTempToken(data.access_token);
                setNeedsPasswordChange(true);
                setLoading(false);
                return;
            }
            login(data.access_token);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`
                },
                body: JSON.stringify({ old_password: password, new_password: newPassword }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Password change failed.');
            }
            login(tempToken);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password: newPassword, role: 'operator' }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Registration failed.');
            }
            const data = await response.json();
            login(data.access_token);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const cardStyle = {
        background: '#111827',
        border: '1px solid #1e2d45',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
    };

    const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#8b9dc3', marginBottom: '6px', display: 'block' };
    const inputWrapper = { position: 'relative', marginBottom: '16px' };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 50% 0%, #0f2040 0%, #0a0f1e 60%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, sans-serif', padding: '20px',
        }}>
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
                    <div style={{
                        width: '44px', height: '44px',
                        background: 'linear-gradient(135deg, #2563eb, #10b981)',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 24px #2563eb50'
                    }}>
                        <Zap size={24} color="#fff" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, fontSize: '20px', background: 'linear-gradient(135deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            SmartEnergy AI
                        </div>
                        <div style={{ fontSize: '11px', color: '#4b6080', marginTop: '-2px' }}>Industrial Monitoring Platform</div>
                    </div>
                </div>

                <div style={cardStyle} className="fade-in">
                    {/* Mode Tabs */}
                    {!needsPasswordChange && (
                        <div style={{
                            display: 'flex', background: '#0d1526', borderRadius: '10px',
                            padding: '4px', marginBottom: '28px', gap: '4px'
                        }}>
                            {['Sign In', 'Sign Up'].map((tab, i) => (
                                <button
                                    key={tab}
                                    onClick={() => { setIsRegistering(i === 1); setError(''); }}
                                    style={{
                                        flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                        background: isRegistering === (i === 1) ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                                        color: isRegistering === (i === 1) ? '#fff' : '#64748b',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}

                    {needsPasswordChange && (
                        <div style={{
                            background: '#422006', border: '1px solid #78350f', borderRadius: '10px',
                            padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#fcd34d'
                        }}>
                            🔒 Security requirement: Please set a new password to continue.
                        </div>
                    )}

                    {error && (
                        <div style={{
                            background: '#3b0a18', border: '1px solid #7f1d2a', borderRadius: '10px',
                            padding: '10px 14px', marginBottom: '18px', fontSize: '13px', color: '#fca5a5', textAlign: 'left'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Form: Sign In */}
                    {!needsPasswordChange && !isRegistering && (
                        <form onSubmit={handleLogin}>
                            <div>
                                <label style={labelStyle}>Username or Email</label>
                                <div style={inputWrapper}>
                                    <input
                                        id="username"
                                        type="text"
                                        className="input-field"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="e.g. admin or you@email.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Password</label>
                                <div style={{ ...inputWrapper, position: 'relative' }}>
                                    <input
                                        id="password"
                                        type={showPass ? 'text' : 'password'}
                                        className="input-field"
                                        style={{ paddingRight: '40px' }}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: '#4b6080', cursor: 'pointer'
                                    }}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '14px' }}
                            >
                                <LogIn size={16} />
                                {loading ? 'Signing in...' : 'Sign In'}
                                {!loading && <ArrowRight size={16} />}
                            </button>
                        </form>
                    )}

                    {/* Form: Sign Up */}
                    {!needsPasswordChange && isRegistering && (
                        <form onSubmit={handleRegister}>
                            <div>
                                <label style={labelStyle}>Username or Email</label>
                                <div style={inputWrapper}>
                                    <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. you@email.com" required />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>New Password</label>
                                <div style={inputWrapper}>
                                    <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Create a strong password" required />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm Password</label>
                                <div style={inputWrapper}>
                                    <input type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-success"
                                style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '14px' }}
                            >
                                <UserPlus size={16} />
                                {loading ? 'Creating account...' : 'Create Account & Login'}
                            </button>
                        </form>
                    )}

                    {/* Form: Change Password */}
                    {needsPasswordChange && (
                        <form onSubmit={handleChangePassword}>
                            <div>
                                <label style={labelStyle}>New Password</label>
                                <div style={inputWrapper}>
                                    <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Create a new password" required />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm New Password</label>
                                <div style={inputWrapper}>
                                    <input type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat the new password" required />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '14px', background: 'linear-gradient(135deg, #d97706, #b45309)' }}
                            >
                                {loading ? 'Updating...' : '🔑 Set New Password & Login'}
                            </button>
                        </form>
                    )}
                </div>

                <p style={{ marginTop: '20px', fontSize: '12px', color: '#2a3a56' }}>
                    SmartEnergy AI · Secured by JWT Authentication
                </p>
            </div>
        </div>
    );
};

export default Login;
