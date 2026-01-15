import React, { useState } from 'react';
import { signIn } from './supabaseClient';

// Colores del tema
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
  fireOrange: '#FF6B35',
  canvasBeige: '#E8DFD0'
};

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        if (signInError.message.includes('Invalid login')) {
          setError('Email o contraseña incorrectos');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data?.user) {
        onLoginSuccess?.();
      }
    } catch (err) {
      setError('Error al iniciar sesión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const gradientBg = 'linear-gradient(180deg, ' + colors.cream + ' 0%, ' + colors.sand + ' 50%, ' + colors.linen + ' 100%)';
  const borderStyle = '1px solid ' + colors.sand;
  const errorBg = colors.terracotta + '20';
  const errorBorder = '1px solid ' + colors.terracotta;

  return (
    <div style={{
      minHeight: '100vh',
      background: gradientBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Cormorant Garamond', Georgia, serif"
    }}>
      <div style={{
        background: colors.cotton,
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#D5C8B8',
          backgroundImage: 'repeating-linear-gradient(0deg, #D5C8B8 0px, #D5C8B8 1px, #CEC1B1 1px, #CEC1B1 2px, #D5C8B8 2px, #D5C8B8 3px, #E0D5C5 3px, #E0D5C5 4px), repeating-linear-gradient(90deg, #D5C8B8 0px, #D5C8B8 1px, #C8BBAB 1px, #C8BBAB 2px, #D5C8B8 2px, #D5C8B8 3px, #DDD2C2 3px, #DDD2C2 4px)',
          backgroundBlendMode: 'multiply',
          padding: '40px 30px',
          textAlign: 'center'
        }}>
          <img
            src="/Yolotl_logo_OK.png"
            alt="Yolotl Logo"
            style={{
              height: '180px',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: '15px'
            }}
          />
          <div style={{
            fontSize: '12px',
            letterSpacing: '4px',
            color: colors.camel,
            marginBottom: '10px'
          }}>
            SINAI HOGAR
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: '300',
            color: colors.espresso,
            letterSpacing: '2px'
          }}>
            Totebags Yolotl
          </div>
          <div style={{
            fontSize: '11px',
            color: colors.camel,
            marginTop: '10px',
            letterSpacing: '2px'
          }}>
            100% ALGODÓN
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              letterSpacing: '2px',
              color: colors.camel,
              marginBottom: '8px',
              textTransform: 'uppercase'
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
                padding: '14px',
                border: borderStyle,
                borderRadius: '6px',
                fontSize: '16px',
                background: colors.cream,
                color: colors.espresso,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              letterSpacing: '2px',
              color: colors.camel,
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                border: borderStyle,
                borderRadius: '6px',
                fontSize: '16px',
                background: colors.cream,
                color: colors.espresso,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              background: errorBg,
              border: errorBorder,
              color: colors.terracotta,
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
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
              padding: '16px',
              background: loading ? colors.sand : colors.fireOrange,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '2px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              textTransform: 'uppercase'
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          borderTop: borderStyle,
          padding: '20px',
          textAlign: 'center',
          fontSize: '11px',
          color: colors.camel,
          letterSpacing: '1px'
        }}>
          Hecho a mano en Puebla, México
        </div>
      </div>
    </div>
  );
};

export default Login;
