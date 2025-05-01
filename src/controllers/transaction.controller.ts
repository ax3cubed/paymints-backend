import type { FastifyRequest, FastifyReply } from "fastify";
import { BaseController } from "./base.controller";
import { z } from "zod";
import config from "@/config";
import { TransactionService } from "@/services/transaction.service";

const getTransactionSchema = z.object({
    address: z.string(),
});

export class TransactionController extends BaseController {
    private transactionService: TransactionService;

    constructor(private fastify: any) {
        super();
        this.transactionService = new TransactionService();
    }
    /**
     * Fetch Trasnactions
     */
    async getTransaction(request: FastifyRequest, reply: FastifyReply) {
        try {
            console.log('--------------------------------------------')
            const { address } = getTransactionSchema.parse(request.query);
            console.log(address)
            console.log('--------------------------------------------')
            const transactions = await this.transactionService.getTransactions(address);
            console.log('--------------------------------------------')


            return this.sendSuccess(
                reply,
                { txn: transactions },
                "Transaction Fetch Successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }
}
