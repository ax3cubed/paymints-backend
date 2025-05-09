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
import { Services } from "@/entities/Services";

export class InvoiceService {
  private invoiceRepository = AppDataSource.getRepository(Invoice);
  private servicesRepository = AppDataSource.getRepository(Services);
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Get authenticated user
   */
  async getAuthenticatedUser(request: FastifyRequest): Promise<User> {
    try {
      const jwtUser = await request.jwtVerify<JwtUser>();
      const user = await this.userRepository.findOne({
        where: { id: jwtUser.id },
        relations: ["address"],
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
   * Find invoice by ID
   */
  async findById(id: string, relations: string[] = []): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceNo: id },
      relations: [...relations, "createdBy", "discountCodes", "services"],
    });

    return invoice;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    try {
      // Validate required fields
      if (!invoiceData.invoiceNo || !invoiceData.invoiceType || !invoiceData.invoiceTitle 
        || !invoiceData.invoiceMintAddress || !invoiceData.services) {
        throw new ValidationError("Required invoice fields are missing");
      }

      // Check if invoice number already exists
      const existingInvoice = await this.invoiceRepository.findOne({
        where: { invoiceNo: invoiceData.invoiceNo },
      });

      if (existingInvoice) {
        throw new ValidationError("Invoice with this number already exists");
      }

      const invoice = this.invoiceRepository.create({
        ...invoiceData,
        invoiceStatus: invoiceData.invoiceStatus || InvoiceStatus.DRAFT,
        invoiceVisibility: invoiceData.invoiceVisibility || InvoiceVisibility.PRIVATE,
        invoiceImage: invoiceData.invoiceImage || "",
        invoiceDescription: invoiceData.invoiceDescription || "",
        clientName: invoiceData.clientName || "",
        clientWallet: invoiceData.clientWallet || "",
        clientAddress: invoiceData.clientAddress || "",
        subtotal: invoiceData.subtotal || 0,
        discount: invoiceData.discount || 0,
        taxRate: invoiceData.taxRate || 0,
        taxAmount: invoiceData.taxAmount || 0,
        totalAmount: invoiceData.totalAmount || 0,
      });

      await this.invoiceRepository.save(invoice);

      invoiceData.services.map(async (items) => {
        try {
          const newService = this.servicesRepository.create({
            title: items.title,
            description: items.description,
            quantity: items.quantity,
            image: items.image,
            unitPrice: items.unitPrice,
            invoice: invoice
          })

          await this.servicesRepository.save(newService);
        } catch (error) {
          logger.error({ err: error }, "Service Creation Failed");
        }
      })
      logger.info({ invoiceId: invoice.id }, "Invoice created successfully");

      return invoice;
    } catch (error) {
      logger.error({ err: error }, "Invoice Creation Failed");
      throw error;
    }
  }

  /**
   * Get invoice by ID with authorization check
   */
  async getInvoice(id: string, userId: number): Promise<Invoice> {
    const invoice = await this.findById(id, ["createdBy", "discountCodes", "services"]);

    if (!invoice) {
      throw new NotFoundError("Invoice", id);
    }

    if (invoice.createdBy.id !== userId) {
      throw new AuthorizationError("Not authorized to access this invoice");
    }

    return invoice;
  }

  /**
   * Get all invoices for a user
   */
  async getUserInvoices(userId: number): Promise<Invoice[]> {
    try {
      const invoices = await this.invoiceRepository.find({
        where: { createdBy: { id: userId } },
        relations: ["createdBy", "discountCodes", "services"],
        order: { createdAt: "DESC" },
      });

      return invoices;
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch user invoices");
      throw error;
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, userId: number, invoiceData: Partial<Invoice>): Promise<Invoice> {
    try {
      const invoice = await this.getInvoice(id, userId);

      // Update allowed fields
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
        "tipOptionEnabled",
        "invoiceVisibility",
        "autoEmailReceipt",
        "QRcodeEnabled",
        "subtotal",
        "discount",
        "taxRate",
        "taxAmount",
        "totalAmount",
      ];

      for (const field of updatableFields) {
        if (invoiceData[field] !== undefined) {
          (invoice[field] as any) = invoiceData[field];
        }
      }

      await this.invoiceRepository.save(invoice);
      logger.info({ invoiceId: invoice.id }, "Invoice updated successfully");

      return invoice;
    } catch (error) {
      logger.error({ err: error }, "Invoice Update Failed");
      throw error;
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string, userId: number): Promise<boolean> {
    try {
      const invoice = await this.getInvoice(id, userId);

      await this.invoiceRepository.remove(invoice);
      logger.info({ invoiceId: id }, "Invoice deleted successfully");

      return true;
    } catch (error) {
      logger.error({ err: error }, "Invoice Deletion Failed");
      throw error;
    }
  }
}