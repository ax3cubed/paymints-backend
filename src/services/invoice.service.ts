import { Invoice, InvoiceStatus, InvoiceType, InvoiceVisibility } from "../entities/Invoice";
import { AppDataSource } from "../database";
import {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from "../core/errors";
import { logger } from "../core/logger";
import type { JwtUser } from "../types/auth.types";
import { FastifyRequest } from "fastify";
import { User } from "../entities/User";
import { Services } from "../entities/Services";
import { ObjectId } from "mongodb";
import { In } from "typeorm";
import { DiscountCodes } from "@/entities/Discount";
import { InvoiceResponseDTO, InvoiceResponseDTOSchema } from "@/DTO/InvoiceDTO";
import { PublicKey } from "@solana/web3.js";
import { convertTransactionToBase58 } from "./smartcontract.service";

// Define input types for services and discountCodes
type ServiceInput = {
  name: string;
  description: string;
  quantity: number;
  price: number;
};

type DiscountCodeInput = {
  discountCode: string;
  discountPercent: string;
  noOfUse: number;
};

export class InvoiceService {
  private invoiceRepository = AppDataSource.getRepository(Invoice);
  private servicesRepository = AppDataSource.getRepository(Services);
  private userRepository = AppDataSource.getRepository(User);
  private discountRepository = AppDataSource.getRepository(DiscountCodes);

  /**
   * Get authenticated user
   */
  async getAuthenticatedUser(request: FastifyRequest): Promise<User> {
    try {
      const jwtUser = await request.jwtVerify<JwtUser>();
      const user = await this.userRepository.findOne({
        where: { id: jwtUser.id },
      });

      if (!user) {
        throw new NotFoundError("User", jwtUser.id);
      }

      return user;
    } catch (error) {
      logger.error({ error }, "Failed to authenticate user from token");
      throw new AuthorizationError("Invalid or expired token");
    }
  }

  /**
   * Find invoice by invoiceNo
   */
  async findById(invoiceNo: string): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceNo },
    });

    if (!invoice) {
      logger.info(`Invoice with invoiceNo ${invoiceNo} not found`);
      return null;
    }

    return invoice;
  }

  async enrichInvoice(invoice: Invoice): Promise<InvoiceResponseDTO> {
    try {
      // Fetch User
      const user = await this.userRepository.findOne({
        where: { _id: new ObjectId(invoice.createdBy) },
      });
      if (!user) {
        throw new NotFoundError("User", invoice.createdBy);
      }

      // Validate and prepare services and discount codes IDs
    const serviceIds = invoice.services?.length ? invoice.services : [];
    const discountIds = invoice.discountCodes?.length ? invoice.discountCodes : [];

    // Log IDs for debugging
    logger.debug(
      {
        invoiceNo: invoice.invoiceNo,
        serviceIds,
        discountIds,
      },
      'Fetching services and discount codes'
    );

    // Fetch services and discount codes concurrently
    const [services, discountCodes] = await Promise.all([
      // Fetch services
      (async () => {
        const services: any[] = [];
        for (const id of serviceIds) {
          try {
            const objectId = new ObjectId(id);
            const service = await this.servicesRepository.findOne({
              where: { _id: objectId },
            });
            if (service) {
              services.push(service);
            } else {
              logger.warn({ invoiceNo: invoice.invoiceNo, serviceId: id }, 'Service not found');
            }
          } catch (err) {
            throw new ValidationError(`Invalid service ID: ${id}`);
          }
        }
        return services;
      })(),
      // Fetch discount codes
      (async () => {
        const discountCodes: any[] = [];
        for (const id of discountIds) {
          try {
            const objectId = new ObjectId(id);
            const discount = await this.discountRepository.findOne({
              where: { _id: objectId },
            });
            if (discount) {
              discountCodes.push(discount);
            } else {
              logger.warn({ invoiceNo: invoice.invoiceNo, discountId: id }, 'Discount code not found');
            }
          } catch (err) {
            throw new ValidationError(`Invalid discount code ID: ${id}`);
          }
        }
        return discountCodes;
      })(),
    ]);

      console.log(invoice.invoiceTxHash)
      // const pubKey = convertTransactionToBase58(invoice.invoiceTxHash)

      // Construct DTO
      const invoiceDTO: InvoiceResponseDTO = {
        _id: invoice._id.toString(),
        id: invoice.id || 0, // Adjust if id is computed differently
        createdAt: invoice.createdAt?.toISOString(),
        updatedAt: invoice.updatedAt?.toISOString(),
        updatedBy: invoice.updatedBy || undefined, // Adjust if updatedBy is an ObjectId
        softDeleted: invoice.softDeleted || undefined, // Adjust based on actual type
        invoiceNo: invoice.invoiceNo,
        createdBy: {
          _id: user._id.toString(),
          email: user.email || undefined,
          address: user.address || undefined,
          username: user.username,
        },
        invoiceType: invoice.invoiceType,
        invoiceTitle: invoice.invoiceTitle,
        invoiceImage: invoice.invoiceImage || undefined,
        invoiceDescription: invoice.invoiceDescription || undefined,
        invoiceStatus: invoice.invoiceStatus,
        invoiceCategory: invoice.invoiceCategory || undefined,
        invoiceMintAddress: invoice.invoiceMintAddress,
        clientName: invoice.clientName || undefined,
        clientWallet: invoice.clientWallet || undefined,
        clientEmail: invoice.clientEmail || undefined,
        clientAddress: invoice.clientAddress || undefined,
        isClientInformation: invoice.isClientInformation || undefined,
        isExpirable: invoice.isExpirable || undefined,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : undefined,
        discountCodes: discountCodes.map((dc) => ({
          _id: dc._id.toString(),
          discountCode: dc.discountCode,
          discountPercent: dc.discountPercent?.toString(),
          noOfUse: dc.noOfUse,
          invoice: dc.invoice,
        })),
        tipOptionEnabled: invoice.tipOptionEnabled || undefined,
        invoiceVisibility: invoice.invoiceVisibility || InvoiceVisibility.PRIVATE,
        autoEmailReceipt: invoice.autoEmailReceipt || undefined,
        QRcodeEnabled: invoice.QRcodeEnabled || undefined,
        services: services.map((s) => ({
          _id: s._id.toString(),
          title: s.title,
          description: s.description,
          quantity: s.quantity,
          unitPrice: s.unitPrice,
          invoice: s.invoice,
        })),
        subtotal: invoice.subtotal || undefined,
        discount: invoice.discount || undefined,
        taxRate: invoice.taxRate || undefined,
        taxAmount: invoice.taxAmount || undefined,
        totalAmount: invoice.totalAmount,
        invoiceTxHash: invoice.invoiceTxHash || undefined,
      };

      return InvoiceResponseDTOSchema.parse(invoiceDTO);
    } catch (error) {
      logger.error({ err: error }, "Failed to enrich invoice");
      throw error;
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(
    invoiceData: Partial<Invoice>
  ): Promise<InvoiceResponseDTO> {
    try {
      // Validate required fields
      if (
        !invoiceData.invoiceNo ||
        !invoiceData.invoiceType ||
        !invoiceData.invoiceTitle ||
        !invoiceData.invoiceMintAddress ||
        !invoiceData.createdBy
      ) {
        throw new ValidationError("Required invoice fields are missing");
      }

      // Validate createdBy
      let createdById: ObjectId;
      try {
        createdById = new ObjectId(invoiceData.createdBy);
      } catch (err) {
        throw new ValidationError(`Invalid User ID format: ${invoiceData.createdBy}`);
      }

      // Fetch user
      const user = await this.userRepository.findOne({
        where: { _id: createdById }, // Pass ObjectId directly
      });
      if (!user) {
        throw new ValidationError(`Invalid User ID: ${invoiceData.createdBy}`);
      }

      // Check if invoice number already exists
      const existingInvoice = await this.invoiceRepository.findOne({
        where: { invoiceNo: invoiceData.invoiceNo },
      });

      if (existingInvoice) {
        throw new ValidationError("Invoice with this number already exists");
      }


      const serviceIds = invoiceData.services || [];
      const discountIds = invoiceData.discountCodes || [];

      // Create Invoice
      const invoice = this.invoiceRepository.create({
        invoiceNo: invoiceData.invoiceNo,
        createdBy: invoiceData.createdBy,
        invoiceType: invoiceData.invoiceType,
        invoiceTitle: invoiceData.invoiceTitle,
        invoiceMintAddress: invoiceData.invoiceMintAddress,
        invoiceStatus: invoiceData.invoiceStatus || InvoiceStatus.DRAFT,
        invoiceVisibility: invoiceData.invoiceVisibility || InvoiceVisibility.PRIVATE,
        invoiceImage: invoiceData.invoiceImage || "",
        invoiceDescription: invoiceData.invoiceDescription || "",
        clientName: invoiceData.clientName || "",
        clientWallet: invoiceData.clientWallet || "",
        clientAddress: invoiceData.clientAddress || "",
        clientEmail: invoiceData.clientEmail || "",
        isClientInformation: invoiceData.isClientInformation || false,
        isExpirable: invoiceData.isExpirable || false,
        dueDate: invoiceData.dueDate || "",
        tipOptionEnabled: invoiceData.tipOptionEnabled || false,
        autoEmailReceipt: invoiceData.autoEmailReceipt || false,
        QRcodeEnabled: invoiceData.QRcodeEnabled || false,
        subtotal: invoiceData.subtotal || 0,
        discount: invoiceData.discount || 0,
        taxRate: invoiceData.taxRate || 0,
        taxAmount: invoiceData.taxAmount || 0,
        totalAmount: invoiceData.totalAmount || 0,
        invoiceTxHash: invoiceData.invoiceTxHash || "",
        discountCodes: discountIds, // Explicitly assign string[]
        services: serviceIds, // Explicitly assign string[]
      });

      const savedInvoice = await this.invoiceRepository.save(invoice);

      // Update Services and DiscountCodes with Invoice ObjectId
      if (serviceIds.length) {
        await this.servicesRepository.update(
          { _id: In(serviceIds) },
          { invoice: savedInvoice._id.toString() }
        );
      }

      if (discountIds.length) {
        await this.discountRepository.update(
          { _id: In(discountIds) },
          { invoice: savedInvoice._id.toString() }
        );
      }

      // Update User's invoices array
      user.invoices = user.invoices ? [...user.invoices, savedInvoice._id.toString()] : [savedInvoice._id.toString()];
      await this.userRepository.save(user);

      logger.info({ invoiceId: savedInvoice.id }, "Invoice created successfully");

      return this.enrichInvoice(savedInvoice);
    } catch (error) {
      logger.error({ err: error }, "Invoice Creation Failed");
      throw error;
    }
  }

  /**
   * Get invoice by ID with authorization check
   */
  async getInvoice(userId: string, invoiceNo: string): Promise<InvoiceResponseDTO> {
    const invoice = await this.findById(invoiceNo);

    if (!invoice) {
      throw new NotFoundError("Invoice", invoiceNo);
    }

    if (invoice.createdBy.toString() !== userId) {
      throw new AuthorizationError("Not authorized to access this invoice");
    }

    return this.enrichInvoice(invoice);
  }

  /**
   * Get all invoices for a user
   */
  async getUserInvoices(userId: string): Promise<InvoiceResponseDTO[]> {
    try {
      const invoices = await this.invoiceRepository.find({
        where: { createdBy: userId },
        order: { createdAt: "DESC" },
      });

      return Promise.all(invoices.map((invoice) => this.enrichInvoice(invoice)));
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch user invoices");
      throw error;
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceNo: string, userId: string, invoiceData: Partial<Invoice>): Promise<InvoiceResponseDTO> {
    try {
      const invoice = await this.getInvoice(userId, invoiceNo); // Returns InvoiceResponseDTO, but we need raw Invoice for updating
      const rawInvoice = await this.findById(invoiceNo); // Get raw Invoice entity
      if (!rawInvoice) {
        throw new NotFoundError("Invoice", invoiceNo);
      }

      // Validate services (if provided)
      if (invoiceData.services?.length) {
        const services = await this.servicesRepository.find({
          where: { _id: In(invoiceData.services) },
        });
        if (services.length !== invoiceData.services.length) {
          throw new ValidationError("One or more Service IDs are invalid");
        }
      }

      // Validate discountCodes (if provided)
      if (invoiceData.discountCodes?.length) {
        const discounts = await this.discountRepository.find({
          where: { _id: In(invoiceData.discountCodes) },
        });
        if (discounts.length !== invoiceData.discountCodes.length) {
          throw new ValidationError("One or more Discount Code IDs are invalid");
        }
      }

      // Define updatable fields
      const updatableFields: (keyof Invoice)[] = [
        "invoiceType",
        "invoiceTitle",
        "invoiceImage",
        "invoiceDescription",
        "invoiceStatus",
        "invoiceCategory",
        "invoiceMintAddress",
        "clientName",
        "clientWallet",
        "clientEmail",
        "clientAddress",
        "isClientInformation",
        "isExpirable",
        "dueDate",
        "discountCodes",
        "tipOptionEnabled",
        "invoiceVisibility",
        "autoEmailReceipt",
        "QRcodeEnabled",
        "services",
        "subtotal",
        "discount",
        "taxRate",
        "taxAmount",
        "totalAmount",
        "invoiceTxHash",
        "updatedBy",
        "softDeleted",
      ];

      // Update fields safely
      for (const field of updatableFields) {
        if (field in invoiceData && invoiceData[field] !== undefined) {
          // Type assertion to ensure field is a valid key of Invoice
          (rawInvoice[field] as any) = invoiceData[field];
        }
      }

      const updatedInvoice = await this.invoiceRepository.save(rawInvoice);
      logger.info({ invoiceId: updatedInvoice.id }, "Invoice updated successfully");

      // Return enriched DTO
      return this.enrichInvoice(updatedInvoice);
    } catch (error) {
      logger.error({ err: error }, "Invoice Update Failed");
      throw error;
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceNo: string, userId: string): Promise<boolean> {
    try {
      const invoice = await this.findById(invoiceNo);
      if (!invoice) {
        throw new NotFoundError("Invoice", invoiceNo);
      }

      // Update User's invoices array
      const user = await this.userRepository.findOne({
        where: { _id: new ObjectId(invoice.createdBy) },
      });
      if (user) {
        user.invoices = user.invoices.filter((id) => id !== invoice._id.toString());
        await this.userRepository.save(user);
      }

      await this.invoiceRepository.remove(invoice);
      logger.info({ invoiceId: invoiceNo }, "Invoice deleted successfully");

      return true;
    } catch (error) {
      logger.error({ err: error }, "Invoice Deletion Failed");
      throw error;
    }
  }
}