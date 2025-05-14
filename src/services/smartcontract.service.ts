import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getAccount,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PaymentApp } from "../anchors/target/types/payment_app";
import { logger } from "../core/logger";
import config from "@/config";
import { getBase58Codec } from "@solana/kit";
// import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import bs58 from 'bs58'

// Configuration
const RPC_URL = config.primaryTokens.rpc_url;
const connection = new web3.Connection(RPC_URL, "confirmed");

// Create a provider-like object
const provider = {
    connection,
};

// Initialize the program
const idl = require("../anchors/target/idl/payment_app.json");
const program = new Program<PaymentApp>(idl, provider);

// PDA Helper Functions
export function getVestingAccountPDA(employer: PublicKey, employee: PublicKey, vestingId: Buffer = Buffer.from("")): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("vesting"), employer.toBuffer(), employee.toBuffer(), vestingId],
        program.programId
    );
}

export function getVaultAuthority(vestingAccount: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from("vault"), vestingAccount.toBuffer()], program.programId);
}

export function getPoolAccountPDA(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from("pool"), mint.toBuffer()], program.programId);
}

export function getContributorAccountPDA(user: PublicKey, mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from("contributor"), user.toBuffer(), mint.toBuffer()], program.programId);
}

export function getPoolTokenAccountPDA(poolAccount: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from("pool_vault"), poolAccount.toBuffer()], program.programId);
}

export function getInvoicePDA(issuer: PublicKey, invoiceId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("invoice"), issuer.toBuffer(), Buffer.from(invoiceId)],
        program.programId
    );
}

export function getPaymentLogPDA(invoice: PublicKey, payer: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("payment_log"), invoice.toBuffer(), payer.toBuffer()],
        program.programId
    );
}

export function convertTransactionToBase58(transactionResponse: string): {
    base58Signature?: string;
    base58Transaction?: string;
    solscanUrl?: string;
  } {
    try {
      // Step 1: Decode Base64 to binary
      const transactionBuffer = Buffer.from(transactionResponse, 'base64');
  
      // Step 2: Deserialize to a Transaction object
      const transaction = Transaction.from(transactionBuffer);
  
      // Step 3: Check if the transaction is signed
      const signaturePair = transaction.signatures[0];
      if (signaturePair && signaturePair.signature) {
        // Transaction is signed, extract the signature
        const signature = signaturePair.signature;
        const base58Signature = bs58.encode(signature);
        const solscanUrl = `https://solscan.io/tx/${base58Signature}`;
        return {
          base58Signature,
          solscanUrl,
        };
      } else {
        // Transaction is unsigned, return the serialized transaction in Base58
        const base58Transaction = bs58.encode(transactionBuffer);
        return {
          base58Transaction,
        };
      }
    } catch (error) {
      console.error('Error converting transaction:', error);
      throw error;
    }
  }

// Helper to get or create associated token account address
async function getOrCreateATA(mint: PublicKey, owner: PublicKey, transaction: Transaction): Promise<PublicKey> {
    const ata = await getAssociatedTokenAddress(mint, owner);
    try {
        await getAccount(connection, ata); // Check if ATA exists
    } catch (err) {
        // ATA doesn't exist, add creation instruction
        transaction.add(
            createAssociatedTokenAccountInstruction(
                owner, // Payer (user)
                ata,
                owner,
                mint
            )
        );
    }
    return ata;
}

// Define TransactionResponse type
interface TransactionResponse {
    transaction: string; // Base64-encoded serialized transaction
}

interface ContributorInfo {
    user: string;
    amount: string;
}

interface PaymentInfo {
    payer: string;
    amount: string;
    timestamp: number;
}

export class SmartContractService {
    /**
     * Create a vesting account
     */
    async createVesting(
        employer: string,
        employee: string,
        mint: string,
        amount: string,
        isVesting: boolean,
        vestUntil: string,
        vestingId: string = ""
    ): Promise<TransactionResponse> {
        try {
            // Validate inputs
            const employerPubkey = new PublicKey(employer);
            const employeePubkey = new PublicKey(employee);
            const mintPubkey = new PublicKey(mint);
            if (!PublicKey.isOnCurve(employerPubkey)) throw new Error("Invalid employer address");
            if (!PublicKey.isOnCurve(employeePubkey)) throw new Error("Invalid employee address");
            if (!PublicKey.isOnCurve(mintPubkey)) throw new Error("Invalid mint address");
            const amountBN = new anchor.BN(amount);
            if (amountBN.lte(new anchor.BN(0))) throw new Error("Amount must be positive");
            const vestUntilBN = new anchor.BN(vestUntil);
            if (isVesting && vestUntilBN.lte(new anchor.BN(Math.floor(Date.now() / 1000)))) {
                throw new Error("Vesting period must be in the future");
            }

            const [vestingAccount, vestingBump] = getVestingAccountPDA(employerPubkey, employeePubkey, Buffer.from(vestingId));
            const [vaultAuthority, vaultBump] = getVaultAuthority(vestingAccount);

            const tx = new Transaction();
            const vaultTokenAccount = await getOrCreateATA(mintPubkey, vaultAuthority, tx);
            const employerTokenAccount = await getOrCreateATA(mintPubkey, employerPubkey, tx);
            const employeeTokenAccount = await getOrCreateATA(mintPubkey, employeePubkey, tx);

            tx.add(
                await program.methods
                    .createVestingAccount(amountBN, isVesting, vestUntilBN)
                    .accounts({
                        employer: employerPubkey,
                        employee: employeePubkey,
                        vestingAccount,
                        employerTokenAccount,
                        vaultTokenAccount,
                        vaultAuthority,
                        employeeTokenAccount,
                        mint: mintPubkey,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    } as any)
                    .instruction()
            );

            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = employerPubkey;

            const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");
            return { transaction: serializedTx };
        } catch (err) {
            logger.error("Failed to create vesting:", err);
            throw new Error(`Failed to create vesting: ${err}`);
        }
    }

    /**
     * Claim vested tokens
     */
    async claimVested(employee: string, mint: string, vestingAccount: string): Promise<TransactionResponse> {
        try {
            const employeePubkey = new PublicKey(employee);
            const mintPubkey = new PublicKey(mint);
            const vestingAccountPubkey = new PublicKey(vestingAccount);
            if (!PublicKey.isOnCurve(employeePubkey)) throw new Error("Invalid employee address");
            if (!PublicKey.isOnCurve(mintPubkey)) throw new Error("Invalid mint address");
            if (!PublicKey.isOnCurve(vestingAccountPubkey)) throw new Error("Invalid vesting account address");

            const [vaultAuthority, vaultBump] = getVaultAuthority(vestingAccountPubkey);

            const tx = new Transaction();
            const vaultTokenAccount = await getOrCreateATA(mintPubkey, vaultAuthority, tx);
            const employeeTokenAccount = await getOrCreateATA(mintPubkey, employeePubkey, tx);

            tx.add(
                await program.methods
                    .claimVestedTokens()
                    .accounts({
                        vestingAccount: vestingAccountPubkey,
                        vaultTokenAccount,
                        vaultAuthority,
                        employeeTokenAccount,
                        employee: employeePubkey,
                        mint: mintPubkey,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    } as any)
                    .instruction()
            );

            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = employeePubkey;

            const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");
            return { transaction: serializedTx };
        } catch (err) {
            logger.error("Failed to claim vested tokens:", err);
            throw new Error(`Failed to claim vested tokens: ${err}`);
        }
    }

    /**
     * Send tokens to another address
     */
    async sendToken(sender: string, recipient: string, mint: string, amount: string): Promise<TransactionResponse> {
        try {
            const senderPubkey = new PublicKey(sender);
            const recipientPubkey = new PublicKey(recipient);
            const mintPubkey = new PublicKey(mint);
            if (!PublicKey.isOnCurve(senderPubkey)) throw new Error("Invalid sender address");
            if (!PublicKey.isOnCurve(recipientPubkey)) throw new Error("Invalid recipient address");
            if (!PublicKey.isOnCurve(mintPubkey)) throw new Error("Invalid mint address");
            const amountBN = new anchor.BN(amount);
            if (amountBN.lte(new anchor.BN(0))) throw new Error("Amount must be positive");

            const tx = new Transaction();
            const senderTokenAccount = await getOrCreateATA(mintPubkey, senderPubkey, tx);
            const recipientTokenAccount = await getOrCreateATA(mintPubkey, recipientPubkey, tx);

            tx.add(
                await program.methods
                    .sendTokens(amountBN)
                    .accounts({
                        sender: senderPubkey,
                        senderTokenAccount,
                        recipientTokenAccount,
                        mint: mintPubkey,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    } as any)
                    .instruction()
            );

            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = senderPubkey;

            const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");
            return { transaction: serializedTx };
        } catch (err) {
            logger.error("Failed to send tokens:", err);
            throw new Error(`Failed to send tokens: ${err}`);
        }
    }

    /**
     * Deposit tokens to the pool
     */
    async depositToPool(user: string, mint: string, amount: string): Promise<TransactionResponse> {
        try {
            const userPubkey = new PublicKey(user);
            const mintPubkey = new PublicKey(mint);
            if (!PublicKey.isOnCurve(userPubkey)) throw new Error("Invalid user address");
            if (!PublicKey.isOnCurve(mintPubkey)) throw new Error("Invalid mint address");
            const amountBN = new anchor.BN(amount);
            if (amountBN.lte(new anchor.BN(0))) throw new Error("Amount must be positive");

            const [poolAccount, poolBump] = getPoolAccountPDA(mintPubkey);
            const [contributorAccount, contributorBump] = getContributorAccountPDA(userPubkey, mintPubkey);
            const [poolTokenAccount, poolTokenBump] = getPoolTokenAccountPDA(poolAccount);
            const [poolAuthority, poolAuthorityBump] = getPoolAccountPDA(mintPubkey);

            const tx = new Transaction();
            const userTokenAccount = await getOrCreateATA(mintPubkey, userPubkey, tx);

            tx.add(
                await program.methods
                    .depositToPool(amountBN)
                    .accounts({
                        user: userPubkey,
                        userTokenAccount,
                        poolAccount,
                        contributorAccount,
                        poolTokenAccount,
                        poolAuthority,
                        mint: mintPubkey,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    } as any)
                    .instruction()
            );

            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = userPubkey;

            const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");
            return { transaction: serializedTx };
        } catch (err) {
            logger.error("Failed to deposit to pool:", err);
            throw new Error(`Failed to deposit to pool: ${err}`);
        }
    }

    /**
     * Withdraw tokens from the pool
     */
    async withdrawFromPool(user: string, mint: string, amount: string): Promise<TransactionResponse> {
        try {
            const userPubkey = new PublicKey(user);
            const mintPubkey = new PublicKey(mint);
            if (!PublicKey.isOnCurve(userPubkey)) throw new Error("Invalid user address");
            if (!PublicKey.isOnCurve(mintPubkey)) throw new Error("Invalid mint address");
            const amountBN = new anchor.BN(amount);
            if (amountBN.lte(new anchor.BN(0))) throw new Error("Amount must be positive");

            const [poolAccount, poolBump] = getPoolAccountPDA(mintPubkey);
            const [contributorAccount, contributorBump] = getContributorAccountPDA(userPubkey, mintPubkey);
            const [poolTokenAccount, poolTokenBump] = getPoolTokenAccountPDA(poolAccount);
            const [poolAuthority, poolAuthorityBump] = getPoolAccountPDA(mintPubkey);

            const tx = new Transaction();
            const userTokenAccount = await getOrCreateATA(mintPubkey, userPubkey, tx);

            tx.add(
                await program.methods
                    .withdrawFromPool(amountBN)
                    .accounts({
                        user: userPubkey,
                        userTokenAccount,
                        poolAccount,
                        contributorAccount,
                        poolTokenAccount,
                        poolAuthority,
                        mint: mintPubkey,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    } as any)
                    .instruction()
            );

            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = userPubkey;

            const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");
            return { transaction: serializedTx };
        } catch (err) {
            logger.error("Failed to withdraw from pool:", err);
            throw new Error(`Failed to withdraw from pool: ${err}`);
        }
    }

    /**
     * Create an invoice
     */
    async createInvoice(
        issuer: string,
        invoiceId: string,
        amount: string,
        description: string,
        deadline: string,
        mint: string
    ): Promise<TransactionResponse> {
        try {
            const issuerPubkey = new PublicKey(issuer);
            const mintPubkey = new PublicKey(mint);
            if (!PublicKey.isOnCurve(issuerPubkey)) throw new Error("Invalid issuer address");
            if (!PublicKey.isOnCurve(mintPubkey)) throw new Error("Invalid mint address");
            if (description.length > 256) throw new Error("Description must be 256 characters or less");
            const amountBN = new anchor.BN(amount);
            if (amountBN.lte(new anchor.BN(0))) throw new Error("Amount must be positive");
            const date = new Date(deadline);
            const millis = date.getTime();
            const deadlineBN = new anchor.BN(millis);
            if (deadlineBN.lte(new anchor.BN(Math.floor(Date.now() / 1000)))) {
                throw new Error("Deadline must be in the future");
            }

            // Generate a random invoice ID
            const [invoicePDA, invoiceBump] = getInvoicePDA(issuerPubkey, invoiceId);

            const tx = new Transaction();
            tx.add(
                await program.methods
                    .createInvoice(invoiceId, amountBN, description, deadlineBN, mintPubkey)
                    .accounts({
                        issuer: issuerPubkey,
                        invoice: invoicePDA,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .instruction()
            );

            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = issuerPubkey;

            const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");
            return { transaction: serializedTx };
        } catch (err) {
            logger.error("Failed to create invoice:", err);
            throw new Error(`Failed to create invoice: ${err}`);
        }
    }

    /**
     * Pay an invoice
     */
    async payInvoice(payer: string, invoice: string, amount: string, mint: string): Promise<TransactionResponse> {
        try {
            const payerPubkey = new PublicKey(payer);
            const invoicePubkey = new PublicKey(invoice);
            const mintPubkey = new PublicKey(mint);
            if (!PublicKey.isOnCurve(payerPubkey)) throw new Error("Invalid payer address");
            if (!PublicKey.isOnCurve(invoicePubkey)) throw new Error("Invalid invoice address");
            if (!PublicKey.isOnCurve(mintPubkey)) throw new Error("Invalid mint address");
            const amountBN = new anchor.BN(amount);
            if (amountBN.lte(new anchor.BN(0))) throw new Error("Amount must be positive");

            const invoiceData = await program.account.invoice.fetch(invoicePubkey);
            const issuerPubkey = invoiceData.issuer;

            const [paymentLogPDA, paymentLogBump] = getPaymentLogPDA(invoicePubkey, payerPubkey);

            const tx = new Transaction();
            const payerTokenAccount = await getOrCreateATA(mintPubkey, payerPubkey, tx);
            const issuerTokenAccount = await getOrCreateATA(mintPubkey, issuerPubkey, tx);

            tx.add(
                await program.methods
                    .payInvoice(amountBN)
                    .accounts({
                        payer: payerPubkey,
                        invoice: invoicePubkey,
                        payerTokenAccount,
                        issuerTokenAccount,
                        paymentLog: paymentLogPDA,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    } as any)
                    .instruction()
            );

            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = payerPubkey;

            const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");
            return { transaction: serializedTx };
        } catch (err) {
            logger.error("Failed to pay invoice:", err);
            throw new Error(`Failed to pay invoice: ${err}`);
        }
    }

    /**
     * Close an invoice
     */
    async closeInvoice(issuer: string, invoice: string, mint: string): Promise<TransactionResponse> {
        try {
            const issuerPubkey = new PublicKey(issuer);
            const invoicePubkey = new PublicKey(invoice);
            const mintPubkey = new PublicKey(mint);
            if (!PublicKey.isOnCurve(issuerPubkey)) throw new Error("Invalid issuer address");
            if (!PublicKey.isOnCurve(invoicePubkey)) throw new Error("Invalid invoice address");
            if (!PublicKey.isOnCurve(mintPubkey)) throw new Error("Invalid mint address");

            const tx = new Transaction();
            tx.add(
                await program.methods
                    .closeInvoice()
                    .accounts({
                        issuer: issuerPubkey,
                        invoice: invoicePubkey,
                        mint: mintPubkey,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .instruction()
            );

            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = issuerPubkey;

            const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");

            return { transaction: serializedTx };
        } catch (err) {
            logger.error("Failed to close invoice:", err);
            throw new Error(`Failed to close invoice: ${err}`);
        }
    }

    /**
     * Get pool contributors
     */
    async getPoolContributors(mint: string): Promise<ContributorInfo[]> {
        try {
            const mintPubkey = new PublicKey(mint);
            if (!PublicKey.isOnCurve(mintPubkey)) throw new Error("Invalid mint address");

            const contributors = await program.account.contributorAccount.all([
                { memcmp: { offset: 8 + 32, bytes: mintPubkey.toBase58() } }, // Filter by mint
            ]);

            return contributors.map((c) => ({
                user: c.account.user.toBase58(),
                amount: c.account.amount.toString(),
            }));
        } catch (err) {
            logger.error("Failed to fetch pool contributors:", err);
            throw new Error(`Failed to fetch pool contributors: ${err}`);
        }
    }

    /**
     * Get invoice payments
     */
    async getInvoicePayments(invoice: string): Promise<PaymentInfo[]> {
        try {
            console.log(invoice)
            const invoicePubkey = new PublicKey(invoice);
            if (!PublicKey.isOnCurve(invoicePubkey)) throw new Error("Invalid invoice address");

            const payments = await program.account.paymentLog.all([
                { memcmp: { offset: 8 + 32 + 8 + 8, bytes: invoicePubkey.toBase58() } }, // Filter by invoice
            ]);

            return payments.map((p) => ({
                payer: p.account.payer.toBase58(),
                amount: p.account.amount.toString(),
                timestamp: Number(p.account.timestamp),
            }));
        } catch (err) {
            logger.error("Failed to fetch invoice payments:", err);
            throw new Error(`Failed to fetch invoice payments: ${err}`);
        }
    }
}