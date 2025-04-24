

export const registerSchema = {
  tags: ["Auth"],
  summary: "Register a new user",
  description: "Creates a new user account and returns a JWT token",
  body: {
    type: "object",
    required: ["email", "username", "password"],
    properties: {
      email: { type: "string", format: "email" },
      username: { type: "string", minLength: 3 },
      password: { type: "string", minLength: 6 },
      fullName: { type: "string" },
      
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
                email: { type: "string" },
                username: { type: "string" },
                fullName: { type: "string" },
               
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
    required: ["emailOrUsername", "password"],
    properties: {
      emailOrUsername: { type: "string" },
      password: { type: "string" },
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
                email: { type: "string" },
                username: { type: "string" },
                fullName: { type: "string" },
               
               
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

export const forgotPasswordSchema = {
  tags: ["Auth"],
  summary: "Forgot password",
  description: "Sends a password reset link to the user's email",
  body: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email" },
    },
  },
  response: {
    200: {
      description: "Reset link sent",
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

export const resetPasswordSchema = {
  tags: ["Auth"],
  summary: "Reset password",
  description: "Resets the user's password using a token",
  body: {
    type: "object",
    required: ["token", "password"],
    properties: {
      token: { type: "string" },
      password: { type: "string", minLength: 6 },
    },
  },
  response: {
    200: {
      description: "Password reset successful",
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
      description: "Invalid token",
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
  description: "Returns the authenticated user's details",
  // security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "User details",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  amount: { type: "number" },
                  type: { type: "string" },
                  status: { type: "string" },
                  createdAt: { type: "string" },
                },
              },
            },
            user: {
              type: "object",
              properties: {
                id: { type: "number" },
                email: { type: "string" },
                username: { type: "string" },
                fullName: { type: "string" },
                emailVerified: { type: "boolean" },
                profileImage: { type: "string" },
                address: { type: "string" },
                
                 
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

