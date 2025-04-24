export enum ErrorCodes {
	INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
	VALIDATION_ERROR = "VALIDATION_ERROR",
	AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
	AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
	NOT_FOUND = "NOT_FOUND",
	BAD_REQUEST = "BAD_REQUEST",
	CONFLICT = "CONFLICT",
	SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
	PAYMENT_REQUIRED = "PAYMENT_REQUIRED",
	INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
	INVALID_TRANSACTION = "INVALID_TRANSACTION",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
}

export class AppError extends Error {
	statusCode: number;
	code: ErrorCodes;
	data?: any;

	constructor(
		message: string,
		statusCode = 500,
		code = ErrorCodes.INTERNAL_SERVER_ERROR,
		data?: any
	) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.code = code;
		this.data = data;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message = "Validation error", data?: any) {
		super(message, 400, ErrorCodes.VALIDATION_ERROR, data);
	}
}

export class AuthenticationError extends AppError {
	constructor(message = "Authentication required") {
		super(message, 401, ErrorCodes.AUTHENTICATION_ERROR);
	}
}

export class AuthorizationError extends AppError {
	constructor(message = "You do not have permission to perform this action") {
		super(message, 403, ErrorCodes.AUTHORIZATION_ERROR);
	}
}

export class NotFoundError extends AppError {
	constructor(resource = "Resource", id?: string | number) {
		const message = id
			? `${resource} with ID ${id} not found`
			: `${resource} not found`;
		super(message, 404, ErrorCodes.NOT_FOUND);
	}
}

export class ConflictError extends AppError {
	constructor(message = "Resource already exists") {
		super(message, 409, ErrorCodes.CONFLICT);
	}
}

export class InsufficientFundsError extends AppError {
	constructor(message = "Insufficient funds to complete this transaction") {
		super(message, 400, ErrorCodes.INSUFFICIENT_FUNDS);
	}
}

export class InvalidTransactionError extends AppError {
	constructor(message = "Invalid transaction") {
		super(message, 400, ErrorCodes.INVALID_TRANSACTION);
	}
}

export class ServiceUnavailableError extends AppError {
	constructor(message = "Service temporarily unavailable") {
		super(message, 503, ErrorCodes.SERVICE_UNAVAILABLE);
	}
}
export class ExternalApiError extends AppError {
	constructor(message = "External API error") {
		super(message, 502, ErrorCodes.EXTERNAL_API_ERROR);
	}
}
