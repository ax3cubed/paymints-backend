import type { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import type { FastifySwaggerUiOptions } from "@fastify/swagger-ui";
import config from "./index";

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
	swagger: {
		info: {
			title: "PAYMINTS API",
			description: "API documentation for PAYMINTS",
			version: "1.0.0",
			contact: {
				name: "Adeola Akinwole",
				email: "adeola.akinwole.me@gmail.com",
			},
		},
		externalDocs: {
			url: "https://example.com",
			description: "Find more info here",
		},
		host: `${config.app.host}:${config.app.port}`,
		schemes: ["http", "https"],
		consumes: ["application/json"],
		produces: ["application/json"],
		tags: [
			{ name: "Auth", description: "Authentication endpoints" },
			{ name: "User", description: "User management endpoints" },
		 
		],
		securityDefinitions: {
			bearerAuth: {
				type: "apiKey",
				name: "Authorization",
				in: "header",
			},
		},
	},
	// Disable authentication for swagger schema access
	openapi: {
		security: [],
	},
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
	routePrefix: "/documentation",
	uiConfig: {
		docExpansion: "list",
		deepLinking: true,
		displayRequestDuration: true,
	},
	uiHooks: {
		// Remove any authentication checks from these hooks
		onRequest: (request, reply, next) => {
			next();
		},
		preHandler: (request, reply, next) => {
			next();
		},
	},
	// Allow unauthenticated access to swagger UI
	staticCSP: true,
	transformStaticCSP: (header) => header,
};

// This function should be used in your main app to explicitly
// skip authentication for swagger routes
export const isSwaggerRoute = (url: string): boolean => {
	return url.startsWith("/documentation");
};
