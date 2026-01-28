import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, signOut, isSupabaseConfigured } from './supabaseClient';

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
  const userRef = useRef(null);
  const profileRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
  }, [user, profile]);

  const loadProfile = async (userId, retryCount = 0) => {
        
    try {
      // Refresh session to ensure token is valid
      const { data: { session } } = await supabase.auth.getSession();
            
      if (!session) {
                return null;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      
      if (data) {
        return data;
      }

      if (error && retryCount < 2) {
                await new Promise(r => setTimeout(r, 1000));
        return loadProfile(userId, retryCount + 1);
      }

      return null;
    } catch (err) {
      console.error('Error al cargar perfil');
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 1000));
        return loadProfile(userId, retryCount + 1);
      }
      return null;
    }
  };

  const handleLogout = async () => {
    setUser(null);
    setProfile(null);
    setLoading(false);
    try {
      await signOut();
      // Solo limpiar la clave de auth, no todo localStorage
      localStorage.removeItem('totebag-auth-token');
    } catch (err) {
      console.error('Error al cerrar sesion');
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    let isInitialized = false;

    // Si Supabase no esta configurado, no intentar autenticar
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setAuthError('Supabase no configurado');
      return;
    }

    const initializeAuth = async () => {

      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (session?.user) {
          setUser(session.user);

          // Wait a bit for auth to be fully ready
          await new Promise(r => setTimeout(r, 800));

          if (!mountedRef.current) return;

          const profileData = await loadProfile(session.user.id);

          if (mountedRef.current) {
            if (profileData) {
              setProfile(profileData);
            } else {
              setAuthError('No se pudo cargar el perfil');
            }
          }
        }
      } catch (err) {
        console.error('Error al inicializar autenticacion');
        if (mountedRef.current) {
          setAuthError('Error al inicializar sesion');
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

        if (!mountedRef.current) return;

        // Handle token refresh - keep user logged in
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
          // No need to reload profile, just ensure user state is updated (use ref to avoid stale closure)
          if (!profileRef.current && isInitialized) {
            const profileData = await loadProfile(session.user.id);
            if (mountedRef.current && profileData) {
              setProfile(profileData);
            }
          }
          return;
        }

        // Only handle SIGNED_IN after initialization (new logins)
        if (event === 'SIGNED_IN' && isInitialized && session?.user) {
          // If we already have user and profile, skip - this is just a session refresh
          if (userRef.current && profileRef.current) {
            return;
          }

          setUser(session.user);

          // Only show loading if we don't have a profile yet
          if (!profileRef.current) {
            setLoading(true);

            await new Promise(r => setTimeout(r, 500));

            const profileData = await loadProfile(session.user.id);
            if (mountedRef.current) {
              setProfile(profileData);
              setLoading(false);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Handle visibility change (when user returns to tab/app)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isInitialized && mountedRef.current) {
        // If we already have user and profile, don't do anything - session is fine
        if (userRef.current && profileRef.current) {
          return;
        }

        // Only verify session if something is missing
        const { data: { session } } = await supabase.auth.getSession();

        if (mountedRef.current) {
          if (session?.user) {
            // Session is valid, restore missing state
            if (!userRef.current) {
              setUser(session.user);
            }
            if (!profileRef.current) {
              const profileData = await loadProfile(session.user.id);
              if (mountedRef.current && profileData) {
                setProfile(profileData);
              }
            }
          } else if (userRef.current) {
            // Session expired, clear state
            setUser(null);
            setProfile(null);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    initializeAuth();

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
      authError,
      logout: handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
