import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AuthCarouselLayout from '../components/layouts/AuthCarouselLayout';
import { logger } from '../services/logger';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    logger.startNewTrace();
    const context = 'LoginPage.handleSubmit';
    setLoading(true);
    setError('');
    
    logger.info('Login attempt started.', { context, details: { email } });

    try {
      const data = await api('/auth/login', 'POST', { email, password });
      logger.success('Login API call successful.', { context, details: { email, role: data.role } });
      login(data.accessToken, data.refreshToken, data.role);
    } catch (err) {
      setError(err.message);
      logger.error('Login failed.', { context, details: { email, error: { message: err.message, stack: err.stack } } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCarouselLayout>
      <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
      <p className="text-muted-foreground mb-8">Please enter your details to sign in.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm text-muted-foreground mb-2" htmlFor="email">Email</label>
          <input className="w-full px-4 py-3 bg-input border border-border rounded-md" type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-6">
          <label className="block text-sm text-muted-foreground mb-2" htmlFor="password">Password</label>
          <input className="w-full px-4 py-3 bg-input border border-border rounded-md" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
        <div className="flex items-center justify-end mb-6">
          <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 px-4 rounded-md transition disabled:opacity-50">
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </AuthCarouselLayout>
  );
};

export default LoginPage;