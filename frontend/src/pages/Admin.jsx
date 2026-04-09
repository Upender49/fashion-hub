import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      navigate('/');
      return;
    }
    
    const fetchAdminData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/orders')
        ]);
        setStats(statsRes.data);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [currentUser, navigate]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status });
      const [statsRes, ordersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/orders')
        ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      alert('Error updating order');
    }
  };

  if (!currentUser?.isAdmin) return null;
  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Dashboard...</div>;

  return (
    <div className="page active" style={{ padding: '2rem 0' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '2rem', fontSize: '2rem' }}>Admin Dashboard</h2>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', flex: 1, minWidth: '200px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', color: 'var(--olive)' }}>{stats?.totalOrders || 0}</div>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Total Orders</div>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', flex: 1, minWidth: '200px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', color: '#c9973b' }}>{stats?.activeTryons || 0}</div>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Active Try-Ons</div>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', flex: 1, minWidth: '200px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Total Revenue</div>
        </div>
      </div>

      <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1rem', fontSize: '1.5rem' }}>Recent Orders</h3>
      <table className="admin-table" style={{ width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <thead style={{ background: '#f9f9f9', textAlign: 'left' }}>
          <tr>
            <th style={{ padding: '1rem' }}>Order ID</th>
            <th style={{ padding: '1rem' }}>Customer</th>
            <th style={{ padding: '1rem' }}>Items</th>
            <th style={{ padding: '1rem' }}>Amount</th>
            <th style={{ padding: '1rem' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{o._id}</td>
              <td style={{ padding: '1rem' }}>{o.user_id?.name || 'Guest'}</td>
              <td style={{ padding: '1rem' }}>{o.items.length}</td>
              <td style={{ padding: '1rem', fontWeight: 600 }}>₹{o.total_amount.toLocaleString()}</td>
              <td style={{ padding: '1rem' }}>
                <select 
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  value={o.status}
                  onChange={e => updateOrderStatus(o._id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No orders yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
