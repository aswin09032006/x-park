import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { api } from '../services/api';

const RatingModal = ({ game, isOpen, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !game) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const updatedGame = await api(`/games/${game._id}/rate`, 'POST', { rating });
            onSuccess(updatedGame); // Pass updated game back to parent
            onClose(); // Close this modal
        } catch (err) {
            setError(err.message || 'Failed to submit rating.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[110]" onClick={onClose}>
            <div className="relative bg-card text-card-foreground rounded-2xl w-full max-w-md p-8 border border-border shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-2">Rate this game</h2>
                <p className="text-muted-foreground mb-6">How would you rate "{game.title}"?</p>
                <div className="flex justify-center items-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={40}
                            className={`cursor-pointer transition-colors ${
                                (hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                            }`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
                {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
                <button
                    onClick={handleSubmit}
                    disabled={loading || rating === 0}
                    className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-md transition disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    );
};

export default RatingModal;