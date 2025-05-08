import { Payroll, PayrollStatus, PaymentType, PayrollVisibility } from "../entities/Payroll";
import { Recipient } from "../entities/Recipient";
import { User } from "../entities/User";
import { AppDataSource } from "../database";
import {
    NotFoundError,
    AuthorizationError,
    ValidationError,
} from "../core/errors";
import { logger } from "../core/logger";
import type { JwtUser } from "../types/auth.types";
import { FastifyRequest } from "fastify";

export class PayrollService {
    private payrollRepository = AppDataSource.getRepository(Payroll);
    private recipientRepository = AppDataSource.getRepository(Recipient);
    private userRepository = AppDataSource.getRepository(User);

    /**
     * Get authenticated user
     */
    async getAuthenticatedUser(request: FastifyRequest): Promise<User> {
        try {
            const jwtUser = await request.jwtVerify<JwtUser>();
            const user = await this.userRepository.findOne({
                where: { id: jwtUser.id },
            });

            if (!user) {
                throw new NotFoundError("User", jwtUser.id);
            }

            return user;
        } catch (error) {
            logger.error({ error }, "Failed to authenticate user from token");
            throw new AuthorizationError("Invalid or expired token");
        }
    }

    /**
     * Find payroll by ID
     */
    async findById(id: number, relations: string[] = []): Promise<Payroll | null> {
        const payroll = await this.payrollRepository.findOne({
            where: { id: id },
            relations: [...relations, "createdBy", "recipients"],
        });

        return payroll;
    }


    async getUserPayrolls(userId: number): Promise<Payroll[]> {
        try {
          const payrolls = await this.payrollRepository.find({
            where: { createdBy: { id: userId } },
            relations: ["createdBy", "recipients"],
            order: { createdAt: "DESC" },
          });
    
          return payrolls;
        } catch (error) {
          logger.error({ err: error }, "Failed to fetch user invoices");
          throw error;
        }
      }

    /**
     * Create a new payroll
     */
    async createPayroll(payrollData: Partial<Payroll>): Promise<Payroll> {
        try {
            // Validate required fields
            if (!payrollData.payrollType || !payrollData.payrollTitle
                || !payrollData.createdBy || !payrollData.recipients) {
                throw new ValidationError("Required payroll fields are missing");
            }

            const payroll = this.payrollRepository.create({
                ...payrollData,
                payrollStatus: payrollData.payrollStatus || PayrollStatus.DRAFT,
                payrollImage: payrollData.payrollImage || "",
                payrollDescription: payrollData.payrollDescription || "",
                subtotal: payrollData.subtotal || 0,
                enableVesting: payrollData.enableVesting || false,
                vestUntil: payrollData.vestUntil || '',
                totalAmount: payrollData.totalAmount || 0,
                stablecoinSymbol: payrollData.stablecoinSymbol || "USDC",
                tokenAddress: payrollData.tokenAddress || "",
                transactionHash: payrollData.transactionHash || "",
                decimals: payrollData.decimals || 6,
                paymentType: payrollData.paymentType || PaymentType.CRYPTO,
                recipients: payrollData.recipients || [],
            });

            await this.payrollRepository.save(payroll);

            payrollData.recipients.map(async (recipient) => {
                try {
                    const newRecipient = this.recipientRepository.create({
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
                        txHash: recipient.txHash || "",
                        payroll: payroll
                    })

                    await this.recipientRepository.save(newRecipient);
                } catch (error) {
                    logger.error({ err: error }, "Recipient Creation Failed");
                }
            })
            logger.info({ payrollId: payroll.id }, "Payroll created successfully");

            return payroll;
        } catch (error) {
            logger.error({ err: error }, "Payroll Creation Failed");
            throw error;
        }
    }

    /**
     * Modify an existing payroll
     */
    async modifyPayroll(id: number, userId: number, payrollData: Partial<Payroll>): Promise<Payroll> {
        try {
            const payroll = await this.findById(id, ["createdBy"]);

            if (!payroll) {
                throw new NotFoundError("Payroll", id);
            }

            if (payroll.createdBy.id !== userId) {
                throw new AuthorizationError("Not authorized to modify this payroll");
            }

            // Update allowed fields
            const updatableFields: (keyof Payroll)[] = [
                "payrollType",
                "payrollTitle",
                "payrollImage",
                "payrollDescription",
                "payrollStatus",
                "enableVesting",
                "vestUntil",
                "subtotal",
                "totalAmount",
                "payrollPeriod",
                "payCycleStart",
                "payCycleEnd",
                "stablecoinSymbol",
                "chain",
                "tokenAddress",
                "decimals",
                "network",
                "transactionHash",
                "paymentType"
            ];

            for (const field of updatableFields) {
                if (payrollData[field] !== undefined) {
                    (payroll[field] as any) = payrollData[field];
                }
            }

            await this.payrollRepository.save(payroll);
            logger.info({ payrollId: payroll.id }, "Payroll updated successfully");

            return payroll;
        } catch (error) {
            logger.error({ err: error }, "Payroll Update Failed");
            throw error;
        }
    }

    /**
     * Delete a payroll
     */
    async deletePayroll(id: number, userId: number): Promise<boolean> {
        try {
            const payroll = await this.findById(id, ["createdBy"]);

            if (!payroll) {
                throw new NotFoundError("Payroll", id);
            }

            if (payroll.createdBy.id !== userId) {
                throw new AuthorizationError("Not authorized to delete this payroll");
            }

            await this.payrollRepository.remove(payroll);
            logger.info({ payrollId: id }, "Payroll deleted successfully");

            return true;
        } catch (error) {
            logger.error({ err: error }, "Payroll Deletion Failed");
            throw error;
        }
    }

    /**
     * Add a recipient to a payroll
     */
    async addRecipient(payrollId: number, userId: number, recipientData: Partial<Recipient>): Promise<Recipient> {
        try {
            const payroll = await this.findById(payrollId, ["createdBy", "recipients"]);

            if (!payroll) {
                throw new NotFoundError("Payroll", payrollId);
            }

            if (payroll.createdBy.id !== userId) {
                throw new AuthorizationError("Not authorized to modify this payroll");
            }

            // Validate required recipient fields
            if (!recipientData.name || !recipientData.walletAddress || recipientData.totalAmount === undefined) {
                throw new ValidationError("Required recipient fields are missing");
            }

            const recipient = this.recipientRepository.create({
                ...recipientData,
                payroll,
            });

            await this.recipientRepository.save(recipient);

            // Update payroll totals
            payroll.subtotal = (payroll.subtotal || 0) + recipient.totalAmount;
            payroll.totalAmount = payroll.subtotal; // Adjust if additional calculations needed
            await this.payrollRepository.save(payroll);

            logger.info({ payrollId, recipientId: recipient.id }, "Recipient added successfully");

            return recipient;
        } catch (error) {
            logger.error({ err: error }, "Recipient Addition Failed");
            throw error;
        }
    }

    /**
     * Remove a recipient from a payroll
     */
    async removeRecipient(payrollId: number, recipientId: number, userId: number): Promise<boolean> {
        try {
            const payroll = await this.findById(payrollId, ["createdBy", "recipients"]);

            if (!payroll) {
                throw new NotFoundError("Payroll", payrollId);
            }

            if (payroll.createdBy.id !== userId) {
                throw new AuthorizationError("Not authorized to modify this payroll");
            }

            const recipient = await this.recipientRepository.findOne({
                where: { id: recipientId, payroll: { id: payrollId } },
            });

            if (!recipient) {
                throw new NotFoundError("Recipient", recipientId);
            }

            // Update payroll totals
            payroll.subtotal = (payroll.subtotal || 0) - recipient.totalAmount;
            payroll.totalAmount = payroll.subtotal; // Adjust if additional calculations needed

            await this.recipientRepository.remove(recipient);
            await this.payrollRepository.save(payroll);

            logger.info({ payrollId, recipientId }, "Recipient removed successfully");

            return true;
        } catch (error) {
            logger.error({ err: error }, "Recipient Removal Failed");
            throw error;
        }
    }
}