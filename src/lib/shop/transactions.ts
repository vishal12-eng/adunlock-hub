// Transaction history and spending tracking - NO DATABASE REQUIRED

const TRANSACTIONS_KEY = 'adnexus_transactions';
const MAX_TRANSACTIONS = 100;

export type TransactionType = 
  | 'shop_purchase'
  | 'ad_discount'
  | 'daily_reward'
  | 'subscription_bonus'
  | 'referral_bonus'
  | 'welcome_bonus'
  | 'unlock_used'
  | 'coins_spent'
  | 'full_unlock'
  | 'ad_skip';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  coinsChange: number; // positive = earned, negative = spent
  unlockCardsChange: number; // positive = earned, negative = spent
  contentId?: string;
  contentTitle?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TransactionStats {
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  totalUnlockCardsEarned: number;
  totalUnlockCardsUsed: number;
  totalAdsDiscounted: number;
  shopPurchases: number;
  dailyRewardsClaimed: number;
}

function getTransactions(): Transaction[] {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return [];
}

function saveTransactions(transactions: Transaction[]): void {
  // Keep only the most recent transactions
  const trimmed = transactions.slice(-MAX_TRANSACTIONS);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(trimmed));
}

// Generate unique ID
function generateId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Add a new transaction
export function addTransaction(
  type: TransactionType,
  description: string,
  coinsChange: number,
  unlockCardsChange: number,
  contentId?: string,
  contentTitle?: string,
  metadata?: Record<string, unknown>
): Transaction {
  const transaction: Transaction = {
    id: generateId(),
    type,
    description,
    coinsChange,
    unlockCardsChange,
    contentId,
    contentTitle,
    timestamp: Date.now(),
    metadata,
  };
  
  const transactions = getTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);
  
  return transaction;
}

// Get recent transactions
export function getRecentTransactions(limit = 20): Transaction[] {
  const transactions = getTransactions();
  return transactions.slice(-limit).reverse();
}

// Get transactions by type
export function getTransactionsByType(type: TransactionType): Transaction[] {
  const transactions = getTransactions();
  return transactions.filter(t => t.type === type);
}

// Get transactions for a specific content
export function getTransactionsForContent(contentId: string): Transaction[] {
  const transactions = getTransactions();
  return transactions.filter(t => t.contentId === contentId);
}

// Get transaction statistics
export function getTransactionStats(): TransactionStats {
  const transactions = getTransactions();
  
  return {
    totalCoinsEarned: transactions
      .filter(t => t.coinsChange > 0)
      .reduce((sum, t) => sum + t.coinsChange, 0),
    totalCoinsSpent: Math.abs(transactions
      .filter(t => t.coinsChange < 0)
      .reduce((sum, t) => sum + t.coinsChange, 0)),
    totalUnlockCardsEarned: transactions
      .filter(t => t.unlockCardsChange > 0)
      .reduce((sum, t) => sum + t.unlockCardsChange, 0),
    totalUnlockCardsUsed: Math.abs(transactions
      .filter(t => t.unlockCardsChange < 0)
      .reduce((sum, t) => sum + t.unlockCardsChange, 0)),
    totalAdsDiscounted: transactions
      .filter(t => t.type === 'ad_discount')
      .reduce((sum, t) => sum + (t.metadata?.adsDiscounted as number || 0), 0),
    shopPurchases: transactions.filter(t => t.type === 'shop_purchase').length,
    dailyRewardsClaimed: transactions.filter(t => t.type === 'daily_reward').length,
  };
}

// Clear all transactions (admin only)
export function clearTransactions(): void {
  localStorage.removeItem(TRANSACTIONS_KEY);
}
