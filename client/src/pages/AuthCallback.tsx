import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/lib/design-system';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=oauth_failed');
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('token', token);

      // Fetch user data
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            const userWithRole = { ...data.user, role: data.user.role || 'user' };
            localStorage.setItem('user', JSON.stringify(userWithRole));
            setUser(userWithRole);
            // Navigate based on role
            const role = userWithRole.role || 'user';
            navigate(role === 'admin' ? '/admin' : '/dashboard');
          } else {
            navigate('/login?error=invalid_token');
          }
        })
        .catch(() => {
          navigate('/login?error=fetch_error');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <PageContainer className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
      <div className="text-center">
        <div className="animate-pulse text-[#72767D]">Completing sign in...</div>
      </div>
    </PageContainer>
  );
}

