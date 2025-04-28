import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";

import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { User } from "./User";
import { DecoratedEntity } from "./decorated.entity";

@Entity()
export class Beneficiary extends DecoratedEntity{

	@Column({ length: 255, nullable: true,  type: "varchar"  })
	@IsString()
	name!: string;

	@Column({ length: 255, default: "", nullable: true,  type: "varchar"  })
	@IsOptional()
	@IsEmail({}, { message: "Invalid email format" })
	email!: string;

	@Column({ length: 255, default: "", nullable: true,  type: "varchar"  })
	@IsOptional()
	@IsString()
	walletAddress!: string;

	@ManyToOne(() => User, (user) => user.beneficiaries, {nullable: false, onDelete: "CASCADE" })
	@JoinColumn({ name: "createdById" })
	user!: User;
}
