
export interface MealRecommendation {
  options: Array<{
    name: string;
    price: string;
    location: string;
    prepSteps?: string;
    nutrition: string;
    alternative?: string;
  }>;
  groundingSources?: any[];
}

export interface UserPreferences {
  budget: number;
  location: string;
  cookingAccess: 'none' | 'kettle' | 'full';
  dietary: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  VOICE = 'VOICE',
  CHAT = 'CHAT',
  PLANNER = 'PLANNER',
  VISION = 'VISION'
}
