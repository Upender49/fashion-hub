import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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
    <div className="page active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 1rem' }}>
      <div className="auth-card" style={{ padding: '2rem', background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontFamily: "'Playfair Display', serif" }}>
          Join Fashion Hub 👗
        </h2>
        
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!needsOtp ? (
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Full Name</label>
                <input type="text" className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Email Address</label>
                <input type="email" className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Password</label>
                <input type="password" className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Confirm Password</label>
                <input type="password" className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: '#2c2c2c', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Create Account</button>
            </>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Enter 6-digit OTP (Sent to Email)</label>
                <input type="text" className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem' }} value={otp} onChange={e => setOtp(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: '#2c2c2c', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Verify OTP</button>
            </>
          )}
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          Already have an account? <br/>
          <Link to="/login" style={{ color: '#4a5a32', textDecoration: 'none', fontWeight: 'bold' }}>Log in gracefully</Link>
        </div>
      </div>
    </div>
  );
}
