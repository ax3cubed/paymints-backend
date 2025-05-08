import type { FastifyRequest, FastifyReply } from "fastify";
import { BaseController } from "./base.controller";
import { z } from "zod";
import config from "@/config";
import { PaymentService } from "@/services/payment.service";
import { UserService } from "@/services/user.service";
import { PaymentStatus, ServiceType } from "@/entities/Payment";
import { SmartContractService } from "@/services/smartcontract.service";

const getPaymentForAddressSchema = z.object({
    walletAddress: z.string(),
});

const getPaymentFromPaymentHashSchema = z.object({
    paymentHash: z.string(),
});

export const createPaymentSchema = z.object({
    paymentHash: z.string(),
    paymentDescription: z.string().optional(),
    receiver: z.string().optional(),
    sender: z.string().optional(),
    totalAmount: z.string().optional(),
    serviceType: z
        .enum([
            ServiceType.STANDARD,
            ServiceType.CREDIT,
            ServiceType.DAO,
            ServiceType.INVOICE,
            ServiceType.PAYROLL
        ])
        .optional(),
    paymentDate: z.string().optional(),
    paymentStatus: z
        .enum([
            PaymentStatus.FAILED,
            PaymentStatus.PENDING,
            PaymentStatus.SUCCESS,
            PaymentStatus.CANCELLED
        ])
        .optional(),
    paymentSignature: z.string().optional(),
    mintAddress: z.string().optional(),
});


export const createNewPaymentSchema = z.object({
    paymentHash: z.string(),
    paymentDescription: z.string().optional(),
    receiver: z.string(),
    sender: z.string(),
    totalAmount: z.string(),
    serviceType: z
        .enum([
            ServiceType.STANDARD,
            ServiceType.CREDIT,
            ServiceType.DAO,
            ServiceType.INVOICE,
            ServiceType.PAYROLL
        ])
        .optional(),
    paymentDate: z.string().optional(),
    paymentStatus: z
        .enum([
            PaymentStatus.FAILED,
            PaymentStatus.PENDING,
            PaymentStatus.SUCCESS,
            PaymentStatus.CANCELLED
        ])
        .optional(),
    mintAddress: z.string(),
});

export const updatePaymentSchema = z.object({
    paymentHash: z.string(),
    paymentStatus: z
        .enum([
            PaymentStatus.FAILED,
            PaymentStatus.PENDING,
            PaymentStatus.SUCCESS,
            PaymentStatus.CANCELLED
        ])
});


export class PaymentController extends BaseController {
    private paymentService: PaymentService;
    private userService: UserService;
    private smartContractService: SmartContractService;

    constructor(private fastify: any) {
        super();
        this.paymentService = new PaymentService();
        this.userService = new UserService();
        this.smartContractService = new SmartContractService();
    }


    /**
         * Create a new invoice
         */
    async createConcludedPayment(request: FastifyRequest, reply: FastifyReply) {
        try {
            const paymentData = createPaymentSchema.parse(request.body);
            const user = await this.userService.getAuthenticatedUser(request);

            const payment = await this.paymentService.saveConcludedPayment({
                ...paymentData,
                createdBy: user,
            });

            return this.sendSuccess(
                reply,
                {
                    data: { id: payment.id, paymentHash: payment.paymentHash },
                    success: true,
                    meta: { timestamp: new Date().toISOString() },
                },
                "Payment created successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }


    async createNewPayment(request: FastifyRequest, reply: FastifyReply) {
        try {
            const paymentData = createNewPaymentSchema.parse(request.body);
            const user = await this.userService.getAuthenticatedUser(request);

            const transactionDetails = await this.smartContractService.sendToken(paymentData.sender,
                paymentData.receiver,
                paymentData.mintAddress,
                paymentData.totalAmount)

            const payment = await this.paymentService.saveNewPayment({
                ...paymentData,
                paymentSignature: transactionDetails.transaction,
                createdBy: user,
            });

            return this.sendSuccess(
                reply,
                {
                    data: { id: payment.id, paymentHash: payment.paymentHash },
                    success: true,
                    meta: { timestamp: new Date().toISOString() },
                },
                "Payment created successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }


    async updatePaymentFromPaymentHash(request: FastifyRequest, reply: FastifyReply) {
        try {
            const paymentData = updatePaymentSchema.parse(request.body);
            const user = await this.userService.getAuthenticatedUser(request);
            const paymentDataFromPaymentHash = this.paymentService.getPaymentFromPaymentHash(paymentData.paymentHash);

            // if(!user.address === paymentDataFromPaymentHash.)
            const payment = await this.paymentService.updatePayment(
                paymentData.paymentHash,
                paymentData.paymentStatus
            );

            return this.sendSuccess(
                reply,
                {
                    payment,
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
     * Fetch Payments
     */
    async getPaymentFromPaymentHash(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { paymentHash } = getPaymentFromPaymentHashSchema.parse(request.query);
            const transactions = await this.paymentService.getPaymentFromPaymentHash(paymentHash);

            return this.sendSuccess(
                reply,
                { txn: transactions },
                "Operation Successfull"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }

    async getPaymentForAddress(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { walletAddress } = getPaymentForAddressSchema.parse(request.query);
            const transactions = await this.paymentService.getPaymentForAddress(walletAddress);

            return this.sendSuccess(
                reply,
                { txn: transactions },
                "Operation Successfull"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }
}
