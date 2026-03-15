import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { AuthProvider, AuthContext } from './AuthContext';
import { Zap, LogOut, User } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function AppContent() {
  const { token, logout } = useContext(AuthContext);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} className="text-white font-sans">
      {token && (
        <header style={{
          background: 'rgba(17, 24, 39, 0.85)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #2563eb, #10b981)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px' }} className="gradient-text">
                SmartEnergy AI
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '-1px' }}>
                Real-time Industrial Monitoring
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '999px', padding: '5px 12px',
              fontSize: '13px', color: 'var(--text-secondary)'
            }}>
              <span className="pulse-dot" style={{ background: '#10b981' }}></span>
              Live
            </div>
            <button
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '8px 14px',
                fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#fb7185'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </header>
      )}

      <main style={{ padding: token ? '28px 24px' : '0', maxWidth: '1440px', margin: '0 auto' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
