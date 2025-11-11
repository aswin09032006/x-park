// --- /frontend/src/pages/ProfilePage.jsx ---
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGames } from '../context/GameContext';
import { api } from '../services/api';
import { Award, Trash2 } from 'lucide-react';
import InfoField from '../components/InfoField';
import EditField from '../components/EditField';
import { getAvatarUrl } from '../utils/avatar';
import { logger } from '../services/logger';

const Achievements = ({ gameData, allGames }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);

  const badgeStyles = {
    bronze: {
      bg: 'bg-orange-200',
      text: 'text-orange-800',
      emoji: '🥉',
      label: 'Bronze',
    },
    silver: {
      bg: 'bg-gray-200',
      text: 'text-gray-800',
      emoji: '🥈',
      label: 'Silver',
    },
    gold: {
      bg: 'bg-yellow-200',
      text: 'text-yellow-800',
      emoji: '🥇',
      label: 'Gold',
    },
  };

  const badgeTypeMap = {
    1: 'bronze',
    2: 'silver',
    3: 'gold',
    bronze: 'bronze',
    silver: 'silver',
    gold: 'gold',
  };

  const gameTitleMap = useMemo(() => {
    const map = new Map();
    if (!allGames) return map;
    allGames.forEach(game => {
      map.set(game._id.toString(), game.title);
    });
    return map;
  }, [allGames]);

  const badges = useMemo(() => {
    const collected = [];
    if (!gameData || !gameTitleMap.size) return [];
    for (const [gameId, progress] of Object.entries(gameData)) {
      if (progress.badges) {
        for (const [level, value] of Object.entries(progress.badges)) {
          if (value && value !== "0") {
            const type = badgeTypeMap[value.toLowerCase?.() || value] || 'unknown';
            collected.push({
              id: `${gameId}-${level}`,
              gameTitle: gameTitleMap.get(gameId) || 'Unknown Game',
              badgeType: type,
              level,
            });
          }
        }
      }
    }
    return collected;
  }, [gameData, gameTitleMap]);

  if (badges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-5xl mb-3 opacity-60">🏆</div>
        <h3 className="text-lg font-semibold text-slate-700">No achievements yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          Complete challenges to earn your first badge!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {badges.length} {badges.length === 1 ? 'badge' : 'badges'} earned
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map(badge => {
          const style = badgeStyles[badge.badgeType] || {
            bg: 'bg-gray-200',
            text: 'text-gray-700',
            emoji: '🏅',
            label: 'Unknown',
          };

          const isSelected = selectedBadge?.id === badge.id;

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(isSelected ? null : badge)}
              className={`rounded-lg p-4 border cursor-pointer transition ${
                isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-full ${style.bg} ${style.text} text-3xl`}
                >
                  {style.emoji}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-gray-200">{style.label} Badge</h3>
                  <p className="text-sm text-slate-600">{badge.gameTitle}</p>
                  <p className="text-xs text-slate-500">Level {badge.level}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, fetchUser } = useAuth();
  const { allGames } = useGames();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gameData, setGameData] = useState(null);
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState('initials');

  useEffect(() => {
    if (user) {
      // --- THIS IS THE FIX (Part 1): Conditionally set yearGroup in form state ---
      const initialFormData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        nickname: user.nickname || '',
        city: user.city || '',
        county: user.county || '',
      };

      if (user.role === 'student') {
        initialFormData.yearGroup = String(user.yearGroup ?? '');
      }
      
      setFormData(initialFormData);
      setSelectedAvatarStyle(user.avatar?.style || 'initials');

      if (user.role === 'student') {
        const fetchGameData = async () => {
          try {
            const data = await api('/users/me/gamedata');
            setGameData(data);
          } catch (err) {
            logger.error('Failed to fetch game data for profile.', {
              context: 'ProfilePage',
              details: { error: err.message },
            });
          }
        };
        fetchGameData();
      }
    }
  }, [user, isEditing]);

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    const context = 'ProfilePage.handleSaveChanges';
    logger.startNewTrace();

    setLoading(true);
    setError('');
    setSuccess('');
    logger.info('Attempting to save profile changes.', { context });

    try {
      await api('/users/me/avatar', 'PUT', { style: selectedAvatarStyle });
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '')
      );
      await api('/users/me', 'PUT', payload);

      setSuccess('Profile updated successfully!');
      await fetchUser();
      setTimeout(() => {
        setIsEditing(false);
        setSuccess('');
      }, 1500);

      logger.success('Profile updated successfully.', { context });
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
      logger.error('Failed to update profile.', {
        context,
        details: { error: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatarPreference = async () => {
    const context = 'ProfilePage.handleRemoveAvatarPreference';
    logger.startNewTrace();

    if (!window.confirm('Are you sure you want to reset your avatar style to the default?'))
      return;

    setLoading(true);
    logger.info('Attempting to reset avatar preference.', { context });

    try {
      await api('/users/me/avatar', 'DELETE');
      await fetchUser();
      setSuccess('Avatar style reset.');
      logger.success('Avatar preference reset successfully.', { context });
    } catch (err) {
      setError(err.message);
      logger.error('Failed to reset avatar preference.', {
        context,
        details: { error: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (!user) return <div className="p-8 text-foreground">Loading profile...</div>;

  const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const displayName = user.nickname || userFullName || user.username;
  const previewUser = { ...user, avatar: { style: selectedAvatarStyle } };

  return (
    <div className="bg-background text-foreground p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Personal info</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-5 rounded-lg transition"
            >
              Edit
            </button>
          )}
        </div>

        <div className="flex items-start mb-10 pb-10 border-b border-border">
          <img
            src={getAvatarUrl(isEditing ? previewUser : user)}
            alt="User Avatar"
            className="h-24 w-24 rounded-full object-cover"
          />
          <div className="ml-6 flex-grow">
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-muted-foreground">{user.email}</p>

            {isEditing && (
              <div className="mt-4">
                <label className="block text-sm text-muted-foreground mb-2">
                  Avatar Style
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedAvatarStyle('initials')}
                    className={`px-4 py-2 text-sm rounded-md border transition ${
                      selectedAvatarStyle === 'initials'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary border-border'
                    }`}
                  >
                    Initials
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAvatarStyle('placeholder')}
                    className={`px-4 py-2 text-sm rounded-md border transition ${
                      selectedAvatarStyle === 'placeholder'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary border-border'
                    }`}
                  >
                    Placeholder
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAvatarPreference}
                    className="text-muted-foreground hover:text-destructive"
                    title="Reset to default"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveChanges}>
            {/* --- THIS IS THE FIX (Part 2): Remove yearGroup from admin edit form --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                {user.role === 'student' ? (
                    <>
                        {/* Student View: Names & Year Group are read-only */}
                        <InfoField label="First Name" value={user.firstName} />
                        <InfoField label="Last Name" value={user.lastName} />
                        
                        {/* Student View: Nickname is editable */}
                        <EditField label="Nickname" name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Your public display name"/>
                        
                        <InfoField label="Year group" value={user.yearGroup} />
                    </>
                ) : (
                    <>
                        {/* Admin/Other View: All fields are editable */}
                        <EditField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                        <EditField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                        <EditField label="Nickname" name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Your public display name"/>
                        {/* Year group selector is now removed for non-students */}
                    </>
                )}

                <InfoField label="School" value={user.school?.name} />
                <InfoField label="City" value={user.school?.city} />
                <InfoField label="County" value={user.school?.county} />
                {/* {user.role === 'student' && <InfoField label="Student ID" value={user.studentId} canCopy />} */}
            </div>


            {error && <p className="text-destructive text-sm text-center my-4">{error}</p>}
            {success && <p className="text-green-500 text-sm text-center my-4">{success}</p>}

            <div className="flex justify-end items-center gap-4 mt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-secondary hover:bg-accent text-secondary-foreground font-bold py-2 px-5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              <InfoField label="First Name" value={user.firstName} />
              <InfoField label="Last Name" value={user.lastName} />
              <InfoField label="Nickname" value={user.nickname} />
              <InfoField label="Email" value={user.email} canCopy />
              <InfoField label="School" value={user.school?.name} />
              <InfoField label="City" value={user.school?.city} />
              <InfoField label="County" value={user.school?.county} />
              
              {/* --- THIS IS THE FIX (Part 3): Conditionally show yearGroup in view mode --- */}
              {user.role === 'student' && (
                <>
                  <InfoField label="Student ID" value={user.studentId} canCopy />
                  <InfoField label="Year group" value={user.yearGroup} />
                </>
              )}
            </div>

            {user.role === 'student' && (
              <div className="mt-12 pt-10 border-t border-border">
                <h2 className="text-2xl font-bold mb-6">Achievements</h2>
                {gameData ? (
                  <Achievements gameData={gameData} allGames={allGames} />
                ) : (
                  <p className="text-muted-foreground">Loading achievements...</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
