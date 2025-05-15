import type { FastifyRequest, FastifyReply } from "fastify";
import { InvoiceService } from "../services/invoice.service";
import { BaseController } from "./base.controller";
import { z } from "zod";
import { InvoiceType, InvoiceStatus, InvoiceVisibility } from "../entities/Invoice";
import { SmartContractService } from "@/services/smartcontract.service";
import { generateInvoiceIdentifier } from "@/config/randomidentifier";
import { logger } from "../core/logger";
import { Services } from "@/entities/Services";
import AppDataSource from "@/database";
import { DiscountCodes } from "@/entities/Discount";
import { PaymentService } from "@/services/payment.service";

// Validation schemas
const createInvoiceSchema = z.object({
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
    invoiceStatus: z
        .enum([
            InvoiceStatus.DRAFT,
            InvoiceStatus.PROCESSING,
            InvoiceStatus.COMPLETED,
            InvoiceStatus.OVERDUE
        ])
        .optional(),
    invoiceCategory: z.string().optional(),
    invoiceMintAddress: z.string().min(1),
    currency: z.string(),
    clientName: z.string().optional(),
    clientWallet: z.string().optional(),
    clientEmail: z.string().email().optional(),
    clientAddress: z.string().optional(),
    isClientInformation: z.boolean().optional(),
    isExpirable: z.boolean().optional(),
    dueDate: z.string().optional(),
    discountCodes: z
        .array(
            z.object({
                discountCode: z.string().min(1),
                discountPercent: z.string().regex(/^\d+$/, "Must be a valid percentage"),
                noOfUse: z.number().int().nonnegative(),
            })
        )
        .optional(),
    tipOptionEnabled: z.boolean().optional(),
    invoiceVisibility: z
        .enum([InvoiceVisibility.PRIVATE, InvoiceVisibility.PUBLIC])
        .optional(),
    autoEmailReceipt: z.boolean().optional(),
    QRcodeEnabled: z.boolean().optional(),
    services: z
        .array(
            z.object({
                name: z.string().min(1),
                description: z.string().min(1),
                quantity: z.number().int().positive(),
                price: z.number().positive(),
            })
        )
        .optional(),
    subtotal: z.number().nonnegative().optional(),
    discount: z.number().nonnegative().optional(),
    taxRate: z.number().nonnegative().optional(),
    taxAmount: z.number().nonnegative().optional(),
    totalAmount: z.number().positive(),
});

const updateInvoiceSchema = z.object({
    invoiceNo: z.string().min(1),
    invoiceType: z
        .enum([
            InvoiceType.INVOICE,
            InvoiceType.DONATION,
            InvoiceType.SUBSCRIPTION,
            InvoiceType.CUSTOM,
            InvoiceType.MILESTONE,
        ])
        .optional(),
    invoiceTitle: z.string().min(1).optional(),
    invoiceImage: z.string().url().optional(),
    invoiceDescription: z.string().optional(),
    invoiceStatus: z
        .enum([
            InvoiceStatus.DRAFT,
            InvoiceStatus.PROCESSING,
            InvoiceStatus.COMPLETED,
            InvoiceStatus.OVERDUE
        ])
        .optional(),
    invoiceCategory: z.string().optional(),
    invoiceMintAddress: z.string().optional(),
    currency: z.string(),
    clientName: z.string().optional(),
    clientWallet: z.string().optional(),
    clientEmail: z.string().email().optional(),
    clientAddress: z.string().optional(),
    isClientInformation: z.boolean().optional(),
    isExpirable: z.boolean().optional(),
    dueDate: z.string().datetime().optional(),
    tipOptionEnabled: z.boolean().optional(),
    invoiceVisibility: z
        .enum([InvoiceVisibility.PRIVATE, InvoiceVisibility.PUBLIC])
        .optional(),
    autoEmailReceipt: z.boolean().optional(),
    QRcodeEnabled: z.boolean().optional(),
    discountCodes: z.array(z.string()).optional(),
    services: z.array(z.string()).optional(),
    subtotal: z.number().nonnegative().optional(),
    discount: z.number().nonnegative().optional(),
    taxRate: z.number().nonnegative().optional(),
    taxAmount: z.number().nonnegative().optional(),
    totalAmount: z.number().nonnegative().optional(),
    invoiceTxHash: z.string().optional(),
});

const activateInvoiceSchema = z.object({
    invoiceNo: z.string().min(1),
});

export class InvoiceController extends BaseController {
    private invoiceService: InvoiceService;
    private smartContractService: SmartContractService;
    private paymentService: PaymentService;
    private servicesRepository = AppDataSource.getRepository(Services);
    private discountRepository = AppDataSource.getRepository(DiscountCodes);

    constructor() {
        super();
        this.invoiceService = new InvoiceService();
        this.smartContractService = new SmartContractService();
        this.paymentService = new PaymentService();
    }

    /**
     * Create a new invoice
     */
    async createInvoice(request: FastifyRequest, reply: FastifyReply) {
        try {
            console.log(request.body);
            const invoiceData = createInvoiceSchema.parse(request.body);
            const user = await this.invoiceService.getAuthenticatedUser(request);
            const invoiceId = generateInvoiceIdentifier();
            logger.info({ requestId: request.requestId, userId: user._id }, "Creating invoice");

            const serviceIds: string[] = [];
            if (invoiceData.services?.length) {
                for (const item of invoiceData.services) {
                    try {
                        const newService = this.servicesRepository.create({
                            title: item.name,
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.price,
                            invoice: invoiceId, 
                        });

                        const savedService = await this.servicesRepository.save(newService);
                        serviceIds.push(savedService._id.toString());
                    } catch (error) {
                        logger.error({ err: error }, "Service Creation Failed");
                        throw new Error("Failed to create Service");
                    }
                }
            }

            // Create DiscountCodes entities
            const discountIds: string[] = [];
            if (invoiceData.discountCodes?.length) {
                for (const item of invoiceData.discountCodes) {
                    try {
                        const newDiscount = this.discountRepository.create({
                            discountCode: item.discountCode,
                            discountPercent: item.discountPercent,
                            noOfUse: item.noOfUse,
                            invoice: invoiceId, // Temporarily store invoiceNo
                        });

                        const savedDiscount = await this.discountRepository.save(newDiscount);
                        discountIds.push(savedDiscount._id.toString());
                    } catch (error) {
                        logger.error({ err: error }, "Discount Code Creation Failed");
                        throw new Error("Failed to create Discount Code");
                    }
                }
            }

            const invoice = await this.invoiceService.createInvoice({
                ...invoiceData,
                invoiceNo: invoiceId,
                services: serviceIds,
                discountCodes: discountIds,
                createdBy: user._id.toString()
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
    async getInvoice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { invoiceNo } = request.params as { invoiceNo: string };
            const user = await this.invoiceService.getAuthenticatedUser(request);
            logger.info({ requestId: request.requestId, userId: user._id, invoiceNo }, "Retrieving invoice");

            const invoice = await this.invoiceService.getInvoice(user._id.toString(), invoiceNo);
            // const invoicePayersFromSC = invoice.invoiceTxHash
            //     ? await this.smartContractService.getInvoicePayments(invoice.invoiceTxHash)
            //     : undefined;

            const invoicePayersFromSC = await this.paymentService.getPaymentForService('invoice', invoice.invoiceNo);

            const response = {
                ...invoice,
                invoicePays: invoicePayersFromSC.map((p) => ({
                    payer: p.sender,
                    amount: p.totalAmount,
                    timestamp: Number(p.createdAt),
                })),
            };

            return this.sendSuccess(
                reply,
                {
                    invoice: response,
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
            logger.info({ requestId: request.requestId, userId: user._id }, "Retrieving user invoices");

            const invoices = await this.invoiceService.getUserInvoices(user._id.toString());

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
    async updateInvoice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { invoiceNo } = request.params as { invoiceNo: string };
            const invoiceData = updateInvoiceSchema.parse(request.body);
            const user = await this.invoiceService.getAuthenticatedUser(request);
            logger.info({ requestId: request.requestId, userId: user._id, invoiceNo }, "Updating invoice");

            if (invoiceData.invoiceStatus === InvoiceStatus.COMPLETED) {
                await this.smartContractService.closeInvoice(
                    user.address,
                    invoiceData.invoiceTxHash || "",
                    invoiceData.invoiceMintAddress || ""
                );
            }

            const newInvoiceData = {
                ...invoiceData,
                createdBy: user._id.toString(),
            };

            const invoice = await this.invoiceService.updateInvoice(invoiceNo, user._id.toString(), newInvoiceData);

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
     * Activate invoice
     */
    async activateInvoice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const invoiceData = activateInvoiceSchema.parse(request.body);
            const user = await this.invoiceService.getAuthenticatedUser(request);
            logger.info({ requestId: request.requestId, userId: user._id, invoiceNo: invoiceData.invoiceNo }, "Activating invoice");

            const inv = await this.invoiceService.getInvoice(user._id.toString(), invoiceData.invoiceNo);

            const invoiceHash = await this.smartContractService.createInvoice(
                user.address,
                invoiceData.invoiceNo,
                inv.totalAmount?.toString(),
                inv.invoiceDescription || "",
                inv.dueDate || "",
                inv.invoiceMintAddress
            );

            const invoice = await this.invoiceService.updateInvoice(inv.invoiceNo, user._id.toString(), {
                invoiceNo: inv.invoiceNo,
                invoiceStatus: InvoiceStatus.PROCESSING,
                invoiceTxHash: invoiceHash?.transaction || ""
            });

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
     * Complete invoice
     */
    async completeInvoice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const invoiceData = activateInvoiceSchema.parse(request.body);
            const user = await this.invoiceService.getAuthenticatedUser(request);
            logger.info({ requestId: request.requestId, userId: user._id, invoiceNo: invoiceData.invoiceNo }, "Completed invoice");

            const inv = await this.invoiceService.getInvoice(user._id.toString(), invoiceData.invoiceNo);

            const invoiceHash = await this.smartContractService.closeInvoice(
                user.address,
                invoiceData.invoiceNo,
                inv.invoiceMintAddress
            );

            const invoice = await this.invoiceService.updateInvoice(inv.invoiceNo, user._id.toString(), {
                invoiceNo: inv.invoiceNo,
                invoiceStatus: InvoiceStatus.COMPLETED,
                invoiceTxHash: invoiceHash.transaction
            });

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
     * Overdue invoice
     */
    async overDueInvoice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const invoiceData = activateInvoiceSchema.parse(request.body);
            const user = await this.invoiceService.getAuthenticatedUser(request);
            logger.info({ requestId: request.requestId, userId: user._id, invoiceNo: invoiceData.invoiceNo }, "Overdue invoice");

            const inv = await this.invoiceService.getInvoice(user._id.toString(), invoiceData.invoiceNo);

            // const invoiceHash = await this.smartContractService.createInvoice(
            //     user.address,
            //     invoiceData.invoiceNo,
            //     inv.totalAmount?.toString(),
            //     inv.invoiceDescription || "",
            //     inv.dueDate || "",
            //     inv.invoiceMintAddress
            // );

            const invoice = await this.invoiceService.updateInvoice(inv.invoiceNo, user._id.toString(), {
                invoiceNo: inv.invoiceNo,
                invoiceStatus: InvoiceStatus.OVERDUE
            });

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
    async deleteInvoice(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { invoiceNo } = request.params as { invoiceNo: string };
            const user = await this.invoiceService.getAuthenticatedUser(request);
            logger.info({ requestId: request.requestId, userId: user._id, invoiceNo }, "Deleting invoice");

            await this.invoiceService.deleteInvoice(invoiceNo, user._id.toString());

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