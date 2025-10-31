import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, ChevronDown, Play, PlusCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { useGames } from '../context/GameContext';
import GameCarousel from '../components/GameCarousel';
import GameModal from '../components/GameModal';
import bg from '../../public/bg.png';

const GameLibraryPage = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedGame, setSelectedGame] = useState(null);

    // --- 1. GET startGame FROM THE CONTEXT ---
    const { savedGames, saveGame, unsaveGame, startGame } = useGames();

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const gamesData = await api('/games');

                // ✅ Sort so live games (not coming soon) come first
                const sortedGames = gamesData.sort((a, b) => {
                    if (a.isComingSoon === b.isComingSoon) return 0;
                    return a.isComingSoon ? 1 : -1;
                });

                setGames(sortedGames);
            } catch (err) {
                setError(err.message || 'Failed to fetch games.');
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    const handleCardClick = (game) => {
        setSelectedGame(game);
    };

    const handleCloseModal = () => {
        setSelectedGame(null);
    };

    const categories = useMemo(() => ['All', ...new Set(games.map(g => g.category))], [games]);

    const filteredGames = useMemo(() => {
        return games
            .filter(game => {
                const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;
                const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCategory && matchesSearch;
            })
            // ✅ Maintain sorting even after filtering
            .sort((a, b) => {
                if (a.isComingSoon === b.isComingSoon) return 0;
                return a.isComingSoon ? 1 : -1;
            });
    }, [games, searchTerm, selectedCategory]);

    const gamesByCategory = useMemo(() => {
        const grouped = filteredGames.reduce((acc, game) => {
            (acc[game.category] = acc[game.category] || []).push(game);
            return acc;
        }, {});

        // ✅ Sort within each category (live first)
        Object.keys(grouped).forEach(cat => {
            grouped[cat].sort((a, b) => {
                if (a.isComingSoon === b.isComingSoon) return 0;
                return a.isComingSoon ? 1 : -1;
            });
        });

        return grouped;
    }, [filteredGames]);

    const heroGame = useMemo(
        () => games.find(g => !g.isComingSoon && g.gameUrl) || games[0],
        [games]
    );

    const isHeroGameSaved = useMemo(() => {
        if (!heroGame) return false;
        return savedGames.some(saved => saved._id === heroGame._id);
    }, [heroGame, savedGames]);

    const handleSaveToggle = () => {
        if (!heroGame) return;
        if (isHeroGameSaved) {
            unsaveGame(heroGame._id);
        } else {
            saveGame(heroGame);
        }
    };

    // --- 2. CREATE A HANDLER FOR THE HERO GAME'S PLAY BUTTON ---
    const handlePlayHeroGame = () => {
        if (heroGame && heroGame.gameUrl && !heroGame.isComingSoon) {
            startGame(heroGame._id);
        }
    };

    if (loading) return <div className="text-foreground text-center p-8">Loading Game Library...</div>;
    if (error) return <div className="text-destructive text-center p-8">Error: {error}</div>;

    return (
        <div className="bg-background text-foreground min-h-screen">
            <main className="flex-1 p-8">
                {heroGame && (
                    <div
                        className="relative p-8 mb-12 rounded-2xl overflow-hidden h-96 flex flex-col justify-between"
                        style={{
                            backgroundImage: `url(${heroGame.imageUrl || bg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <div className="absolute inset-0 bg-black/60 z-0"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <Link to="/dashboard" className="flex items-center text-xl font-bold text-white no-underline hover:underline">
                                <ChevronLeft size={24} className="mr-2" />
                                <h1>Game Library</h1>
                            </Link>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search games..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-64 bg-transparent border border-border rounded-lg py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-gray-400"
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                </div>
                                <div className="relative">
                                    <select
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                        className="bg-transparent border border-border rounded-lg py-2 pl-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:border-gray-400 w-40"
                                    >
                                        <option value="All" className="bg-card">All Categories</option>
                                        {categories.slice(1).map(cat => (
                                            <option key={cat} value={cat} className="bg-card">{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 max-w-2xl">
                            <h2 className="text-5xl font-medium mb-4 text-white">{heroGame.title}</h2>
                            <p className="text-gray-300 mb-6 text-lg leading-relaxed">{heroGame.description}</p>
                            <div className="flex gap-4">
                                {/* --- 3. ATTACH THE HANDLER TO THE LINK --- */}
                                <Link
                                    to={heroGame.gameUrl || '#'}
                                    onClick={handlePlayHeroGame}
                                    className={!heroGame.gameUrl || heroGame.isComingSoon ? "pointer-events-none" : ""}
                                >
                                    <button
                                        className="flex items-center bg-black/30 border border-white/20 backdrop-blur-sm text-white font-medium py-3 px-8 rounded-2xl hover:bg-black/50 hover:border-white/30 transition-all duration-300 disabled:opacity-50"
                                        disabled={!heroGame.gameUrl || heroGame.isComingSoon}
                                    >
                                        <Play size={20} className="mr-3 fill-white" /> Play
                                    </button>
                                </Link>

                                <button
                                    onClick={handleSaveToggle}
                                    className={`flex items-center bg-black/30 border border-white/20 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-2xl hover:bg-black/50 hover:border-white/30 transition-all duration-300 ${isHeroGameSaved ? 'border-primary' : ''}`}
                                >
                                    <span className="mr-3">{isHeroGameSaved ? 'Saved' : 'Save'}</span>
                                    <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                                        {isHeroGameSaved ? (
                                            <CheckCircle size={16} className="text-primary" />
                                        ) : (
                                            <PlusCircle size={16} />
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-0">
                    {Object.keys(gamesByCategory).length > 0 ? (
                        Object.entries(gamesByCategory).map(([category, gamesInCategory]) => (
                            <GameCarousel
                                key={category}
                                title={category}
                                gameList={gamesInCategory}
                                onCardClick={handleCardClick}
                            />
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground">
                            No games found matching your criteria.
                        </p>
                    )}
                </div>
            </main>

            <GameModal game={selectedGame} isOpen={!!selectedGame} onClose={handleCloseModal} />
        </div>
    );
};

export default GameLibraryPage;
