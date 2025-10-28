import React from 'react';
import { Bookmark } from 'lucide-react';
import { useGames } from '../context/GameContext';

const GameCard = ({ game, onClick }) => {
  const {
    _id,
    title = "Default Title",
    imageUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center",
    description = "Default description for the game.",
    category = "N/A",
    sponsor = "N/A",
    isComingSoon = false,
    // --- Use the new averageRating field from the backend ---
    averageRating, 
  } = game;
  
  const { saveGame, unsaveGame, isGameSaved } = useGames();
  const isSaved = isGameSaved(_id);

  const handleCardClick = () => {
    if (onClick) {
      onClick(game);
    }
  };
  
  const handleSaveClick = (e) => {
      e.stopPropagation();
      if (isSaved) {
          unsaveGame(_id);
      } else {
          saveGame(game);
      }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer w-80 aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl bg-card border-2 border-border transition-all duration-300 hover:z-20"
    >
      <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />

      <button 
        onClick={handleSaveClick}
        className="absolute top-3 right-3 bg-black/40 p-2 rounded-full z-10 hover:bg-black/70 transition-colors"
        aria-label={isSaved ? "Unsave game" : "Save game"}
      >
        <Bookmark 
            size={20} 
            className={`text-white transition-all ${isSaved ? 'fill-white' : 'fill-transparent'}`} 
        />
      </button>

      {isComingSoon && (
        <span className="absolute top-3 left-3 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
          Coming Soon
        </span>
      )}

      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
        <h3 className="text-white font-bold text-lg truncate transition-transform duration-300 group-hover:-translate-y-1">{title}</h3>
        
        <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-96 group-hover:opacity-100 transition-all duration-500 ease-in-out pt-2">
          <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">{description}</p>
          
          <div className={`grid ${isComingSoon ? 'grid-cols-2' : 'grid-cols-3'} gap-4 text-sm`}>
            <div>
              <p className="text-gray-400 text-xs mb-1">Category</p>
              <div className="flex items-center">
                <span className="text-yellow-400 mr-1 text-base">🏆</span>
                <span className="text-white font-medium text-xs truncate">{category}</span>
              </div>
            </div>
            
            {/* --- Conditionally render the Rating section --- */}
            {!isComingSoon && (
              <div>
                <p className="text-gray-400 text-xs mb-1">Rating</p>
                <div className="flex items-center">
                  <span className="text-green-400 mr-1 text-base">⭐</span>
                  <span className="text-white font-medium">
                    {averageRating ? averageRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
            )}
            
            <div>
              <p className="text-gray-400 text-xs mb-1">Sponsor</p>
              <div className="flex items-center">
                <span className="text-cyan-400 mr-1 text-base">⚪</span>
                <span className="text-white font-medium text-xs truncate">{sponsor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;