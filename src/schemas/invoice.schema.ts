const UserDTOSchema = {
    type: "object",
    required: ["_id"],
    properties: {
      _id: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      address: { type: "string", nullable: true },
      username: { type: "string", nullable: true },
    },
  };
  
  const ServicesDTOSchema = {
    type: "object",
    required: ["_id", "title", "description", "quantity", "unitPrice", "invoice"],
    properties: {
      _id: { type: "string", minLength: 1 },
      title: { type: "string", minLength: 1 },
      description: { type: "string", minLength: 1 },
      quantity: { type: "integer", minimum: 1 },
      unitPrice: { type: "number", exclusiveMinimum: 0 },
      invoice: { type: "string", minLength: 1 },
    },
  };
  
  const DiscountCodesDTOSchema = {
    type: "object",
    required: ["_id", "code", "discountPercent", "noOfUse", "invoice"],
    properties: {
      _id: { type: "string", minLength: 1 },
      code: { type: "string", minLength: 1 },
      discountPercent: { type: "string", pattern: "^\\d+$" },
      noOfUse: { type: "integer", minimum: 0 },
      invoice: { type: "string", minLength: 1 },
    },
  };
  
  const InvoiceResponseDTOSchema = {
    type: "object",
    required: [
      "_id",
      "id",
      "createdAt",
      "updatedAt",
      "invoiceNo",
      "createdBy",
      "invoiceType",
      "invoiceTitle",
      "invoiceStatus",
      "invoiceMintAddress",
      "totalAmount",
    ],
    properties: {
      _id: { type: "string", minLength: 1 },
      id: { type: "integer", minimum: 0 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      updatedBy: { type: "string", minLength: 1, nullable: true },
      softDeleted: { type: "string", nullable: true },
      invoiceNo: { type: "string", minLength: 1 },
      createdBy: UserDTOSchema,
      invoiceType: {
        type: "string",
        enum: ["STANDARD", "DONATION", "SUBSCRIPTION", "CUSTOM", "MILESTONE"],
      },
      invoiceTitle: { type: "string", minLength: 1 },
      invoiceImage: { type: "string", format: "uri", nullable: true },
      invoiceDescription: { type: "string", nullable: true },
      invoiceStatus: {
        type: "string",
        enum: ["DRAFT", "PROCESSING", "COMPLETED", "OVERDUE"],
      },
      invoiceCategory: { type: "string", nullable: true },
      invoiceMintAddress: { type: "string", minLength: 1 },
      currency: {type: "string"},
      clientName: { type: "string", nullable: true },
      clientWallet: { type: "string", nullable: true },
      clientEmail: { type: "string", format: "email", nullable: true },
      clientAddress: { type: "string", nullable: true },
      isClientInformation: { type: "boolean", nullable: true },
      isExpirable: { type: "boolean", nullable: true },
      dueDate: { type: "string", nullable: true },
      discountCodes: { type: "array", items: DiscountCodesDTOSchema, nullable: true },
      tipOptionEnabled: { type: "boolean", nullable: true },
      invoiceVisibility: {
        type: "string",
        enum: ["PRIVATE", "PUBLIC"],
        nullable: true,
      },
      autoEmailReceipt: { type: "boolean", nullable: true },
      QRcodeEnabled: { type: "boolean", nullable: true },
      services: { type: "array", items: ServicesDTOSchema, nullable: true },
      subtotal: { type: "number", minimum: 0, nullable: true },
      discount: { type: "number", minimum: 0, nullable: true },
      taxRate: { type: "number", minimum: 0, nullable: true },
      taxAmount: { type: "number", minimum: 0, nullable: true },
      totalAmount: { type: "number", exclusiveMinimum: 0 },
      invoiceTxHash: { type: "string", nullable: true },
      invoicePays: {
        type: "array",
        items: {
          type: "object",
          required: ["payer", "amount", "timestamp"],
          properties: {
            payer: { type: "string" },
            amount: { type: "string" },
            timestamp: { type: "string" },
          },
        },
        nullable: true,
      },
    },
  };

  // Common schemas
const ServiceInputSchema = {
    type: "object",
    required: ["title", "description", "quantity", "unitPrice"],
    properties: {
      title: { type: "string", minLength: 1 },
      description: { type: "string", minLength: 1 },
      quantity: { type: "integer", minimum: 1 },
      unitPrice: { type: "number", exclusiveMinimum: 0 },
    },
  };
  
  const DiscountCodeInputSchema = {
    type: "object",
    required: ["discountCode", "discountPercent", "noOfUse"],
    properties: {
      discountCode: { type: "string", minLength: 1 },
      discountPercent: { type: "string", pattern: "^\\d+$" },
      noOfUse: { type: "integer", minimum: 0 },
    },
  };
  
  const InvoiceNoParamsSchema = {
    type: "object",
    required: ["invoiceNo"],
    properties: {
      invoiceNo: { type: "string", minLength: 1 },
    },
  };
  
  const SuccessResponseSchema = {
    type: "object",
    required: ["success", "message", "meta"],
    properties: {
      success: { type: "boolean" },
      message: { type: "string" },
      data: { type: "object", properties: {}, nullable: true },
      meta: {
        type: "object",
        required: ["timestamp"],
        properties: {
          timestamp: { type: "string" },
        },
      },
    },
  };
  
  const ErrorResponseSchema = {
    type: "object",
    required: ["success", "message", "meta"],
    properties: {
      success: { type: "boolean" },
      message: { type: "string" },
      errors: { type: "array", items: {}, nullable: true },
      meta: {
        type: "object",
        required: ["timestamp"],
        properties: {
          timestamp: { type: "string" },
        },
      },
    },
  };
  
  // Create invoice schema
  export const createInvoiceSchema = {
    tags: ["Invoice"],
    summary: "Create a new invoice",
    description: "Creates a new invoice for the authenticated user",
    body: {
      type: "object",
      required: ["invoiceType", "invoiceTitle", "invoiceMintAddress", "totalAmount"],
      properties: {
        invoiceType: {
          type: "string",
          enum: ["standard", "donation", "subscription", "custom", "milestone"],
        },
        invoiceTitle: { type: "string", minLength: 1 },
        invoiceImage: { type: "string", format: "uri", nullable: true },
        invoiceDescription: { type: "string", nullable: true },
        invoiceCategory: { type: "string", nullable: true },
        invoiceMintAddress: { type: "string", minLength: 1 },
        currency: {type: "string"},
        clientName: { type: "string", nullable: true },
        clientWallet: { type: "string", nullable: true },
        clientEmail: { type: "string", format: "email", nullable: true },
        clientAddress: { type: "string", nullable: true },
        isClientInformation: { type: "boolean", nullable: true },
        isExpirable: { type: "boolean", nullable: true },
        dueDate: { type: "string", nullable: true },
        discountCodes: {
          type: "array",
          items: DiscountCodeInputSchema,
          nullable: true,
        },
        tipOptionEnabled: { type: "boolean", nullable: true },
        invoiceVisibility: {
          type: "string",
          enum: ["private", "public"],
          nullable: true,
        },
        autoEmailReceipt: { type: "boolean", nullable: true },
        QRcodeEnabled: { type: "boolean", nullable: true },
        services: { type: "array", items: ServiceInputSchema, nullable: true },
        subtotal: { type: "number", minimum: 0, nullable: true },
        discount: { type: "number", minimum: 0, nullable: true },
        taxRate: { type: "number", minimum: 0, nullable: true },
        taxAmount: { type: "number", minimum: 0, nullable: true },
        totalAmount: { type: "number", exclusiveMinimum: 0 },
      },
    },
    response: {
      201: {
        description: "Successful invoice creation",
        type: "object",
        required: ["success", "message", "data", "meta"],
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            required: ["invoice"],
            properties: {
              invoice: InvoiceResponseDTOSchema,
            },
          },
          meta: {
            type: "object",
            required: ["timestamp"],
            properties: {
              timestamp: { type: "string" },
            },
          },
        },
      },
      400: ErrorResponseSchema,
      401: ErrorResponseSchema,
    },
  };
  
  // Get invoice schema
  export const getInvoiceSchema = {
    tags: ["Invoice"],
    summary: "Get invoice by ID",
    description: "Returns the details of a specific invoice for the authenticated user",
    params: InvoiceNoParamsSchema,
    response: {
      200: {
        description: "Invoice details",
        type: "object",
        required: ["success", "message", "data", "meta"],
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            required: ["invoice"],
            properties: {
              invoice: InvoiceResponseDTOSchema,
            },
          },
          meta: {
            type: "object",
            required: ["timestamp"],
            properties: {
              timestamp: { type: "string" },
            },
          },
        },
      },
      401: ErrorResponseSchema,
      404: ErrorResponseSchema,
    },
  };
  
  // Get all invoices schema
  export const getInvoicesSchema = {
    tags: ["Invoice"],
    summary: "Get all user invoices",
    description: "Returns a list of all invoices for the authenticated user",
    response: {
      200: {
        description: "List of user invoices",
        type: "object",
        required: ["success", "message", "data", "meta"],
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            required: ["invoices"],
            properties: {
              invoices: {
                type: "array",
                items: InvoiceResponseDTOSchema,
              },
            },
          },
          meta: {
            type: "object",
            required: ["timestamp"],
            properties: {
              timestamp: { type: "string" },
            },
          },
        },
      },
      401: ErrorResponseSchema,
    },
  };
  
  // Update invoice schema
  export const updateInvoiceSchema = {
    tags: ["Invoice"],
    summary: "Update invoice",
    description: "Updates an existing invoice for the authenticated user",
    params: InvoiceNoParamsSchema,
    body: {
      type: "object",
      required: ["invoiceNo"],
      properties: {
        invoiceNo: { type: "string", minLength: 1 },
        invoiceType: {
          type: "string",
          enum: ["INVOICE", "DONATION", "SUBSCRIPTION", "CUSTOM", "MILESTONE"],
          nullable: true,
        },
        invoiceTitle: { type: "string", minLength: 1, nullable: true },
        invoiceImage: { type: "string", format: "uri", nullable: true },
        invoiceDescription: { type: "string", nullable: true },
        invoiceStatus: {
          type: "string",
          enum: ["DRAFT", "PROCESSING", "COMPLETED", "OVERDUE"],
          nullable: true,
        },
        invoiceCategory: { type: "string", nullable: true },
        invoiceMintAddress: { type: "string", nullable: true },
        currency: {type: "string"},
        clientName: { type: "string", nullable: true },
        clientWallet: { type: "string", nullable: true },
        clientEmail: { type: "string", format: "email", nullable: true },
        clientAddress: { type: "string", nullable: true },
        isClientInformation: { type: "boolean", nullable: true },
        isExpirable: { type: "boolean", nullable: true },
        dueDate: { type: "string", format: "date-time", nullable: true },
        discountCodes: {
          type: "array",
          items: { type: "string" },
          nullable: true,
        },
        tipOptionEnabled: { type: "boolean", nullable: true },
        invoiceVisibility: {
          type: "string",
          enum: ["PRIVATE", "PUBLIC"],
          nullable: true,
        },
        autoEmailReceipt: { type: "boolean", nullable: true },
        QRcodeEnabled: { type: "boolean", nullable: true },
        services: {
          type: "array",
          items: { type: "string" },
          nullable: true,
        },
        subtotal: { type: "number", minimum: 0, nullable: true },
        discount: { type: "number", minimum: 0, nullable: true },
        taxRate: { type: "number", minimum: 0, nullable: true },
        taxAmount: { type: "number", minimum: 0, nullable: true },
        totalAmount: { type: "number", minimum: 0, nullable: true },
        invoiceTxHash: { type: "string", nullable: true },
      },
    },
    response: {
      200: {
        description: "Invoice updated",
        type: "object",
        required: ["success", "message", "data", "meta"],
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            required: ["invoice"],
            properties: {
              invoice: InvoiceResponseDTOSchema,
            },
          },
          meta: {
            type: "object",
            required: ["timestamp"],
            properties: {
              timestamp: { type: "string" },
            },
          },
        },
      },
      401: ErrorResponseSchema,
      404: ErrorResponseSchema,
    },
  };
  
  // Activate invoice schema
  export const activateInvoiceSchema = {
    tags: ["Invoice"],
    summary: "Activate invoice",
    description: "Activates an existing invoice for the authenticated user",
    body: {
      type: "object",
      required: ["invoiceNo"],
      properties: {
        invoiceNo: { type: "string", minLength: 1 },
      },
    },
    response: {
      200: {
        description: "Invoice activated",
        type: "object",
        required: ["success", "message", "data", "meta"],
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            required: ["invoice"],
            properties: {
              invoice: InvoiceResponseDTOSchema,
            },
          },
          meta: {
            type: "object",
            required: ["timestamp"],
            properties: {
              timestamp: { type: "string" },
            },
          },
        },
      },
      401: ErrorResponseSchema,
      404: ErrorResponseSchema,
    },
  };
  
  // Delete invoice schema
  export const deleteInvoiceSchema = {
    tags: ["Invoice"],
    summary: "Delete invoice",
    description: "Deletes an existing invoice for the authenticated user",
    params: InvoiceNoParamsSchema,
    response: {
      200: SuccessResponseSchema,
      401: ErrorResponseSchema,
      404: ErrorResponseSchema,
    },
  };