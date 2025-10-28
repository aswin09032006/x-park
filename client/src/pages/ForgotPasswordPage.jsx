import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import AuthCarouselLayout from '../components/layouts/AuthCarouselLayout';
import { ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const data = await api('/auth/forgot-password', 'POST', { email });
      setSuccess(data.msg);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCarouselLayout>
      <Link to="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-10"><ArrowLeft className="w-4 h-4 mr-2" /> Go Back</Link>
      <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
      <p className="text-muted-foreground mb-8">Enter your email and we'll send you a link to reset your password.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm text-muted-foreground mb-2" htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" />
        </div>
        {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center mb-4">{success}</p>}
        <button type="submit" disabled={loading || !!success} className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-md transition disabled:opacity-50">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </AuthCarouselLayout>
  );
};
export default ForgotPasswordPage;