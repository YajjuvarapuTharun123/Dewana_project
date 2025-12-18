import { supabase } from "@/integrations/supabase/client";

export const generateUniqueSlug = (eventName: string): string => {
  let baseSlug = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Add random suffix for uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

export const getEventTypeEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    'wedding': '🎊',
    'birthday': '🎂',
    'festival': '🪔',
    'graduation': '🎓',
    'baby-shower': '👶',
    'corporate': '💼',
    'other': '🎉'
  };
  return emojis[type] || '🎉';
};

export const getEventTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'wedding': 'Wedding / Shaadi',
    'birthday': 'Birthday',
    'festival': 'Festival Celebration',
    'graduation': 'Graduation',
    'baby-shower': 'Baby Shower',
    'corporate': 'Corporate Event',
    'other': 'Other'
  };
  return labels[type] || 'Event';
};

export const dressCodeOptions = [
  { value: 'traditional', label: 'Traditional / Indian' },
  { value: 'semi-formal', label: 'Semi-Formal' },
  { value: 'formal', label: 'Formal / Western' },
  { value: 'casual', label: 'Casual' },
  { value: 'theme', label: 'Theme Based' },
  { value: 'any', label: 'Any / Comfortable' },
];

export const mealPreferenceOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non-veg', label: 'Non-Vegetarian' },
  { value: 'jain', label: 'Jain' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'eggetarian', label: 'Eggetarian' },
];

export const subEventTemplates = [
  { name: 'Haldi Ceremony', type: 'wedding' },
  { name: 'Mehendi Ceremony', type: 'wedding' },
  { name: 'Sangeet Night', type: 'wedding' },
  { name: 'Wedding Ceremony', type: 'wedding' },
  { name: 'Reception', type: 'wedding' },
  { name: 'Baraat', type: 'wedding' },
  { name: 'Pheras', type: 'wedding' },
  { name: 'Vidaai', type: 'wedding' },
];
