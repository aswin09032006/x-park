import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCarouselLayout from '../components/layouts/AuthCarouselLayout';
import { ArrowLeft } from 'lucide-react';
import { logger } from '../services/logger';
import { publicApi } from '../services/api';

const VerificationPage = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your email';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const context = 'VerificationPage.handleSubmit';
    logger.startNewTrace();
    setLoading(true);
    setError('');
    logger.info('Submitting verification code.', { context, details: { email } });

    try {
      const data = await publicApi('/auth/public/verify', 'POST', { email, code });
      logger.success('Verification code successful.', { context });
      navigate('/update-password', { state: { resetToken: data.token } });
    } catch (err) {
      setError(err.message);
      logger.error('Verification code failed.', { context, details: { email, error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCarouselLayout>
        <Link to="/forgot-password" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-10">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Link>
        <h2 className="text-3xl font-bold mb-2">Verification</h2>
        <p className="text-muted-foreground mb-8">Enter the reset code sent to <span className="text-cyan-400">{email}</span>.</p>
        <form onSubmit={handleSubmit}>
            <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-2" htmlFor="code">Verification Code</label>
                <input id="code" type="text" placeholder="Enter the code" required className="w-full px-4 py-3 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-md transition disabled:opacity-50">
                {loading ? 'Verifying...' : 'Submit'}
            </button>
        </form>
    </AuthCarouselLayout>
  );
};

export default VerificationPage;