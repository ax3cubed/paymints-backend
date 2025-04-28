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
export class DiscountCodes extends DecoratedEntity{

    @Column({ length: 255, nullable: true,  type: "varchar"  })
    @IsString()
    discountCode?: string;

    @Column({ length: 255, default: 0, nullable: true,  type: "int"  })
    @IsOptional()
    discountPercent?: Number;

    @Column({ length: 255, default: 0, nullable: true,  type: "int"  })
    @IsOptional()
    noOfUse?: string;

    @ManyToOne(() => Invoice, (inv) => inv.discountCodes, { onDelete: "CASCADE" })
    invoice!: Invoice;
}
