// A simple hashing function to get a color from a string
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

// A function to get contrasting text color (black or white)
const getContrastColor = (hexColor) => {
  if (hexColor.startsWith('#')) {
    hexColor = hexColor.slice(1);
  }
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

export const getAvatarUrl = (user) => {
    if (!user) return `https://i.pravatar.cc/150`;

    // --- UPDATED: Handle firstName and lastName ---
    const { firstName, lastName, username, email, avatar } = user;
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    
    // Use Pravatar for placeholder style or if no name/username is available
    if (avatar?.style === 'placeholder' || (!fullName && !username)) {
        // Use email or a random string for a consistent but unique placeholder
        return `https://i.pravatar.cc/150?u=${email || Math.random()}`;
    }

    // Generate initials-based avatar
    const nameForInitials = fullName || username;
    const initials = nameForInitials
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const bgColor = stringToColor(nameForInitials);
    const textColor = getContrastColor(bgColor);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <rect width="100%" height="100%" fill="${bgColor}" />
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="60" fill="${textColor}" text-anchor="middle" dy=".3em">
          ${initials}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
};