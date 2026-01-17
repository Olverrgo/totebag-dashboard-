import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [authError, setAuthError] = useState(null);

  // Fetch profile with retry
  const loadProfile = useCallback(async (userId) => {
    console.log('Loading profile for:', userId);
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await getUserProfile(userId);
        console.log('Profile attempt', attempt, '- data:', data, 'error:', error);
        
        if (data && data.rol) {
          console.log('Profile loaded successfully, rol:', data.rol);
          return data;
        }
        
        if (error) {
          console.error('Profile error:', error.message);
        }
        
        // Wait before retry
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error('Profile exception:', err);
      }
    }
    
    console.error('Failed to load profile after 3 attempts');
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;
    let profileLoaded = false;

    const setupAuth = async () => {
      try {
        // Get current session
        const { data: session, error: sessionError } = await getSession();
        console.log('Session check:', session ? 'found' : 'none', sessionError || '');

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          
          // Load profile
          const profileData = await loadProfile(session.user.id);
          if (isMounted && profileData) {
            setProfile(profileData);
            profileLoaded = true;
          } else if (isMounted) {
            setAuthError('No se pudo cargar el perfil');
          }
        }
      } catch (err) {
        console.error('Setup auth error:', err);
        if (isMounted) setAuthError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Listen for auth changes (login/logout only, not initial)
    const authListener = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (!isMounted) return;

      if (event === 'SIGNED_IN') {
        // Only handle if we don't already have the profile loaded
        if (!profileLoaded && session?.user) {
          setUser(session.user);
          const profileData = await loadProfile(session.user.id);
          if (isMounted && profileData) {
            setProfile(profileData);
            profileLoaded = true;
          }
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        profileLoaded = false;
      }
      // Ignore INITIAL_SESSION - we handle it in setupAuth
    });

    setupAuth();

    const subscription = authListener?.data?.subscription;

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const logout = async () => {
    console.log('Logout called');
    try {
      const { error } = await signOut();
      if (error) console.error('Logout error:', error);
    } catch (err) {
      console.error('Logout exception:', err);
    }
    // Always clear state
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.rol === 'admin';
  const isUsuario = profile?.rol === 'usuario';
  const isAuthenticated = !!user;

  // Debug log
  console.log('Auth state - user:', !!user, 'profile rol:', profile?.rol, 'isAdmin:', isAdmin);

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
