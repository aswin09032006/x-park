import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, ChevronDown, Play } from 'lucide-react';
import GameCarousel from '../components/GameCarousel';
import bg from '../../public/image.png';
import GameSeriesModal from '../components/GameSeriesModal';
import { useGames } from '../context/GameContext';
import { api } from '../services/api';

const MyGames = () => {
  // --- THIS IS THE FIX: Get the new `playedGames` state from context ---
  const { savedGames, playedGames, startGame } = useGames();
  const [allGames, setAllGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesData = await api('/games');
        setAllGames(gamesData);
      } catch (err) {
        setError(err.message || 'Failed to fetch games.');
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const handleGameCardClick = (game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  const handleGameUpdate = (updatedGame) => {
    setAllGames((prevGames) =>
      prevGames.map((g) => (g._id === updatedGame._id ? updatedGame : g))
    );
    if (selectedGame && selectedGame._id === updatedGame._id) {
      setSelectedGame(updatedGame);
    }
  };

  const heroGame = useMemo(
    () => allGames.find((g) => g.title === 'Network Shield') || allGames.find(g => !g.isComingSoon),
    [allGames]
  );
  
  // --- THIS IS THE FIX: Filter logic for played games ---
  const filteredPlayedGames = useMemo(() => {
    return playedGames
      .filter((game) => {
        const matchesCategory =
          selectedCategory === 'All' || game.category === selectedCategory;
        const matchesSearch = game.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => (a.isComingSoon ? 1 : -1));
  }, [playedGames, searchTerm, selectedCategory]);
  
  // --- THIS IS THE FIX: Filter logic for saved games ---
  const filteredSavedGames = useMemo(() => {
      return savedGames
      .filter((game) => {
        const matchesCategory =
          selectedCategory === 'All' || game.category === selectedCategory;
        const matchesSearch = game.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => (a.isComingSoon ? 1 : -1));
  }, [savedGames, searchTerm, selectedCategory]);


  const handlePlayHeroGame = () => {
    if (heroGame && heroGame.gameUrl) {
      startGame(heroGame);
    }
  };

  if (loading)
    return <div className="text-foreground text-center p-8">Loading My Games...</div>;
  if (error)
    return <div className="text-destructive text-center p-8">Error: {error}</div>;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <GameSeriesModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        game={selectedGame}
        onGameUpdate={handleGameUpdate}
      />

      <main className="flex-1 p-8">
        {heroGame && (
          <div
            className="relative p-8 mb-12 rounded-2xl overflow-hidden h-[500px] flex flex-col justify-between"
            style={{
              backgroundImage: `url(${bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/70 z-0"></div>

            <div className="relative z-10 flex justify-between items-center">
              <Link
                to="/dashboard"
                className="flex items-center text-lg font-medium text-white hover:opacity-80 transition-opacity"
              >
                <ChevronLeft size={22} className="mr-2" /> My Games
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 bg-neutral-800/80 border border-neutral-700 rounded-lg py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-gray-400"
                  />
                  <Search
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                </div>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-neutral-800/80 border border-neutral-700 rounded-lg py-2 pl-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 w-40"
                  >
                    <option
                      value="All"
                      className="bg-neutral-900 text-white"
                    >
                      All Categories
                    </option>
                    {[...new Set(allGames.map((g) => g.category))].map((cat) => (
                      <option
                        key={cat}
                        value={cat}
                        className="bg-neutral-900 text-white"
                      >
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={18}
                  />
                </div>
              </div>
            </div>

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-6xl font-bold mb-4 text-white tracking-wide">
                {heroGame.title.toUpperCase()}
              </h2>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed max-w-xl">
                {heroGame.description}
              </p>
              <div className="flex gap-3">
                <Link to={heroGame.gameUrl} onClick={handlePlayHeroGame}>
                  <button className="flex items-center bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300">
                    <Play size={20} className="mr-2 fill-current" /> Play
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* --- THIS IS THE FIX: Restore the two-carousel layout --- */}
        <div className="space-y-8">
          <GameCarousel
            title="Recently Played"
            gameList={filteredPlayedGames}
            onCardClick={handleGameCardClick}
          />
          <GameCarousel
            title="Saved Games"
            gameList={filteredSavedGames}
            onCardClick={handleGameCardClick}
          />
        </div>
      </main>
    </div>
  );
};

export default MyGames;