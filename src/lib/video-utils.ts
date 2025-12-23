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
