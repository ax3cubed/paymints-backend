import crypto from "crypto";

/**
 * Generates a random payment hash with 'pmt_' prefix.
 * @returns {string} A prefixed 64-character hexadecimal hash (total length 68).
 */
export function generatePaymentHash(): string {
    const hash = crypto.randomBytes(32).toString("hex"); // 64 hex characters
    return `pmt_${hash}`;
}

