import { Connection, PublicKey } from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { createLogger } from '@ninjapay/logger';

const logger = createLogger('solana-token');

export class TokenUtils {
  /**
   * Get SPL token account for a wallet
   */
  static async getTokenAccount(
    connection: Connection,
    walletAddress: PublicKey,
    mintAddress: PublicKey,
    isToken2022: boolean = false
  ) {
    try {
      const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      const ata = await getAssociatedTokenAddress(
        mintAddress,
        walletAddress,
        false,
        programId
      );

      const account = await getAccount(connection, ata, undefined, programId);
      return account;
    } catch (error) {
      logger.error('Failed to get token account', {
        wallet: walletAddress.toString(),
        mint: mintAddress.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Get or create associated token account
   */
  static async getOrCreateAssociatedTokenAccount(
    connection: Connection,
    payer: PublicKey,
    mint: PublicKey,
    owner: PublicKey,
    isToken2022: boolean = false
  ) {
    const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

    const associatedToken = await getAssociatedTokenAddress(
      mint,
      owner,
      false,
      programId
    );

    try {
      const account = await getAccount(connection, associatedToken, undefined, programId);
      return { address: associatedToken, account };
    } catch (error) {
      // Account doesn't exist, need to create
      const instruction = createAssociatedTokenAccountInstruction(
        payer,
        associatedToken,
        owner,
        mint,
        programId
      );

      return {
        address: associatedToken,
        account: null,
        createInstruction: instruction,
      };
    }
  }

  /**
   * Get token balance
   */
  static async getTokenBalance(
    connection: Connection,
    tokenAccount: PublicKey
  ): Promise<bigint> {
    try {
      const account = await getAccount(connection, tokenAccount);
      return account.amount;
    } catch (error) {
      logger.error('Failed to get token balance', {
        tokenAccount: tokenAccount.toString(),
        error,
      });
      return BigInt(0);
    }
  }

  /**
   * Format token amount with decimals
   */
  static formatTokenAmount(amount: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;

    if (fractionalPart === BigInt(0)) {
      return wholePart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    return `${wholePart}.${fractionalStr}`.replace(/\.?0+$/, '');
  }

  /**
   * Parse token amount from string
   */
  static parseTokenAmount(amount: string, decimals: number): bigint {
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedFraction);
  }
}
