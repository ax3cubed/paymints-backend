import {  FastifyReply, FastifyRequest } from "fastify";
import { PublicKey, Transaction } from "@solana/web3.js";
import { SwapService } from "@/services/swapService";
import { SwapRequest, SwapResponse } from "@/types/swap.types";
import { BaseController } from "./base.controller";
import { z } from "zod";

 export const SwapRequestSchema = z.object({
  poolAddress: z.string().min(32, "Invalid Solana public key"),
  inTokenIndex: z.number().int().nonnegative(),
  outTokenIndex: z.number().int().nonnegative(),
  amountIn: z.number().int().positive(),
  minAmountOut: z.number().int().positive(),
  userPublicKey: z.string().min(32, "Invalid Solana public key"),
});

export class SwapController extends BaseController {
	private swapService: SwapService;

	constructor() {
        super();
		this.swapService = new SwapService();
	}

	async handleSwap(
		request: FastifyRequest,
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
		} = SwapRequestSchema.parse(request.body) as SwapRequest;
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
			const transaction = await this.swapService.prepareSwap({
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
					transaction,
					success: true,
					meta: { timestamp: new Date().toISOString() },
				},
				"Invoice created successfully"
			);
			
		} catch (error) {
			 return this.handleError(error as Error, reply, request.requestId);
		}
	}
    async submitSwap(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<{ signature: string }> {
        const transaction = request.body as Transaction;
        if (!transaction) {
            throw { statusCode: 400, message: "Missing transaction in request body" };
        }
        try {
            const signature = await this.swapService.submitSignedTransaction(transaction);
            return this.sendSuccess(
                reply,
                { signature },
                "Swap transaction submitted successfully"
            );
        } catch (error) {
            return this.handleError(error as Error, reply, request.requestId);
        }
    }
}
