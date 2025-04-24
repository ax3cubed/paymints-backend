import { User } from "../entities/User";
import { AppDataSource } from "../database";
import {
	NotFoundError,
	ConflictError,
	ValidationError,
	AuthorizationError,
} from "../core/errors";
import bcrypt from "bcryptjs";
import { logger } from "../core/logger";
import type { JwtUser } from "../types/auth.types";
import { FastifyRequest } from "fastify";

export class UserService {
	private userRepository = AppDataSource.getRepository(User);
	 

	/**
	 * Find a user by ID with optional relations
	 *
	 * @param id - User ID
	 * @param relations - Optional relations to include (e.g., beneficiaries)
	 * @returns User with requested relations
	 */
	async findById(id: number, relations: string[] = []): Promise<User> {
		const user = await this.userRepository.findOne({
			where: { id },
			relations: relations,
		});

		if (!user) {
			throw new NotFoundError("User", id);
		}

		return user;
	}
	/**
	 * Get the authenticated user
	 */
	async getAuthenticatedUser(request: FastifyRequest): Promise<User> {
		try {
			// Extract and verify the JWT token
			const jwtUser = await request.jwtVerify<JwtUser>();

			// Find the user in the database using the ID from the token
			const user = await this.findById(jwtUser.id, ["beneficiaries"]);

			return user as User;
		} catch (error) {
			logger.error({ error }, "Failed to authenticate user from token");
			throw new AuthorizationError("Invalid or expired token");
		}
	}
 
	/**
	 * Find a user by email or username
	 */
	async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
		return this.userRepository.findOne({
			where: [{ email: emailOrUsername }, { username: emailOrUsername }],
		});
	}

	/**
	 * Create a new user
	 */
	async create(userData: Partial<User>): Promise<User> {
		// Check if user already exists
		const existingUser = await this.userRepository.findOne({
			where: [{ email: userData.email }, { username: userData.username }],
		});

		if (existingUser) {
			throw new ConflictError(
				"User with this email or username already exists"
			);
		}

		// Hash password
		if (userData.password) {
			userData.password = await bcrypt.hash(userData.password, 10);
		}

		// Create and save user
		const user = this.userRepository.create(userData);

		await this.userRepository.save(user);
		logger.info({ userId: user.id }, "User created successfully");

		return user;
	}

	/**
	 * Update user profile
	 */
	async updateProfile(
		request: FastifyRequest | JwtUser,
		profileData: Partial<User>
	): Promise<User> {
		// Extract user from token
		let authUser: JwtUser;

		if ("jwtVerify" in request) {
			// request is FastifyRequest
			authUser = await request.jwtVerify<JwtUser>();
			if (!authUser) {
				throw new AuthorizationError("Invalid or expired token");
			}
		} else {
			// request is already a JwtUser
			authUser = request;
		}
		const user = await this.findById(authUser.id);

		// Update user fields
		if (profileData.fullName !== undefined)
			user.fullName = profileData.fullName;
	 
		if (profileData.address !== undefined) user.address = profileData.address;
		if (profileData.profileImage !== undefined)
			user.profileImage = profileData.profileImage;

		await this.userRepository.save(user);
		logger.info({ userId: authUser.id }, "User profile updated");

		return user;
	}

	/**
	 * Update user password
	 */
	async updatePassword(
		request: FastifyRequest,
		currentPassword: string,
		newPassword: string
	): Promise<void> {
		// Extract user from token
		const authUser = await request.jwtVerify<JwtUser>();

		const user = await this.findById(authUser.id);

		// Verify current password
		const isPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password
		);
		if (!isPasswordValid) {
			throw new ValidationError("Current password is incorrect");
		}

		// Hash and update new password
		user.password = await bcrypt.hash(newPassword, 10);
		await this.userRepository.save(user);
		logger.info({ userId: authUser.id }, "User password updated");
	}

 
 

	/**
	 * Update notification settings
	 */
	async updateNotificationSettings(
		request: FastifyRequest,
		settings: {
			allowPushNotification?: boolean;
			allowEmailNotification?: boolean;
			allowBiometricsLogin?: boolean;
		}
	): Promise<User> {
		// Extract user from token
		const authUser = await request.jwtVerify<JwtUser>();
		if (!authUser) {
			throw new AuthorizationError("Invalid or expired token");
		}
		const user = await this.findById(authUser.id);

		// Update notification settings
		if (settings.allowPushNotification !== undefined) {
			user.allowPushNotification = settings.allowPushNotification;
		}

		if (settings.allowEmailNotification !== undefined) {
			user.allowEmailNotification = settings.allowEmailNotification;
		}

		if (settings.allowBiometricsLogin !== undefined) {
			user.allowBiometricsLogin = settings.allowBiometricsLogin;
		}

		await this.userRepository.save(user);
		logger.info({ userId: authUser.id }, "User notification settings updated");

		return user;
	}
}
