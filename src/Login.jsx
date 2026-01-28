import React, { useState, useEffect } from 'react';
import { signIn } from './supabaseClient';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar fuente
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        const msg = typeof signInError === 'string' ? signInError : (signInError.message || 'Error desconocido');
        if (msg.includes('Invalid login')) {
          setError('Email o contrasena incorrectos');
        } else if (msg.includes('no configurado')) {
          setError('Error de conexion. Recarga la pagina e intenta de nuevo.');
        } else {
          setError(msg);
        }
        return;
      }

      if (data?.user) {
        onLoginSuccess?.();
      }
    } catch (err) {
      setError('Error al iniciar sesion');
      console.error('Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!loading) {
      document.querySelector('form')?.requestSubmit();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header con imagen de fondo */}
        <div className="login-header"></div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoCapitalize="none"
              className="login-input"
              placeholder="tu@email.com"
            />
          </div>

          <div className="login-field login-field-password">
            <label className="login-label">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="login-input"
              placeholder="********"
            />
          </div>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={handleButtonClick}
            onTouchEnd={(e) => { e.preventDefault(); handleButtonClick(); }}
            className="login-button"
          >
            {loading ? 'INGRESANDO...' : 'INGRESAR'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          Hecho con el corazon desde Puebla (v8)<span className="login-version"></span>
        </div>
      </div>
    </div>
  );
};

export default Login;
