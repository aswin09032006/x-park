import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import AuthCarouselLayout from '../components/layouts/AuthCarouselLayout';

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await api(`/auth/reset-password/${resetToken}`, 'PUT', { password });
      setSuccess(`${data.msg} Redirecting to login...`);

      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCarouselLayout>
      <h2 className="text-3xl font-bold mb-2">Set Your New Password</h2>
      <p className="text-muted-foreground mb-8">Please enter a new password below.</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm text-muted-foreground mb-2"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter your new password"
          />
        </div>

        {error && (
          <p className="text-destructive text-sm text-center mb-4">{error}</p>
        )}
        {success && (
          <p className="text-green-500 text-sm text-center mb-4">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading || !!success}
          className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-md transition disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </AuthCarouselLayout>
  );
};

export default UpdatePasswordPage;
