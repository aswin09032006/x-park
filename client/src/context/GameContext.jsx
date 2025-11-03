import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const GameContext = createContext();
export const useGames = () => useContext(GameContext);

// --- THE FIX: Define total levels for progress calculation ---
const GAME_LEVEL_COUNTS = {
    'cyber-security': 1, // Based on description: "10 fast-paced mini-games"
    'data-forge': 5,      // Based on game implementation: NUM_LEVELS = 5
};

export const GameProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // --- SAVED GAMES (BOOKMARKS) ---
    const [savedGames, setSavedGames] = useState([]);
    // --- PLAYED GAMES (HISTORY) ---
    const [playedGames, setPlayedGames] = useState([]);

    // --- THE FIX: State to hold real progress data from the backend ---
    const [userGameData, setUserGameData] = useState({});

    const fetchSavedGames = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const gamesData = await api('/users/me/saved-games');
            setSavedGames(gamesData);
        } catch (error) {
            console.error("Failed to fetch saved games:", error);
        }
    }, [isAuthenticated]);

    // --- THIS IS THE FIX: Fetch played games from the new endpoint ---
    const fetchPlayedGames = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const gamesData = await api('/users/me/played-games');
            setPlayedGames(gamesData);
        } catch (error) {
            console.error("Failed to fetch played games:", error);
        }
    }, [isAuthenticated]);

    // --- THE FIX: Fetch real game progress data ---
    const fetchUserProgress = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const progressData = await api('/users/me/gamedata');
            setUserGameData(progressData);
        } catch (error) {
            console.error("Failed to fetch user game progress:", error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSavedGames();
            fetchPlayedGames();
            fetchUserProgress(); // <-- Call the new fetch function
        } else {
            setSavedGames([]);
            setPlayedGames([]);
            setUserGameData({}); // <-- Clear progress on logout
        }
    }, [isAuthenticated, fetchSavedGames, fetchPlayedGames, fetchUserProgress]);
    
    const saveGame = async (game) => {
        try {
            setSavedGames((prev) => {
                if (prev.find(g => g._id === game._id)) return prev;
                return [...prev, game];
            });
            await api('/users/me/saved-games', 'POST', { gameId: game._id });
        } catch (error) {
            console.error("Failed to save game:", error);
            setSavedGames((prev) => prev.filter((g) => g._id !== game._id));
        }
    };
    
    const unsaveGame = async (gameId) => {
        const originalState = savedGames;
        try {
            setSavedGames((prev) => prev.filter((game) => game._id !== gameId));
            await api(`/users/me/saved-games/${gameId}`, 'DELETE');
        } catch (error) {
            console.error("Failed to unsave game:", error);
            setSavedGames(originalState);
        }
    };

    const isGameSaved = (gameId) => !!savedGames.find(game => game._id === gameId);

    // --- THE FIX: New calculation function ---
    const getGameProgress = (game) => {
        // The game identifier is the last part of its URL, e.g., "cyber-security"
        const gameIdentifier = game.gameUrl?.split('/').pop();

        if (!gameIdentifier || !GAME_LEVEL_COUNTS[gameIdentifier] || !userGameData[gameIdentifier]) {
            return 0; // Return 0 if game isn't trackable or has no progress
        }
        
        const progress = userGameData[gameIdentifier];
        const completedLevels = progress.completedLevels ? Object.keys(progress.completedLevels).length : 0;
        const totalLevels = GAME_LEVEL_COUNTS[gameIdentifier];
        
        if (totalLevels === 0) return 0;

        return Math.round((completedLevels / totalLevels) * 100);
    };

    // --- THE FIX: Check for any progress data ---
    const isGameInProgress = (game) => {
        const gameIdentifier = game.gameUrl?.split('/').pop();
        if (!gameIdentifier || !userGameData[gameIdentifier]) return false;
        
        const progress = userGameData[gameIdentifier];
        const completedLevels = progress.completedLevels ? Object.keys(progress.completedLevels).length : 0;
        
        // A game is "in progress" if at least one level is done but not all
        const totalLevels = GAME_LEVEL_COUNTS[gameIdentifier] || 0;
        return completedLevels > 0 && completedLevels < totalLevels;
    };
    
    // --- THE FIX: Simplified startGame, no more timers ---
    const startGame = async (game) => {
        if (!game || !game._id) return;

        // Logic to add to playedGames list (existing)
        if (!playedGames.some(p => p._id === game._id)) {
            try {
                setPlayedGames(prev => [...prev, game]);
                await api('/users/me/played-games', 'POST', { gameId: game._id });
            } catch (error)
 {
                console.error("Failed to add to played games:", error);
                setPlayedGames(prev => prev.filter(p => p._id !== game._id));
            }
        }
    };

    const value = {
        savedGames,
        playedGames, // <-- Export new state
        saveGame,
        unsaveGame,
        isGameSaved,
        startGame,
        isGameInProgress,
        getGameProgress,
        fetchUserProgress, // <-- Expose fetch function for updates
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};