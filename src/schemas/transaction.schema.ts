export const getTransactionSchema = {
    tags: ["Transaction"],
    summary: "Fetch Transaction",
    description: "Fetch all Wallet Transaction",
    querystring: {
      type: "object",
      required: ["address"],
      properties: {
        address: { type: "string" },
      },
    },
    response: {
      200: {
        description: "Successful",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              txn: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    signature: { type: "string" },
                    slot: { type: "number" },
                    blockTime: { type: "number", nullable: true },
                    sender: { type: "string", nullable: true },
                    recipient: { type: "string", nullable: true },
                    amount: { type: "number", nullable: true },
                    tokenMint: { type: "string", nullable: true },
                    error: { type: ["string", "null"] },
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
          errors: { type: "array", items: { type: "string" } },
          meta: {
            type: "object",
            properties: {
              timestamp: { type: "string" },
            },
          },
        },
      },
    },
  };
  