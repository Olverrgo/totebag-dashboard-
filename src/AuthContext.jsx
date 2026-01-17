import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, signOut } from './supabaseClient';

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
  const mountedRef = useRef(true);

  const loadProfile = async (userId, retryCount = 0) => {
    console.log('loadProfile attempt', retryCount + 1, 'for', userId);
    
    try {
      // Refresh session to ensure token is valid
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session refreshed:', !!session);
      
      if (!session) {
        console.log('No session after refresh');
        return null;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Profile query result:', { data, error: error?.message });

      if (data) {
        return data;
      }

      if (error && retryCount < 2) {
        console.log('Retrying in 1s...');
        await new Promise(r => setTimeout(r, 1000));
        return loadProfile(userId, retryCount + 1);
      }

      return null;
    } catch (err) {
      console.error('loadProfile error:', err);
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 1000));
        return loadProfile(userId, retryCount + 1);
      }
      return null;
    }
  };

  const handleLogout = async () => {
    console.log('handleLogout called');
    setUser(null);
    setProfile(null);
    setLoading(false);
    try {
      await signOut();
      console.log('signOut complete');
    } catch (err) {
      console.error('signOut error:', err);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    let isInitialized = false;

    const initializeAuth = async () => {
      console.log('initializeAuth starting');
      
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session:', !!session, error?.message || '');

        if (!mountedRef.current) return;

        if (session?.user) {
          console.log('User found:', session.user.email);
          setUser(session.user);

          // Wait a bit for auth to be fully ready
          await new Promise(r => setTimeout(r, 800));

          if (!mountedRef.current) return;

          const profileData = await loadProfile(session.user.id);
          
          if (mountedRef.current) {
            if (profileData) {
              console.log('Setting profile:', profileData.rol);
              setProfile(profileData);
            } else {
              console.log('No profile data');
              setAuthError('No se pudo cargar el perfil');
            }
          }
        } else {
          console.log('No session found');
        }
      } catch (err) {
        console.error('initializeAuth error:', err);
        if (mountedRef.current) {
          setAuthError(err.message);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          isInitialized = true;
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('onAuthStateChange:', event);

        if (!mountedRef.current) return;

        // Only handle SIGNED_IN after initialization (new logins)
        if (event === 'SIGNED_IN' && isInitialized && session?.user) {
          console.log('New sign in detected');
          setUser(session.user);
          setLoading(true);
          
          await new Promise(r => setTimeout(r, 500));
          
          const profileData = await loadProfile(session.user.id);
          if (mountedRef.current) {
            setProfile(profileData);
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('Sign out detected');
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    initializeAuth();

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.rol === 'admin';
  const isUsuario = profile?.rol === 'usuario';
  const isAuthenticated = !!user;

  console.log('AUTH STATE:', { user: user?.email, rol: profile?.rol, isAdmin, loading });

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      isUsuario,
      isAuthenticated,
      authError,
      logout: handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
