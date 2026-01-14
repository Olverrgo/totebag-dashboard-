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
    const initAuth = async () => {
      try {
        setLoading(true);

        // Obtener sesión actual
        const { data: session } = await getSession();

        if (session?.user) {
          setUser(session.user);

          // Obtener perfil con rol
          const { data: profileData } = await getUserProfile(session.user.id);
          setProfile(profileData);
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const { data: profileData } = await getUserProfile(session.user.id);
        setProfile(profileData);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
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
