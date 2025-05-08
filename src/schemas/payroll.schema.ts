import { PaymentType, PayrollStatus } from "@/entities/Payroll";
import { z } from "zod";

const createResponseSchema = {
    type: "object",
    required: ["payrollNo", "payrollTxHash"],
    properties: {
        payrollNo: { type: "string" },
        payrollTxHash: { type: "string" }
    }
  };
  

  export const createPayrollSchema = {
    type: "object",
    required: [
      "payrollType",
      "payrollTitle",
      "enableVesting",
      "vestUntil",
      "subtotal",
      "totalAmount",
      "tokenAddress"
    ],
    properties: {
      payrollType: { type: "string" },
      payrollTitle: { type: "string" },
      payrollImage: { type: "string" },
      payrollDescription: { type: "string" },
      payrollStatus: {
        type: "string",
        enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] // Update enum as per your `PayrollStatus`
      },
      enableVesting: { type: "boolean" },
      vestUntil: { type: "string", format: "date-time" },
      subtotal: { type: "number" },
      totalAmount: { type: "number" },
      payrollPeriod: { type: "string" },
      payCycleStart: { type: "string" },
      payCycleEnd: { type: "string" },
      stablecoinSymbol: {
        type: "string",
        default: "USDC"
      },
      chain: { type: "string" },
      tokenAddress: { type: "string" },
      decimals: {
        type: "number",
        default: 6
      },
      network: { type: "string" },
      transactionHash: { type: "string" },
      paymentType: {
        type: "string",
        enum: ["CRYPTO", "FIAT"], // Update based on your `PaymentType` enum
        default: "CRYPTO"
      },
      recipients: {
        type: "array",
        items: { type: "object" } // Replace with actual schema if needed
      }
    }
  };
  

  export const getPayrollSchema = {
    type: "object",
    required: [
      "id",
      "payrollType",
      "payrollTitle",
      "enableVesting",
      "vestUntil",
      "subtotal",
      "totalAmount",
      "tokenAddress"
    ],
    properties: {
      id: { type: "string" },
      payrollType: { type: "string" },
      payrollTitle: { type: "string" },
      payrollImage: { type: "string" },
      payrollDescription: { type: "string" },
      payrollStatus: {
        type: "string",
        enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] // Update as needed
      },
      enableVesting: { type: "boolean" },
      vestUntil: { type: "string", format: "date-time" },
      subtotal: { type: "number" },
      totalAmount: { type: "number" },
      payrollPeriod: { type: "string" },
      payCycleStart: { type: "string" },
      payCycleEnd: { type: "string" },
      stablecoinSymbol: {
        type: "string",
        default: "USDC"
      },
      chain: { type: "string" },
      tokenAddress: { type: "string" },
      decimals: {
        type: "number",
        default: 6
      },
      network: { type: "string" },
      transactionHash: { type: "string" },
      paymentType: {
        type: "string",
        enum: ["CRYPTO", "FIAT"], // Update based on enum
        default: "CRYPTO"
      },
      recipients: {
        type: "array",
        items: { type: "object" } // Replace with strict recipient schema if available
      }
    }
  };
  

  export const createSchema = {
    tags: ["Payroll"],
    summary: "Create a new Payroll",
    description: "Creates a new Payroll for the authenticated user",
    // security: [{ bearerAuth: [] }],
    body: createPayrollSchema, // ✅ This is now correct
    response: {
        201: {
            description: "Successful payroll creation",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        invoice: {
                            type: "object",
                            properties: {
                                invoiceNo: { type: "string" },
                                invoiceTxHash: { type: "string" },
                            },
                            required: ["invoiceNo", "invoiceTxHash"],
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
};



export const getPayrolSchema = {
    tags: ["Payroll"],
    summary: "Get Payroll by ID",
    description: "Returns the details of a specific Payroll for the authenticated user",
    // security: [{ bearerAuth: [] }],
    params: {
        type: "object",
        properties: {
            id: { type: "string", description: "Payroll ID" },
        },
        required: ["id"],
    },
    response: {
        200: {
            description: "Payroll details",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: getPayrollSchema.properties, // ✅ Fix here
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
            description: "Invoice not found",
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
};



export const getPayrollsSchema = {
    tags: ["Payroll"],
    summary: "Get all user Payroll",
    description: "Returns a list of all Payroll for the authenticated user",
    // security: [{ bearerAuth: [] }],
    response: {
        200: {
            description: "List of user Payroll",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        invoices: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: getPayrollSchema.properties, // ✅ Fix here
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
};
