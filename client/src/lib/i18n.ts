// Simple i18n implementation for Vora
// Languages: en (English), si (Sinhala), ta (Tamil)

type Language = 'en' | 'si' | 'ta';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.rooms': 'Rooms',
    'nav.profile': 'Profile',
    'nav.friends': 'Friends',
    'nav.analytics': 'Analytics',
    'nav.admin': 'Admin',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    
    // Rooms
    'rooms.title': 'Rooms',
    'rooms.create': 'Create Room',
    'rooms.join': 'Join Room',
    'rooms.name': 'Room Name',
    'rooms.description': 'Description',
    'rooms.private': 'Private',
    'rooms.public': 'Public',
    
    // Profile
    'profile.title': 'Profile',
    'profile.bio': 'Bio',
    'profile.university': 'University',
    'profile.timezone': 'Timezone',
    'profile.language': 'Language',
    
    // Tasks
    'tasks.title': 'Tasks',
    'tasks.create': 'Create Task',
    'tasks.assign': 'Assign To',
    'tasks.dueDate': 'Due Date',
    'tasks.priority': 'Priority',
    'tasks.tags': 'Tags',
    'tasks.comments': 'Comments',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.empty': 'No notifications',
    'notifications.markAllRead': 'Mark all as read',
  },
  si: {
    // Common
    'common.save': 'සුරකින්න',
    'common.cancel': 'අවලංගු කරන්න',
    'common.delete': 'මකන්න',
    'common.edit': 'සංස්කරණය',
    'common.loading': 'පූරණය වෙමින්...',
    'common.error': 'දෝෂය',
    'common.success': 'සාර්ථක',
    
    // Auth
    'auth.login': 'පිවිසෙන්න',
    'auth.logout': 'පිටවීම',
    'auth.register': 'ලියාපදිංචි වන්න',
    'auth.email': 'විද්‍යුත් තැපෑල',
    'auth.password': 'මුරපදය',
    
    // Navigation
    'nav.dashboard': 'උපකරණ පුවරුව',
    'nav.rooms': 'කාමර',
    'nav.profile': 'පැතිකඩ',
    'nav.friends': 'මිතුරන්',
    'nav.analytics': 'විශ්ලේෂණ',
    'nav.admin': 'පරිපාලක',
    
    // Dashboard
    'dashboard.title': 'උපකරණ පුවරුව',
    'dashboard.welcome': 'සාදරයෙන් පිළිගනිමු',
    
    // Rooms
    'rooms.title': 'කාමර',
    'rooms.create': 'කාමරයක් සාදන්න',
    'rooms.join': 'කාමරයට සම්බන්ධ වන්න',
    'rooms.name': 'කාමර නම',
    'rooms.description': 'විස්තර',
    'rooms.private': 'පෞද්ගලික',
    'rooms.public': 'මහජන',
    
    // Profile
    'profile.title': 'පැතිකඩ',
    'profile.bio': 'ජීවිත කථාව',
    'profile.university': 'විශ්ව විද්‍යාලය',
    'profile.timezone': 'වේලා කලාපය',
    'profile.language': 'භාෂාව',
    
    // Tasks
    'tasks.title': 'කාර්යයන්',
    'tasks.create': 'කාර්යයක් සාදන්න',
    'tasks.assign': 'වෙන් කරන්න',
    'tasks.dueDate': 'නියමිත දිනය',
    'tasks.priority': 'ප්‍රමුඛත්වය',
    'tasks.tags': 'ටැග්',
    'tasks.comments': 'අදහස්',
    
    // Notifications
    'notifications.title': 'දැනුම්දීම්',
    'notifications.empty': 'දැනුම්දීම් නොමැත',
    'notifications.markAllRead': 'සියල්ල කියවූ ලෙස සලකුණු කරන්න',
  },
  ta: {
    // Common
    'common.save': 'சேமி',
    'common.cancel': 'ரத்துசெய்',
    'common.delete': 'நீக்கு',
    'common.edit': 'திருத்து',
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'பிழை',
    'common.success': 'வெற்றி',
    
    // Auth
    'auth.login': 'உள்நுழை',
    'auth.logout': 'வெளியேறு',
    'auth.register': 'பதிவு செய்',
    'auth.email': 'மின்னஞ்சல்',
    'auth.password': 'கடவுச்சொல்',
    
    // Navigation
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.rooms': 'அறைகள்',
    'nav.profile': 'சுயவிவரம்',
    'nav.friends': 'நண்பர்கள்',
    'nav.analytics': 'பகுப்பாய்வு',
    'nav.admin': 'நிர்வாகி',
    
    // Dashboard
    'dashboard.title': 'டாஷ்போர்டு',
    'dashboard.welcome': 'வரவேற்கிறோம்',
    
    // Rooms
    'rooms.title': 'அறைகள்',
    'rooms.create': 'அறையை உருவாக்க',
    'rooms.join': 'அறையில் சேர',
    'rooms.name': 'அறை பெயர்',
    'rooms.description': 'விளக்கம்',
    'rooms.private': 'தனியார்',
    'rooms.public': 'பொது',
    
    // Profile
    'profile.title': 'சுயவிவரம்',
    'profile.bio': 'வாழ்க்கை வரலாறு',
    'profile.university': 'பல்கலைக்கழகம்',
    'profile.timezone': 'நேர மண்டலம்',
    'profile.language': 'மொழி',
    
    // Tasks
    'tasks.title': 'பணிகள்',
    'tasks.create': 'பணியை உருவாக்க',
    'tasks.assign': 'நியமி',
    'tasks.dueDate': 'காலக்கெடு',
    'tasks.priority': 'முன்னுரிமை',
    'tasks.tags': 'குறிச்சொற்கள்',
    'tasks.comments': 'கருத்துகள்',
    
    // Notifications
    'notifications.title': 'அறிவிப்புகள்',
    'notifications.empty': 'அறிவிப்புகள் இல்லை',
    'notifications.markAllRead': 'அனைத்தையும் படித்ததாகக் குறிக்க',
  },
};

let currentLanguage: Language = 'en';

export const i18n = {
  getLanguage: (): Language => {
    const stored = localStorage.getItem('language') as Language;
    return stored && ['en', 'si', 'ta'].includes(stored) ? stored : 'en';
  },
  
  setLanguage: (lang: Language): void => {
    if (['en', 'si', 'ta'].includes(lang)) {
      currentLanguage = lang;
      localStorage.setItem('language', lang);
    }
  },
  
  t: (key: string, fallback?: string): string => {
    const lang = currentLanguage;
    return translations[lang]?.[key] || fallback || key;
  },
  
  getCurrentLanguage: (): Language => currentLanguage,
};

// Initialize from localStorage
currentLanguage = i18n.getLanguage();

