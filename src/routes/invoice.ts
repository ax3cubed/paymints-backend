import type { FastifyInstance } from "fastify";

import {
    createInvoiceSchema,
    getInvoiceSchema,
    getInvoicesSchema,
    updateInvoiceSchema,
    deleteInvoiceSchema,
} from "@/schemas/invoice.schema";
import { InvoiceController } from "@/controllers/invoice.controller";

export async function invoiceRoutes(fastify: FastifyInstance) {
    const invoiceController = new InvoiceController();

    // Create new invoice
    fastify.post(
        "/",
        { schema: createInvoiceSchema },
        (request, reply) => invoiceController.createInvoice(request, reply)
    );

    // Get specific invoice by ID
    fastify.get(
        "/:id",
        { schema: getInvoiceSchema },
        (request, reply) => invoiceController.getInvoice(request, reply)
    );

    // Get all invoices for user
    fastify.get(
        "/",
        { schema: getInvoicesSchema },
        (request, reply) => invoiceController.getUserInvoices(request, reply)
    );

    // Update invoice
    fastify.put(
        "/:id",
        { schema: updateInvoiceSchema },
        (request, reply) => invoiceController.updateInvoice(request, reply)
    );

    // Delete invoice
    fastify.delete(
        "/:id",
        { schema: deleteInvoiceSchema },
        (request, reply) => invoiceController.deleteInvoice(request, reply)
    );
}