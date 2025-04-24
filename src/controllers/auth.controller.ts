import type { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/user.service";
import { BaseController } from "./base.controller";
import { z } from "zod";
import { AuthenticationError } from "../core/errors";
import bcrypt from "bcryptjs";

// Validation schemas
const registerSchema = z.object({
	email: z.string().email(),
	username: z.string().min(3),
	password: z.string().min(6),
	fullName: z.string().optional(),
	phoneNumber: z.string().optional(),
});

const loginSchema = z.object({
	emailOrUsername: z.string(),
	password: z.string(),
});

const forgotPasswordSchema = z.object({
	email: z.string().email(),
});

const resetPasswordSchema = z.object({
	token: z.string(),
	password: z.string().min(6),
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
			const { email, username, password, fullName, phoneNumber } =
				registerSchema.parse(request.body);

			const user = await this.userService.create({
				email,
				username,
				password,
				fullName,
			});

			// Generate JWT token
			const token = this.fastify.jwt.sign({
				id: user.id,
				email: user.email,
				username: user.username,
			});

			return this.sendSuccess(
				reply,
				{
					user: {
						id: user.id,
						email: user.email,
						username: user.username,
						fullName: user.fullName,
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
			const { emailOrUsername, password } = loginSchema.parse(request.body);

			// Find user by email or username
			const user = await this.userService.findByEmailOrUsername(
				emailOrUsername
			);

			if (!user) {
				throw new AuthenticationError("Invalid credentials");
			}

			// Verify password
			const isPasswordValid = await bcrypt.compare(password, user.password);

			if (!isPasswordValid) {
				throw new AuthenticationError("Invalid credentials");
			}

			// Generate JWT token
			const token = this.fastify.jwt.sign({
				id: user.id,
				email: user.email,
				username: user.username,
			});

			return this.sendSuccess(
				reply,
				{
					user: {
						id: user.id,
						email: user.email,
						username: user.username,
						fullName: user.fullName,
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
	 * Forgot password
	 */
	async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { email } = forgotPasswordSchema.parse(request.body);

			// Find user by email
			const user = await this.userService.findByEmailOrUsername(email);

			// For security reasons, don't reveal that the email doesn't exist
			if (!user) {
				return this.sendSuccess(
					reply,
					null,
					"If your email is registered, you will receive a password reset link"
				);
			}

			// Generate reset token
			const resetToken = this.fastify.jwt.sign(
				{ id: user.id, email: user.email, type: "password-reset" },
				{ expiresIn: "1h" }
			);

			// In a real app, send an email with the reset link
			// For now, just return the token in development mode
			const responseData =
				process.env.NODE_ENV === "development" ? { resetToken } : undefined;

			return this.sendSuccess(
				reply,
				responseData,
				"If your email is registered, you will receive a password reset link"
			);
		} catch (error) {
			return this.handleError(error as Error, reply, request.requestId);
		}
	}

	/**
	 * Reset password
	 */
	async resetPassword(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { token, password } = resetPasswordSchema.parse(request.body);

			// Verify token
			let decoded;
			try {
				decoded = this.fastify.jwt.verify(token);
			} catch (err) {
				throw new Error("Invalid or expired token");
			}

			// Check if token is for password reset
			if (decoded.type !== "password-reset") {
				throw new Error("Invalid token type");
			}

			// Find user
			const user = await this.userService.findByEmailOrUsername(decoded.email);

			if (!user || user.id !== decoded.id) {
				throw new Error("Invalid token");
			}

			// Hash new password
			const hashedPassword = await bcrypt.hash(password, 10);

			// Update user password
			await this.userService.updateProfile(user, { password: hashedPassword });

			return this.sendSuccess(reply, null, "Password reset successful");
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

			const payload = {
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					fullName: user.fullName,
					emailVerified: user.emailVerified,
					profileImage: user.profileImage,
					address: user.address,
				},
			};

			return this.sendSuccess(reply, payload);
		} catch (error) {
			return this.handleError(error as Error, reply, request.requestId);
		}
	}
}
