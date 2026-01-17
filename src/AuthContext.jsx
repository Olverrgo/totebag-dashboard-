import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, getUserProfile, onAuthStateChange, signOut } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: session } = await getSession();

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          const { data: profileData } = await getUserProfile(session.user.id);
          if (isMounted && profileData) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const authListener = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const { data: profileData } = await getUserProfile(session.user.id);
        if (isMounted && profileData) {
          setProfile(profileData);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    const subscription = authListener?.data?.subscription;

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error al cerrar sesion:', err);
    }
  };

  const isAdmin = profile?.rol === 'admin';
  const isUsuario = profile?.rol === 'usuario';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      isUsuario,
      isAuthenticated,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
