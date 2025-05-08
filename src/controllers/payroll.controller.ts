import type { FastifyRequest, FastifyReply } from "fastify";
import { BaseController } from "./base.controller";
import { z } from "zod";
import { PayrollService } from "@/services/payroll.service";
import { PaymentType, PayrollStatus } from "@/entities/Payroll";
import { SmartContractService } from "@/services/smartcontract.service";
import { logger } from "@/core/logger";

// Validation schemas (unchanged from previous implementation)
const createPayrollSchema = z.object({
    payrollType: z.string(),
    payrollTitle: z.string(),
    payrollImage: z.string().optional(),
    payrollDescription: z.string().optional(),
    payrollStatus: z.nativeEnum(PayrollStatus).optional(),
    enableVesting: z.boolean(),
    vestUntil: z.string(), // ISO date
    subtotal: z.number(),
    totalAmount: z.number(),
    payrollPeriod: z.string().optional(),
    payCycleStart: z.string().optional(),
    payCycleEnd: z.string().optional(),
    stablecoinSymbol: z.string().optional().default("USDC"),
    chain: z.string().optional(),
    tokenAddress: z.string(),
    decimals: z.number().optional().default(6),
    network: z.string().optional(),
    transactionHash: z.string().optional(),
    paymentType: z.nativeEnum(PaymentType).optional().default(PaymentType.CRYPTO),
    recipients: z.array(z.any()).optional(), // Use `createRecipientSchema` here if strict typing needed
});

const updatePayrollSchema = createPayrollSchema.partial();

const createRecipientSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    walletAddress: z.string(),
    payType: z.string(),
    grossPay: z.string(),
    netPay: z.string(),
    bonuses: z.string(),
    deductions: z.string(),
    paid: z.string(),
    totalAmount: z.number(),
    txHash: z.string(),
});

export class PayrollController extends BaseController {
    private payrollService: PayrollService;
    private smartCOntractService: SmartContractService

    constructor() {
        super();
        this.payrollService = new PayrollService();
        this.smartCOntractService = new SmartContractService();
    }

    /**
     * Create a new invoice
     */
    async createPayroll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const payrollData = createPayrollSchema.parse(request.body);
            const user = await this.payrollService.getAuthenticatedUser(request);

            payrollData.recipients?.map(async (recipient) => {
                try {
                    const newRecipient = {
                        name: recipient.name,
                        email: recipient.email,
                        walletAddress: recipient.walletAddress,
                        payType: recipient.payType,
                        grossPay: recipient.grossPay,
                        netPay: recipient.netPay,
                        bonuses: recipient.bonuses,
                        deductions: recipient.deductions,
                        paid: recipient.paid,
                        totalAmount: recipient.totalAmount,
                        txHash: recipient.txHash || ""
                    }

                    await this.smartCOntractService.createVesting(user.address, newRecipient.walletAddress, payrollData.tokenAddress,
                        newRecipient.totalAmount, payrollData.enableVesting, payrollData.vestUntil
                    )
                } catch (error) {
                    logger.error({ err: error }, "Recipient Creation Failed");
                }
            })

            const invoice = await this.payrollService.createPayroll({
                ...payrollData,
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
    async getPayroll(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            //   const { id } = request.params;
            const { id } = (request.params as { id: number });
            const user = await this.payrollService.getAuthenticatedUser(request);

            const payroll = await this.payrollService.findById(id);

            if (!payroll) {
                return this.sendError(reply, "Invoice not found", 404);
            }

            return this.sendSuccess(
                reply,
                {
                    payroll,
                    success: true,
                    meta: { timestamp: new Date().toISOString() },
                },
                "Payroll retrieved successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }

    /**
     * Get all invoices for user
     */
    async getUserPayrolls(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = await this.payrollService.getAuthenticatedUser(request);
            const payrolls = await this.payrollService.getUserPayrolls(user.id);

            return this.sendSuccess(
                reply,
                {
                    payrolls,
                    success: true,
                    meta: { timestamp: new Date().toISOString() },
                },
                "Payrolls retrieved successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }


}