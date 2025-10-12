export interface User {
  id: string;
  walletAddress: string;
  arciumKeyId: string; // Reference to MPC key shares
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  userId: string;
  walletAddress: string;
  arciumKeyId: string;
  expiresAt: number;
}

export interface RewardAccount {
  id: string;
  userId: string;
  pointsBalance: number;
  lifetimePoints: number;
  currentStreak: number;
  longestStreak: number;
  referralCode: string;
}
