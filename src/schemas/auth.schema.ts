

export const registerSchema = {
  tags: ["Auth"],
  summary: "Register a new user",
  description: "Creates a new user account and returns a JWT token",
  body: {
    type: "object",
    required: ["address"],
    properties: {
      address: { type: "string" }
    },
  },
  response: {
    201: {
      description: "Successful registration",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                email: { type: "string" },
                username: { type: "string" },
                Image: { type: "string" },
                address: { type: "string" },
                status: { type: "string" },
                isAdmin: { type: "boolean" },
                twitterId: { type: "string" },
                website: { type: "string" },

              },
            },
            token: { type: "string" },
          },
        },
        meta: {
          type: "object",
          properties: {
            timestamp: { type: "string" },
          },
        },
      },
    },
    400: {
      description: "Validation error",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        errors: { type: "array" },
        meta: {
          type: "object",
          properties: {
            timestamp: { type: "string" },
          },
        },
      },
    },
  },
}

export const loginSchema = {
  tags: ["Auth"],
  summary: "Login user",
  description: "Authenticates a user and returns a JWT token",
  body: {
    type: "object",
    required: ["addressOrUsername"],
    properties: {
      addressOrUsername: { type: "string" }
    },
  },
  response: {
    200: {
      description: "Successful login",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                email: { type: "string" },
                username: { type: "string" },
                Image: { type: "string" },
                address: { type: "string" },
                status: { type: "string" },
                isAdmin: { type: "boolean" },
                twitterId: { type: "string" },
                website: { type: "string" },
              },
            },
            token: { type: "string" },
          },
        },
        meta: {
          type: "object",
          properties: {
            timestamp: { type: "string" },
          },
        },
      },
    },
    401: {
      description: "Authentication failed",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        meta: {
          type: "object",
          properties: {
            timestamp: { type: "string" },
          },
        },
      },
    },
  },
}

export const getMeSchema = {
  tags: ["Auth"],
  summary: "Get current user",
  description: "Returns the authenticated user's details, including beneficiaries, token balances, and user profile",
  response: {
    200: {
      description: "User details",
      type: "object",
      required: ["success", "message", "data", "meta"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            beneficiaries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number", description: "Beneficiary ID" },
                  name: { type: "string", description: "Beneficiary name" },
                  email: { type: "string", format: "email", description: "Beneficiary email" },
                  walletAddress: {
                    type: "string",
                    pattern: "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
                    description: "Solana wallet address (base58-encoded)"
                  }
                }
              },
              description: "Array of beneficiaries (empty if none)"
            },
            tokens: {
              type: "array",
              items: {
                type: "object",
                required: ["symbol", "mintAddress", "balance"],
                properties: {
                  symbol: {
                    type: "string",
                    minLength: 1,
                    maxLength: 10,
                    pattern: "^[A-Za-z0-9*]+$",
                    description: "Token symbol, e.g., 'USDC'"
                  },
                  mintAddress: {
                    type: "string",
                    pattern: "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
                    description: "Solana mint address (base58-encoded)"
                  },
                  balance: {
                    type: "number",
                    minimum: 0,
                    description: "Token balance as a floating-point number, e.g., 100.5"
                  },
                  imageUrl: {
                    type: "string"
                  },
                  associatedTokenAddress: {
                    type: "string",
                    pattern: "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
                    nullable: true,
                    description: "Solana associated token address (base58-encoded) or null if unavailable"
                  }
                }
              },
              description: "Array of token accounts (empty if none)"
            },
            user: {
              type: "object",
              properties: {
                id: { type: "number", description: "User ID" },
                name: { type: "string", description: "User full name" },
                email: { type: "string", format: "email", description: "User email" },
                username: { type: "string", description: "User username" },
                image: { type: "string", nullable: true, description: "User profile image URL" },
                address: {
                  type: "string",
                  pattern: "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
                  description: "Solana wallet address (base58-encoded)"
                },
                status: {
                  type: "string",
                  enum: ["active", "inactive", "pending"],
                  description: "User account status"
                },
                isAdmin: { type: "boolean", description: "Whether the user is an admin" },
                twitterId: { type: "string", nullable: true, description: "User Twitter ID" },
                website: { type: "string", nullable: true, description: "User website URL" }
              }
            },
            creditScoreHistory: {
              type: "array",
              description: "Array of historical credit score evaluations for the user (can be empty)",
              items: {
                type: "object",
                properties: {
                  id: { type: "number", description: "Credit score entry ID" },
                  name: { type: "string", description: "Name or label for the score snapshot" },
                  createdAt: { type: "string", format: "date-time", description: "Timestamp of the credit score evaluation" },
            
                  walletAgeDays: { type: "integer", description: "Number of days the wallet has existed" },
                  kycVerified: { type: "boolean", description: "Whether the user has completed KYC verification" },
                  countryRiskRating: { type: "string", nullable: true, description: "Geopolitical or regional risk label" },
            
                  txVolume30d: { type: "number", format: "float", description: "Total transaction volume in the last 30 days" },
                  txFrequency30d: { type: "integer", description: "Number of transactions in the last 30 days" },
                  protocolInteractionsCount: { type: "integer", description: "Count of different Web3 protocols interacted with" },
                  daoVotesCast: { type: "integer", description: "Number of DAO votes cast by the user" },
            
                  invoicesPaidReceivedRatio: { type: "number", format: "float", description: "Ratio of invoices paid vs received" },
                  avgInvoiceAmount: { type: "number", format: "float", description: "Average invoice amount handled" },
                  invoiceOnTimeRate: { type: "number", format: "float", description: "Proportion of invoices paid on time" },
                  invoiceFactoringUsed: { type: "boolean", description: "Whether the user has used invoice factoring" },
            
                  reputationScore: { type: "number", format: "float", description: "Aggregated DAO reputation score" },
                  linkedSocialsCount: { type: "integer", description: "Number of linked social accounts (GitHub, Twitter, etc.)" },
                  peerReviewsScore: { type: "number", format: "float", description: "Average peer review rating" },
            
                  loanRepaymentRate: { type: "number", format: "float", description: "Rate of successful loan repayments" },
                  loanDefaultsCount: { type: "integer", description: "Number of loan defaults" },
                  borrowedToEarnedRatio: { type: "number", format: "float", description: "Borrowed amount vs earned funds" },
            
                  consistencyScore: { type: "number", format: "float", description: "Score reflecting financial behavior consistency" },
                  riskAnomaliesDetected: { type: "boolean", description: "Flag if anomalies or risk spikes were detected" },
                  activityCluster: { type: "string", nullable: true, description: "Behavioral cluster name (e.g., 'spender', 'builder')" },
            
                  finalCreditScore: { type: "number", format: "float", description: "Final calculated credit score from AI engine" },
                  creditTier: {
                    type: "string",
                    enum: ["Excellent", "Good", "Fair", "Poor", "High Risk"],
                    description: "Tier label based on the final credit score"
                  }
                }
              }
            }
          }
        },
        meta: {
          type: "object",
          required: ["timestamp"],
          properties: {
            timestamp: {
              type: "string",
              format: "date-time",
              description: "ISO 8601 date-time string, e.g., '2025-04-28T12:34:56Z'"
            }
          }
        }
      }
    },
    401: {
      description: "Unauthorized",
      type: "object",
      required: ["success", "message", "meta"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        meta: {
          type: "object",
          required: ["timestamp"],
          properties: {
            timestamp: { type: "string", format: "date-time" }
          }
        }
      }
    },
    400: {
      description: "Bad Request",
      type: "object",
      required: ["success", "message", "meta"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        meta: {
          type: "object",
          required: ["timestamp"],
          properties: {
            timestamp: { type: "string", format: "date-time" }
          }
        }
      }
    },
    500: {
      description: "Internal Server Error",
      type: "object",
      required: ["success", "message", "meta"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        meta: {
          type: "object",
          required: ["timestamp"],
          properties: {
            timestamp: { type: "string", format: "date-time" }
          }
        }
      }
    }
  }
};

