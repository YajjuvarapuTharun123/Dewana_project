export const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // Handle various YouTube URL formats
    // Standard: https://www.youtube.com/watch?v=VIDEO_ID
    // Short: https://youtu.be/VIDEO_ID
    // Embed: https://www.youtube.com/embed/VIDEO_ID
    // Shorts: https://www.youtube.com/shorts/VIDEO_ID

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=0&controls=1&rel=0`;
    }

    return null;
};

export const getInstagramEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // Instagram embeds usually require the /embed suffix
    // e.g. https://www.instagram.com/p/CODE/embed
    // or https://www.instagram.com/reel/CODE/embed

    try {
        const urlObj = new URL(url);
        // Remove query params
        urlObj.search = '';

        // Ensure it ends with /
        let cleanUrl = urlObj.toString();
        if (!cleanUrl.endsWith('/')) {
            cleanUrl += '/';
        }

        return `${cleanUrl}embed`;
    } catch (e) {
        return null;
    }
};

export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

export const isYoutubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
};

export const isInstagramUrl = (url: string): boolean => {
    return url.includes('instagram.com');
};

// Check if URL is a YouTube video (embeddable)
export const isYouTubeVideoUrl = (url: string): boolean => {
    if (!url) return false;
    // Video patterns: watch?v=, youtu.be/, embed/, shorts/
    const videoPattern = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]{11}).*/;
    return videoPattern.test(url);
};

// Check if URL is a YouTube channel/profile (not embeddable)
export const isYouTubeChannelUrl = (url: string): boolean => {
    if (!url) return false;
    // Channel patterns: @username, /channel/, /c/, /user/
    const channelPattern = /(youtube\.com\/@|youtube\.com\/channel\/|youtube\.com\/c\/|youtube\.com\/user\/)/;
    return channelPattern.test(url);
};

// Check if URL is an Instagram post/reel (potentially embeddable)
export const isInstagramPostUrl = (url: string): boolean => {
    if (!url) return false;
    // Post patterns: /p/, /reel/, /reels/, /tv/
    const postPattern = /instagram\.com\/(p|reel|reels|tv)\//;
    return postPattern.test(url);
};

// Check if URL is an Instagram profile (not embeddable)
export const isInstagramProfileUrl = (url: string): boolean => {
    if (!url) return false;
    // Profile: instagram.com/username (no /p/, /reel/, etc.)
    if (!url.includes('instagram.com')) return false;
    const postPattern = /instagram\.com\/(p|reel|reels|tv|explore|stories)\//;
    if (postPattern.test(url)) return false;
    // Likely a profile
    return true;
};

// Check if URL is a Google Photos link
export const isGooglePhotosUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('photos.google.com') || url.includes('photos.app.goo.gl');
};

