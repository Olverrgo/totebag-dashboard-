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

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar sesión al iniciar
  useEffect(() => {
    let isMounted = true;
    let subscription = null;

    const initAuth = async () => {
      try {
        setLoading(true);

        // Timeout de 5 segundos para evitar que se quede cargando
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        // Obtener sesión actual con timeout
        const sessionPromise = getSession();

        const { data: session } = await Promise.race([sessionPromise, timeoutPromise])
          .catch(err => {
            console.log('Error o timeout obteniendo sesión:', err.message);
            return { data: null };
          });

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);

          // Obtener perfil con rol
          try {
            const { data: profileData } = await getUserProfile(session.user.id);
            if (isMounted) setProfile(profileData);
          } catch (profileErr) {
            console.error('Error obteniendo perfil:', profileErr);
          }
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    try {
      const authListener = onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          try {
            const { data: profileData } = await getUserProfile(session.user.id);
            if (isMounted) setProfile(profileData);
          } catch (err) {
            console.error('Error obteniendo perfil:', err);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
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

  // Cerrar sesión
  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  // Verificar si es admin
  const isAdmin = profile?.rol === 'admin';

  // Verificar si es usuario (solo lectura)
  const isUsuario = profile?.rol === 'usuario';

  // Verificar si está autenticado
  const isAuthenticated = !!user;

  const value = {
    user,
    profile,
    loading,
    error,
    isAdmin,
    isUsuario,
    isAuthenticated,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
