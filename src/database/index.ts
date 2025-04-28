import { DataSource } from "typeorm";
import { User } from "../entities/User";
import config from "../config";
import { logger } from "../core/logger";
import { Beneficiary } from "@/entities/Beneficiary";
import { Invoice } from "@/entities/Invoice";
import { DiscountCodes } from "@/entities/Discount";
import { Services } from "@/entities/Services";
import { Recipient } from "@/entities/Recipient";
import { Payroll } from "@/entities/Payroll";

export const AppDataSource = new DataSource({
	type: config.database.type as any,
	database: config.database.database,
	connectString: config.database.url,
	url: config.database.url,
	dropSchema:
		config.app.environment === "development" && config.database.dropSchema,
	entities: [
		User,
		Beneficiary,
		Invoice,
		DiscountCodes,
		Services,
		Recipient,
		Payroll
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

		if (config.app.environment === "development" && AppDataSource.isInitialized) {
			const { seedDatabase } = await import("../seed");
			await seedDatabase(config.app.primaryAddress);
		}
	} catch (error) {
		logger.error({ err: error }, "Failed to initialize database connection");
		throw error;
	}
};

export default AppDataSource;
