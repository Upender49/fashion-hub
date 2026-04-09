import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!needsOtp) {
        const res = await login(email, password);
        if (res.requiresOtp) {
          setNeedsOtp(true);
        }
      } else {
        await verifyOtp(email, otp);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div id="page-login" className="page active">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/assets/logo.png" alt="Fashion Hub" />
            <h2>{needsOtp ? 'Verify Your Email' : 'Welcome Back'}</h2>
            <p>{needsOtp ? 'Enter the 6-digit code sent to your email.' : 'Login to your Fashion Hub account'}</p>
          </div>

          {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

          <form id="login-form" onSubmit={handleSubmit}>
            {!needsOtp ? (
              <>
                <div className="form-group">
                  <label>Email Address</label>
                  <input className="form-control" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input className="form-control" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>Login →</button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label style={{ textAlign: 'center', display: 'block' }}>6-Digit Code</label>
                  <input className="form-control" type="text" placeholder="000000" maxLength="6" style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', padding: '12px', fontWeight: 700 }} value={otp} onChange={e => setOtp(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '0.5rem' }}>Verify Code →</button>
              </>
            )}
          </form>

          <div className="auth-switch">
            {!needsOtp ? (
              <>
                Don't have an account? <a style={{cursor: 'pointer'}} onClick={() => navigate('/signup')}>Sign up here</a><br/>
                <a style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Forgot your password?</a>
              </>
            ) : (
              <>
                Didn't receive it? <a style={{cursor: 'pointer'}} onClick={() => setNeedsOtp(false)}>Back to Login</a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
