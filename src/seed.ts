import { User } from "./entities/User";
import bcrypt from "bcryptjs";
import AppDataSource from "./database";
import { logger } from "./core/logger";
import { generateUsername } from "./config/username";

export async function seedDatabase(address: string) {
	try {
		const userRepository = AppDataSource.getRepository(User);
		console.log(address)

		// Check if regular user exists
		const userExists = await userRepository.findOne({
			where: { address: address },
		});
		if (!userExists) {
			// Create regular user
			// const hashedPassword = await bcrypt.hash("user123", 10);
			const username = generateUsername()
			const user = userRepository.create({
				name: username,
				address: address,
				username: username,
			});

			await userRepository.save(user);
			console.log("Regular user created");
		}
		console.log("Database seeding completed");
	} catch (error) {
		logger.error({ err: error }, "Seeding Failed: ");
		throw error;
	}



}
