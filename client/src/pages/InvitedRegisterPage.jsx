import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import AuthCarouselLayout from '../components/layouts/AuthCarouselLayout';
import { Loader2 } from 'lucide-react';

const InvitedRegisterPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [studentData, setStudentData] = useState(null);

    // --- THIS IS THE FIX: Removed phoneNumber state ---
    const [password, setPassword] = useState('');
    const [rePassword, setRePassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const data = await publicApi(`/auth/verify-invite/${token}`);
                setStudentData(data);
            } catch (err) {
                setError(err.message || 'This invitation link is invalid or has expired.');
            } finally {
                setLoading(false);
            }
        };
        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== rePassword) {
            setError('Passwords do not match.');
            return;
        }
        
        setIsSubmitting(true);
        setError('');

        try {
            // --- THIS IS THE FIX: Payload no longer includes phoneNumber ---
            const payload = { password };
            const response = await publicApi(`/auth/complete-invite/${token}`, 'POST', payload);
            alert(response.msg);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-white text-center p-8">Verifying invitation...</div>;
    }

    return (
        <AuthCarouselLayout>
            {error && !studentData && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-destructive mb-4">Link Invalid</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Link to="/" className="text-cyan-400 hover:underline mt-4 inline-block">Go to Login</Link>
                </div>
            )}
            {studentData && (
                <form onSubmit={handleSubmit}>
                    <h2 className="text-3xl font-bold mb-2">Welcome, {studentData.firstName} {studentData.lastName}!</h2>
                    <p className="text-muted-foreground mb-8">
                        Your username will be <span className="font-bold text-cyan-400">{studentData.username}</span>. 
                        Please complete your registration below to activate your account.
                    </p>
                    
                    {/* --- THIS IS THE FIX: Removed phoneNumber input field --- */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-muted-foreground mb-2" htmlFor="password">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm text-muted-foreground mb-2" htmlFor="re-password">Re-enter password</label>
                            <input id="re-password" type="password" value={rePassword} onChange={(e) => setRePassword(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                        </div>
                    </div>
                    
                    {error && <p className="text-destructive text-sm text-center my-4">{error}</p>}

                    <button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-primary text-primary-foreground font-bold py-3 rounded-md transition disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Complete Registration'}
                    </button>
                </form>
            )}
        </AuthCarouselLayout>
    );
};

export default InvitedRegisterPage;
