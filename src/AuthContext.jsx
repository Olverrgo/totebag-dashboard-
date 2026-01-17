import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getSession, getUserProfile, onAuthStateChange, signOut } from './supabaseClient';

// Crear contexto
const AuthContext = createContext({});

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

// Funcion para reintentar una operacion
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await operation();
      return result;
    } catch (err) {
      lastError = err;
      console.log(`Intento ${i + 1} de ${maxRetries} fallido:`, err.message);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

// Proveedor de autenticacion
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Funcion para limpiar sesion y mostrar error
  const handleAuthFailure = (errorMessage) => {
    console.error('Auth failure:', errorMessage);
    setUser(null);
    setProfile(null);
    setAuthError(errorMessage);
    setLoading(false);
  };

  // Cargar sesion al iniciar
  useEffect(() => {
    let isMounted = true;
    let subscription = null;

    const initAuth = async () => {
      try {
        setLoading(true);
        setAuthError(null);

        // Timeout de 10 segundos (aumentado de 5s)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout al conectar con el servidor')), 10000)
        );

        // Obtener sesion actual con timeout
        const sessionPromise = getSession();

        const { data: session, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise])
          .catch(err => {
            console.log('Error o timeout obteniendo sesion:', err.message);
            return { data: null, error: err };
          });

        if (!isMounted) return;

        if (sessionError) {
          console.log('Error de sesion:', sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);

          // Obtener perfil con reintentos (hasta 3 intentos)
          try {
            const profileResult = await retryOperation(
              async () => {
                const { data, error } = await getUserProfile(session.user.id);
                if (error) throw error;
                if (!data) throw new Error('Perfil no encontrado');
                return data;
              },
              3,
              1500
            );

            if (isMounted) {
              setProfile(profileResult);
              console.log('Perfil cargado correctamente:', profileResult?.rol);
            }
          } catch (profileErr) {
            console.error('Error obteniendo perfil despues de reintentos:', profileErr);
            if (isMounted) {
              handleAuthFailure('No se pudo cargar tu perfil. Por favor inicia sesion nuevamente.');
              try {
                await signOut();
              } catch (e) {
                console.error('Error cerrando sesion:', e);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
        if (isMounted) {
          setError(err.message);
          handleAuthFailure('Error de conexion. Por favor recarga la pagina.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de autenticacion
    try {
      const authListener = onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setAuthError(null);

          try {
            const profileResult = await retryOperation(
              async () => {
                const { data, error } = await getUserProfile(session.user.id);
                if (error) throw error;
                if (!data) throw new Error('Perfil no encontrado');
                return data;
              },
              3,
              1500
            );
            if (isMounted) {
              setProfile(profileResult);
              console.log('Perfil cargado en SIGNED_IN:', profileResult?.rol);
            }
          } catch (err) {
            console.error('Error obteniendo perfil en SIGNED_IN:', err);
            if (isMounted) {
              handleAuthFailure('Error al cargar perfil. Por favor intenta de nuevo.');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setAuthError(null);
        } else if (event === 'TOKEN_REFRESHED') {
          if (session?.user && !profile) {
            try {
              const { data } = await getUserProfile(session.user.id);
              if (isMounted && data) setProfile(data);
            } catch (err) {
              console.error('Error recargando perfil en TOKEN_REFRESHED:', err);
            }
          }
        }
      });
      subscription = authListener?.data?.subscription;
    } catch (err) {
      console.error('Error configurando listener de auth:', err);
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Cerrar sesion mejorado
  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
      setProfile(null);
      setAuthError(null);
      await signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Error al cerrar sesion:', err);
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const isAdmin = profile?.rol === 'admin';
  const isUsuario = profile?.rol === 'usuario';
  const isAuthenticated = !!user;

  const value = {
    user,
    profile,
    loading,
    error,
    authError,
    isAdmin,
    isUsuario,
    isAuthenticated,
    logout,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
