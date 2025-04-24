import type { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticationError, AuthorizationError } from "../core/errors";
import { JwtUser } from "@/types/auth.types";

/**
 * Authentication middleware
 */
export const authenticate = async (
	request: FastifyRequest,
	reply: FastifyReply
) => {
	try {
		await request.jwtVerify();
	} catch (err) {
		throw new AuthenticationError();
	}
};

/**
 * Admin authorization middleware
 */
export const authorizeAdmin = async (
	request: FastifyRequest,
	reply: FastifyReply
) => {
	try {
		// Extract user from token
		const authUser = await request.jwtVerify<JwtUser>();
		if (!authUser) {
			throw new AuthenticationError();
		}
		if (!authUser.isAdmin) {
			throw new AuthorizationError("Admin");
		}
	} catch (err) {
		if (err instanceof AuthorizationError) {
			throw err;
		}
		throw new AuthenticationError();
	}
};
