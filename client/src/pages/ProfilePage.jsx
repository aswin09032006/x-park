import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Award, Trash2 } from 'lucide-react';
import InfoField from '../components/InfoField';
import EditField from '../components/EditField';
import { getAvatarUrl } from '../utils/avatar';

// A component to render the achievements
const Achievements = ({ gameData }) => {
    const badgeColors = {
        bronze: 'text-orange-400',
        silver: 'text-gray-300',
        gold: 'text-yellow-400',
    };

    const hasAchievements = gameData && Object.keys(gameData).length > 0 && 
                            Object.values(gameData).some(game => game.badges && Object.keys(game.badges).length > 0);

    if (!hasAchievements) {
        return (
            <div className="text-center bg-secondary p-6 rounded-lg">
                <p className="text-muted-foreground">Play some games to earn badges and achievements!</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {Object.entries(gameData).map(([gameId, progress]) => {
                if (!progress.badges || Object.keys(progress.badges).length === 0) return null;

                return (
                    <div key={gameId}>
                        <h3 className="text-lg font-semibold capitalize mb-4">{gameId.replace(/([A-Z])/g, ' $1')}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Object.entries(progress.badges).map(([stage, badge]) => (
                                <div key={stage} className="bg-secondary p-4 rounded-lg flex flex-col items-center justify-center text-center">
                                    <Award size={40} className={badgeColors[badge.toLowerCase()] || 'text-foreground'} />
                                    <p className="font-bold mt-2 capitalize">{badge} Badge</p>
                                    <p className="text-sm text-muted-foreground capitalize">{stage}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
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
                displayName: user.displayName || '',
                city: user.city || '',
                county: user.county || '', // Changed from state to county
                school: user.school || '',
                studentId: user.studentId || '',
                yearGroup: String(user.yearGroup ?? ''),
            });

            setSelectedAvatarStyle(user.avatar?.style || 'initials');

            const fetchGameData = async () => {
                try {
                    const data = await api('/users/me/gamedata');
                    setGameData(data);
                } catch (err) {
                    console.error("Failed to fetch game data:", err);
                }
            };
            fetchGameData();
        }
    }, [user, isEditing]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        
        try {
            await api('/users/me/avatar', 'PUT', { style: selectedAvatarStyle });
            const payload = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== ''));
            await api('/users/me', 'PUT', payload);

            setSuccess('Profile updated successfully!');
            await fetchUser();
            setTimeout(() => {
                setIsEditing(false);
                setSuccess('');
            }, 1500);

        } catch (err) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAvatarPreference = async () => {
        if (!window.confirm('Are you sure you want to reset your avatar style to the default?')) return;
        setLoading(true);
        try {
            await api('/users/me/avatar', 'DELETE');
            await fetchUser();
            setSuccess('Avatar style reset.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    const handleCancel = () => { setIsEditing(false); setError(''); setSuccess(''); };

    if (!user) return <div className="p-8 text-foreground">Loading profile...</div>;

    const previewUser = { ...user, avatar: { style: selectedAvatarStyle } };
    const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    return (
        <div className="bg-background text-foreground p-8">
            <div className="mx-auto max-w-5xl">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold">Personal info</h1>
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-5 rounded-lg transition">Edit</button>}
                </div>

                <div className="flex items-start mb-10 pb-10 border-b border-border">
                    <img 
                        src={getAvatarUrl(isEditing ? previewUser : user)} 
                        alt="User Avatar" 
                        className="h-24 w-24 rounded-full object-cover" 
                    />
                    <div className="ml-6 flex-grow">
                        <h2 className="text-2xl font-bold">{userFullName || user.username}</h2>
                        <p className="text-muted-foreground">{user.email}</p>
                        
                        {isEditing && (
                            <div className="mt-4">
                                <label className="block text-sm text-muted-foreground mb-2">Avatar Style</label>
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => setSelectedAvatarStyle('initials')} className={`px-4 py-2 text-sm rounded-md border transition ${selectedAvatarStyle === 'initials' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border'}`}>
                                        Initials
                                    </button>
                                    <button type="button" onClick={() => setSelectedAvatarStyle('placeholder')} className={`px-4 py-2 text-sm rounded-md border transition ${selectedAvatarStyle === 'placeholder' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border'}`}>
                                        Placeholder
                                    </button>
                                    <button type="button" onClick={handleRemoveAvatarPreference} className="text-muted-foreground hover:text-destructive" title="Reset to default">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <form onSubmit={handleSaveChanges}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <EditField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                            <EditField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                            <EditField label="Display Name" name="displayName" value={formData.displayName} onChange={handleInputChange} />
                            <EditField label="City" name="city" value={formData.city} onChange={handleInputChange} />
                            <EditField label="County" name="county" value={formData.county} onChange={handleInputChange} /> {/* Changed label and name to County */}
                            <EditField label="School" name="school" value={formData.school} onChange={handleInputChange} />
                            <EditField label="Student ID" name="studentId" value={formData.studentId} onChange={handleInputChange} />
                            <div className="mb-6">
                                <label htmlFor="yearGroup" className="block text-sm text-muted-foreground mb-2">Year group</label>
                                <select
                                    id="yearGroup"
                                    name="yearGroup"
                                    value={formData.yearGroup}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                                >
                                    <option value="">Select Year...</option>
                                    {Array.from({ length: 7 }, (_, i) => i + 7).map(year => (
                                        <option key={year} value={year}>Year {year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {error && <p className="text-destructive text-sm text-center my-4">{error}</p>}
                        {success && <p className="text-green-500 text-sm text-center my-4">{success}</p>}
                        <div className="flex justify-end items-center gap-4 mt-8">
                            <button type="button" onClick={handleCancel} className="bg-secondary hover:bg-accent text-secondary-foreground font-bold py-2 px-5 rounded-lg transition">Cancel</button>
                            <button type="submit" disabled={loading} className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-2 px-5 rounded-lg transition disabled:opacity-50">
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <InfoField label="First Name" value={user.firstName} />
                            <InfoField label="Last Name" value={user.lastName} />
                            <InfoField label="Display Name" value={user.displayName || user.username} />
                            <InfoField label="Email" value={user.email} canCopy />
                            <InfoField label="City" value={user.city} />
                            <InfoField label="County" value={user.county} /> {/* Changed label to County */}
                            <InfoField label="School" value={user.school} />
                            <InfoField label="Student ID" value={user.studentId} canCopy />
                            <InfoField label="Year group" value={user.yearGroup} />
                        </div>
                        <div className="mt-12 pt-10 border-t border-border">
                            <h2 className="text-2xl font-bold mb-6">Achievements</h2>
                            {gameData ? <Achievements gameData={gameData} /> : <p className="text-muted-foreground">Loading achievements...</p>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;