import { z } from "zod";
import { InvoiceType, InvoiceStatus, InvoiceVisibility } from "../entities/Invoice";

// Zod schemas for validation (used in controller)
const createInvoiceZodSchema = z.object({
    invoiceType: z.enum([
        InvoiceType.INVOICE,
        InvoiceType.DONATION,
        InvoiceType.SUBSCRIPTION,
        InvoiceType.CUSTOM,
        InvoiceType.MILESTONE,
    ]),
    invoiceTitle: z.string(),
    invoiceImage: z.string().optional(),
    invoiceDescription: z.string().optional(),
    invoiceStatus: z
        .enum([
            InvoiceStatus.DRAFT,
            InvoiceStatus.PROCESSING,
            InvoiceStatus.COMPLETED,
        ])
        .optional(),
    invoiceCategory: z.string().optional(),
    invoiceMintAddress: z.string(),
    clientName: z.string().optional(),
    clientWallet: z.string().optional(),
    clientEmail: z.string().email().optional(),
    clientAddress: z.string().optional(),
    isClientInformation: z.boolean().optional(),
    isExpirable: z.boolean().optional(),
    dueDate: z.string().optional(),
    discountCodes: z.array(z.any()).optional(), // Replace with specific schema if available
    tipOptionEnabled: z.boolean().optional(),
    invoiceVisibility: z
        .enum([InvoiceVisibility.PRIVATE, InvoiceVisibility.PUBLIC])
        .optional(),
    autoEmailReceipt: z.boolean().optional(),
    QRcodeEnabled: z.boolean().optional(),
    services: z.array(z.any()).optional(), // Replace with specific schema if available
    subtotal: z.number().optional(),
    discount: z.number().optional(),
    taxRate: z.number().optional(),
    taxAmount: z.number().optional(),
    totalAmount: z.number().optional(),
});

const updateInvoiceZodSchema = z.object({
    invoiceNo: z.string().optional(),
    invoiceType: z
        .enum([
            InvoiceType.INVOICE,
            InvoiceType.DONATION,
            InvoiceType.SUBSCRIPTION,
            InvoiceType.CUSTOM,
            InvoiceType.MILESTONE,
        ])
        .optional(),
    invoiceTitle: z.string().optional(),
    invoiceImage: z.string().optional(),
    invoiceDescription: z.string().optional(),
    invoiceStatus: z
        .enum([
            InvoiceStatus.DRAFT,
            InvoiceStatus.PROCESSING,
            InvoiceStatus.COMPLETED,
        ])
        .optional(),
    invoiceCategory: z.string().optional(),
    invoiceMintAddress: z.string().optional(),
    clientName: z.string().optional(),
    clientWallet: z.string().optional(),
    clientEmail: z.string().email().optional(),
    clientAddress: z.string().optional(),
    isClientInformation: z.boolean().optional(),
    isExpirable: z.boolean().optional(),
    dueDate: z.string().optional(),
    tipOptionEnabled: z.boolean().optional(),
    invoiceVisibility: z
        .enum([InvoiceVisibility.PRIVATE, InvoiceVisibility.PUBLIC])
        .optional(),
    autoEmailReceipt: z.boolean().optional(),
    QRcodeEnabled: z.boolean().optional(),
    subtotal: z.number().optional(),
    discount: z.number().optional(),
    taxRate: z.number().optional(),
    taxAmount: z.number().optional(),
    totalAmount: z.number().optional(),
});

// Zod schema for params
const idParamsSchema = z.object({
    id: z.string(),
});

const createResponseSchema = {
    type: "object",
    required: ["invoiceNo", "invoiceTxHash"],
    properties: {
      invoiceNo: { type: "string" },
      invoiceTxHash: { type: "string" }
    }
  };
  

const invoiceResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        invoiceNo: { type: "string" },
        invoiceType: {
            type: "string",
            enum: ["standard", "donation", "subscription", "custom"],
        },
        invoiceTitle: { type: "string" },
        invoiceImage: { type: "string" },
        invoiceDescription: { type: "string" },
        createdBy: {
            type: "object",
            properties: {
                id: { type: "number" },
                address: { type: "string" },
            },
        },
        invoiceStatus: {
            type: "string",
            enum: ["0", "1", "2"],
        },
        invoiceCategory: { type: "string", nullable: true },
        invoiceMintAddress: { type: "string" },
        clientName: { type: "string" },
        clientWallet: { type: "string" },
        clientEmail: { type: "string", nullable: true },
        clientAddress: { type: "string" },
        isClientInformation: { type: "boolean" },
        isExpirable: { type: "boolean" },
        dueDate: { type: "string", nullable: true },
        discountCodes: {
            type: "array",
            items: { type: "object" }, // Replace with specific schema if available
        },
        tipOptionEnabled: { type: "boolean" },
        invoiceVisibility: {
            type: "string",
            enum: ["private", "public"],
        },
        autoEmailReceipt: { type: "boolean" },
        QRcodeEnabled: { type: "boolean" },
        services: {
            type: "array",
            items: { type: "object" }, // Replace with specific schema if available
        },
        subtotal: { type: "number" },
        discount: { type: "number" },
        taxRate: { type: "number" },
        taxAmount: { type: "number" },
        totalAmount: { type: "number" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
        invoicePays: {
            type: "array",
            properties: {
                payer: {type: "string"},
                amount: {type: "string"},
                timestamp: {type: "string"},
            }
        }
    },
};

// Create invoice schema
export const createInvoiceSchema = {
    tags: ["Invoice"],
    summary: "Create a new invoice",
    description: "Creates a new invoice for the authenticated user",
    // security: [{ bearerAuth: [] }],
    body: {
        type: "object",
        required: [ "invoiceType", "invoiceTitle", "invoiceMintAddress"],
        properties: {
            
            invoiceType: {
                type: "string",
                enum: ["standard", "donation", "subscription", "custom", "milestone"],
            },
            invoiceTitle: { type: "string" },
            invoiceImage: { type: "string" },
            invoiceDescription: { type: "string" },
            invoiceStatus: {
                type: "string",
                enum: ["0", "1", "2"],
            },
            invoiceCategory: { type: "string" },
            invoiceMintAddress: { type: "string" },
            clientName: { type: "string" },
            clientWallet: { type: "string" },
            clientEmail: { type: "string" },
            clientAddress: { type: "string" },
            isClientInformation: { type: "boolean" },
            isExpirable: { type: "boolean" },
            dueDate: { type: "string" },
            discountCodes: {
                type: "array",
                items: { type: "object" }, // Replace with specific schema if available
            },
            tipOptionEnabled: { type: "boolean" },
            invoiceVisibility: {
                type: "string",
                enum: ["private", "public"],
            },
            autoEmailReceipt: { type: "boolean" },
            QRcodeEnabled: { type: "boolean" },
            services: {
                type: "array",
                items: { type: "object" }, // Replace with specific schema if available
            },
            subtotal: { type: "number" },
            discount: { type: "number" },
            taxRate: { type: "number" },
            taxAmount: { type: "number" },
            totalAmount: { type: "number" },
        },
    },
    response: {
        201: {
            description: "Successful invoice creation",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        invoice: createResponseSchema,
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

// Get invoice schema
export const getInvoiceSchema = {
    tags: ["Invoice"],
    summary: "Get invoice by ID",
    description: "Returns the details of a specific invoice for the authenticated user",
    // security: [{ bearerAuth: [] }],
    params: {
        type: "object",
        properties: {
            id: { type: "string", description: "Invoice ID" },
        },
        required: ["id"],
    },
    response: {
        200: {
            description: "Invoice details",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        invoice: invoiceResponseSchema,
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

// Get all invoices schema
export const getInvoicesSchema = {
    tags: ["Invoice"],
    summary: "Get all user invoices",
    description: "Returns a list of all invoices for the authenticated user",
    // security: [{ bearerAuth: [] }],
    response: {
        200: {
            description: "List of user invoices",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        invoices: {
                            type: "array",
                            items: invoiceResponseSchema,
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

// Update invoice schema
export const updateInvoiceSchema = {
    tags: ["Invoice"],
    summary: "Update invoice",
    description: "Updates an existing invoice for the authenticated user",
    // security: [{ bearerAuth: [] }],
    params: {
        type: "object",
        properties: {
            id: { type: "string", description: "Invoice ID" },
        },
        required: ["id", "invoiceMintAddress", "invoiceTxHash"],
    },
    body: {
        type: "object",
        properties: {
            invoiceNo: { type: "string" },
            invoiceType: {
                type: "string",
                enum: ["standard", "donation", "subscription", "custom", "milestone"],
            },
            invoiceTitle: { type: "string" },
            invoiceImage: { type: "string" },
            invoiceDescription: { type: "string" },
            invoiceTxHash: { type: "string" },
            invoiceStatus: {
                type: "string",
                enum: ["0", "1", "2"],
            },
            invoiceCategory: { type: "string" },
            invoiceMintAddress: { type: "string" },
            clientName: { type: "string" },
            clientWallet: { type: "string" },
            clientEmail: { type: "string" },
            clientAddress: { type: "string" },
            isClientInformation: { type: "boolean" },
            isExpirable: { type: "boolean" },
            dueDate: { type: "string" },
            tipOptionEnabled: { type: "boolean" },
            invoiceVisibility: {
                type: "string",
                enum: ["private", "public"],
            },
            autoEmailReceipt: { type: "boolean" },
            QRcodeEnabled: { type: "boolean" },
            subtotal: { type: "number" },
            discount: { type: "number" },
            taxRate: { type: "number" },
            taxAmount: { type: "number" },
            totalAmount: { type: "number" },
        },
    },
    response: {
        200: {
            description: "Invoice updated",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        invoice: invoiceResponseSchema,
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

// Delete invoice schema
export const deleteInvoiceSchema = {
    tags: ["Invoice"],
    summary: "Delete invoice",
    description: "Deletes an existing invoice for the authenticated user",
    // security: [{ bearerAuth: [] }],
    params: {
        type: "object",
        properties: {
            id: { type: "string", description: "Invoice ID" },
        },
        required: ["id"],
    },
    response: {
        200: {
            description: "Invoice deleted",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {},
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