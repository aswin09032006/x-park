// --- /frontend/src/components/AdminSidebar.jsx ---
import React from 'react';
import { Star, Info } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';

const GameList = ({ title, games, showRating = false }) => (
    <div className="bg-card p-6 rounded-2xl">
        <h3 className="font-bold text-lg mb-4 text-card-foreground">{title}</h3>
        <ul className="space-y-3">
            {games.length > 0 ? (
                games.map((game, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            {showRating ? (
                                <span className="text-muted-foreground font-mono text-xs w-6 text-center">{`0${index + 1}`}</span>
                            ) : (
                                <img 
                                    src={game.imageUrl || `https://i.pravatar.cc/40?u=${game.title}`} 
                                    alt={game.title} 
                                    className="w-8 h-8 rounded-full object-cover" 
                                />
                            )}
                            <p className="text-card-foreground">{game.title}</p>
                        </div>
                        <div 
                            className="flex items-center gap-2"
                            title={showRating ? "This rating is calculated only from students at your school." : ""}
                        >
                            {showRating && <Star size={14} className="text-yellow-500" /> }
                            {showRating ? game.averageRating.toFixed(1) : `${game.students} Students`}
                            <span className={`py-1 px-3 rounded-full text-xs font-semibold ${showRating ? 'bg-muted/50 text-muted-foreground' : 'hidden'}`}>
                                {showRating ? `${game.numRatings} ${game.numRatings === 1 ? 'Rating' : 'Ratings'}` : ``}
                            </span>
                        </div>
                    </li>
                ))
            ) : (
                <li className="text-center text-muted-foreground text-sm py-4">
                    No games to display in this section.
                </li>
            )}
        </ul>
        {showRating && games.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
                <Info size={14} />
                <span>Ratings are based on your school's students only.</span>
            </div>
        )}
    </div>
);


const AdminSidebar = ({ user, schoolName, favoriteGames, topPlayedGames }) => {
    if (!user || !schoolName || !favoriteGames || !topPlayedGames) {
        return null;
    }

    // --- THIS IS THE FIX: Construct the admin's full name for display ---
    const adminFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const displayName = adminFullName || user.username;

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center text-center bg-card p-6 rounded-2xl">
                <img 
                    src={getAvatarUrl(user)} 
                    alt="admin" 
                    className="w-24 h-24 rounded-full mb-4 object-cover" 
                />
                {/* Use the new displayName variable */}
                <h2 className="text-xl font-bold">{displayName}</h2>
                <p className="text-muted-foreground text-sm mb-3">{schoolName}</p>
                <span className="bg-lime-500/20 text-lime-300 text-xs font-semibold py-1 px-3 rounded-full">Admin</span>
            </div>

            <GameList title="Favourite games" games={favoriteGames} showRating={true} />
            
            <GameList title="Top played games" games={topPlayedGames} />
        </div>
    );
};

export default AdminSidebar;