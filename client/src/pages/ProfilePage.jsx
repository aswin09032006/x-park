import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Award, Trash2 } from 'lucide-react';
import InfoField from '../components/InfoField';
import EditField from '../components/EditField';
import { getAvatarUrl } from '../utils/avatar';
import { logger } from '../services/logger';

const Achievements = ({ gameData }) => {
  // ... Achievement component logic remains the same
  return (
    <div>
      {gameData?.achievements?.length ? (
        gameData.achievements.map((ach, i) => (
          <div key={i} className="flex items-center mb-3">
            <Award className="text-primary mr-2" />
            <span>{ach.title}</span>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">No achievements yet.</p>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { user, fetchUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gameData, setGameData] = useState(null);
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState('initials');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        nickname: user.nickname || '',
        city: user.city || '',
        county: user.county || '',
        studentId: user.studentId || '',
        yearGroup: String(user.yearGroup ?? ''),
      });
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

  const previewUser = { ...user, avatar: { style: selectedAvatarStyle } };
  const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  return (
    <div className="bg-background text-foreground p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
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

        {/* Avatar + Basic Info */}
        <div className="flex items-start mb-10 pb-10 border-b border-border">
          <img
            src={getAvatarUrl(isEditing ? previewUser : user)}
            alt="User Avatar"
            className="h-24 w-24 rounded-full object-cover"
          />
          <div className="ml-6 flex-grow">
            <h2 className="text-2xl font-bold">
              {userFullName || user.username}
            </h2>
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

        {/* Editable / Read-only Sections */}
        {isEditing ? (
          <form onSubmit={handleSaveChanges}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              <EditField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
              <EditField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
              <EditField label="Nickname" name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Your public display name"/>
              <EditField label="City" name="city" value={formData.city} onChange={handleInputChange} />
              <EditField label="County" name="county" value={formData.county} onChange={handleInputChange} />
              {user.school && <InfoField label="School" value={user.school?.name} />}
              
              {user.role === 'student' && (
                <>
                  <EditField label="Student ID" name="studentId" value={formData.studentId} onChange={handleInputChange} />
                  <div className="mb-6">
                    <label htmlFor="yearGroup" className="block text-sm text-muted-foreground mb-2">
                      Year group
                    </label>
                    <select
                      id="yearGroup"
                      name="yearGroup"
                      value={formData.yearGroup}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    >
                      <option value="">Select Year...</option>
                      {Array.from({ length: 7 }, (_, i) => i + 7).map((year) => (
                        <option key={year} value={year}>
                          Year {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
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
              {/* --- THIS IS THE FIX: Removed Display Name, shows Nickname instead --- */}
              <InfoField label="Nickname" value={user.nickname} />
              <InfoField label="Email" value={user.email} canCopy />
              <InfoField label="City" value={user.city} />
              <InfoField label="County" value={user.county} />
              {user.school && <InfoField label="School" value={user.school?.name} />}

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
                  <Achievements gameData={gameData} />
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