import type { FastifyInstance } from "fastify";
import { PayrollController } from "@/controllers/payroll.controller";
import { createSchema, getPayrollsSchema, getPayrolSchema } from "@/schemas/payroll.schema";

export async function payrollRoutes(fastify: FastifyInstance) {
    const payrollController = new PayrollController();

    // Create new invoice
    fastify.post(
        "/",
        { schema: createSchema },
        (request, reply) => payrollController.createPayroll(request, reply)
    );

    // Get specific invoice by ID
    fastify.get(
        "/:id",
        { schema: getPayrolSchema },
        (request, reply) => payrollController.getPayroll(request, reply)
    );

    // Get all invoices for user
    fastify.get(
        "/",
        { schema: getPayrollsSchema },
        (request, reply) => payrollController.getUserPayrolls(request, reply)
    );
}