import dotenv from "dotenv";
import path from "path";
import { logger } from "../core/logger";
import { get } from "env-var";
import { createDefaultRpcTransport, createSolanaRpcApi, Rpc, RpcApi, RpcTransport, SolanaRpcApi } from "@solana/kit";


// Load environment variables based on NODE_ENV
const envFile =
	process.env.NODE_ENV === "production"
		? ".env.production"
		: process.env.NODE_ENV === "test"
		? ".env.test"
		: ".env.development";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
export const rpcs = [
	"https://api.mainnet-beta.solana.com",
	"https://api.devnet.solana.com",
	"https://api.localnet.solana.com"
]
const cluster = get("CLUSTER").default("1").asString();
const rpc2 = createSolanaRpcApi({defaultCommitment: 'confirmed'})
const rpc = get(rpcs[parseInt(cluster)]).default("https://api.devnet.solana.com").asString();
const transport = createDefaultRpcTransport({url: rpc})




// Define the configuration interface
interface Config {
	app: {
		name: string;
		port: number;
		host: string;
		environment: string;
		apiPrefix: string;
		primaryAddress: string;
		protocol: string;
		url: string;
		urlWithPort: string;
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

	primaryTokens: {
		newRpc: RpcApi<RpcTransport>,
		transport: RpcTransport,
		rpc_url: string,

		tokens: {
			symbol: string;
			mintAddress: string;
			imageUrl: string;
		}[];
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
		primaryAddress: get("PRIMARYWALLETADDRESS").default("").asString(),
		protocol: get("SERVER_PROTOCOL").default("http").asString(),
		url: get("SERVER_URL").default("http://localhost").asString(),
		urlWithPort: get("SERVER_URL_WITH_PORT")
			.default("http://localhost:3000")
			.asString(),
		// urlWithPort: `${get("SERVER_URL").default("http://localhost").asString()}:${get("SERVER_PORT").default("3000").asPortNumber()}`,
	},
	auth: {
		jwtSecret: get("JWT_SECRET").default("supersecretkey").asString(),
		jwtExpiresIn: get("JWT_EXPIRES_IN").default("7d").asString(),
		refreshTokenExpiresIn: get("REFRESH_TOKEN_EXPIRES_IN")
			.default("30d")
			.asString(),
	},
	database: {
		type: get("DB_TYPE").default("mongodb").asString(),
		database: get("DB_NAME").default(":memory:").asString(),
		// url: get("URL").default("").asString(),

		synchronize: get("DB_SYNCHRONIZE").default("true").asBool(),
		logging: get("DB_LOGGING").default("true").asBool(),
		dropSchema: get("DB_DROP_SCHEMA").default("false").asBool(),
		url: get("DATABASE_URL").default("sqlite://:memory:").asString(),
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
	primaryTokens: {
		newRpc: rpc2,
		transport: transport,
		rpc_url: get(rpcs[parseInt(cluster)]).default("https://api.devnet.solana.com").asString(),

		tokens: [
			{
				symbol: "USDC",
				mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
				imageUrl: "https://raw.githubusercontent.com/Ayphilip/appPics/refs/heads/main/usd-coin-usdc-logo.png",
			},
			{
				symbol: "USDT",
				mintAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
				imageUrl: "https://raw.githubusercontent.com/Ayphilip/appPics/refs/heads/main/tether-usdt-logo.png",
			},
			{
				symbol: "USD*",
				mintAddress: "BenJy1n3WTx9mTjEvy63e8Q1j4RqUc6E4VBMz3ir4Wo6",
				imageUrl:
					"https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f697066732e66696c65626173652e696f2f697066732f516d5041333735546558756e6a6145513561674c42375251576745705161553539544438526d554a786f31374563",
			},
			{
				symbol: "PYUSD",
				mintAddress: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
				imageUrl: "https://raw.githubusercontent.com/Ayphilip/appPics/refs/heads/main/paypal-usd-pyusd-logo.png",
			},
		],
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
