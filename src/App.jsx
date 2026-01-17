import { AuthProvider, useAuth } from './AuthContext'
import DashboardToteBag from './Dashboard'
import Login from './Login'

// Componente que maneja la logica de autenticacion
function AppContent() {
  const { isAuthenticated, loading, authError, clearAuthError } = useAuth();

  // Mostrar loading mientras verifica la sesion
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

  // Mostrar error de autenticacion si existe
  if (authError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FDF6E9',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#C75B39', marginBottom: '15px', fontSize: '20px' }}>
            Error de Sesion
          </h2>
          <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>
            {authError}
          </p>
          <button
            onClick={clearAuthError}
            style={{
              padding: '14px 30px',
              background: '#5C6B4A',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Mostrar Login si no esta autenticado
  if (!isAuthenticated) {
    return <Login />;
  }

  // Mostrar Dashboard si esta autenticado
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
