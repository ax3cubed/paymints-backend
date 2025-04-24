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
		token: string;
		monifyBaseUrl: string;
		monifyApiKey: string;
		monifySecretKey: string;
		monifyWalletAccountNumber: string;
		monifyContractCode: string;
		paymentRedirectUrl: string;
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
	},
	api: {
		baseUrl: get("NEXT_PUBLIC_DATASTATION_BASE_URL")
			.default("https://datastation.com.ng/api")
			.asString(),
		token: get("NEXT_PUBLIC_DATASTATION_TOKEN").default("").asString(),
		monifyBaseUrl: get("MONIFY_BASE_URL")
			.default("https://api.monnify.com")
			.asString(),
		monifyApiKey: get("MONIFY_API_KEY").default("").asString(),
		monifySecretKey: get("MONIFY_SECRET_KEY").default("").asString(),
		monifyWalletAccountNumber: get("MONIFY_WALLET_ACCOUNT_NUMBER")
			.default("")
			.asString(),
		monifyContractCode: get("MONIFY_CONTRACT_CODE").default("").asString(),
		paymentRedirectUrl: get("PAYMENT_REDIRECT_URL")
			.default("https://example.com/redirect")
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
