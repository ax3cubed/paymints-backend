import { User } from "./entities/User";
import bcrypt from "bcryptjs";
import AppDataSource from "./database";

export async function seedDatabase() {
	const userRepository = AppDataSource.getRepository(User);

	// Check if regular user exists
	const userExists = await userRepository.findOne({
		where: { email: "user@example.com" },
	});

	if (!userExists) {
		// Create regular user
		const hashedPassword = await bcrypt.hash("user123", 10);
		const user = userRepository.create({
			email: "user@example.com",
			username: "user",
			password: hashedPassword,
			fullName: "Regular User",
			emailVerified: true,
			accountsVerified: true,
		});

		await userRepository.save(user);
		console.log("Regular user created");
	}

	console.log("Database seeding completed");
}
