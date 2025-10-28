import React from 'react';
import { Star } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';

const GameList = ({ title, games, showRating = false }) => (
    <div className="bg-[#1C1C1C] p-6 rounded-2xl">
        <h3 className="font-bold text-lg mb-4 text-white">{title}</h3>
        <ul className="space-y-3">
            {games.map((game, index) => (
                <li key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        {showRating ? (
                            <span className="text-gray-400 font-mono text-xs w-6 text-center">{`0${index + 1}`}</span>
                        ) : (
                             <img src={`https://i.pravatar.cc/40?u=${game.title}`} alt="game" className="w-8 h-8 rounded-full" />
                        )}
                        <p className="text-gray-200">{game.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {showRating && <Star size={14} className="text-yellow-500" />}
                        <span className={`py-1 px-3 rounded-full text-xs font-semibold ${showRating ? 'bg-gray-700/50 text-yellow-400' : 'bg-gray-700/50 text-gray-300'}`}>
                           {showRating ? game.averageRating.toFixed(1) : `${game.students} Students`}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);


// --- 1. ACCEPT 'schoolName' AS A PROP ---
const AdminSidebar = ({ user, schoolName, favoriteGames, topPlayedGames }) => {
    // --- 2. UPDATE THE GUARD CLAUSE TO INCLUDE 'schoolName' ---
    if (!user || !schoolName || !favoriteGames || !topPlayedGames) {
        return null;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center text-center bg-[#1C1C1C] p-6 rounded-2xl">
                <img 
                    src={getAvatarUrl(user)} 
                    alt="admin" 
                    className="w-24 h-24 rounded-full mb-4 object-cover" 
                />
                <h2 className="text-xl font-bold">{user.username}</h2>
                <p className="text-gray-400 text-sm mb-3">{schoolName}</p>
                <span className="bg-lime-500/20 text-lime-300 text-xs font-semibold py-1 px-3 rounded-full">Admin</span>
            </div>

            <GameList title="Favourite games" games={favoriteGames} showRating={true} />
            
            <GameList title="Top played games" games={topPlayedGames} />
        </div>
    );
};

export default AdminSidebar;