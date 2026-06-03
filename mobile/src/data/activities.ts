import { Activity, ActivityKey } from '../types/activities';

export const ACTIVITIES: Activity[] = [
  // Garden
  { key: 'grass', icon: '🌱', label: 'Cut grass', question: 'Should I cut the grass today?', category: 'Garden', description: 'Mowing and lawn care' },
  { key: 'plants', icon: '💧', label: 'Water plants', question: 'Should I water my plants today?', category: 'Garden', description: 'Pots, beds and baskets' },
  // Home
  { key: 'washing', icon: '👕', label: 'Hang washing', question: 'Can I hang washing out today?', category: 'Home', description: 'Outdoor laundry drying' },
  { key: 'washCar', icon: '🚗', label: 'Wash car', question: 'Should I wash my car today?', category: 'Home', description: 'Car and vehicle washing' },
  { key: 'paint', icon: '🎨', label: 'Paint outside', question: 'Should I paint outside today?', category: 'Home', description: 'Outdoor painting and decorating' },
  { key: 'windows', icon: '🪟', label: 'Clean windows', question: 'Should I clean the windows today?', category: 'Home', description: 'Window and glass cleaning' },
  // Food & BBQ
  { key: 'bbq', icon: '🔥', label: 'BBQ', question: 'Should I BBQ today?', category: 'Food & BBQ', description: 'Outdoor cooking and grilling' },
  // Travel
  { key: 'camping', icon: '⛺', label: 'Go camping', question: 'Should I go camping today?', category: 'Travel', description: 'Camping and overnight outdoors' },
  { key: 'hiking', icon: '🥾', label: 'Go hiking', question: 'Should I go hiking today?', category: 'Travel', description: 'Trails and hillwalking' },
  { key: 'beach', icon: '🏖️', label: 'Beach', question: 'Should I go to the beach today?', category: 'Travel', description: 'Beach and coastal visits' },
  { key: 'fishing', icon: '🎣', label: 'Go fishing', question: 'Should I go fishing today?', category: 'Travel', description: 'Fishing and angling' },
  // Fitness
  { key: 'run', icon: '🏃', label: 'Go running', question: 'Should I go for a run today?', category: 'Fitness', description: 'Running and jogging' },
  { key: 'cycling', icon: '🚲', label: 'Go cycling', question: 'Should I go cycling today?', category: 'Fitness', description: 'Cycling and biking' },
  { key: 'golf', icon: '⛳', label: 'Play golf', question: 'Should I play golf today?', category: 'Fitness', description: 'Golf and outdoor sport' },
  // Pets
  { key: 'dog', icon: '🐕', label: 'Walk dog', question: 'Should I walk the dog today?', category: 'Pets', description: 'Dog walks and outdoor pet time' },
  // Home (jacket)
  { key: 'jacket', icon: '🧥', label: 'Need a coat?', question: 'Do I need a coat today?', category: 'Home', description: 'Coat and layer check' },
];

export const CATEGORIES: ActivityKey[][] = [
  // grouped by category for display
  ['grass', 'plants'],
  ['washing', 'washCar', 'paint', 'windows', 'jacket'],
  ['bbq'],
  ['camping', 'hiking', 'beach', 'fishing'],
  ['run', 'cycling', 'golf'],
  ['dog'],
];

export const CATEGORY_LABELS = ['Garden', 'Home', 'Food & BBQ', 'Travel', 'Fitness', 'Pets'];

export function getActivity(key: ActivityKey): Activity {
  return ACTIVITIES.find(a => a.key === key) ?? ACTIVITIES[0];
}
