import type { FastifyInstance } from "fastify"
import { getTransactionSchema } from "@/schemas/transaction.schema"
import { TransactionController } from "@/controllers/transaction.controller"

export async function txnRoutes(fastify: FastifyInstance) {
  const transactionController = new TransactionController(fastify)

  // Fetch Transaction
  fastify.post("/transactions", { schema: getTransactionSchema }, (request, reply) => transactionController.getTransaction(request, reply))

}

