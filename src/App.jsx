import { AuthProvider, useAuth } from './AuthContext'
import DashboardToteBag from './Dashboard'
import Login from './Login'

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
      <AppContent />
    </AuthProvider>
  );
}

export default App
