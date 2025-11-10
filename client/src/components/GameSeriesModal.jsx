// --- /frontend/src/components/GameSeriesModal.jsx ---
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, X } from 'lucide-react';
import bg from '../../public/image.png';
import { useGames } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import RatingModal from './RatingModal';

const ModalGameCard = ({ game, onRateClick }) => {
    const { startGame } = useGames();
    const { user } = useAuth();

    const getGameInfo = (g) => {
        if (g.gameUrl?.includes('data-forge')) return { identifier: 'data-forge', totalLevels: 5 };
        if (g.gameUrl?.includes('cyber-security')) return { identifier: 'cyber-security', totalLevels: 1 };
        return { identifier: g._id, totalLevels: 1 };
    };

    const { identifier, totalLevels } = getGameInfo(game);
    const userProgressForGame = user?.gameData?.[identifier];
    const completedLevelsCount = userProgressForGame?.completedLevels ? Object.keys(userProgressForGame.completedLevels).length : 0;
    
    const progress = totalLevels > 0 ? Math.round((completedLevelsCount / totalLevels) * 100) : 0;
    const isInProgress = completedLevelsCount > 0;
    
    const userRating = game.ratings?.find(r => r.user === user?._id);
    const hasRated = !!userRating;
    
    const handlePlayClick = () => {
        if (game.gameUrl && !game.isComingSoon) {
            startGame(game);
        }
    };
    
    return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="relative">
            <img src={game.imageUrl} alt={game.title} className="w-full h-auto aspect-video object-cover" />
            {isInProgress && !game.isComingSoon && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex justify-between items-center text-xs text-red-400 font-semibold mb-1">
                        <span>{progress === 100 ? 'Completed' : 'In-progress'}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                </div>
            )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-bold text-card-foreground text-lg mb-2">{game.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed flex-grow">{game.description}</p>
            <div className="flex gap-2 mt-4">
                {game.gameUrl && !game.isComingSoon ? (
                    <Link to={game.gameUrl} onClick={handlePlayClick} className="flex-grow flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                        <Play size={16} className="mr-2 fill-current" /> Play
                    </Link>
                ) : (
                    <button className="flex-grow flex items-center justify-center bg-muted text-muted-foreground font-medium py-2 px-4 rounded-md cursor-not-allowed">Coming Soon</button>
                )}
                
                {!game.isComingSoon && (
                    hasRated ? (
                        <div className="flex items-center justify-center border border-border text-yellow-400 py-2 px-4 rounded-md" title={`You rated this ${userRating.rating} stars`}>
                            <Star size={16} className="mr-2 fill-current" /> Rated {userRating.rating}/5
                        </div>
                    ) : (
                        <button onClick={() => onRateClick(game)} className="flex items-center justify-center border border-border text-muted-foreground hover:bg-accent py-2 px-4 rounded-md transition-colors">
                            <Star size={16} className="mr-2" /> Rate
                        </button>
                    )
                )}
            </div>
            <div className="border-t border-border mt-4 pt-3 text-xs text-muted-foreground flex justify-between items-center">
                <div>
                    <span className="font-semibold text-muted-foreground">Category</span>
                    <p className="text-card-foreground">{game.category || 'N/A'}</p>
                </div>
                {/* --- THIS IS THE FIX: Reverted to only show global averageRating --- */}
                {!game.isComingSoon && 
                <div>
                    <span className="font-semibold text-muted-foreground">Rating</span>
                    <p className="flex items-center text-card-foreground">
                        <Star size={14} className="text-yellow-400 fill-current mr-1" />
                        {game.averageRating ? game.averageRating.toFixed(1) : 'N/A'}
                    </p>
                </div>
                }
                <div>
                    <span className="font-semibold text-muted-foreground">Sponsor</span>
                    <p className="flex items-center text-card-foreground">{game.sponsor || 'N/A'}</p>
                </div>
            </div>
        </div>
    </div>
    );
};

const GameSeriesModal = ({ isOpen, onClose, game, onGameUpdate }) => {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [gameToRate, setGameToRate] = useState(null);

    if (!isOpen || !game) return null;
    
    const modalGamesData = [
        { ...game, key: `${game._id}_1`, isComingSoon: !game.gameUrl }, 
    ];

    const handleOpenRatingModal = (gameForRating) => {
        setGameToRate(gameForRating);
        setIsRatingModalOpen(true);
    };

    const handleRatingSuccess = (updatedGame) => {
        if (onGameUpdate) {
            onGameUpdate(updatedGame);
        }
        setIsRatingModalOpen(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="bg-background w-full max-w-7xl h-full max-h-[95vh] rounded-2xl overflow-y-auto scrollbar-thin scrollbar-track-secondary scrollbar-thumb-muted hover:scrollbar-thumb-accent"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="relative p-8 md:p-12 h-[350px] flex flex-col justify-end" style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0"></div>
                        <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors z-20"><X size={24} /></button>
                        <div className="relative z-10 max-w-3xl">
                            <h1 className="text-5xl font-bold mb-4 text-white">{game.title}</h1>
                            <p className="text-gray-300 text-lg leading-relaxed">{game.description}</p>
                        </div>
                    </div>
                    <div className="p-8 md:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {modalGamesData.map(g => <ModalGameCard key={g.key} game={g} onRateClick={handleOpenRatingModal} />)}
                        </div>
                    </div>
                </div>
            </div>

            <RatingModal isOpen={isRatingModalOpen} game={gameToRate} onClose={() => setIsRatingModalOpen(false)} onSuccess={handleRatingSuccess} />
        </>
    );
};

export default GameSeriesModal;