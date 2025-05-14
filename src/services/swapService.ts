import { Connection, PublicKey, Keypair, Commitment } from "@solana/web3.js";
import { init, swapExactIn } from "@perena/numeraire-sdk";
import bs58 from "bs58";
import { buildOptimalTransaction } from "@/helpers/build-optimal-transaction";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const COMMITMENT: Commitment = "confirmed";
const CU_LIMIT = 1_500_000;
const CU_PRICE = 100_000; // micro-lamports

export class SwapService {
	private connection: Connection;
	private payer: Keypair;

	constructor() {
		this.connection = new Connection(SOLANA_RPC, COMMITMENT);
		const secret = process.env.BACKEND_WALLET_SECRET_KEY;
		if (!secret)
			throw { statusCode: 500, message: "Backend wallet secret not set" };
		try {
			this.payer = Keypair.fromSecretKey(bs58.decode(secret));
		} catch {
			throw { statusCode: 500, message: "Invalid backend wallet secret" };
		}
		init({ payer: this.payer });
	}

	async performSwap({
		poolAddress,
		inTokenIndex,
		outTokenIndex,
		amountIn,
		minAmountOut,
		userPublicKey,
	}: {
		poolAddress: PublicKey;
		inTokenIndex: number;
		outTokenIndex: number;
		amountIn: number;
		minAmountOut: number;
		userPublicKey: PublicKey;
	}): Promise<{ signature: string; confirmation: any }> {
		try {
			// Prepare swap instructions
			const swapResult = await swapExactIn({
				pool: poolAddress,
				in: inTokenIndex,
				out: outTokenIndex,
				exactAmountIn: amountIn,
				minAmountOut,
				cuLimit: CU_LIMIT,

				// user: userPublicKey,
			});
			// Build transaction
			const { transaction } = await buildOptimalTransaction(
				this.connection,
				swapResult.call,
				this.payer,
				[] // Empty lookupTables array
			);
			// Sign and send
			transaction.sign([this.payer]);
			const signature = await this.connection.sendRawTransaction(
				transaction.serialize(),
				{ skipPreflight: false }
			);
			const confirmation = await this.connection.confirmTransaction(
				signature,
				COMMITMENT
			);
			return { signature, confirmation };
		} catch (err: any) {
			if (err.message?.includes("insufficient funds")) {
				throw {
					statusCode: 400,
					message: "Insufficient funds in backend wallet",
				};
			}
			if (err.message?.includes("token account")) {
				throw { statusCode: 400, message: "Invalid or missing token account" };
			}
			if (err.message?.includes("compute units")) {
				throw { statusCode: 400, message: "Insufficient compute units" };
			}
			throw {
				statusCode: 500,
				message: err.message || "Solana transaction failed",
			};
		}
	}
}
