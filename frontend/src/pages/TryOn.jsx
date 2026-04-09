import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function TryOn() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState({});
  const navigate = useNavigate();

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
      const msgs = { perfect: '🎉 Feedback noted. Purchase processed!', alterations: '✂️ Noted! We will contact you for alterations.', return: '↩ Return initiated. Thank you!' };
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

  return (
    <div id="page-tryon" className="page active">
      <div className="tryon-container">

        {/* Header */}
        <div className="tryon-header">
          <div className="tryon-header-icon">👗</div>
          <div>
            <h2>Sample Try-On</h2>
            <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>Get samples delivered in 1–4 hours. Try. Decide. Buy only if it fits!</p>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' }}>How Sample Try-On Works</div>
          <div className="tryon-steps">
            <div className="step done"><div className="step-circle">1</div><div className="step-label">Browse & Add to Try-On</div></div>
            <div className="step done"><div className="step-circle">2</div><div className="step-label">Enter Measurements</div></div>
            <div className="step active"><div className="step-circle">3</div><div className="step-label">Delivered in 1–4 hrs</div></div>
            <div className="step"><div className="step-circle">4</div><div className="step-label">Try It On</div></div>
            <div className="step"><div className="step-circle">5</div><div className="step-label">Buy the Real Product</div></div>
          </div>
        </div>

        {/* Try-On Items */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Your Try-On List</div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/#shop')}>+ Add More Items</button>
        </div>

        <div id="tryon-items">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👗</div>
              <h3>No try-on items yet</h3>
              <p>Hit the "Try" button on any product to add it here</p>
              <button className="btn btn-tryon" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/#shop')}>Browse Products</button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.tryonId} className="tryon-order-card" id={`tryon-${item.tryonId}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '2.5rem' }}>{item.emoji || '👗'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.color} · ID: {item.tryonId}</div>
                  </div>
                  <div>
                    <span className={`badge ${item.status === 'delivered' ? 'badge-green' : 'badge-orange'}`}>
                      {item.status === 'delivered' ? '✅ Delivered' : item.status === 'ordered' ? '🚚 On the Way' : '⏳ Pending'}
                    </span>
                  </div>
                </div>

                {item.status === 'pending' && (
                  <div style={{ background: 'var(--cream)', borderRadius: '10px', padding: '1.25rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>📏 Enter Measurements & Delivery Details</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Chest (inches)</label>
                        <input className="form-control" type="number" placeholder="e.g. 36" onChange={e => handleFormChange(item.tryonId, 'chest', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Waist (inches)</label>
                        <input className="form-control" type="number" placeholder="e.g. 30" onChange={e => handleFormChange(item.tryonId, 'waist', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Hip (inches)</label>
                        <input className="form-control" type="number" placeholder="e.g. 38" onChange={e => handleFormChange(item.tryonId, 'hip', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Preferred Color</label>
                        <input className="form-control" type="text" placeholder={item.color} value={item.color} readOnly />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Delivery Address</label>
                      <textarea className="form-control" placeholder="Enter your full address..." onChange={e => handleFormChange(item.tryonId, 'address', e.target.value)}></textarea>
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input className="form-control" type="tel" placeholder="+91 9876543210" onChange={e => handleFormChange(item.tryonId, 'phone', e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-tryon" onClick={() => placeTryOnOrder(item.tryonId)}>🚀 Place Try-On Order (1-4 hrs delivery)</button>
                      <button className="btn btn-outline btn-sm" onClick={() => removeTryon(item.tryonId)}>Remove</button>
                    </div>
                  </div>
                )}

                {(item.status === 'ordered' || item.status === 'delivered') && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      📦 Ordered: {new Date(item.orderedAt).toLocaleString()} &nbsp;|&nbsp; ⏱ Est. Delivery: {item.estimatedDelivery || 'Within 4 hours'}
                    </div>
                    {/* Simplified tracking timeline representation */}
                  </div>
                )}

                {item.status === 'delivered' && !item.feedback && (
                  <div style={{ background: 'var(--cream)', borderRadius: '10px', padding: '1.25rem', marginTop: '1rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '1rem' }}>👗 How does it fit? Give your feedback</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-olive btn-sm" onClick={() => submitFeedback(item.tryonId, 'perfect')}>✅ Perfect Fit — Buy Now!</button>
                      <button className="btn btn-mustard btn-sm" onClick={() => submitFeedback(item.tryonId, 'alterations')}>✂️ Needs Alterations</button>
                      <button className="btn btn-outline btn-sm" onClick={() => submitFeedback(item.tryonId, 'return')}>↩ Return Sample</button>
                    </div>
                  </div>
                )}

                {item.feedback && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--cream)', borderRadius: '10px' }}>
                    <strong>Your feedback:</strong> {item.feedback === 'perfect' ? '✅ Loved it! Proceeding to buy.' : item.feedback === 'alterations' ? '✂️ Requested alterations.' : '↩ Sample returned.'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
