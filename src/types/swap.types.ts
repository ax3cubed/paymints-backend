export interface SwapRequest {
  poolAddress: string;
  inTokenIndex: number;
  outTokenIndex: number;
  amountIn: number;
  minAmountOut: number;
  userPublicKey: string;
}

export interface SwapResponse {
  serializedTransaction: string;
}

export interface SubmitSwapRequest {
  serializedTransaction: string;
}

export interface SubmitSwapResponse {
  success: boolean;
  signature: string;
}
