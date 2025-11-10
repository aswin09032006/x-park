import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
// --- THIS IS THE FIX (Part 1): Import the Bookmark icon ---
import { ChevronLeft, Search, ChevronDown, Play, Bookmark } from 'lucide-react';
import { useGames } from '../context/GameContext';
import GameCarousel from '../components/GameCarousel';
import GameModal from '../components/GameModal';
import bg from '../../public/bg.png';

const GameLibraryPage = () => {
    const { allGames: games, savedGames, saveGame, unsaveGame, startGame, updateGameInList } = useGames();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedGame, setSelectedGame] = useState(null);

    const handleCardClick = (game) => setSelectedGame(game);
    const handleCloseModal = () => setSelectedGame(null);

    const handleGameUpdate = (updatedGame) => {
        updateGameInList(updatedGame);
        if (selectedGame && selectedGame._id === updatedGame._id) {
            setSelectedGame(updatedGame);
        }
    };

    const categories = useMemo(() => ['All', ...new Set(games.map(g => g.category))], [games]);

    const filteredGames = useMemo(() => {
        return games
            .filter(game => (selectedCategory === 'All' || game.category === selectedCategory) && game.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => (a.isComingSoon === b.isComingSoon) ? 0 : a.isComingSoon ? 1 : -1);
    }, [games, searchTerm, selectedCategory]);

    const gamesByCategory = useMemo(() => {
        const grouped = filteredGames.reduce((acc, game) => {
            (acc[game.category] = acc[game.category] || []).push(game);
            return acc;
        }, {});
        Object.keys(grouped).forEach(cat => grouped[cat].sort((a, b) => a.isComingSoon - b.isComingSoon ? 1 : -1));
        return grouped;
    }, [filteredGames]);

    const heroGame = useMemo(() => games.find(g => !g.isComingSoon && g.gameUrl) || games[0], [games]);
    const isHeroGameSaved = useMemo(() => heroGame ? savedGames.some(saved => saved._id === heroGame._id) : false, [heroGame, savedGames]);

    const handleSaveToggle = () => {
        if (!heroGame) return;
        isHeroGameSaved ? unsaveGame(heroGame._id) : saveGame(heroGame);
    };

    const handlePlayHeroGame = () => {
        if (heroGame && heroGame.gameUrl && !heroGame.isComingSoon) startGame(heroGame);
    };

    if (games.length === 0) return <div className="text-foreground text-center p-8">Loading Game Library...</div>;

    return (
        <div className="bg-background text-foreground min-h-screen">
            <main className="flex-1 p-8">
                {heroGame && (
                    <div className="relative p-8 mb-12 rounded-2xl overflow-hidden h-96 flex flex-col justify-between" style={{ backgroundImage: `url(${heroGame.imageUrl || bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <div className="absolute inset-0 bg-black/60 z-0"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <Link to="/dashboard" className="flex items-center text-xl font-bold text-white no-underline hover:underline">
                                <ChevronLeft size={24} className="mr-2" />
                                <h1>Game Library</h1>
                            </Link>
                            <div className="flex items-center gap-4">
                                <div className="relative"><input type="text" placeholder="Search games..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64 bg-transparent border border-border rounded-lg py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-gray-400" /><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /></div>
                                <div className="relative">
                                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-transparent border border-border rounded-lg py-2 pl-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:border-gray-400 w-40">
                                        <option value="All" className="bg-card">All Categories</option>
                                        {categories.slice(1).map(cat => (<option key={cat} value={cat} className="bg-card">{cat}</option>))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 max-w-2xl">
                            <h2 className="text-5xl font-medium mb-4 text-white">{heroGame.title}</h2>
                            <p className="text-gray-300 mb-6 text-lg leading-relaxed">{heroGame.description}</p>
                            <div className="flex gap-4">
                                <Link to={heroGame.gameUrl || '#'} onClick={handlePlayHeroGame} className={!heroGame.gameUrl || heroGame.isComingSoon ? "pointer-events-none" : ""}>
                                    <button className="flex items-center bg-black/30 border border-white/20 backdrop-blur-sm text-white font-medium py-3 px-8 rounded-2xl hover:bg-black/50 hover:border-white/30 transition-all duration-300 disabled:opacity-50" disabled={!heroGame.gameUrl || heroGame.isComingSoon}>
                                        <Play size={20} className="mr-3 fill-white" /> Play
                                    </button>
                                </Link>
                                {/* --- THIS IS THE FIX (Part 2): Replace the button content with the Bookmark icon --- */}
                                <button 
                                    onClick={handleSaveToggle} 
                                    className="flex items-center gap-3 bg-black/30 border border-white/20 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-2xl hover:bg-black/50 hover:border-white/30 transition-all duration-300"
                                >
                                    <Bookmark size={20} className={`transition-all ${isHeroGameSaved ? 'fill-white' : 'fill-transparent'}`} />
                                    <span>{isHeroGameSaved ? 'Saved' : 'Save'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="space-y-0">
                    {Object.keys(gamesByCategory).length > 0 ? (Object.entries(gamesByCategory).map(([category, gamesInCategory]) => (<GameCarousel key={category} title={category} gameList={gamesInCategory} onCardClick={handleCardClick} />))) : (<p className="text-center text-muted-foreground">No games found matching your criteria.</p>)}
                </div>
            </main>
            
            <GameModal 
                game={selectedGame} 
                isOpen={!!selectedGame} 
                onClose={handleCloseModal}
                onGameUpdate={handleGameUpdate}
            />
        </div>
    );
};

export default GameLibraryPage;