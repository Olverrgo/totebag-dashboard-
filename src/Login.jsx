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

  const borderStyle = '1px solid ' + colors.sand;
  const errorBg = colors.terracotta + '20';
  const errorBorder = '1px solid ' + colors.terracotta;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #E8DFD0 0%, #D4C5B5 50%, #C4B396 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Cormorant Garamond', Georgia, serif"
    }}>
      <div style={{
        background: colors.cotton,
        borderRadius: '0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: '380px',
        overflow: 'hidden'
      }}>
        {/* Header con imagen de fondo */}
        <div style={{
          backgroundImage: 'url("/login-header-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          padding: '0',
          minHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{
          padding: '25px 30px',
          background: colors.cotton
        }}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
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
              style={{
                width: '100%',
                padding: '12px 14px',
                border: borderStyle,
                borderRadius: '4px',
                fontSize: '15px',
                background: '#FAFAF8',
                color: colors.espresso,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
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
              style={{
                width: '100%',
                padding: '12px 14px',
                border: borderStyle,
                borderRadius: '4px',
                fontSize: '15px',
                background: '#FAFAF8',
                color: colors.espresso,
                outline: 'none',
                boxSizing: 'border-box'
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
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? colors.sand : colors.olive,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '3px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              textTransform: 'uppercase'
            }}
          >
            {loading ? 'INGRESANDO...' : 'INGRESAR'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          borderTop: borderStyle,
          padding: '15px 20px',
          textAlign: 'center',
          fontSize: '10px',
          color: colors.camel,
          letterSpacing: '1px',
          background: colors.cotton
        }}>
          Hecho a mano en Puebla, Mexico
        </div>
      </div>
    </div>
  );
};

export default Login;
