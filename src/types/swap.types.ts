import { PublicKey } from '@solana/web3.js';
import { FastifyRequest } from 'fastify';

export interface SwapRequest extends FastifyRequest
 {
  poolAddress: string;
  inTokenIndex: number;
  outTokenIndex: number;
  amountIn: number;
  minAmountOut: number;
  userPublicKey: string;
}

export interface SwapResponse {
  success: boolean;
  signature?: string;
  confirmation?: any;
  error?: string;
}
