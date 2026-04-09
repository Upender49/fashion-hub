import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const { signup, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!needsOtp) {
      if (password !== confirm) return setError('Passwords do not match');
      try {
        const res = await signup(name, email, password);
        if (res.requiresOtp) setNeedsOtp(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Signup failed');
      }
    } else {
      try {
        await verifyOtp(email, otp);
        navigate('/');
      } catch (err) {
        setError('Invalid OTP code');
      }
    }
  };

  return (
    <div id="page-signup" className="page active">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/assets/logo.png" alt="Fashion Hub" />
            <h2>{needsOtp ? 'Verify Your Email' : 'Create Account'}</h2>
            <p>{needsOtp ? 'Enter the 6-digit code sent to your email' : 'Join Fashion Hub and explore curated fashion'}</p>
          </div>

          {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

          <form id="signup-form" onSubmit={handleSubmit}>
            {!needsOtp ? (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-control" type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input className="form-control" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password</label>
                    <input className="form-control" type="password" placeholder="Min 6 chars" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input className="form-control" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>Create Account →</button>
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
                Already have an account? <a style={{cursor: 'pointer'}} onClick={() => navigate('/login')}>Login here</a>
              </>
            ) : (
              <>
                Didn't receive it? <a style={{cursor: 'pointer'}} onClick={() => setNeedsOtp(false)}>Back to Sign Up</a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
