import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsBoolean, IsString, IsEnum, IsIn, IsNumber } from "class-validator";
import { User } from "./User";
import { DiscountCodes } from "./Discount";
import { Services } from "./Services";
import { DecoratedEntity } from "./decorated.entity";
import { Payroll } from "./Payroll";

// Enums for various states
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
export class Recipient extends DecoratedEntity {

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    name!: string; // Matches orderTitle

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    email!: string; // Matches orderTitle

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    walletAddress!: string; // Matches orderTitle

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    payType!: string; // Matches orderTitle

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    grossPay!: string; // Matches orderTitle

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    netPay!: string; // Matches orderTitle

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    bonuses!: string; // Matches orderTitle

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    deductions!: string; // Matches orderTitle

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    paid!: string; // Matches orderTitle

    @Column({ type: "float", default: 0 })
    @IsNumber()
    totalAmount!: number;

    @Column({ type: "varchar", length: 255, nullable: false })
    @IsString()
    txHash!: string; // Matches orderTitle

    @ManyToOne(() => Payroll, (payroll) => payroll.recipients, {nullable: false, onDelete: "CASCADE" })
    payroll!: Payroll; // Matches createdBy
}
