// import {
//   Connection,
//   ParsedInstruction,
//   PublicKey,
//   SystemProgram,
//   TransactionError
// } from '@solana/web3.js';
import { NotFoundError } from '../core/errors';
import { logger } from '../core/logger';
import config from '@/config';
import { address, createRpc, createSolanaRpcFromTransport, TransactionError, TransactionForFullMetaInnerInstructionsParsed } from '@solana/kit';
import { a } from 'vitest/dist/chunks/suite.B2jumIFP';

interface TransactionResponse {
  signature: string;
  slot: number;
  error: TransactionError | null;
  blockTime: number | null;
  sender: string | null;
  recipient: string | null;
  amount: number | null;
  tokenMint?: string | null;
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
      const rpcUrl = config.primaryTokens.rpc_url;
      const rpcUrl2 = config.primaryTokens.newRpc;
      console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
      // console.log(`RPC: ${rpcUrl2}`)
      const addr = address(walletAddress)

      // Get recent signatures
      // const signatures = await connection.getSignaturesForAddress(publicKey);
      const conns = createSolanaRpcFromTransport(config.primaryTokens.transport)
      const signatures = conns.getSignaturesForAddress(addr)
      console.log('--3-3-3--3-3-3-3-3-3--3-3-3-3--3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3')
      const allSignature = await signatures.send()
      // console.log(allSignature)
      console.log('--3-3-3--3-3-3-3-3-3--3-3-3-3--3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3-3')

      // Fetch and parse transactions
      const fetchedTxns = await Promise.all(
        allSignature.map(async (sig) => {
          try {
            // const tx = await connection.getParsedTransaction(sig.signature, {
            //   maxSupportedTransactionVersion: 0,
            // });

            const txs = conns.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            })

            const tx = await txs.send()
            console.log(tx);

            if (!tx) return null;

            // Handle System Program transfers (SOL) and SPL Token transfers
            let sender: string | null = null;
            let recipient: string | null = null;
            let amount: number | null = null;
            let tokenMint: string | null = null;

            const systemInstruction = tx?.transaction?.message?.instructions;
            const systemInstruction2 = tx.transaction.message.accountKeys;

            // console.log('/////////////////////////////////////////////////////////////////////////')
            // console.log(systemInstruction)
            // console.log('/////////////////////////////////////////////////////////////////////////')
            // console.log(systemInstruction2)




            // if (systemInstruction) {
            //   sender = tx.transaction.message.accountKeys[0]?.pubkey?.toBase58() ?? null;
            //   recipient = systemInstruction.parsed?.info?.destination ?? null;

            //   const lamports = systemInstruction.parsed?.info?.lamports;
            //   amount = lamports !== undefined && lamports !== null ? lamports / 1e9 : null; // Convert lamports to SOL
            // }

            // const tokenInstruction = tx.transaction.message.instructions.find(
            //   (ix): ix is ParsedInstruction =>
            //     'parsed' in ix &&
            //     ix.program === 'spl-token' &&
            //     (ix.parsed?.type === 'transfer' || ix.parsed?.type === 'transferChecked')
            // );

            // if (tokenInstruction) {
            //   sender = tokenInstruction.parsed?.info?.authority ?? null;
            //   recipient = tokenInstruction.parsed?.info?.destination ?? null;

            //   const tokenAmount = tokenInstruction.parsed?.info?.amount;
            //   amount = tokenAmount !== undefined && tokenAmount !== null
            //     ? Number(tokenAmount) / 1e6 // Adjust decimals (example: USDC uses 6)
            //     : null;
            //   tokenMint = tokenInstruction.parsed?.info?.mint ?? null;
            // }

            // if (!systemInstruction) return null;

            // return {
            //   signature: sig.signature,
            //   slot: sig.slot,
            //   error: null,
            //   blockTime: sig.blockTime,
            //   sender,
            //   recipient,
            //   amount,
            //   tokenMint: null
            // };

            return null
          } catch (err) {
            logger.warn(`Error parsing transaction ${sig.signature}:`, err);
            return null;
          }
        })
      );

      // Filter out null transactions
      // const filteredTxns = fetchedTxns.filter((tx): tx is TransactionResponse => tx !== null);
      // console.log(filteredTxns[0])
      return [];
    } catch (err) {
      logger.error('Failed to fetch transactions:', err);
      throw new Error('Failed to fetch transactions. Please check the address.');
    }
  }
}