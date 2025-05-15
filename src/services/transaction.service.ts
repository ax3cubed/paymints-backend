import { NotFoundError } from "../core/errors";
import { logger } from "../core/logger";
import config from "@/config";
import {
	address,
	createSolanaRpcFromTransport,
	TransactionError,
} from "@solana/kit";
import { PublicKey, SystemProgram } from "@solana/web3.js";
// @ts-ignore
import BN from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface TransactionResponse {
	signature: string;
	slot: number;
	error: TransactionError | null;
	blockTime: number | null;
	sender: string | null;
	recipient: string | null;
	amount: string | null; // changed from number | null
	tokenMint?: string | null;
}
const LAMPORTS_PER_SOL = 1_000_000_000n;
// Helper to convert lamports (string) to SOL (string, up to 9 decimals, no trailing zeros)
function lamportsToSolString(lamports: string): string {
	const LAMPORTS_PER_SOL = 1_000_000_000n;
	const lamportsBigInt = BigInt(lamports);
	const solInt = lamportsBigInt / LAMPORTS_PER_SOL;
	const solFrac = lamportsBigInt % LAMPORTS_PER_SOL;
	if (solFrac === 0n) return solInt.toString();
	// Pad fractional part to 9 digits
	let fracStr = solFrac.toString().padStart(9, "0");
	// Remove trailing zeros
	fracStr = fracStr.replace(/0+$/, "");
	return `${solInt.toString()}.${fracStr}`;
}

export class TransactionService {
	/**
	 * Get recent transactions for a wallet address
	 *
	 * @param walletAddress - Solana wallet address (base58-encoded)
	 * @returns List of transaction details
	 */
	async getTransactions(walletAddress: string): Promise<TransactionResponse[]> {
		try {
			// Validate wallet address
			try {
				address(walletAddress);
			} catch (err) {
				throw new NotFoundError("Invalid wallet address");
			}

			// Initialize connection
			const addr = address(walletAddress);
			const conns = createSolanaRpcFromTransport(
				config.primaryTokens.transport
			);
			const signatures = conns.getSignaturesForAddress(addr);
			const allSignature = await signatures.send();

			// Initialize token decimal cache
			const tokenDecimalCache: Record<string, number> = {
				// Pre-fill with common tokens if known
				// e.g. "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 6, // USDC
			};

			// Helper function to fetch token decimals
			async function getTokenDecimals(mint: string): Promise<number> {
				if (tokenDecimalCache[mint] !== undefined) {
					return tokenDecimalCache[mint];
				}

				try {
					const mintInfo = await conns.getTokenSupply(address(mint)).send();
					const decimals = mintInfo.value.decimals;
					tokenDecimalCache[mint] = decimals;
					return decimals;
				} catch (err) {
					logger.warn(`Failed to fetch decimals for token ${mint}:`, err);
					return 0; // Default to 0 if unable to fetch
				}
			}

			// Helper function to format SOL amount
			function lamportsToSolString(lamports: string): string {
				const bn = new BN(lamports);
				const sol = bn.div(new BN(LAMPORTS_PER_SOL));
				const remainder = bn.mod(new BN(LAMPORTS_PER_SOL));

				// Format with proper decimal places
				const solString = sol.toString();
				let remainderString = remainder.toString().padStart(9, "0");

				// Remove trailing zeros
				while (remainderString.endsWith("0") && remainderString.length > 1) {
					remainderString = remainderString.slice(0, -1);
				}

				return remainderString === "0"
					? solString
					: `${solString}.${remainderString}`;
			}

			// Fetch and parse transactions
			const fetchedTxns = await Promise.all(
				allSignature.map(async (sig: any) => {
					try {
						const txs = conns.getTransaction(sig.signature, {
							maxSupportedTransactionVersion: 0,
						});
						const tx = await txs.send();
						if (!tx) return null;

						let sender: string | null = null;
						let recipient: string | null = null;
						let amount: string | null = null;
						let tokenMint: string | null = null;

						const instructions = tx?.transaction?.message?.instructions || [];
						const accountKeys = tx?.transaction?.message?.accountKeys || [];

						for (const ix of instructions) {
							const programId =
								typeof accountKeys[ix.programIdIndex] === "string"
									? accountKeys[ix.programIdIndex]
									: accountKeys[ix.programIdIndex]?.toString();

							// System transfer (SOL)
							if (programId === SystemProgram.programId.toBase58()) {
								// System transfer: decode data
								if (
									ix.data &&
									ix.data.length >= 16 &&
									ix.accounts.length >= 2
								) {
									sender =
										typeof accountKeys[ix.accounts[0]] === "string"
											? accountKeys[ix.accounts[0]]
											: accountKeys[ix.accounts[0]]?.toString();
									recipient =
										typeof accountKeys[ix.accounts[1]] === "string"
											? accountKeys[ix.accounts[1]]
											: accountKeys[ix.accounts[1]]?.toString();

									// lamports: bytes 4-11 (8 bytes LE)
									const dataBuf = Buffer.from(ix.data, "base64");
									const lamports = new BN(dataBuf.slice(4, 12), "le");

									// Use correct LAMPORTS_PER_SOL constant (1 SOL = 1,000,000,000 lamports)
									const LAMPORTS_PER_SOL = 1000000000;
									amount = lamportsToSolString(lamports.toString());
									tokenMint = null;
									break;
								}
							}

							// SPL Token transfer
							if (programId === TOKEN_PROGRAM_ID.toBase58()) {
								// SPL Token transfer: decode data
								if (ix.data && ix.accounts.length >= 3) {
									const dataBuf = Buffer.from(ix.data, "base64");
									// 1: transfer, 12: transferChecked
									const instructionType = dataBuf[0];
									if (instructionType === 1 || instructionType === 12) {
										// transfer: 1 byte (instruction) + 8 bytes (amount)
										sender =
											typeof accountKeys[ix.accounts[0]] === "string"
												? accountKeys[ix.accounts[0]]
												: accountKeys[ix.accounts[0]]?.toString();
										recipient =
											typeof accountKeys[ix.accounts[1]] === "string"
												? accountKeys[ix.accounts[1]]
												: accountKeys[ix.accounts[1]]?.toString();

										// For token transfers, we need to account for token decimals
										const mintIdx =
											instructionType === 12 ? ix.accounts[1] : ix.accounts[1]; // Account index differs based on instruction
										const mintAccount = accountKeys[mintIdx];
										tokenMint =
											typeof mintAccount === "string"
												? mintAccount
												: mintAccount &&
												  typeof mintAccount === "object" &&
												  "toString" in mintAccount
												? (mintAccount as { toString(): string }).toString()
												: null;

										const amountRaw = dataBuf.slice(1, 9);
										const rawAmount = new BN(amountRaw, "le");

										// For token transfers, get token decimals and format amount
										if (tokenMint) {
											const decimals = await getTokenDecimals(tokenMint);
											const divisor = new BN(10).pow(new BN(decimals));

											if (divisor.gt(new BN(1))) {
												const whole = rawAmount.div(divisor);
												const fraction = rawAmount.mod(divisor);

												// Format with proper decimal places
												const wholeString = whole.toString();
												let fractionString = fraction
													.toString()
													.padStart(decimals, "0");

												// Remove trailing zeros
												while (
													fractionString.endsWith("0") &&
													fractionString.length > 1
												) {
													fractionString = fractionString.slice(0, -1);
												}

												amount =
													fractionString === "0"
														? wholeString
														: `${wholeString}.${fractionString}`;
											} else {
												amount = rawAmount.toString(); // No decimals needed
											}
										} else {
											amount = rawAmount.toString(); // Fallback if token mint isn't identified
										}

										break;
									}
								}
							}
						}

						return {
							signature: sig.signature,
							slot: sig.slot,
							error: tx.meta?.err || null,
							blockTime: sig.blockTime,
							sender: sender,
							recipient: recipient,
							amount: amount,
							tokenMint: tokenMint,
						} as TransactionResponse;
					} catch (err) {
						logger.warn(`Error parsing transaction ${sig.signature}:`, err);
						return null;
					}
				})
			);

			// Filter out null transactions
			const filteredTxns = fetchedTxns.filter(
				(tx): tx is TransactionResponse => tx !== null
			);
			return filteredTxns;
		} catch (err) {
			logger.error("Failed to fetch transactions:", err);
			throw new Error(
				"Failed to fetch transactions. Please check the address."
			);
		}
	}
}
