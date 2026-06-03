export type ActivityKey =
  | 'grass' | 'washCar' | 'washing' | 'paint' | 'bbq'
  | 'dog' | 'jacket' | 'run' | 'windows' | 'plants'
  | 'camping' | 'hiking' | 'beach' | 'fishing' | 'golf' | 'cycling';

export type ActivityCategory = 'Garden' | 'Home' | 'Food & BBQ' | 'Travel' | 'Fitness' | 'Pets';

export interface Activity {
  key: ActivityKey;
  icon: string;
  label: string;
  question: string;
  category: ActivityCategory;
  description: string;
}

export type Period = 'today' | 'tomorrow' | 'weekend';

export type RegionKey = 'UK' | 'IE' | 'US' | 'CA' | 'AU' | 'NZ';
