// --- /frontend/src/pages/Dashboard.jsx ---
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// --- THIS IS THE FIX (Part 1): Import the Zap icon for XP ---
import { Trophy, Award, Shield, Download, Gamepad2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGames } from '../context/GameContext';
import { api } from '../services/api';
import GameCarousel from '../components/GameCarousel';
import GameModal from '../components/GameModal';

const Dashboard = () => {
  const { user } = useAuth();
  const { savedGames, playedGames, allGames: games, updateGameInList } = useGames();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  const [gameStats, setGameStats] = useState({
    gameAttempts: 0,
    totalScore: 0,
    badges: 0,
    certificates: 0,
    totalXp: 0, // <-- Add state for XP
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userGameData = await api('/users/me/gamedata');
        processGameData(userGameData);
      } catch (err) {
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // --- THIS IS THE FIX (Part 2): Calculate total XP from all games ---
  const processGameData = (data) => {
    let totalScore = 0, badges = 0, gameAttempts = 0, certificates = 0, totalXp = 0;
    for (const gameId in data) {
      const progress = data[gameId];
      if (progress.highScores) totalScore += Object.values(progress.highScores).reduce((sum, score) => sum + score, 0);
      if (progress.badges) badges += Object.keys(progress.badges).length;
      if (progress.totalAttempts) gameAttempts += progress.totalAttempts;
      if (progress.certificates) certificates += Object.keys(progress.certificates).length;
      // Sum up XP from the xp map for each game
      if (progress.xp) totalXp += Object.values(progress.xp).reduce((sum, xp) => sum + xp, 0);
    }
    setGameStats({ totalScore, badges, gameAttempts, certificates, totalXp });
  };

  const handleCardClick = (game) => setSelectedGame(game);
  const handleCloseModal = () => setSelectedGame(null);

  const handleGameUpdate = (updatedGame) => {
    updateGameInList(updatedGame);
    if (selectedGame && selectedGame._id === updatedGame._id) {
      setSelectedGame(updatedGame);
    }
  };

  const getRecommendations = () => {
    if (!games || games.length === 0) return [];
    const gamesCopy = [...games].sort((a, b) => a.isComingSoon - b.isComingSoon ? 1 : -1);
    const networkShieldIndex = gamesCopy.findIndex((game) => game.title === 'Network Shield');
    if (networkShieldIndex > -1) {
      const [networkShieldGame] = gamesCopy.splice(networkShieldIndex, 1);
      gamesCopy.unshift(networkShieldGame);
    }
    return gamesCopy.slice(0, 8);
  };

  // --- THIS IS THE FIX (Part 3): Replace the "Games rated" card with the "Total XP" card ---
  const statsCards = [
    { title: 'Game Attempts', value: gameStats.gameAttempts, icon: Gamepad2, bgColor: 'bg-blue-500' },
    { title: 'Total Score', value: gameStats.totalScore, icon: Trophy, bgColor: 'bg-pink-500' },
    { title: 'Badges Earned', value: gameStats.badges, icon: Award, bgColor: 'bg-lime-500' },
    { title: 'Certificates', value: gameStats.certificates, icon: Shield, bgColor: 'bg-teal-500' },
    { title: 'Total XP Earned', value: gameStats.totalXp.toLocaleString(), icon: Zap, bgColor: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto">
        {user?.isFirstLogin ? (
          <div className="mb-8 p-6 bg-card border border-border rounded-lg">
            <h1 className="text-3xl font-bold mb-3">Welcome {user?.nickname || user?.displayName || user?.username || 'Player'} to XPark career exploration platform!</h1>
            <p className="text-muted-foreground mb-4">Download our user manual to get started.</p>
            <a href="/XPARK_User_Manual.pdf" download="XPARK_User_Manual.pdf" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
              <Download size={18} /> Download User Manual
            </a>
          </div>
        ) : (
          <h1 className="text-3xl font-bold mb-8">Welcome back, {user?.nickname || user?.displayName || user?.username || 'Player'}!</h1>
        )}

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Progress Tracker</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {statsCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <div key={index} className={`${card.bgColor} rounded-xl p-5 text-white flex flex-col`}>
                  <div className="flex-grow space-y-1"><p className="text-sm font-medium opacity-90">{card.title}</p><p className="text-3xl font-bold">{card.value}</p></div>
                  <div className="flex justify-end"><IconComponent className="w-8 h-8 opacity-50" /></div>
                </div>
              );
            })}
          </div>
        </section>

        {games.length === 0 && !error ? (
          <div className="text-center py-10"><p className="text-lg text-muted-foreground">Loading games...</p></div>
        ) : error ? (
          <div className="text-center py-10"><p className="text-lg text-destructive">Error: {error}</p></div>
        ) : (
          <>
            <GameCarousel title="Recently Played" gameList={playedGames} exploreLink="/my-games" onCardClick={handleCardClick} />
            <GameCarousel title="Saved For Later" gameList={savedGames} exploreLink="/my-games" onCardClick={handleCardClick} />
            <GameCarousel title="Recommendations" gameList={getRecommendations()} onCardClick={handleCardClick} />
          </>
        )}
      </div>
      <GameModal game={selectedGame} isOpen={!!selectedGame} onClose={handleCloseModal} onGameUpdate={handleGameUpdate} />
    </div>
  );
};

export default Dashboard;