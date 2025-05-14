export const swapRouteSchema = {
  tags: ['Swap'],
  summary: 'Swap tokens in a pool',
  description: 'Swaps tokens using the specified pool and user public key on Solana.',
  body: {
    type: 'object',
    required: [
      'poolAddress',
      'inTokenIndex',
      'outTokenIndex',
      'amountIn',
      'minAmountOut',
      'userPublicKey',
    ],
    properties: {
      poolAddress: { type: 'string', minLength: 32, description: 'Solana pool public key' },
      inTokenIndex: { type: 'integer', minimum: 0, description: 'Input token index' },
      outTokenIndex: { type: 'integer', minimum: 0, description: 'Output token index' },
      amountIn: { type: 'integer', minimum: 1, description: 'Amount to swap (input)' },
      minAmountOut: { type: 'integer', minimum: 1, description: 'Minimum output amount' },
      userPublicKey: { type: 'string', minLength: 32, description: 'User Solana public key' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        serializedTransaction: { type: 'string', description: 'Base64-encoded Solana transaction' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['timestamp'],
        },
      },
      required: ['success', 'serializedTransaction'],
      description: 'Swap transaction prepared successfully',
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string' },
        errors: { type: 'array', items: { type: 'object' } },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' },
          },
        },
      },
      required: ['success', 'message'],
      description: 'Validation or input error',
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' },
          },
        },
      },
      required: ['success', 'message'],
      description: 'Internal server error',
    },
  },
};

export const submitSwapRouteSchema = {
  tags: ['Swap'],
  summary: 'Submit a signed swap transaction',
  description: 'Submits a signed Solana web3.js Transaction object (serialized as base64) for execution.',
  body: {
    type: 'object',
    required: ['transaction'],
    properties: {
      transaction: {
        type: 'object',
        description: 'A Solana web3.js Transaction object. Typically, this should be serialized and base64-encoded for transport, but if sending as JSON, structure as below.',
        properties: {
          signatures: {
            type: 'array',
            description: 'Signatures for the transaction',
            items: {
              type: 'object',
              properties: {
                publicKey: { type: 'string', description: 'Base58-encoded public key' },
                signature: { type: ['string', 'null'], description: 'Base58-encoded signature or null' },
              },
              required: ['publicKey', 'signature'],
            },
          },
          feePayer: { type: ['string', 'null'], description: 'Base58-encoded public key of the fee payer' },
          instructions: {
            type: 'array',
            description: 'Instructions to atomically execute',
            items: {
              type: 'object',
              properties: {
                keys: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      pubkey: { type: 'string', description: 'Base58-encoded public key' },
                      isSigner: { type: 'boolean' },
                      isWritable: { type: 'boolean' },
                    },
                    required: ['pubkey', 'isSigner', 'isWritable'],
                  },
                },
                programId: { type: 'string', description: 'Base58-encoded program id' },
                data: { type: 'string', description: 'Base64-encoded instruction data' },
              },
              required: ['keys', 'programId', 'data'],
            },
          },
          recentBlockhash: { type: ['string', 'null'], description: 'Recent blockhash' },
          lastValidBlockHeight: { type: ['number', 'null'], description: 'Last valid block height' },
          nonceInfo: {
            type: ['object', 'null'],
            description: 'Optional Nonce information',
            properties: {
              nonce: { type: 'string' },
              nonceInstruction: { type: 'object' },
            },
            required: ['nonce', 'nonceInstruction'],
          },
          minNonceContextSlot: { type: ['number', 'null'], description: 'Minimum nonce context slot' },
        },
        required: ['signatures', 'instructions'],
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        signature: { type: 'string', description: 'Solana transaction signature' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['timestamp'],
        },
      },
      required: ['success', 'signature'],
      description: 'Swap transaction submitted successfully',
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string' },
        errors: { type: 'array', items: { type: 'object' } },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' },
          },
        },
      },
      required: ['success', 'message'],
      description: 'Validation or input error',
    },
    500: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' },
          },
        },
      },
      required: ['success', 'message'],
      description: 'Internal server error',
    },
  },
};
