import type { FastifyRequest, FastifyReply } from "fastify";
import { InvoiceService } from "../services/invoice.service";
import { BaseController } from "./base.controller";
import { z } from "zod";
import { InvoiceType, InvoiceStatus, InvoiceVisibility } from "../entities/Invoice";
import { SmartContractService } from "@/services/smartcontract.service";
import { generateInvoiceIdentifier } from "@/config/randomidentifier";

// Validation schemas (unchanged from previous implementation)
const createInvoiceSchema = z.object({

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
    totalAmount: z.number(),
});

const updateInvoiceSchema = z.object({
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
    invoiceMintAddress: z.string(),
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
    invoiceTxHash: z.string(),
});

const activateInvoiceSchema = z.object({
    invoiceNo: z.string(),
    invoiceStatus: z
        .enum([
            InvoiceStatus.DRAFT,
            InvoiceStatus.PROCESSING,
            InvoiceStatus.COMPLETED,
        ])
});

export class InvoiceController extends BaseController {
    private invoiceService: InvoiceService;
    private smartContractService: SmartContractService;

    constructor() {
        super();
        this.invoiceService = new InvoiceService();
        this.smartContractService = new SmartContractService();
    }

    /**
     * Create a new invoice
     */
    async createInvoice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const invoiceData = createInvoiceSchema.parse(request.body);
            const user = await this.invoiceService.getAuthenticatedUser(request);
            const invoiceId = generateInvoiceIdentifier()


            const invoice = await this.invoiceService.createInvoice({
                ...invoiceData,
                invoiceNo: invoiceId,
                createdBy: user
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

            const invoicePayersFromSC = await this.smartContractService.getInvoicePayments(invoice.invoiceTxHash)

            const response = {
                ...invoice,
                invoicePays: invoicePayersFromSC
            }

            return this.sendSuccess(
                reply,
                {
                    response,
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

            if (invoiceData.invoiceStatus === InvoiceStatus.COMPLETED) {
                const invoiceHash = await this.smartContractService.closeInvoice(user.address, invoiceData.invoiceTxHash, invoiceData.invoiceMintAddress)
            }

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


    async activateInvoice(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            const invoiceData = activateInvoiceSchema.parse(request.body);
            const user = await this.invoiceService.getAuthenticatedUser(request);

            const inv = await this.invoiceService.getInvoice(invoiceData.invoiceNo, user.id);

            var invoiceHas;

            if (!inv) {
                return this.sendError(reply, "Invoice not found", 404);
            }

            if (invoiceData.invoiceStatus === InvoiceStatus.COMPLETED) {
                const invoiceHash = await this.smartContractService.closeInvoice(user.address, inv.invoiceTxHash, inv.invoiceMintAddress)
                invoiceHas = invoiceHash;
            }

            if (invoiceData.invoiceStatus === InvoiceStatus.PROCESSING) {


                const invoiceHash = await this.smartContractService.createInvoice(
                    user.address,
                    invoiceData.invoiceNo,
                    inv.totalAmount?.toString(),
                    inv.invoiceDescription || '',
                    inv.dueDate || '',
                    inv.invoiceMintAddress
                )
                invoiceHas = invoiceHash;
            }

            const invoice = await this.invoiceService.updateInvoice(inv._id, user.id, {
                invoiceStatus: invoiceData.invoiceStatus,
                invoiceTxHash: invoiceHas?.transaction
            });

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