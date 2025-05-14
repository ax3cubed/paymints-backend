import {
	Connection,
	PublicKey,
	Commitment,
	Transaction,
	ComputeBudgetProgram,
} from "@solana/web3.js";
import { init, swapExactIn } from "@perena/numeraire-sdk";

import { getSimulationComputeUnits } from "@solana-developers/helpers";
import { rpcs } from "@/config";
import { AnchorProvider, setProvider } from "@coral-xyz/anchor";

const SOLANA_RPC = rpcs[1];
const COMMITMENT: Commitment = "confirmed";

export class SwapService {
	private connection: Connection;

	constructor() {
		this.connection = new Connection(SOLANA_RPC, COMMITMENT);
		const provider = new AnchorProvider(this.connection, {} as any, {
			commitment: "confirmed",
		});
		setProvider(provider);
		init({ applyD: false });
	}

	async prepareSwap({
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
	}): Promise<string> {
		try {
			// Prepare swap instructions
			const swapResult = await swapExactIn({
				pool: poolAddress,
				in: inTokenIndex,
				out: outTokenIndex,
				exactAmountIn: amountIn,
				minAmountOut,
				cuLimit: 1_500_000,
			});

			// Create transaction
			const transaction = new Transaction();

			// Estimate compute units
			let units = await getSimulationComputeUnits(
				this.connection,
				swapResult.call.instructions,
				userPublicKey,
				[]
			);
			units = units ? Math.ceil(units * 1.2) : 1_500_000; // 20% buffer or default

			// Add compute budget instructions
			transaction.add(
				ComputeBudgetProgram.setComputeUnitLimit({ units }),
				ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 })
			);
			transaction.add(...swapResult.call.instructions);

			// Set fee payer and recent blockhash
			transaction.feePayer = userPublicKey;
			const { blockhash } = await this.connection.getLatestBlockhash(
				COMMITMENT
			);
			transaction.recentBlockhash = blockhash;

			// Serialize transaction for frontend signing
			return transaction
				.serialize({ requireAllSignatures: false })
				.toString("base64");
		} catch (err: any) {
			if (err.message?.includes("invalid public key")) {
				throw { statusCode: 400, message: "Invalid pool or user public key" };
			}
			if (err.message?.includes("token account")) {
				throw { statusCode: 400, message: "Invalid or missing token account" };
			}
			if (err.message?.includes("compute units")) {
				throw { statusCode: 400, message: "Insufficient compute units" };
			}
			throw {
				statusCode: 500,
				message: err.message + "Failed to prepare transaction",
			};
		}
	}

	async submitSignedTransaction(transaction: Transaction): Promise<string> {
		try {
			const signature = await this.connection.sendRawTransaction(
				transaction.serialize(),
				{
					skipPreflight: false,
				}
			);
			await this.connection.confirmTransaction(signature, COMMITMENT);
			return signature;
		} catch (err: any) {
			throw {
				statusCode: 500,
				message: err.message || "Failed to submit transaction",
			};
		}
	}
}
