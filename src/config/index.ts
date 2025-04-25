import dotenv from "dotenv";
import path from "path";
import { logger } from "../core/logger";
import { get } from "env-var";

// Load environment variables based on NODE_ENV
const envFile =
	process.env.NODE_ENV === "production"
		? ".env.production"
		: process.env.NODE_ENV === "test"
		? ".env.test"
		: ".env.development";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Define the configuration interface
interface Config {
	app: {
		name: string;
		port: number;
		host: string;
		environment: string;
		apiPrefix: string;
	};
	auth: {
		jwtSecret: string;
		jwtExpiresIn: string;
		refreshTokenExpiresIn: string;
	};
	database: {
		type: string;
		database: string;
		synchronize: boolean;
		logging: boolean;
		dropSchema: boolean;
		url?: string;
	};
	api: {
		baseUrl: string;
		 
	};
	cors: {
		origin: string | string[];
		methods: string[];
	};

	logging: {
		level: string;
	};
}

// Create the configuration object
export const config: Config = {
	app: {
		name: get("APP_NAME").default("Payment API").asString(),
		port: get("PORT").default("3000").asPortNumber(),
		host: get("HOST").default("0.0.0.0").asString(),
		environment: get("NODE_ENV").default("development").asString(),
		apiPrefix: get("API_PREFIX").default("/api").asString(),
	},
	auth: {
		jwtSecret: get("JWT_SECRET").default("supersecretkey").asString(),
		jwtExpiresIn: get("JWT_EXPIRES_IN").default("7d").asString(),
		refreshTokenExpiresIn: get("REFRESH_TOKEN_EXPIRES_IN")
			.default("30d")
			.asString(),
	},
	database: {
		type: get("DB_TYPE").default("better-sqlite3").asString(),
		database: get("DB_NAME").default(":memory:").asString(),
		synchronize: get("DB_SYNCHRONIZE").default("true").asBool(),
		logging: get("DB_LOGGING").default("true").asBool(),
		dropSchema: get("DB_DROP_SCHEMA").default("false").asBool(),
		url: get("DATABASE_URL")
			.default("sqlite://:memory:")
			.asString(),
	},
	api: {
		baseUrl: get("NEXT_PUBLIC_BASE_URL")
			.default("https://thirdpartyapi.com")
			.asString(),
		 
	},
	cors: {
		origin: get("CORS_ORIGIN").default("*").asString(),
		methods: get("CORS_METHODS")
			.default("GET,POST,PUT,DELETE,OPTIONS")
			.asString()
			.split(","),
	},
	logging: {
		level: get("LOG_LEVEL").default("info").asString(),
	},
};

// Validate critical configuration
if (
	config.app.environment === "production" &&
	config.auth.jwtSecret === "supersecretkey"
) {
	logger.warn("Using default JWT secret in production environment");
}

// Log the current environment
logger.info(`Application running in ${config.app.environment} mode`);

export default config;
