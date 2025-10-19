import { Connection, PublicKey, LAMPORTS_PER_SOL, ParsedAccountData } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Solana RPC connection
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// Known token mint addresses on devnet
export const KNOWN_TOKENS = {
  USDC: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // USDC devnet
  USDT: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS', // USDT devnet (example)
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
};

/**
 * Get Solana connection instance
 */
export function getSolanaConnection(): Connection {
  return connection;
}

/**
 * Get SOL balance for a wallet address
 */
export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    return 0;
  }
}

/**
 * Get SPL token balance for a wallet address
 */
export async function getTokenBalance(
  walletAddress: string,
  tokenMintAddress: string
): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(tokenMintAddress);

    // Get all token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    // Find the account for this specific token
    for (const { account } of tokenAccounts.value) {
      const parsedData = account.data as ParsedAccountData;
      const mintAddress = parsedData.parsed.info.mint;

      if (mintAddress === tokenMintAddress) {
        const balance = parsedData.parsed.info.tokenAmount.uiAmount;
        return balance || 0;
      }
    }

    return 0;
  } catch (error) {
    console.error(`Error fetching token balance for ${tokenMintAddress}:`, error);
    return 0;
  }
}

/**
 * Get all token balances for a wallet
 */
export async function getAllTokenBalances(walletAddress: string): Promise<{
  SOL: number;
  USDC: number;
  USDT: number;
  [key: string]: number;
}> {
  try {
    const [solBalance, usdcBalance, usdtBalance] = await Promise.all([
      getSolBalance(walletAddress),
      getTokenBalance(walletAddress, KNOWN_TOKENS.USDC),
      getTokenBalance(walletAddress, KNOWN_TOKENS.USDT),
    ]);

    return {
      SOL: solBalance,
      USDC: usdcBalance,
      USDT: usdtBalance,
    };
  } catch (error) {
    console.error('Error fetching all token balances:', error);
    return {
      SOL: 0,
      USDC: 0,
      USDT: 0,
    };
  }
}

/**
 * Get recent transactions for a wallet address
 */
export async function getRecentTransactions(
  walletAddress: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const publicKey = new PublicKey(walletAddress);

    // Get confirmed signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit,
    });

    // Get transaction details for each signature
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx) return null;

          // Extract relevant info
          const blockTime = tx.blockTime;
          const status = tx.meta?.err ? 'failed' : 'confirmed';
          const fee = tx.meta?.fee || 0;

          // Try to determine transaction type and amount
          let type = 'unknown';
          let amount = 0;
          let token = 'SOL';
          let counterparty = '';

          // Check if this is a token transfer
          if (tx.meta?.postTokenBalances && tx.meta?.preTokenBalances) {
            const preBalance = tx.meta.preTokenBalances.find(
              (b) => b.owner === walletAddress
            );
            const postBalance = tx.meta.postTokenBalances.find(
              (b) => b.owner === walletAddress
            );

            if (preBalance && postBalance) {
              const preAmount = preBalance.uiTokenAmount.uiAmount || 0;
              const postAmount = postBalance.uiTokenAmount.uiAmount || 0;
              amount = Math.abs(postAmount - preAmount);
              type = postAmount > preAmount ? 'received' : 'sent';

              // Try to get token symbol (simplified)
              const mint = preBalance.mint;
              if (mint === KNOWN_TOKENS.USDC) token = 'USDC';
              else if (mint === KNOWN_TOKENS.USDT) token = 'USDT';
            }
          } else {
            // SOL transfer
            const preBalance = tx.meta?.preBalances?.[0] || 0;
            const postBalance = tx.meta?.postBalances?.[0] || 0;
            amount = Math.abs((postBalance - preBalance) / LAMPORTS_PER_SOL);
            type = postBalance > preBalance ? 'received' : 'sent';
          }

          return {
            signature: sig.signature,
            blockTime,
            status,
            type,
            amount,
            token,
            fee: fee / LAMPORTS_PER_SOL,
            slot: sig.slot,
          };
        } catch (err) {
          console.error('Error parsing transaction:', err);
          return null;
        }
      })
    );

    return transactions.filter((tx) => tx !== null);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Shorten wallet address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
