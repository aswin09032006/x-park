import React from 'react';
import { Link } from 'react-router-dom';
import GameCard from './GameCard';

const GameCarousel = ({ title, gameList, exploreLink, onCardClick }) => {
  // Fallback for onCardClick to prevent errors if not provided
  const handleCardClick = (game) => {
    if (onCardClick) {
      onCardClick(game);
    }
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium">{title}</h2>
        {exploreLink && (
          <Link to={exploreLink} className="text-sm font-medium text-primary hover:opacity-80 transition-opacity">
            Explore All
          </Link>
        )}
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
        {gameList.length > 0 ? (
          gameList.map(game => (
            <GameCard key={game._id} game={game} onClick={() => handleCardClick(game)} />
          ))
        ) : (
          <div className="flex w-full justify-center">
            <p className="text-center text-muted-foreground">
              No games to display in this section.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GameCarousel;