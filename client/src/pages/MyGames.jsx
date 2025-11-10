import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, ChevronDown, Play } from 'lucide-react';
import GameCarousel from '../components/GameCarousel';
import bg from '../../public/image.png';
import GameSeriesModal from '../components/GameSeriesModal';
import { useGames } from '../context/GameContext';

const MyGames = () => {
  // --- THIS IS THE FIX (PART 1): Get data from the context ---
  const { savedGames, playedGames, startGame, allGames, updateGameInList } = useGames();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleGameCardClick = (game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  // --- THIS IS THE FIX (PART 2): Call the context's update function ---
  const handleGameUpdate = (updatedGame) => {
    updateGameInList(updatedGame);
    if (selectedGame && selectedGame._id === updatedGame._id) {
        setSelectedGame(updatedGame);
    }
  };

  const heroGame = useMemo(() => allGames.find((g) => g.title === 'Network Shield') || allGames.find(g => !g.isComingSoon), [allGames]);
  
  const filterGames = (games) => games
    .filter(game => (selectedCategory === 'All' || game.category === selectedCategory) && game.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.isComingSoon - b.isComingSoon ? 1 : -1);

  const filteredPlayedGames = useMemo(() => filterGames(playedGames), [playedGames, searchTerm, selectedCategory]);
  const filteredSavedGames = useMemo(() => filterGames(savedGames), [savedGames, searchTerm, selectedCategory]);

  const handlePlayHeroGame = () => {
    if (heroGame && heroGame.gameUrl) startGame(heroGame);
  };

  if (allGames.length === 0) return <div className="text-foreground text-center p-8">Loading My Games...</div>;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <GameSeriesModal isOpen={isModalOpen} onClose={handleCloseModal} game={selectedGame} onGameUpdate={handleGameUpdate} />
      <main className="flex-1 p-8">
        {heroGame && (
          <div className="relative p-8 mb-12 rounded-2xl overflow-hidden h-[500px] flex flex-col justify-between" style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-black/70 z-0"></div>
            <div className="relative z-10 flex justify-between items-center">
              <Link to="/dashboard" className="flex items-center text-lg font-medium text-white hover:opacity-80 transition-opacity"><ChevronLeft size={22} className="mr-2" /> My Games</Link>
              <div className="flex items-center gap-3">
                <div className="relative"><input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 bg-secondary/80 border border-border rounded-lg py-2 pl-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground" /><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /></div>
                <div className="relative">
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-secondary/80 border border-border rounded-lg py-2 pl-4 pr-10 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 w-40">
                    <option value="All" className="bg-popover text-popover-foreground">All Categories</option>
                    {[...new Set(allGames.map((g) => g.category))].map((cat) => (<option key={cat} value={cat} className="bg-popover text-popover-foreground">{cat}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                </div>
              </div>
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-6xl font-bold mb-4 text-white tracking-wide">{heroGame.title.toUpperCase()}</h2>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed max-w-xl">{heroGame.description}</p>
              <div className="flex gap-3"><Link to={heroGame.gameUrl} onClick={handlePlayHeroGame}><button className="flex items-center bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300"><Play size={20} className="mr-2 fill-current" /> Play</button></Link></div>
            </div>
          </div>
        )}
        <div className="space-y-8">
          <GameCarousel title="Recently Played" gameList={filteredPlayedGames} onCardClick={handleGameCardClick} />
          <GameCarousel title="Saved Games" gameList={filteredSavedGames} onCardClick={handleGameCardClick} />
        </div>
      </main>
    </div>
  );
};

export default MyGames;