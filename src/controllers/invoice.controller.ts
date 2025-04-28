import type { FastifyRequest, FastifyReply } from "fastify";
import { InvoiceService } from "../services/invoice.service";
import { BaseController } from "./base.controller";
import { z } from "zod";
import { InvoiceType, InvoiceStatus, InvoiceVisibility } from "../entities/Invoice";

// Validation schemas (unchanged from previous implementation)
const createInvoiceSchema = z.object({
    invoiceNo: z.string(),
    invoiceType: z.enum([
        InvoiceType.INVOICE,
        InvoiceType.DONATION,
        InvoiceType.SUBSCRIPTION,
        InvoiceType.CUSTOM,
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
    discountCodes: z.array(z.any()).optional(),
    tipOptionEnabled: z.boolean().optional(),
    invoiceVisibility: z
        .enum([InvoiceVisibility.PRIVATE, InvoiceVisibility.PUBLIC])
        .optional(),
    autoEmailReceipt: z.boolean().optional(),
    QRcodeEnabled: z.boolean().optional(),
    services: z.array(z.any()).optional(),
    subtotal: z.number().optional(),
    discount: z.number().optional(),
    taxRate: z.number().optional(),
    taxAmount: z.number().optional(),
    totalAmount: z.number().optional(),
});

const updateInvoiceSchema = z.object({
    invoiceNo: z.string().optional(),
    invoiceType: z
        .enum([
            InvoiceType.INVOICE,
            InvoiceType.DONATION,
            InvoiceType.SUBSCRIPTION,
            InvoiceType.CUSTOM,
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

export class InvoiceController extends BaseController {
    private invoiceService: InvoiceService;

    constructor() {
        super();
        this.invoiceService = new InvoiceService();
    }

    /**
     * Create a new invoice
     */
    async createInvoice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const invoiceData = createInvoiceSchema.parse(request.body);
            const user = await this.invoiceService.getAuthenticatedUser(request);

            const invoice = await this.invoiceService.createInvoice({
                ...invoiceData,
                createdBy: user,
            });

            return this.sendSuccess(
                reply,
                {
                    invoice,
                    success: true,
                    meta: { timestamp: new Date().toISOString() },
                },
                "Invoice created successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }

    /**
     * Get invoice by ID
     */
    async getInvoice(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            //   const { id } = request.params;
            const { id } = (request.params as { id: string });
            const user = await this.invoiceService.getAuthenticatedUser(request);

            const invoice = await this.invoiceService.getInvoice(id, user.id);

            if (!invoice) {
                return this.sendError(reply, "Invoice not found", 404);
            }

            return this.sendSuccess(
                reply,
                {
                    invoice,
                    success: true,
                    meta: { timestamp: new Date().toISOString() },
                },
                "Invoice retrieved successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }

    /**
     * Get all invoices for user
     */
    async getUserInvoices(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = await this.invoiceService.getAuthenticatedUser(request);
            const invoices = await this.invoiceService.getUserInvoices(user.id);

            return this.sendSuccess(
                reply,
                {
                    invoices,
                    success: true,
                    meta: { timestamp: new Date().toISOString() },
                },
                "Invoices retrieved successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }

    /**
     * Update invoice
     */
    async updateInvoice(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            // const { id } = request.params;
            const { id } = (request.params as { id: string });
            const invoiceData = updateInvoiceSchema.parse(request.body);
            const user = await this.invoiceService.getAuthenticatedUser(request);

            const invoice = await this.invoiceService.updateInvoice(id, user.id, invoiceData);

            if (!invoice) {
                return this.sendError(reply, "Invoice not found", 404);
            }

            return this.sendSuccess(
                reply,
                {
                    invoice,
                    success: true,
                    meta: { timestamp: new Date().toISOString() },
                },
                "Invoice updated successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }

    /**
     * Delete invoice
     */
    async deleteInvoice(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            // const { id } = request.params;
            const { id } = (request.params as { id: string });
            const user = await this.invoiceService.getAuthenticatedUser(request);

            const success = await this.invoiceService.deleteInvoice(id, user.id);

            if (!success) {
                return this.sendError(reply, "Invoice not found", 404);
            }

            return this.sendSuccess(
                reply,
                {
                    success: true,
                    meta: { timestamp: new Date().toISOString() },
                },
                "Invoice deleted successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }
}