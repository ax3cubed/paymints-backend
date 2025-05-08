import { z } from 'zod';


export const createNewPaymentSchema = {
    tags: ["Payment"],
    summary: "Create a new payment",
    description: "Creates a new payment record for a transaction",
    body: {
        type: "object",
        required: ["sender", "receiver", "totalAmount", "mintAddress"],
        properties: {
            paymentDescription: { type: "string" },
            receiver: { type: "string" },
            sender: { type: "string" },
            totalAmount: { type: "string" },
            serviceType: {
                type: "string",
                enum: ["standard", "invoice", "payroll", "DAO", "credit"],
            },
            paymentDate: { type: "string", format: "date-time" },
            paymentStatus: {
                type: "string",
                enum: ["pending", "completed", "failed", "cancelled"],
            },
            mintAddress: { type: "string" },
        },
    },
    response: {
        201: {
            description: "Payment created successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        data: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                paymentHash: { type: "string" },
                                // receiver: { type: "string" },
                                // sender: { type: "string" },
                                // totalAmount: { type: "string" },
                                // paymentDate: { type: "string" },
                                // paymentStatus: { type: "string" },
                                // serviceType: { type: "string" },
                                // paymentDescription: { type: "string" },
                                // paymentSignature: { type: "string" },
                                // mintAddress: { type: "string" },
                                // createdAt: { type: "string", format: "date-time" },
                                // updatedAt: { type: "string", format: "date-time" },
                            },
                        },
                    },
                },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string", format: "date-time" },
                    },
                },
            },
        },
        400: {
            description: "Validation error",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                errors: { type: "array", items: { type: "string" } },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string" },
                    },
                },
            },
        },
        401: {
            description: "Unauthorized",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string" },
                    },
                },
            },
        },
    },
};

export const createConcludedPaymentSchema = {
    tags: ["Payment"],
    summary: "Create a new payment",
    description: "Creates a new payment record for a transaction",
    body: {
        type: "object",
        required: ["sender", "receiver", "totalAmount", "mintAddress", "paymentSignature"],
        properties: {
            paymentHash: { type: "string" },
            paymentDescription: { type: "string" },
            receiver: { type: "string" },
            sender: { type: "string" },
            totalAmount: { type: "string" },
            serviceType: {
                type: "string",
                enum: ["standard", "invoice", "payroll", "DAO", "credit"],
            },
            paymentDate: { type: "string", format: "date-time" },
            paymentStatus: {
                type: "string",
                enum: ["pending", "completed", "failed", "cancelled"],
            },
            paymentSignature: { type: "string" },
            mintAddress: { type: "string" },
        },
    },
    response: {
        201: {
            description: "Payment created successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        data: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                paymentHash: { type: "string" },
                                // receiver: { type: "string" },
                                // sender: { type: "string" },
                                // totalAmount: { type: "string" },
                                // paymentDate: { type: "string" },
                                // paymentStatus: { type: "string" },
                                // serviceType: { type: "string" },
                                // paymentDescription: { type: "string" },
                                // paymentSignature: { type: "string" },
                                // mintAddress: { type: "string" },
                                // createdAt: { type: "string", format: "date-time" },
                                // updatedAt: { type: "string", format: "date-time" },
                            },
                        },
                    },
                },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string", format: "date-time" },
                    },
                },
            },
        },
        400: {
            description: "Validation error",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                errors: { type: "array", items: { type: "string" } },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string" },
                    },
                },
            },
        },
        401: {
            description: "Unauthorized",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string" },
                    },
                },
            },
        },
    },
};




export const getPaymentFromPaymentHashSchema = {
    tags: ["Payment"],
    summary: "Get Payment For Payment Hash",
    description: "Fetch all Wallet Transaction",
    querystring: {
        type: "object",
        required: ["paymentHash"],
        properties: {
            paymentHash: { type: "string" },
        },
    },
    response: {
        200: {
            description: "Successful",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        txn: {
                            type: "object",
                            properties: {
                                id: { type: "number" },
                                paymentHash: { type: "string" },
                                paymentDescription: { type: "string" },
                                receiver: { type: "string" },
                                sender: { type: "string" },
                                paymentStatus: { type: "string" },
                                totalAmount: { type: "string" },
                                serviceType: { type: "string" },
                                paymentDate: { type: "string" },
                                paymentSignature: { type: "string" },
                                mintAddress: { type: "string" },
                                createdAt: { type: "string" },
                                updatedAt: { type: "string" },
                            },
                        },
                    },
                },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string" },
                    },
                },
            },
        },
        400: {
            description: "Validation error",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                errors: { type: "array", items: { type: "string" } },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string" },
                    },
                },
            },
        },
    },
};


export const getPaymentForAddressSchema = {
    tags: ["Payment"],
    summary: "Get Payment For Address",
    description: "Fetch all Wallet Transaction",
    querystring: {
        type: "object",
        required: ["walletAddress"],
        properties: {
            walletAddress: { type: "string" },
        },
    },
    response: {
        200: {
            description: "Successful",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        txn: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "number" },
                                    paymentHash: { type: "string" },
                                    paymentDescription: { type: "string" },
                                    receiver: { type: "string" },
                                    sender: { type: "string" },
                                    paymentStatus: { type: "string" },
                                    totalAmount: { type: "string" },
                                    serviceType: { type: "string" },
                                    paymentDate: { type: "string" },
                                    paymentSignature: { type: "string" },
                                    mintAddress: { type: "string" },
                                    createdAt: { type: "string" },
                                    updatedAt: { type: "string" }
                                },
                            },
                        },
                    },
                },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string" },
                    },
                },
            },
        },
        400: {
            description: "Validation error",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                errors: { type: "array", items: { type: "string" } },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string" },
                    },
                },
            },
        },
    },
};


export const updatePaymentSchema = {
    tags: ["Payment"],
    summary: "Update payment",
    description: "Updates an existing payment record",
    params: {
        type: "object",
        properties: {
            id: { type: "string", description: "Payment ID" },
        },
        required: ["id"],
    },
    body: {
        type: "object",
        properties: {
            paymentHash: { type: "string" },
            paymentStatus: {
                type: "string",
                enum: ["pending", "completed", "failed", "cancelled"],
            },
        },
    },
    response: {
        200: {
            description: "Payment updated",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        payment: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                paymentHash: { type: "string" },
                                paymentDescription: { type: "string" },
                                receiver: { type: "string" },
                                sender: { type: "string" },
                                totalAmount: { type: "string" },
                                paymentDate: { type: "string", format: "date-time" },
                                paymentStatus: { type: "string" },
                                serviceType: { type: "string" },
                                paymentSignature: { type: "string" },
                                mintAddress: { type: "string" },
                                createdAt: { type: "string", format: "date-time" },
                                updatedAt: { type: "string", format: "date-time" },
                            },
                        },
                    },
                },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string", format: "date-time" },
                    },
                },
            },
        },
        401: {
            description: "Unauthorized",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string", format: "date-time" },
                    },
                },
            },
        },
        404: {
            description: "Payment not found",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                meta: {
                    type: "object",
                    properties: {
                        timestamp: { type: "string", format: "date-time" },
                    },
                },
            },
        },
    },
};
