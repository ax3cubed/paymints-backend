import { NotFoundError } from '../core/errors';
import { logger } from '../core/logger';
import config from '@/config';
import { address, createSolanaRpcFromTransport, TransactionError } from '@solana/kit';
import { PublicKey, SystemProgram } from '@solana/web3.js';
// @ts-ignore
import BN from 'bn.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface TransactionResponse {
  signature: string;
  slot: number;
  error: TransactionError | null;
  blockTime: number | null;
  sender: string | null;
  recipient: string | null;
  amount: string | null; // changed from number | null
  tokenMint?: string | null;
}

// Helper to convert lamports (string) to SOL (string, up to 9 decimals, no trailing zeros)
function lamportsToSolString(lamports: string): string {
  const LAMPORTS_PER_SOL = 1_000_000_000n;
  const lamportsBigInt = BigInt(lamports);
  const solInt = lamportsBigInt / LAMPORTS_PER_SOL;
  const solFrac = lamportsBigInt % LAMPORTS_PER_SOL;
  if (solFrac === 0n) return solInt.toString();
  // Pad fractional part to 9 digits
  let fracStr = solFrac.toString().padStart(9, '0');
  // Remove trailing zeros
  fracStr = fracStr.replace(/0+$/, '');
  return `${solInt.toString()}.${fracStr}`;
}

export class TransactionService {
  /**
   * Get recent transactions for a wallet address
   *
   * @param walletAddress - Solana wallet address (base58-encoded)
   * @returns List of transaction details
   */
  async getTransactions(walletAddress: string): Promise<TransactionResponse[]> {
    try {
      // Validate wallet address
      try {
        address(walletAddress);
      } catch (err) {
        throw new NotFoundError('Invalid wallet address');
      }

      // Initialize connection
      const addr = address(walletAddress)
      const conns = createSolanaRpcFromTransport(config.primaryTokens.transport)
      const signatures = conns.getSignaturesForAddress(addr)
      const allSignature = await signatures.send()

      // Fetch and parse transactions
      const fetchedTxns = await Promise.all(
        allSignature.map(async (sig: any) => {
          try {
            const txs = conns.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            })
            const tx = await txs.send()
            if (!tx) return null;

            let sender: string | null = null;
            let recipient: string | null = null;
            let amount: string | null = null;
            let tokenMint: string | null = null;

            const instructions = tx?.transaction?.message?.instructions || [];
            const accountKeys = tx?.transaction?.message?.accountKeys || [];

            for (const ix of instructions) {
              const programId = typeof accountKeys[ix.programIdIndex] === 'string'
                ? accountKeys[ix.programIdIndex]
                : accountKeys[ix.programIdIndex]?.toString();
              // System transfer (SOL)
              if (programId === SystemProgram.programId.toBase58()) {
                // System transfer: decode data
                if (ix.data && ix.data.length >= 16 && ix.accounts.length >= 2) {
                  sender = typeof accountKeys[ix.accounts[0]] === 'string'
                    ? accountKeys[ix.accounts[0]]
                    : accountKeys[ix.accounts[0]]?.toString();
                  recipient = typeof accountKeys[ix.accounts[1]] === 'string'
                    ? accountKeys[ix.accounts[1]]
                    : accountKeys[ix.accounts[1]]?.toString();
                  // lamports: bytes 4-11 (8 bytes LE)
                  const dataBuf = Buffer.from(ix.data, 'base64');
                  const lamports = new BN(dataBuf.slice(4, 12), 'le');
                  amount = lamportsToSolString(lamports.toString()); // precise SOL string
                  tokenMint = null;
                  break;
                }
              }
              // SPL Token transfer
              if (programId === TOKEN_PROGRAM_ID.toBase58()) {
                // SPL Token transfer: decode data
                if (ix.data && ix.accounts.length >= 3) {
                  const dataBuf = Buffer.from(ix.data, 'base64');
                  // 1: transfer, 12: transferChecked
                  const instructionType = dataBuf[0];
                  if ((instructionType === 1 || instructionType === 12)) {
                    // transfer: 1 byte (instruction) + 8 bytes (amount)
                    sender = typeof accountKeys[ix.accounts[2]] === 'string'
                      ? accountKeys[ix.accounts[2]]
                      : accountKeys[ix.accounts[2]]?.toString();
                    recipient = typeof accountKeys[ix.accounts[1]] === 'string'
                      ? accountKeys[ix.accounts[1]]
                      : accountKeys[ix.accounts[1]]?.toString();
                    const mintIdx = ix.accounts[0];
                    tokenMint = String(accountKeys[mintIdx]);
                    const amountRaw = dataBuf.slice(1, 9);
                    amount = new BN(amountRaw, 'le').toString(); // return as string
                    break;
                  }
                }
              }
            }

            return {
              signature: sig.signature,
              slot: sig.slot,
              error: tx.meta?.err || null,
              blockTime: sig.blockTime,
              sender: sender,
              recipient: recipient,
              amount: amount,
              tokenMint: tokenMint,
            } as TransactionResponse;
          } catch (err) {
            logger.warn(`Error parsing transaction ${sig.signature}:`, err);
            return null;
          }
        })
      );

      // Filter out null transactions
      const filteredTxns = fetchedTxns.filter((tx): tx is TransactionResponse => tx !== null);
      return filteredTxns;
    } catch (err) {
      logger.error('Failed to fetch transactions:', err);
      throw new Error('Failed to fetch transactions. Please check the address.');
    }
  }
}

