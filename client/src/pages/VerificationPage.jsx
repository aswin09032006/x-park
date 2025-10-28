import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCarouselLayout from '../components/layouts/AuthCarouselLayout';
import { ArrowLeft } from 'lucide-react';

const VerificationPage = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your email'; // Safely access email from previous page

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // --- BACKEND API CALL ---
      // This is a placeholder for your actual API call.
      // You would replace this with a call to your backend, for example using the `api` service.
      const response = await fetch('/api/password-reset/verify-code/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Invalid verification code.');

      // On success, navigate to update password page, passing the verified token
      navigate('/update-password', { state: { resetToken: data.token } });

    } catch (err) {
      setError(err.message);
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
        <p className="text-muted-foreground mb-8">
            Enter the reset code sent to <span className="text-cyan-400">{email}</span>.
        </p>
        
        <form onSubmit={handleSubmit}>
            <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-2" htmlFor="code">Verification Code</label>
                <input
                    id="code" type="text" placeholder="Enter the code" required
                    className="w-full px-4 py-3 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    value={code} onChange={(e) => setCode(e.target.value)}
                />
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