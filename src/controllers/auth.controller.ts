import type { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/user.service";
import { BaseController } from "./base.controller";
import { z } from "zod";
import { AuthenticationError } from "../core/errors";
import bcrypt from "bcryptjs";
import config from "@/config";

// Validation schemas
const registerSchema = z.object({
	address: z.string(),
});

const loginSchema = z.object({
	addressOrUsername: z.string(),
	// password: z.string(),
});


export class AuthController extends BaseController {
	private userService: UserService;

	constructor(private fastify: any) {
		super();
		this.userService = new UserService();
	}

	/**
	 * Register a new user
	 */
	async register(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { address } =
				registerSchema.parse(request.body);

			const user = await this.userService.create({
				address
			});

			// Generate JWT token
			const token = this.fastify.jwt.sign({
				id: user.id,
				address: user.address,
				username: user.username,
			});

			return this.sendSuccess(
				reply,
				{
					user: {
						id: user.id,
						email: user.email,
						address: user.address,
						username: user.username,
						name: user.name,
						status: user.status,
						image: user.image,
						twitterId: user.twitterId,
						website: user.website,
					},
					token,
				},
				"User registered successfully",
				201
			);
		} catch (error) {
			return this.handleError(error as Error, reply, request.requestId);
		}
	}


	async initializeUser(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { address } =
				registerSchema.parse(request.body);

			const user = await this.userService.initializeUser({
				address
			});

			// Generate JWT token
			const token = this.fastify.jwt.sign({
				id: user.id,
				address: user.address,
				username: user.username,
			});

			return this.sendSuccess(
				reply,
				{
					user: {
						id: user.id,
						email: user.email,
						address: user.address,
						username: user.username,
						name: user.name,
						status: user.status,
						image: user.image,
						twitterId: user.twitterId,
						website: user.website,
					},
					token,
				},
				"User registered successfully",
				201
			);
		} catch (error) {
			return this.handleError(error as Error, reply, request.requestId);
		}
	}

	/**
	 * Login user
	 */
	async login(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { addressOrUsername } = loginSchema.parse(request.body);

			// Find user by email or username
			const user = await this.userService.findByAddressOrUsername(
				addressOrUsername
			);

			if (!user) {
				throw new AuthenticationError("User Doest Exist");
			}

			// Generate JWT token
			const token = this.fastify.jwt.sign({
				id: user.id,
				address: user.address,
				username: user.username,
			});

			return this.sendSuccess(
				reply,
				{
					user: {
						id: user.id,
						email: user.email,
						address: user.address,
						username: user.username,
						name: user.name,
						status: user.status,
						image: user.image,
						twitterId: user.twitterId,
						website: user.website,
					},
					token,
				},
				"Login successful"
			);
		} catch (error) {
			return this.handleError(error as Error, reply, request.requestId);
		}
	}

	/**
	 * Get current user
	 */
	async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
		try {

			const user = await this.userService.getAuthenticatedUser(request);
			const tokenMintAddresses = config.primaryTokens;
			const tokenResponse = await this.userService.getTokenAccounts(user.address, tokenMintAddresses)
			

			const payload = {
				user: {
					id: user.id,
					email: user.email,
					address: user.address,
					username: user.username,
					name: user.name,
					status: user.status,
					image: user.image,
					twitterId: user.twitterId,
					website: user.website,
				},
				beneficiaries: user.beneficiaries || [],
				tokens: tokenResponse.tokens
			};

			return this.sendSuccess(reply, payload);
		} catch (error) {
			return this.handleError(error as Error, reply, request.requestId);
		}
	}

}
