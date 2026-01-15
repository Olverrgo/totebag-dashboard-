import React, { useState, useEffect } from 'react';
import { signIn } from './supabaseClient';

const colors = {
  cream: '#FDF6E9',
  sand: '#D4C5B5',
  camel: '#A67B5B',
  terracotta: '#C75B39',
  olive: '#5C6B4A',
  espresso: '#2C1810',
  gold: '#B8860B',
  cotton: '#FAF9F6',
  linen: '#E8E4DC',
  sage: '#9CAF88',
  burlap: '#C4B396'
};

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Detectar cambios de tamano de ventana
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar fuente
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const isMobile = windowWidth <= 480;
  const isTablet = windowWidth > 480 && windowWidth <= 768;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        if (signInError.message.includes('Invalid login')) {
          setError('Email o contrasena incorrectos');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data?.user) {
        onLoginSuccess?.();
      }
    } catch (err) {
      setError('Error al iniciar sesion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!loading) {
      document.querySelector('form')?.requestSubmit();
    }
  };

  const borderStyle = '1px solid ' + colors.sand;
  const errorBg = colors.terracotta + '20';
  const errorBorder = '1px solid ' + colors.terracotta;

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '-webkit-fill-available',
      background: 'linear-gradient(180deg, #E8DFD0 0%, #D4C5B5 50%, #C4B396 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '10px' : '20px',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: colors.cotton,
        borderRadius: isMobile ? '8px' : '0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: isMobile ? '100%' : '380px',
        overflow: 'hidden'
      }}>
        {/* Header con imagen de fondo */}
        <div style={{
          backgroundImage: 'url("/login-header-bg.png?v=3")',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          padding: '0',
          minHeight: isMobile ? '220px' : isTablet ? '250px' : '280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{
          padding: isMobile ? '20px 15px' : '25px 30px',
          background: colors.cotton
        }}>
          <div style={{ marginBottom: isMobile ? '15px' : '18px' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '10px' : '11px',
              letterSpacing: '2px',
              color: colors.camel,
              marginBottom: '8px',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoCapitalize="none"
              style={{
                width: '100%',
                padding: isMobile ? '14px 12px' : '12px 14px',
                border: borderStyle,
                borderRadius: '4px',
                fontSize: '16px',
                background: '#FAFAF8',
                color: colors.espresso,
                outline: 'none',
                boxSizing: 'border-box',
                WebkitAppearance: 'none'
              }}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: isMobile ? '20px' : '22px' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '10px' : '11px',
              letterSpacing: '2px',
              color: colors.camel,
              marginBottom: '8px',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: isMobile ? '14px 12px' : '12px 14px',
                border: borderStyle,
                borderRadius: '4px',
                fontSize: '16px',
                background: '#FAFAF8',
                color: colors.espresso,
                outline: 'none',
                boxSizing: 'border-box',
                WebkitAppearance: 'none'
              }}
              placeholder="********"
            />
          </div>

          {error && (
            <div style={{
              background: errorBg,
              border: errorBorder,
              color: colors.terracotta,
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '18px',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={handleButtonClick}
            onTouchEnd={(e) => { e.preventDefault(); handleButtonClick(); }}
            style={{
              width: '100%',
              padding: isMobile ? '16px' : '14px',
              background: loading ? colors.sand : colors.olive,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: isMobile ? '14px' : '13px',
              fontWeight: '600',
              letterSpacing: '3px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              textTransform: 'uppercase',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {loading ? 'INGRESANDO...' : 'INGRESAR'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          borderTop: borderStyle,
          padding: isMobile ? '12px 15px' : '15px 20px',
          textAlign: 'center',
          fontSize: isMobile ? '9px' : '10px',
          color: colors.camel,
          letterSpacing: '1px',
          background: colors.cotton
        }}>
          Hecho con el corazon desde Puebla
        </div>
      </div>
    </div>
  );
};

export default Login;
