import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  // Check authentication on server side
  const checkAuth = async () => {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('accessToken');
      return !!token;
    } catch {
      return false;
    }
  };

  const isAuthenticated = await checkAuth();
  
  if (isAuthenticated) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  return null;
}