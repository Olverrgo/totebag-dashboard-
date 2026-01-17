import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { signOut } from './supabaseClient';

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
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Function to load profile with delay and retry
    const loadProfile = async (userId) => {
      console.log('loadProfile called for:', userId);
      
      // Small delay to ensure auth token is ready
      await new Promise(r => setTimeout(r, 500));
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log('Profile fetch attempt', attempt);
          
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          console.log('Profile result:', { data, error: error?.message });
          
          if (data && data.rol) {
            return data;
          }
          
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (err) {
          console.error('Profile fetch error:', err);
        }
      }
      return null;
    };

    // Use onAuthStateChange as the ONLY source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'session:', !!session);
        
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          
          // Load profile
          const profileData = await loadProfile(session.user.id);
          
          if (isMounted) {
            if (profileData) {
              setProfile(profileData);
              console.log('Profile set:', profileData.rol);
            } else {
              setAuthError('No se pudo cargar el perfil');
            }
            setLoading(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          if (isMounted) setLoading(false);
        }
      }
    );

    // Timeout safety
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('Auth timeout');
        setLoading(false);
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.rol === 'admin';
  const isUsuario = profile?.rol === 'usuario';
  const isAuthenticated = !!user;

  console.log('Render - user:', !!user, 'rol:', profile?.rol, 'isAdmin:', isAdmin, 'loading:', loading);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      isUsuario,
      isAuthenticated,
      authError,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
