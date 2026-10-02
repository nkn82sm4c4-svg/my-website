export type GameId = 
  | 'wheel' 
  | 'scratch' 
  | 'mystery' 
  | 'slot' 
  | 'memory' 
  | 'streak' 
  | 'guess' 
  | 'progress';

export interface Prize {
  id: string;
  name: string;
  type: 'cashback' | 'free_meal' | 'discount' | 'free_drink' | 'dessert' | 'none';
  icon: string;
  code?: string;
  color: string;
  valueText: string;
}

export interface GameDefinition {
  id: GameId;
  title: string;
  shortDesc: string;
  longDesc: string;
  iconName: string;
  accentColor: string;
  badge: string;
  estimatedConversion: string;
  idealFor: string;
  businessBenefit: string;
}

export type FeedbackStatus = 'liked' | 'disliked' | null;

export interface OwnerFeedbackState {
  [gameId: string]: FeedbackStatus;
}
