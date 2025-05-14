import { z } from "zod";
import { InvoiceStatus, InvoiceType, InvoiceVisibility } from "@/entities/Invoice";

// User DTO (subset of User entity for response)
const UserDTOSchema = z.object({
  _id: z.string().min(1), // ObjectId string
  email: z.string().email().optional(),
  address: z.string().optional(), // Wallet address
  username: z.string().optional(),
  // Add other User fields as needed, excluding sensitive data
});

// Services DTO (maps to Services entity)
const ServicesDTOSchema = z.object({
  _id: z.string().min(1), // ObjectId string
  title: z.string().min(1), // Maps to `name` in input
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(), // Maps to `price` in input
  invoice: z.string().min(1), // Invoice ObjectId string
});

// DiscountCodes DTO (maps to DiscountCodes entity)
const DiscountCodesDTOSchema = z.object({
  _id: z.string().min(1), // ObjectId string
  discountCode: z.string().optional(), // Maps to `discountCode` in input
  discountPercent: z.string().regex(/^\d+$/, "Must be a valid percentage").optional(),
  noOfUse: z.number().int().nonnegative().optional(),
  invoice: z.string().min(1), // Invoice ObjectId string
});

// Invoice Response DTO
export const InvoiceResponseDTOSchema = z.object({
  _id: z.string().min(1), // ObjectId string
  id: z.number().int().nonnegative(), // Numeric ID (if used)
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  updatedBy: z.string().min(1).optional(), // ObjectId string or identifier
  softDeleted: z.boolean().optional(), // Status or flag (e.g., "true", "false")
  invoiceNo: z.string().min(1),
  createdBy: UserDTOSchema, // Full User object
  invoiceType: z.enum([
    InvoiceType.INVOICE,
    InvoiceType.DONATION,
    InvoiceType.SUBSCRIPTION,
    InvoiceType.CUSTOM,
    InvoiceType.MILESTONE,
  ]),
  invoiceTitle: z.string().min(1),
  invoiceImage: z.string().url().optional(),
  invoiceDescription: z.string().optional(),
  invoiceStatus: z.enum([
    InvoiceStatus.DRAFT,
    InvoiceStatus.PROCESSING,
    InvoiceStatus.COMPLETED,
    InvoiceStatus.OVERDUE
  ]),
  invoiceCategory: z.string().optional(),
  invoiceMintAddress: z.string().min(1),
  clientName: z.string().optional(),
  clientWallet: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional(),
  isClientInformation: z.boolean().optional(),
  isExpirable: z.boolean().optional(),
  dueDate: z.string().datetime().optional(),
  discountCodes: z.array(DiscountCodesDTOSchema).optional(),
  tipOptionEnabled: z.boolean().optional(),
  invoiceVisibility: z.enum([
    InvoiceVisibility.PRIVATE,
    InvoiceVisibility.PUBLIC,
  ]).optional(),
  autoEmailReceipt: z.boolean().optional(),
  QRcodeEnabled: z.boolean().optional(),
  services: z.array(ServicesDTOSchema).optional(),
  subtotal: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  totalAmount: z.number().positive(),
  invoiceTxHash: z.string().optional(),
});

// TypeScript type for the DTO
export type InvoiceResponseDTO = z.infer<typeof InvoiceResponseDTOSchema>;