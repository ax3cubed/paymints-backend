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
import { generateUsername } from "@/config/username";
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import config from "@/config";



interface TokenInfo {
	symbol: string;
	mintAddress: string;
	imageUrl: string;
}

interface TokenAccount {
	symbol: string;
	mintAddress: string;
	balance: number;
	imageUrl: string;
	associatedTokenAddress: string;
}

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
			console.log('...................................')
			console.log(request.headers.authorization)
			console.log('...................................')
			const jwtUser = await request.jwtVerify<JwtUser>();

			console.log(jwtUser)

			// Find the user in the database using the ID from the token
			const user = await this.findById(jwtUser.id, ["beneficiaries"]);
			console.log(user)

			return user as User;
		} catch (error) {
			logger.error({ error }, "Failed to authenticate user from token");
			throw new AuthorizationError("Invalid or expired token");
		}
	}

	async getTokenAccounts(
		walletAddress: string,
		primaryTokens: { tokens: TokenInfo[] },
		rpcUrl: string = config.primaryTokens.rpc_url,
	): Promise<{ tokens: TokenAccount[] }> {
		try {
			// Initialize Solana connection
			const connection = new Connection(rpcUrl, 'confirmed');

			// Validate wallet address
			const walletPubkey = new PublicKey(walletAddress);

			const tokenAccounts: TokenAccount[] = [];

			// Process each token
			for (const token of primaryTokens.tokens) {
				try {
					// Get associated token address
					const mintPubkey = new PublicKey(token.mintAddress);
					const associatedTokenAddress = await getAssociatedTokenAddress(
						mintPubkey,
						walletPubkey
					);

					// Get token balance
					let balance = 0;
					try {
						const accountInfo = await connection.getTokenAccountBalance(associatedTokenAddress);
						balance = accountInfo.value.uiAmount || 0;
					} catch (error) {
						// Account doesn't exist or no balance
						console.log('Account Doesnt exist')
						balance = 0;
					}

					tokenAccounts.push({
						symbol: token.symbol,
						mintAddress: token.mintAddress,
						balance,
						imageUrl: token.imageUrl,
						associatedTokenAddress: associatedTokenAddress.toBase58()
					});
				} catch (error) {
					console.error(`Error processing token ${token.symbol}:`, error);
					// Push with zero balance if error occurs
					tokenAccounts.push({
						symbol: token.symbol,
						mintAddress: token.mintAddress,
						balance: 0,
						imageUrl: token.imageUrl,
						associatedTokenAddress: ''
					});
				}
			}

			return { tokens: tokenAccounts };
		} catch (error) {
			console.error('Error in getTokenAccounts:', error);
			throw new Error('Failed to fetch token accounts');
		}
	}

	/**
	 * Find a user by email or username
	 */
	async findByAddressOrUsername(addressOrUsername: string): Promise<User | null> {
		console.log('Checking For User');
		const mongoRepo = this.userRepository.manager.getMongoRepository(User);
		return await mongoRepo.findOne({
			where: {
				// @ts-ignore — bypass TypeScript check safely for MongoDB
				$or: [
					{ address: addressOrUsername },
					{ username: addressOrUsername }
				]
			}
		});

		// return await this.userRepository.findOne({
		// 	where: {
		// 		$or: [
		// 			{ address: addressOrUsername },
		// 			{ username: addressOrUsername }
		// 		]
		// 	}
		// });
	}

	/**
	 * Create a new user
	 */
	async create(userData: Partial<User>): Promise<User> {
		// Check if user already exists
		const existingUser = await this.userRepository.findOne({
			where: { address: userData.address },
		});

		if (existingUser) {
			throw new ConflictError(
				"User with this address already exists"
			);
		}

		const username = generateUsername()
		userData.username = username;
		userData.name = username;


		try {
			const user = this.userRepository.create(userData);
			console.log(user)

			await this.userRepository.save(user);
			logger.info({ userId: user.id }, "User created successfully");

			return user;
		} catch (error) {
			logger.error({ err: error }, "User Creation Failed: ");
			throw error;
		}
	}



	async initializeUser(userData: Partial<User>): Promise<User> {
		// Check if user already exists
		const existingUser = await this.userRepository.findOne({
			where: { address: userData.address },
		});

		if (existingUser) {
			const user = await this.userRepository.findOne({
				where: { address: userData.address },
			});
	
			if (!user) {
				throw new NotFoundError("User", userData.address);
			}
	
			return user;
		}

		const username = generateUsername()
		userData.username = username;
		userData.name = username;


		try {
			const user = this.userRepository.create(userData);
			console.log(user)

			await this.userRepository.save(user);
			logger.info({ userId: user.id }, "User created successfully");

			return user;
		} catch (error) {
			logger.error({ err: error }, "User Creation Failed: ");
			throw error;
		}
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
		if (profileData.name !== undefined)
			user.name = profileData.name;

		if (profileData.image !== undefined)
			user.image = profileData.image;

		if (profileData.email !== undefined)
			user.email = profileData.email;

		if (profileData.twitterId !== undefined)
			user.twitterId = profileData.twitterId;

		if (profileData.website !== undefined)
			user.website = profileData.website;

		await this.userRepository.save(user);
		logger.info({ userId: authUser.id }, "User profile updated");

		return user;
	}

}
