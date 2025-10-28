import React, { useState } from 'react';
import { Phone, MapPin, Mail } from 'lucide-react';
import { api } from '../services/api';

const SupportPage = () => {
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim()) {
            setError('Feedback cannot be empty.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const data = await api('/support/feedback', 'POST', { message: feedback });
            setSuccess(data.msg);
            setFeedback('');
        } catch (err) {
            setError(err.message || 'Failed to send feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const ContactInfo = ({ icon: Icon, text, href }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-foreground transition-colors group">
            <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
            <span className={href ? "group-hover:underline" : ""}>{text}</span>
        </a>
    );

    return (
        <div className="bg-background text-foreground p-8 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <section className="mb-16">
                    <h1 className="text-2xl font-bold mb-6">Support</h1>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Enter feedback..."
                            className="w-full h-48 p-4 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring transition"
                        />
                        <div className="flex items-center justify-between mt-4">
                             <button 
                                type="submit" 
                                disabled={loading}
                                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit'}
                            </button>
                             {error && <p className="text-destructive text-sm">{error}</p>}
                             {success && <p className="text-green-500 text-sm">{success}</p>}
                        </div>
                    </form>
                </section>

                <section>
                    <h2 className="text-xl font-medium mb-8">Contact Us</h2>
                    <div className="space-y-6">
                     <ContactInfo 
                        icon={Phone} 
                        text="+44 20 3051 1448"
                        href="tel:+442030511448"
                        />
                        <ContactInfo 
                        icon={MapPin} 
                        text="XPARK GAMES LTD, 20 Wenlock Road, London, N1 7GU, United Kingdom"
                        />
                        <ContactInfo 
                            icon={Mail} 
                            text="info@xparkgames.com"
                            href="mailto:info@xparkgames.com"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SupportPage;