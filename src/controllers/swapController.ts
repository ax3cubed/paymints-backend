import { FastifyError, FastifyReply } from "fastify";
import { PublicKey } from "@solana/web3.js";
import { SwapService } from "@/services/swapService";
import { SwapRequest, SwapResponse } from "@/types/swap.types";
import { BaseController } from "./base.controller";

export class SwapController extends BaseController {
	private swapService: SwapService;

	constructor() {
        super();
		this.swapService = new SwapService();
	}

	async handleSwap(
		request: SwapRequest,
		reply: FastifyReply
	): Promise<SwapResponse> {
		// Validate fields
		const {
			poolAddress,
			inTokenIndex,
			outTokenIndex,
			amountIn,
			minAmountOut,
			userPublicKey,
		} = request;
		if (
			!poolAddress ||
			!Number.isInteger(inTokenIndex) ||
			!Number.isInteger(outTokenIndex) ||
			amountIn == null ||
			minAmountOut == null ||
			!userPublicKey
		) {
			throw { statusCode: 400, message: "Missing required fields" };
		}
		// Validate types
		if (
			!Number.isInteger(inTokenIndex) ||
			!Number.isInteger(outTokenIndex) ||
			inTokenIndex < 0 ||
			outTokenIndex < 0
		) {
			throw {
				statusCode: 400,
				message: "Token indices must be non-negative integers",
			};
		}
		if (
			!Number.isInteger(amountIn) ||
			amountIn <= 0 ||
			!Number.isInteger(minAmountOut) ||
			minAmountOut <= 0
		) {
			throw { statusCode: 400, message: "Amounts must be positive integers" };
		}
		// Validate Solana public keys
		let poolPubkey: PublicKey, userPubkey: PublicKey;
		try {
			poolPubkey = new PublicKey(poolAddress);
			userPubkey = new PublicKey(userPublicKey);
			if (
				!PublicKey.isOnCurve(poolPubkey.toBuffer()) ||
				!PublicKey.isOnCurve(userPubkey.toBuffer())
			) {
				throw new Error();
			}
		} catch {
			throw { statusCode: 400, message: "Invalid Solana public key(s)" };
		}
		try {
			const { signature, confirmation } = await this.swapService.performSwap({
				poolAddress: poolPubkey,
				inTokenIndex,
				outTokenIndex,
				amountIn,
				minAmountOut,
				userPublicKey: userPubkey,
			});
			return this.sendSuccess(
				reply,
				{
					signature,
                    confirmation,
					success: true,
					meta: { timestamp: new Date().toISOString() },
				},
				"Invoice created successfully"
			);
			
		} catch (error) {
			 return this.handleError(error as Error, reply, request.requestId);
		}
	}
}
