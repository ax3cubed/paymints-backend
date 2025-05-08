import "reflect-metadata";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { initializeDatabase } from "./database";
import { userRoutes } from "./routes/user";
import { requestLogger } from "./middleware/request-logger.middleware";
import { authenticate } from "./middleware/auth.middleware";
import config from "./config";
import { logger } from "./core/logger";
import { ResponseHandler } from "./core/response-handler";
import { AppError, ErrorCodes } from "./core/errors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import {
	isSwaggerRoute,
	swaggerOptions,
	swaggerUiOptions,
} from "./config/swagger";
import { authRoutes } from "./routes/auth";
import { invoiceRoutes } from "./routes/invoice";
import { url } from "inspector";

import { paymentRoutes } from "./routes/payment";
import { payrollRoutes } from "./routes/payroll";
import { txnRoutes } from "./routes/transaction";

// Create Fastify instance
const server: FastifyInstance = Fastify({
	logger: false, // We use our custom logger
	trustProxy: true,
});

// Register plugins
server.register(fastifyCors, {
	origin: config.cors.origin,
	methods: config.cors.methods,
	credentials: true,
});

server.register(fastifyJwt, {
	secret: config.auth.jwtSecret,
	sign: {
		expiresIn: config.auth.jwtExpiresIn,
	},
});

// Register Swagger plugins
server.register(fastifySwagger, swaggerOptions);
server.register(fastifySwaggerUi, swaggerUiOptions);

// Register request logger middleware
server.addHook("onRequest", requestLogger);

// Add authentication hook
server.addHook("onRequest", async (request, reply) => {
	try {
		// Skip authentication for auth routes, health check, and swagger documentation
		if (
			request.url &&
			(request.url.startsWith(`${config.app.apiPrefix}/auth`) ||
				request.url === `${config.app.apiPrefix}/health` ||
				isSwaggerRoute(request.url))
		) {
			return;
		}

		await authenticate(request, reply);
	} catch (err) {
		ResponseHandler.error(reply, err as Error, 401, request.requestId);
	}
});

// Global error handler
server.setErrorHandler((error, request, reply) => {
	if (error instanceof AppError) {
		return ResponseHandler.error(
			reply,
			error,
			error.statusCode,
			request.requestId
		);
	}

	// Handle validation errors from fastify
	if (error.validation) {
		return ResponseHandler.error(
			reply,
			new AppError("Validation error", 400, ErrorCodes.VALIDATION_ERROR, {
				validationErrors: error.validation.map((err) => ({
					message: err.message || "Validation error occurred", // Provide a default message
					path: err.instancePath
						? err.instancePath.split("/").filter(Boolean)
						: [],
					code: "custom", // Provide a default code
				})),
			}),
			400,
			request.requestId
		);
	}

	// Handle other errors
	logger.error({ err: error, requestId: request.requestId }, "Unhandled error");
	return ResponseHandler.error(reply, error, 500, request.requestId);
});

// Register routes
server.register(authRoutes, { prefix: `${config.app.apiPrefix}/auth` });
server.register(userRoutes, { prefix: `${config.app.apiPrefix}/user` });
server.register(invoiceRoutes, { prefix: `${config.app.apiPrefix}/invoice` })
server.register(txnRoutes, { prefix: `${config.app.apiPrefix}/txn` })
server.register(paymentRoutes, { prefix: `${config.app.apiPrefix}/payments` })
server.register(payrollRoutes, { prefix: `${config.app.apiPrefix}/payroll` })


// Add this after registering routes but before starting the server
// Health check route with Swagger documentation
server.get(
	`${config.app.apiPrefix}/health`,
	{
		schema: {
			tags: ["Health"],
			summary: "Health check",
			description: "Check if the API is up and running",
			response: {
				200: {
					description: "API is healthy",
					type: "object",
					properties: {
						success: { type: "boolean" },
						data: {
							type: "object",
							properties: {
								status: { type: "string" },
								timestamp: { type: "string" },
							},
						},
						message: { type: "string" },
					},
				},
			},
		},
	},
	async (request, reply) => {
		return ResponseHandler.success(
			reply,
			{ status: "ok", timestamp: new Date().toISOString() },
			"API is healthy"
		);
	}
);

// Start server
const start = async () => {
	try {
		// Initialize database connection
		await initializeDatabase();

		// Start server
		await server.listen({
			port: config.app.port,
			host: config.app.host,
		});
		if(config.app.environment !== "production") {
    //   logger.info(config);
    }
		logger.info(
			{
				address: server.server.address(),
				environment: config.app.environment,
			},
			`Server started successfully`
		);
	} catch (err) {
		logger.fatal({ err }, "Failed to start server");
		process.exit(1);
	}
};

// Handle unhandled rejections and exceptions
process.on("unhandledRejection", (reason, promise) => {
	logger.fatal({ reason, promise }, "Unhandled Rejection");
	// Don't exit in production, just log
	if (config.app.environment !== "production") {
		process.exit(1);
	}
});

process.on("uncaughtException", (error) => {
	logger.fatal({ err: error }, "Uncaught Exception");
	// Don't exit in production, just log
	if (config.app.environment !== "production") {
		process.exit(1);
	}
});

// Start the server
if (require.main === module) {
	start();
}

export { server, start };
