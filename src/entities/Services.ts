import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
} from "typeorm";

import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { DecoratedEntity } from "./decorated.entity";
import { Invoice } from "./Invoice";

@Entity()
export class Services extends DecoratedEntity{

    @Column({ length: 255, nullable: true,  type: "varchar"  })
    @IsString()
    title?: string;

    @Column({ length: 255, nullable: true,  type: "varchar"  })
    @IsString()
    description?: string;

    @Column({ length: 255, default: 0, nullable: true,  type: "int"  })
    @IsOptional()
    quantity?: Number;

    @Column({ length: 255, nullable: true, type: "varchar" })
	@IsOptional()
	image?: string;

    @Column({ length: 255, default: '0.00', nullable: true,  type: "varchar"  })
    @IsOptional()
    unitPrice?: string;

    @ManyToOne(() => Invoice, (inv) => inv.services, { onDelete: "CASCADE" })
    invoice!: Invoice;
}