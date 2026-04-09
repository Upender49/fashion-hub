import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function TryOn() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState({});

  const fetchTryOns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tryon');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTryOns();
  }, []);

  const handleFormChange = (id, field, value) => {
    setForms(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const placeTryOnOrder = async (tryonId) => {
    const f = forms[tryonId] || {};
    if (!f.chest || !f.waist || !f.address || !f.phone) {
      return alert('Please fill in Chest, Waist, Address, and Phone');
    }

    try {
      await api.put(`/tryon/order/${tryonId}`, f);
      alert('🚀 Try-On order placed successfully!');
      fetchTryOns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    }
  };

  const submitFeedback = async (tryonId, feedbackType) => {
    try {
      await api.put(`/tryon/feedback/${tryonId}`, { feedback: feedbackType });
      const msgs = { perfect: '🎉 Added to cart naturally (actually you can buy it now)', alterations: '✂️ Noted! We will contact you.', return: '↩ Return initiated.' };
      alert(msgs[feedbackType] || 'Feedback submitted');
      fetchTryOns();
    } catch (err) {
      alert('Error submitting feedback');
    }
  };

  const removeTryon = async (tryonId) => {
    try {
      await api.delete(`/tryon/remove/${tryonId}`);
      fetchTryOns();
    } catch (err) {
      alert('Error removing item');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Try-On details...</div>;

  if (items.length === 0) {
    return (
      <div className="page active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
        <div className="empty-state">
          <div className="empty-icon">👗</div>
          <h3>No try-on items yet</h3>
          <p>Hit the "Try" button on any product to requested a home fit session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page active" style={{ padding: '2rem 0' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '2rem', fontSize: '2rem' }}>Sample Try-On ✨</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {items.map(item => (
          <div key={item.tryonId} className="tryon-order-card" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '3rem', background: '#faf7f2', padding: '16px', borderRadius: '12px' }}>{item.emoji || '👗'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{item.color} · ID: {item.tryonId}</div>
              </div>
              <div>
                <span className={`badge ${item.status === 'delivered' ? 'badge-green' : 'badge-orange'}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                  {item.status === 'delivered' ? '✅ Delivered' : item.status === 'ordered' ? '🚚 On the Way' : '⏳ Pending Details'}
                </span>
              </div>
            </div>

            {item.status === 'pending' && (
              <div style={{ background: 'var(--cream)', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '1.5rem', fontSize: '1.1rem' }}>📏 Enter Measurements & Delivery Details</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>Chest (inches)</label>
                    <input type="number" className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} onChange={e => handleFormChange(item.tryonId, 'chest', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>Waist (inches)</label>
                    <input type="number" className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} onChange={e => handleFormChange(item.tryonId, 'waist', e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>Hip (inches)</label>
                    <input type="number" className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} onChange={e => handleFormChange(item.tryonId, 'hip', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>Phone Number</label>
                    <input type="tel" className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} onChange={e => handleFormChange(item.tryonId, 'phone', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>Delivery Address</label>
                  <textarea className="form-control" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', minHeight: '80px' }} onChange={e => handleFormChange(item.tryonId, 'address', e.target.value)}></textarea>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="btn btn-tryon" onClick={() => placeTryOnOrder(item.tryonId)} style={{ background: 'linear-gradient(135deg, #8c4a2f, #c9973b)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🚀 Place Try-On Order</button>
                  <button className="btn btn-outline" onClick={() => removeTryon(item.tryonId)} style={{ padding: '12px 24px', borderRadius: '8px' }}>Remove</button>
                </div>
              </div>
            )}

            {(item.status === 'ordered' || item.status === 'delivered') && (
              <div style={{ marginBottom: '1rem', background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  📦 Ordered: {new Date(item.orderedAt).toLocaleString()} <br/> 
                  ⏱ Est. Delivery: {item.estimatedDelivery || 'Within 4 hours'}
                </div>
              </div>
            )}

            {item.status === 'delivered' && !item.feedback && (
              <div style={{ background: 'var(--cream)', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '1rem' }}>👗 How does it fit? Share your feedback!</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="btn btn-olive btn-sm" onClick={() => submitFeedback(item.tryonId, 'perfect')}>✅ Perfect Fit (Buy)</button>
                  <button className="btn btn-mustard btn-sm" onClick={() => submitFeedback(item.tryonId, 'alterations')} style={{ background: '#c9973b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px' }}>✂️ Needs Alterations</button>
                  <button className="btn btn-outline btn-sm" onClick={() => submitFeedback(item.tryonId, 'return')}>↩ Return Sample</button>
                </div>
              </div>
            )}

            {item.feedback && (
              <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--cream)', borderRadius: '12px' }}>
                <strong>Your feedback:</strong> {
                  item.feedback === 'perfect' ? '✅ Loved it! Sample kept.' : 
                  item.feedback === 'alterations' ? '✂️ Alterations requested.' : 
                  '↩ Sample retrieved by delivery.'
                }
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
