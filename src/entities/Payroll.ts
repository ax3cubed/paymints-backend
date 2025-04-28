import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  import { IsString, IsEmail, IsOptional, IsNumber, IsEnum, IsDateString } from "class-validator";
  import { User } from "./User";
  import { Recipient } from "./Recipient";
  import { DecoratedEntity } from "./decorated.entity";
  
  export enum PayrollStatus {
    DRAFT = "0",
    PROCESSING = "1",
    COMPLETED = "2",
  }
  
  export enum PayrollVisibility {
    PRIVATE = "private",
    PUBLIC = "public",
  }
  
  export enum PaymentType {
    CRYPTO = "crypto",
    FIAT = "fiat",
  }
  
  @Entity()
  export class Payroll extends DecoratedEntity {
    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    payrollType!: string;
  
    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    payrollTitle!: string;
  
    @Column({ type: "varchar", length: 255, default: "" })
    @IsString()
    @IsOptional()
    payrollImage!: string;
  
    @Column({ type: "text", default: "" })
    @IsString()
    @IsOptional()
    payrollDescription!: string;
  
    @ManyToOne(() => User, (user) => user.payroll)
    createdBy!: User;
  
    @Column({ type: "enum", enum: PayrollStatus, default: PayrollStatus.DRAFT })
    @IsEnum(PayrollStatus)
    payrollStatus!: PayrollStatus;
  
    @Column({ type: "float", default: 0 })
    @IsNumber()
    subtotal!: number;
  
    @Column({ type: "float", default: 0 })
    @IsNumber()
    totalAmount!: number;
  
    @Column({ type: "varchar", length: 255, nullable: true })
    @IsString()
    @IsOptional()
    payrollPeriod!: string;
  
    @Column({ type: "date", nullable: true })
    @IsDateString()
    @IsOptional()
    payCycleStart!: string;
  
    @Column({ type: "date", nullable: true })
    @IsDateString()
    @IsOptional()
    payCycleEnd!: string;
  
    @Column({ type: "varchar", length: 255, default: "USDC" })
    @IsString()
    stablecoinSymbol!: string;
  
    @Column({ type: "varchar", length: 255, nullable: true })
    @IsString()
    @IsOptional()
    chain!: string;
  
    @Column({ type: "varchar", length: 255, default: "" })
    @IsString()
    @IsOptional()
    tokenAddress!: string;
  
    @Column({ type: "int", default: 6 })
    @IsNumber()
    decimals!: number;
  
    @Column({ type: "varchar", length: 255, nullable: true })
    @IsString()
    @IsOptional()
    network!: string;
  
    @Column({ type: "varchar", length: 255, default: "" })
    @IsString()
    @IsOptional()
    transactionHash!: string;
  
    @Column({ type: "enum", enum: PaymentType, default: PaymentType.CRYPTO })
    @IsEnum(PaymentType)
    paymentType!: PaymentType;
  
    @OneToMany(() => Recipient, (recipient) => recipient.payroll, { cascade: true})
    recipients!: Recipient[];
  }