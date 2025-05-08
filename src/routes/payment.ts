import { PaymentController } from "@/controllers/payment.controller";
import { createConcludedPaymentSchema, createNewInvoicePaymentSchema, createNewPaymentSchema, getPaymentForAddressSchema, getPaymentFromPaymentHashSchema, updatePaymentSchema } from "@/schemas/payment.schema";

import type { FastifyInstance } from "fastify";


export async function paymentRoutes(fastify: FastifyInstance) {
    const paymentController = new PaymentController(fastify);

    // Create new invoice
    fastify.post(
        "/",
        { schema: createConcludedPaymentSchema },
        (request, reply) => paymentController.createConcludedPayment(request, reply)
    );

    fastify.post(
        "/new",
        { schema: createNewInvoicePaymentSchema },
        (request, reply) => paymentController.createNewPayment(request, reply)
    );

    fastify.post(
        "/invoice/new",
        { schema: createNewInvoicePaymentSchema },
        (request, reply) => paymentController.createNewPayment(request, reply)
    );


    // Get specific invoice by ID
    fastify.get(
        "/paymentsForAddress",
        { schema: getPaymentForAddressSchema },
        (request, reply) => paymentController.getPaymentForAddress(request, reply)
    );

    // Get all invoices for user
    fastify.get(
        "/paymentFromPaymentHash",
        { schema: getPaymentFromPaymentHashSchema },
        (request, reply) => paymentController.getPaymentFromPaymentHash(request, reply)
    );

    // Update invoice
    fastify.put(
        "/updatePaymentData",
        { schema: updatePaymentSchema },
        (request, reply) => paymentController.updatePaymentFromPaymentHash(request, reply)
    );
}