

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
          required: ["beneficiaries", "tokens", "user"],
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

