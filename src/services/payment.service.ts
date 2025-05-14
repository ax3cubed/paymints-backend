import { generatePaymentHash } from '@/config/paymenthash';
import { NotFoundError, ValidationError } from '../core/errors';
import { logger } from '../core/logger';
import config from '@/config';
import AppDataSource from '@/database';
import { Payment } from '@/entities/Payment';
import { address, createRpc, createSolanaRpcFromTransport, TransactionError, TransactionForFullMetaInnerInstructionsParsed } from '@solana/kit';
import { a } from 'vitest/dist/chunks/suite.B2jumIFP';
import { z } from 'zod';


interface PaymentResponse {
    id: number;
    paymentHash: string;
    paymentDescription: string;
    receiver: string;
    sender: string;
    paymentStatus: string;
    totalAmount: string;
    serviceType: string;
    serviceId: string;
    paymentDate: string;
    paymentSignature: string;
    mintAddress: string;
    createdAt: string;
    updatedAt: string;
}

export enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    CANCELLED = 'cancelled'
}

export enum ServiceType {
    INVOICE = "invoice",
    PAYROLL = "payroll",
    DAO = "DAO",
    CREDIT = "credit",
}


export class PaymentService {
    private paymentInventory = AppDataSource.getRepository(Payment);

    /* Already concluded payment to be saved on the database */
    async saveConcludedPayment(paymentData: Partial<Payment>): Promise<Payment> {
        try {
            const newPaymentHash = generatePaymentHash();
            // Validate required fields
            if (!paymentData.paymentSignature || !paymentData.totalAmount || !paymentData.sender ||
                !paymentData.mintAddress || !paymentData.paymentStatus || !paymentData.serviceType) {
                throw new ValidationError("Required invoice fields are missing");
            }

            // Check if invoice number already exists
            const existingInvoice = await this.paymentInventory.findOne({
                where: { paymentSignature: paymentData.paymentSignature },
            });

            if (existingInvoice) {
                throw new ValidationError("Invoice with this number already exists");
            }

            const payment = this.paymentInventory.create({
                ...paymentData,
                paymentHash: newPaymentHash
            });

            await this.paymentInventory.save(payment);
            logger.info({ paymentHash: payment.paymentHash }, "Invoice created successfully");

            return payment;
        } catch (error) {
            logger.error({ err: error }, "Invoice Creation Failed");
            throw error;
        }

    }
    async saveNewPayment(paymentData: Partial<Payment>): Promise<Payment> {
        try {
            const newPaymentHash = generatePaymentHash();
            // Validate required fields
            if (!paymentData.paymentSignature || !paymentData.totalAmount || !paymentData.sender ||
                !paymentData.mintAddress || !paymentData.paymentStatus || !paymentData.serviceType) {
                throw new ValidationError("Required invoice fields are missing");
            }

            // Check if invoice number already exists
            const existingInvoice = await this.paymentInventory.findOne({
                where: { paymentSignature: paymentData.paymentSignature },
            });

            if (existingInvoice) {
                throw new ValidationError("Invoice with this number already exists");
            }

            const payment = this.paymentInventory.create({
                ...paymentData,
                paymentHash: newPaymentHash
            });

            await this.paymentInventory.save(payment);
            logger.info({ paymentHash: payment.paymentHash }, "Invoice created successfully");

            return payment;
        } catch (error) {
            logger.error({ err: error }, "Invoice Creation Failed");
            throw error;
        }
    }


    async getPaymentFromPaymentHash(paymentHash: string): Promise<PaymentResponse> {
        try {

            const payment = await this.paymentInventory.findOne({
                where: { paymentHash: paymentHash }
            });

            if (!payment) {
                throw new NotFoundError(`Payment with hash ${paymentHash} not found`);
            }

            const response: PaymentResponse = {
                id: payment.id,
                paymentHash: payment.paymentHash || '',
                paymentDescription: payment.paymentDescription || '',
                receiver: payment.receiver?.toString() || '',
                sender: payment.sender || '',
                paymentStatus: payment.paymentStatus || '',
                totalAmount: payment.totalAmount || '',
                serviceType: payment.serviceType || '',
                serviceId: payment.serviceId || "",
                paymentDate: payment.paymentDate || '',
                paymentSignature: payment.paymentSignature || '',
                mintAddress: payment.mintAddress || '',
                createdAt: payment.createdAt?.toISOString?.() || '',
                updatedAt: payment.updatedAt?.toISOString?.() || '',
            };

            return response;
        } catch (err) {
            logger.error('Failed to fetch payment:', err);
            throw new Error('Failed to fetch payment. Please check the address.');
        }
    }


    async getPaymentForAddress(walletAddress: string): Promise<PaymentResponse[]> {
        try {
            const mongoRepo = this.paymentInventory.manager.getMongoRepository(Payment);
            const allPayment = await mongoRepo.find({
                where: {
                    // @ts-ignore — bypass TypeScript check safely for MongoDB
                    $or: [
                        { sender: walletAddress },
                        { receiver: walletAddress }
                    ]
                }
            });

            const fetchedTxns = await Promise.all(
                allPayment.map(async (payment) => {
                    try {
                        if (!payment) {
                            throw new NotFoundError(`Payment not found`);
                        }

                        const response: PaymentResponse = {
                            id: payment.id,
                            paymentHash: payment.paymentHash || '',
                            paymentDescription: payment.paymentDescription || '',
                            receiver: payment.receiver?.toString() || '',
                            sender: payment.sender || '',
                            paymentStatus: payment.paymentStatus || '',
                            totalAmount: payment.totalAmount || '',
                            serviceType: payment.serviceType || '',
                            serviceId: payment.serviceId || "",
                            paymentDate: payment.paymentDate || '',
                            paymentSignature: payment.paymentSignature || '',
                            mintAddress: payment.mintAddress || '',
                            createdAt: payment.createdAt?.toISOString?.() || '',
                            updatedAt: payment.updatedAt?.toISOString?.() || '',
                        };

                        return response;
                    } catch (err) {
                        logger.warn(`Error parsing payment ${payment.paymentHash}:`, err);
                        return null;
                    }
                })
            );

            // Filter out null responses
            const filteredPayments = fetchedTxns.filter(
                (tx): tx is PaymentResponse => tx !== null
            );

            return filteredPayments;
        } catch (err) {
            logger.error('Failed to fetch payments:', err);
            throw new Error('Failed to fetch payments. Please check the address.');
        }
    }

    async getPaymentForService(serviceType: string, serviceId: string): Promise<PaymentResponse[]> {
        try {
            const mongoRepo = this.paymentInventory.manager.getMongoRepository(Payment);
            const allPayment = await mongoRepo.find({
                where: {
                    // @ts-ignore — bypass TypeScript check safely for MongoDB
                    $and: [
                        { serviceType: serviceType },
                        { serviceId: serviceId }
                    ]
                }
            });

            const fetchedTxns = await Promise.all(
                allPayment.map(async (payment) => {
                    try {
                        if (!payment) {
                            throw new NotFoundError(`Payment not found`);
                        }

                        const response: PaymentResponse = {
                            id: payment.id,
                            paymentHash: payment.paymentHash || '',
                            paymentDescription: payment.paymentDescription || '',
                            receiver: payment.receiver?.toString() || '',
                            sender: payment.sender || '',
                            paymentStatus: payment.paymentStatus || '',
                            totalAmount: payment.totalAmount || '',
                            serviceType: payment.serviceType || '',
                            serviceId: payment.serviceId || "",
                            paymentDate: payment.paymentDate || '',
                            paymentSignature: payment.paymentSignature || '',
                            mintAddress: payment.mintAddress || '',
                            createdAt: payment.createdAt?.toISOString?.() || '',
                            updatedAt: payment.updatedAt?.toISOString?.() || '',
                        };

                        return response;
                    } catch (err) {
                        logger.warn(`Error parsing payment ${payment.paymentHash}:`, err);
                        return null;
                    }
                })
            );

            // Filter out null responses
            const filteredPayments = fetchedTxns.filter(
                (tx): tx is PaymentResponse => tx !== null
            );

            return filteredPayments;
        } catch (err) {
            logger.error('Failed to fetch payments:', err);
            throw new Error('Failed to fetch payments. Please check the address.');
        }
    }

    async updatePayment(paymentHash: string, paymentStatus: PaymentStatus ): Promise<PaymentResponse> {
        try {
            const payment = await this.paymentInventory.findOne({
                where: { paymentHash: paymentHash }
            });

            if (!payment) {
                throw new NotFoundError(`Payment with hash ${paymentHash} not found`);
            }

            // Update allowed fields
            // const updatableFields: (keyof Payment)[] = [
            //     "paymentStatus"
            // ];


            if (paymentStatus !== undefined) {
                (payment['paymentStatus'] as any) = paymentStatus;
            }

            await this.paymentInventory.save(payment);
            logger.info({ paymentHash: payment.paymentHash }, "Payment updated successfully");

            const response: PaymentResponse = {
                id: payment.id,
                paymentHash: payment.paymentHash || '',
                paymentDescription: payment.paymentDescription || '',
                receiver: payment.receiver?.toString() || '',
                sender: payment.sender || '',
                paymentStatus: payment.paymentStatus || '',
                totalAmount: payment.totalAmount || '',
                serviceType: payment.serviceType || '',
                serviceId: payment.serviceId || "",
                paymentDate: payment.paymentDate || '',
                paymentSignature: payment.paymentSignature || '',
                mintAddress: payment.mintAddress || '',
                createdAt: payment.createdAt?.toISOString?.() || '',
                updatedAt: payment.updatedAt?.toISOString?.() || '',
            };

            return response;
        } catch (error) {
            logger.error({ err: error }, "Payment Update Failed");
            throw error;
        }
    }

}
