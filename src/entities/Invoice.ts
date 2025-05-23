import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
  } from "typeorm";
  import {
	IsEmail,
	IsNotEmpty,
	MinLength,
	IsOptional,
	IsBoolean,
	IsString,
	IsEnum,
	IsIn,
  } from "class-validator";
  import { DecoratedEntity } from "./decorated.entity";
  
  export enum InvoiceType {
	INVOICE = "standard",
	DONATION = "donation",
	SUBSCRIPTION = "subscription",
	MILESTONE = "milestone",
	CUSTOM = "custom",
  }
  
  export enum InvoiceStatus {
	DRAFT = "0",
	PROCESSING = "1",
	COMPLETED = "2",
	OVERDUE = "3"
  }
  
  export enum InvoiceVisibility {
	PRIVATE = "private",
	PUBLIC = "public",
  }
  
  @Entity()
  export class Invoice extends DecoratedEntity {
	@Column({ type: "varchar", length: 255, nullable: false })
	@IsString()
	invoiceNo!: string;
  
	@Column({ type: "enum", enum: InvoiceType })
	invoiceType!: InvoiceType;
  
	@Column({ type: "varchar", length: 255, nullable: false })
	invoiceTitle!: string;
  
	@Column({ type: "varchar", default: "", nullable: false })
	invoiceImage!: string;
  
	@Column({ type: "text", default: "", nullable: false })
	invoiceDescription!: string;
  
	@Column({ type: "varchar", length: 255, nullable: false })
	createdBy!: string; // Stores ObjectId as string
  
	@Column({ type: "enum", enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
	invoiceStatus!: InvoiceStatus;
  
	@Column({ type: "varchar", length: 255, nullable: true })
	invoiceCategory!: string;
  
	@Column({ type: "varchar", length: 255, nullable: false })
	invoiceMintAddress!: string;
  
	@Column({ type: "varchar", length: 255, default: "", nullable: false })
	clientName!: string;
  
	@Column({ type: "varchar", length: 255, default: "", nullable: false })
	clientWallet!: string;
  
	@Column({ type: "varchar", length: 255, default: "", nullable: true })
	@IsOptional()
	@IsEmail()
	clientEmail!: string;
  
	@Column({ type: "varchar", length: 255, default: "", nullable: false })
	clientAddress!: string;
  
	@Column({ type: "boolean", default: false })
	@IsBoolean()
	isClientInformation!: boolean;
  
	@Column({ type: "boolean", default: false })
	@IsBoolean()
	isExpirable!: boolean;
  
	@Column({ type: "varchar", nullable: true })
	dueDate!: string;
  
	@Column({ type: "simple-array", nullable: false, default: "" })
	discountCodes!: string[]; // Stores array of ObjectId strings
  
	@Column({ type: "boolean", default: true })
	tipOptionEnabled!: boolean;
  
	@Column({
	  type: "enum",
	  enum: InvoiceVisibility,
	  default: InvoiceVisibility.PRIVATE,
	})
	invoiceVisibility!: InvoiceVisibility;
  
	@Column({ type: "boolean", default: true })
	autoEmailReceipt!: boolean;
  
	@Column({ type: "boolean", default: true })
	QRcodeEnabled!: boolean;
  
	@Column({ type: "varchar", default: true })
	invoiceTxHash!: string;
  
	@Column({ type: "simple-array", nullable: false, default: "" })
	services!: string[]; // Stores array of ObjectId strings
  
	@Column({ type: "float", default: 0 })
	subtotal!: number;
  
	@Column({ type: "float", default: 0 })
	discount!: number;
  
	@Column({ type: "float", default: 0 })
	taxRate!: number;
  
	@Column({ type: "float", default: 0 })
	taxAmount!: number;
  
	@Column({ type: "float", default: 0 })
	totalAmount!: number;
  }