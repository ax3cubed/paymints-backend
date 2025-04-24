import { DataSource } from "typeorm";
import { User } from "../entities/User";
import config from "../config";
import { logger } from "../core/logger";


export const AppDataSource = new DataSource({
	type: config.database.type as any,
	database: config.database.database,
	url: config.database.url,
	dropSchema:
		config.app.environment === "development" && config.database.dropSchema,
	entities: [
		User
	],
	synchronize: config.database.synchronize,
	logging: config.database.logging,
});

export const initializeDatabase = async (): Promise<void> => {
	try {
		if (!AppDataSource.isInitialized) {
			await AppDataSource.initialize();
			logger.info(
				`Database connection established to ${config.database.database}`
			);
		}

		if (config.app.environment === "development") {
			const { seedDatabase } = await import("../seed");
			await seedDatabase();
		}
	} catch (error) {
		logger.error({ err: error }, "Failed to initialize database connection");
		throw error;
	}
};

export default AppDataSource;
