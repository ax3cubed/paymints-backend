import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToOne,
} from "typeorm";

import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { DecoratedEntity } from "./decorated.entity";
import { User } from "./User";

export enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    CANCELLED = "cancelled"
}

export enum ServiceType {
    STANDARD = "standard",
    INVOICE = "invoice",
    PAYROLL = "payroll",
    DAO = "DAO",
    CREDIT = "credit",
}


@Entity()
export class Payment extends DecoratedEntity {

    @Column({ length: 255, nullable: true, type: "varchar" })
    @IsString()
    paymentHash?: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    @IsString()
    paymentDescription?: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    @IsOptional()
    receiver?: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    @IsOptional()
    sender?: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    @IsOptional()
    totalAmount?: string;

    @Column({ type: "enum", enum: ServiceType, default: ServiceType.STANDARD })
    serviceType?: ServiceType;

    @Column({ length: 255, nullable: true, type: "varchar" })
    serviceId?: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    @IsOptional()
    paymentDate?: string;

    @Column({ type: "enum", enum: PaymentStatus, default: PaymentStatus.PENDING })
    paymentStatus?: PaymentStatus;

    @OneToOne(() => User, (user) => user.address, { eager: true })
    // @JoinColumn({ name: "createdBy" })
    createdBy!: User;

    @Column({ length: 255, nullable: true, type: "varchar" })
    @IsOptional()
    paymentSignature?: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    @IsOptional()
    mintAddress?: string;

}