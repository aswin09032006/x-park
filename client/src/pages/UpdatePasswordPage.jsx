// --- /frontend/src/pages/UpdatePasswordPage.jsx ---
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import AuthCarouselLayout from '../components/layouts/AuthCarouselLayout';
import { logger } from '../services/logger';

const UpdatePasswordPage = () => {
    // --- THIS IS THE FIX (Part 1): Add state for first and last name ---
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { resetToken } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const context = 'UpdatePasswordPage.handleSubmit';
        logger.startNewTrace();
        setLoading(true);
        setError('');
        setSuccess('');
        logger.info('Attempting to update password/activate account.', { context });

        try {
            // --- THIS IS THE FIX (Part 2): Send all fields in the payload ---
            const payload = { password, firstName, lastName };
            const data = await api(`/auth/reset-password/${resetToken}`, 'PUT', payload);
            setSuccess(`${data.msg} Redirecting to login...`);
            logger.success('Password updated/account activated successfully.', { context });
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
            logger.error('Failed to update password/activate account.', { context, details: { error: err.message } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthCarouselLayout>
            <h2 className="text-3xl font-bold mb-2">Activate Your Account</h2>
            <p className="text-muted-foreground mb-8">Please complete your profile and set a password to continue.</p>
            <form onSubmit={handleSubmit}>
                {/* --- THIS IS THE FIX (Part 3): Add form fields for names --- */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm text-muted-foreground mb-2">First Name</label>
                        <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" placeholder="Enter first name" />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm text-muted-foreground mb-2">Last Name</label>
                        <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" placeholder="Enter last name" />
                    </div>
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block text-sm text-muted-foreground mb-2">New Password</label>
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" placeholder="Enter your new password" />
                </div>

                {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
                {success && <p className="text-green-500 text-sm text-center mb-4">{success}</p>}
                <button type="submit" disabled={loading || !!success} className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-md transition disabled:opacity-50">
                    {loading ? 'Activating...' : 'Activate Account & Set Password'}
                </button>
            </form>
        </AuthCarouselLayout>
    );
};

export default UpdatePasswordPage;