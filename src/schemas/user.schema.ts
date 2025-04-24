export const getProfileSchema = {
  tags: ["User"],
  summary: "Get user profile",
  description: "Returns the authenticated user's profile details",
  // security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "User profile",
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
                email: { type: "string" },
                username: { type: "string" },
                fullName: { type: "string" },
                phoneNumber: { type: "string" },
                level: { type: "string" },
                accountBalance: { type: "number" },
                bonusBalance: { type: "number" },
                isAdmin: { type: "boolean" },
                emailVerified: { type: "boolean" },
                profileImage: { type: "string" },
                address: { type: "string" },
                bankAccounts: {
                  type: "object",
                  properties: {
                    accounts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          bankCode: { type: "string" },
                          bankName: { type: "string" },
                          accountNumber: { type: "string" },
                          accountName: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
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
      description: "Unauthorized",
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

export const updateProfileSchema = {
  tags: ["User"],
  summary: "Update user profile",
  description: "Updates the authenticated user's profile details",
  // security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    properties: {
      fullName: { type: "string" },
      phoneNumber: { type: "string" },
      address: { type: "string" },
      profileImage: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Profile updated",
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
                email: { type: "string" },
                username: { type: "string" },
                fullName: { type: "string" },
                phoneNumber: { type: "string" },
                address: { type: "string" },
                profileImage: { type: "string" },
              },
            },
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
    401: {
      description: "Unauthorized",
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

export const updatePasswordSchema = {
  tags: ["User"],
  summary: "Update password",
  description: "Updates the authenticated user's password",
  // security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["currentPassword", "newPassword"],
    properties: {
      currentPassword: { type: "string" },
      newPassword: { type: "string", minLength: 6 },
    },
  },
  response: {
    200: {
      description: "Password updated",
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
    400: {
      description: "Validation error or incorrect current password",
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
    401: {
      description: "Unauthorized",
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

export const updatePinSchema = {
  tags: ["User"],
  summary: "Update PIN",
  description: "Updates the authenticated user's PIN",
  // security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["pin"],
    properties: {
      pin: { type: "string", minLength: 4, maxLength: 4, pattern: "^[0-9]+$" },
    },
  },
  response: {
    200: {
      description: "PIN updated",
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
    401: {
      description: "Unauthorized",
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

export const addBankAccountSchema = {
  tags: ["User"],
  summary: "Add bank account",
  description: "Adds a bank account to the authenticated user",
  // security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["bankCode", "bankName", "accountNumber", "accountName"],
    properties: {
      bankCode: { type: "string" },
      bankName: { type: "string" },
      accountNumber: { type: "string" },
      accountName: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Bank account added",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            bankAccounts: {
              type: "object",
              properties: {
                accounts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      bankCode: { type: "string" },
                      bankName: { type: "string" },
                      accountNumber: { type: "string" },
                      accountName: { type: "string" },
                    },
                  },
                },
              },
            },
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
    401: {
      description: "Unauthorized",
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
    409: {
      description: "Bank account already exists",
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

export const removeBankAccountSchema = {
  tags: ["User"],
  summary: "Remove bank account",
  description: "Removes a bank account from the authenticated user",
  // security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["accountNumber"],
    properties: {
      accountNumber: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Bank account removed",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            bankAccounts: {
              type: "object",
              properties: {
                accounts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      bankCode: { type: "string" },
                      bankName: { type: "string" },
                      accountNumber: { type: "string" },
                      accountName: { type: "string" },
                    },
                  },
                },
              },
            },
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
      description: "Unauthorized",
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
    404: {
      description: "Bank account not found",
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

