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

  // Fetch profile with retry logic
  const fetchProfile = async (userId, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await getUserProfile(userId);
        if (data) {
          console.log('Profile loaded:', data.rol);
          return data;
        }
        if (error) console.error('Profile fetch error:', error);
        // Wait before retry
        if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error('Profile fetch exception:', err);
      }
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout
    const timeoutId = setTimeout(() => {
      console.log('Auth timeout - forcing loading to false');
      if (isMounted) setLoading(false);
    }, 10000);

    const initAuth = async () => {
      try {
        const { data: session } = await getSession();
        console.log('Initial session:', session ? 'exists' : 'none');

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (isMounted && profileData) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const authListener = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      // Handle both SIGNED_IN and INITIAL_SESSION events
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
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
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    console.log('Logout initiated');
    try {
      await signOut();
      setUser(null);
      setProfile(null);
      console.log('Logout complete');
    } catch (err) {
      console.error('Error al cerrar sesion:', err);
      // Force clear state even on error
      setUser(null);
      setProfile(null);
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
