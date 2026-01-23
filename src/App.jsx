import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import DashboardToteBag from './Dashboard'
import Login from './Login'

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [, forceUpdate] = useState(0);

  // Force re-render when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to ensure browser has fully restored the page
        setTimeout(() => {
          forceUpdate(n => n + 1);
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also handle window focus for mobile
    const handleFocus = () => {
      setTimeout(() => {
        forceUpdate(n => n + 1);
      }, 100);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FDF6E9',
        fontFamily: "'Cormorant Garamond', Georgia, serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛍️</div>
          <div style={{ color: '#A67B5B', letterSpacing: '2px' }}>Cargando...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <DashboardToteBag />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
