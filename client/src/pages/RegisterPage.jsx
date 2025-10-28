import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../services/api';
import AuthCarouselLayout from '../components/layouts/AuthCarouselLayout';
import { ArrowLeft } from 'lucide-react';

const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    // --- UPDATED: Use firstName, lastName ---
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rePassword, setRePassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGetCode = async (e) => {
        e.preventDefault(); 
        setLoading(true); 
        setError('');
        try {
            await publicApi('/auth/public/start', 'POST', { email });
            setStep(2);
        } catch (err) { 
            setError(err.message); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault(); 
        setLoading(true); 
        setError('');
        try {
            await publicApi('/auth/public/verify', 'POST', { email, code });
            setStep(3);
        } catch (err) { 
            setError(err.message); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleCompleteRegistration = async (e) => {
        e.preventDefault();
        if (password !== rePassword) {
            setError('Passwords do not match.'); 
            return;
        }
        setLoading(true); 
        setError('');
        try {
            // --- UPDATED: Send firstName, lastName to API ---
            await publicApi('/auth/public/complete', 'POST', { email, code, firstName, lastName, username, password });
            alert('Registration successful! You can now log in.');
            navigate('/');
        } catch (err) { 
            setError(err.message); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <AuthCarouselLayout>
            <Link to="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-10">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>
            {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
            
            {step === 1 && (
                <form onSubmit={handleGetCode}>
                    <h2 className="text-3xl font-bold mb-2">Create an Account (Step 1 of 3)</h2>
                    <p className="text-muted-foreground mb-8">Enter your email to get started.</p>
                    <div className="mb-6">
                        <label htmlFor="email" className="block text-sm text-muted-foreground mb-2">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md transition disabled:opacity-50">
                        {loading ? 'Sending Code...' : 'Get Verification Code'}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleVerifyCode}>
                    <h2 className="text-3xl font-bold mb-2">Verification (Step 2 of 3)</h2>
                    <p className="text-muted-foreground mb-8">Enter the code sent to <span className="font-bold text-cyan-400">{email}</span></p>
                    <div className="mb-6">
                        <label htmlFor="code" className="block text-sm text-muted-foreground mb-2">Verification Code</label>
                        <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md transition disabled:opacity-50">
                       {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                    <button type="button" onClick={() => { setStep(1); setError(''); }} className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-foreground">Change email</button>
                </form>
            )}

            {step === 3 && (
                 <form onSubmit={handleCompleteRegistration}>
                    <h2 className="text-3xl font-bold mb-2">Final Step (3 of 3)</h2>
                    <p className="text-muted-foreground mb-8">Create your profile to complete registration.</p>
                    <div className="space-y-4">
                        {/* --- UPDATED: Use First and Last Name inputs --- */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-2" htmlFor="firstName">First Name</label>
                                <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm text-muted-foreground mb-2" htmlFor="lastName">Last Name</label>
                                <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-muted-foreground mb-2" htmlFor="username">Username (Optional)</label>
                            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm text-muted-foreground mb-2" htmlFor="password">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm text-muted-foreground mb-2" htmlFor="re-password">Re-enter password</label>
                            <input id="re-password" type="password" value={rePassword} onChange={(e) => setRePassword(e.target.value)} required className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full mt-6 bg-primary text-primary-foreground font-bold py-3 rounded-md transition disabled:opacity-50">
                        {loading ? 'Creating Account...' : 'Complete Registration'}
                    </button>
                </form>
            )}
        </AuthCarouselLayout>
    );
};

export default RegisterPage;