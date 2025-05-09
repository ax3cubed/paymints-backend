

export function generateInvoiceIdentifier() {
    const invoiceId = `INV-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;

    return invoiceId;
}