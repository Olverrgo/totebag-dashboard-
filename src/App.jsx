import { AuthProvider, useAuth } from './AuthContext'
import DashboardToteBag from './Dashboard'
import Login from './Login'

function DebugPanel() {
  const { user, profile, isAdmin, loading, authError } = useAuth();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: '#0f0',
      padding: '10px',
      fontSize: '11px',
      fontFamily: 'monospace',
      borderRadius: '5px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>user: {user ? user.email : 'null'}</div>
      <div>profile.rol: {profile?.rol || 'null'}</div>
      <div>isAdmin: {String(isAdmin)}</div>
      <div>loading: {String(loading)}</div>
      {authError && <div style={{color: 'red'}}>error: {authError}</div>}
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

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
      <DebugPanel />
      <AppContent />
    </AuthProvider>
  );
}

export default App
