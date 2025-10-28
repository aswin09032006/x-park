<<<<<<< HEAD
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const GameContext = createContext();
export const useGames = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // --- SAVED GAMES STATE (FETCHED FROM BACKEND) ---
    const [savedGames, setSavedGames] = useState([]);

    const fetchSavedGames = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const gamesData = await api('/users/me/saved-games');
            setSavedGames(gamesData);
        } catch (error) {
            console.error("Failed to fetch saved games:", error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSavedGames();
        } else {
            setSavedGames([]); // Clear games on logout
        }
    }, [isAuthenticated, fetchSavedGames]);
    
    const saveGame = async (game) => {
        try {
            // Optimistic Update: Add to state immediately for a responsive UI
            setSavedGames((prevGames) => {
                if (prevGames.find(g => g._id === game._id)) return prevGames;
                return [...prevGames, game];
            });
            await api('/users/me/saved-games', 'POST', { gameId: game._id });
        } catch (error) {
            console.error("Failed to save game:", error);
            // Revert on API failure
            setSavedGames((prev) => prev.filter((g) => g._id !== game._id));
        }
    };
    
    const unsaveGame = async (gameId) => {
        const originalState = savedGames;
        try {
            // Optimistic Update: Remove from state immediately
            setSavedGames((prev) => prev.filter((game) => game._id !== gameId));
            await api(`/users/me/saved-games/${gameId}`, 'DELETE');
        } catch (error) {
            console.error("Failed to unsave game:", error);
            // Revert on API failure
            setSavedGames(originalState);
        }
    };

    const isGameSaved = (gameId) => !!savedGames.find(game => game._id === gameId);

    // --- GAME PROGRESS STATE (remains in localStorage) ---
    const [gameProgress, setGameProgress] = useState(() => {
        try {
            const items = window.localStorage.getItem('gameProgress');
            return items ? JSON.parse(items) : {};
        } catch (error) {
            console.error("Could not parse game progress from localStorage", error);
            return {};
        }
    });
    
    const activeTimers = useRef({});

    useEffect(() => {
        window.localStorage.setItem('gameProgress', JSON.stringify(gameProgress));
    }, [gameProgress]);

    const updateGameProgress = (gameId, newProgress) => {
        setGameProgress(prev => ({
            ...prev,
            [gameId]: Math.min(newProgress, 100)
        }));
    };

    const startGame = (gameId) => {
        if (gameProgress[gameId] === undefined) {
            updateGameProgress(gameId, 0);
        }
        if (activeTimers.current[gameId]) clearInterval(activeTimers.current[gameId]);

        activeTimers.current[gameId] = setInterval(() => {
            setGameProgress(currentProgress => {
                const progress = currentProgress[gameId] || 0;
                if (progress >= 100) {
                    clearInterval(activeTimers.current[gameId]);
                    delete activeTimers.current[gameId];
                    return currentProgress;
                }
                const newProgress = progress + 5;
                return { ...currentProgress, [gameId]: Math.min(newProgress, 100) };
            });
        }, 2000);
    };

    const stopGame = (gameId) => {
        if (activeTimers.current[gameId]) {
            clearInterval(activeTimers.current[gameId]);
            delete activeTimers.current[gameId];
        }
    };
    
    const isGameInProgress = (gameId) => gameProgress[gameId] !== undefined;
    const getGameProgress = (gameId) => gameProgress[gameId] || 0;

    useEffect(() => {
        const timers = activeTimers.current;
        return () => {
            Object.values(timers).forEach(clearInterval);
        };
    }, []);

    const value = {
        savedGames,
        saveGame,
        unsaveGame,
        isGameSaved,
        gameProgress,
        startGame,
        stopGame,
        updateGameProgress,
        isGameInProgress,
        getGameProgress,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
=======
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const GameContext = createContext();
export const useGames = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // --- SAVED GAMES STATE (FETCHED FROM BACKEND) ---
    const [savedGames, setSavedGames] = useState([]);

    const fetchSavedGames = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const gamesData = await api('/users/me/saved-games');
            setSavedGames(gamesData);
        } catch (error) {
            console.error("Failed to fetch saved games:", error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSavedGames();
        } else {
            setSavedGames([]); // Clear games on logout
        }
    }, [isAuthenticated, fetchSavedGames]);
    
    const saveGame = async (game) => {
        try {
            // Optimistic Update: Add to state immediately for a responsive UI
            setSavedGames((prevGames) => {
                if (prevGames.find(g => g._id === game._id)) return prevGames;
                return [...prevGames, game];
            });
            await api('/users/me/saved-games', 'POST', { gameId: game._id });
        } catch (error) {
            console.error("Failed to save game:", error);
            // Revert on API failure
            setSavedGames((prev) => prev.filter((g) => g._id !== game._id));
        }
    };
    
    const unsaveGame = async (gameId) => {
        const originalState = savedGames;
        try {
            // Optimistic Update: Remove from state immediately
            setSavedGames((prev) => prev.filter((game) => game._id !== gameId));
            await api(`/users/me/saved-games/${gameId}`, 'DELETE');
        } catch (error) {
            console.error("Failed to unsave game:", error);
            // Revert on API failure
            setSavedGames(originalState);
        }
    };

    const isGameSaved = (gameId) => !!savedGames.find(game => game._id === gameId);

    // --- GAME PROGRESS STATE (remains in localStorage) ---
    const [gameProgress, setGameProgress] = useState(() => {
        try {
            const items = window.localStorage.getItem('gameProgress');
            return items ? JSON.parse(items) : {};
        } catch (error) {
            console.error("Could not parse game progress from localStorage", error);
            return {};
        }
    });
    
    const activeTimers = useRef({});

    useEffect(() => {
        window.localStorage.setItem('gameProgress', JSON.stringify(gameProgress));
    }, [gameProgress]);

    const updateGameProgress = (gameId, newProgress) => {
        setGameProgress(prev => ({
            ...prev,
            [gameId]: Math.min(newProgress, 100)
        }));
    };

    const startGame = (gameId) => {
        if (gameProgress[gameId] === undefined) {
            updateGameProgress(gameId, 0);
        }
        if (activeTimers.current[gameId]) clearInterval(activeTimers.current[gameId]);

        activeTimers.current[gameId] = setInterval(() => {
            setGameProgress(currentProgress => {
                const progress = currentProgress[gameId] || 0;
                if (progress >= 100) {
                    clearInterval(activeTimers.current[gameId]);
                    delete activeTimers.current[gameId];
                    return currentProgress;
                }
                const newProgress = progress + 5;
                return { ...currentProgress, [gameId]: Math.min(newProgress, 100) };
            });
        }, 2000);
    };

    const stopGame = (gameId) => {
        if (activeTimers.current[gameId]) {
            clearInterval(activeTimers.current[gameId]);
            delete activeTimers.current[gameId];
        }
    };
    
    const isGameInProgress = (gameId) => gameProgress[gameId] !== undefined;
    const getGameProgress = (gameId) => gameProgress[gameId] || 0;

    useEffect(() => {
        const timers = activeTimers.current;
        return () => {
            Object.values(timers).forEach(clearInterval);
        };
    }, []);

    const value = {
        savedGames,
        saveGame,
        unsaveGame,
        isGameSaved,
        gameProgress,
        startGame,
        stopGame,
        updateGameProgress,
        isGameInProgress,
        getGameProgress,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
>>>>>>> a82808b71a06082732bf9b4ec76ae7f852ab2cb3
};