import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	OneToMany,
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
	IsIn,
} from "class-validator";
import { Beneficiary } from "./Beneficiary";
import { DecoratedEntity } from "./decorated.entity";
import { Payroll } from "./Payroll";


@Entity()
export class User extends DecoratedEntity{

	@Column({ length: 255, nullable: true, type: "varchar" })
	@IsOptional()
	@IsString()
	name!: string;

	@Column({ length: 255, nullable: true,  type: "varchar"  })
	@IsEmail({}, { message: "Invalid email format" })
	email!: string;

	@Column({ length: 100, unique: true,  type: "varchar"  })
	@IsNotEmpty()
	@MinLength(3, { message: "Username must be at least 3 characters" })
	username!: string;

	@Column({ length: 255, nullable: true, type: "varchar" })
	@IsOptional()
	image!: string;

	@Column({ length: 255, unique: true, type: "varchar"  })
	@IsNotEmpty()
	@IsString()
	address!: string; // Web3 wallet address

	@Column({ default: "0",  type: "varchar" })
	@IsString()
	status!: string;

	@Column({ default: false,  type: "boolean" })
	@IsBoolean()
	isAdmin!: boolean;

	@Column({ nullable: true,  type: "varchar" })
	@IsOptional()
	@IsString()
	twitterId!: string;

	@Column({ nullable: true,  type: "varchar" })
	@IsOptional()
	@IsString()
	website!: string;

	@OneToMany(() => Beneficiary, (b) => b.user, { cascade: true, eager: true })
	beneficiaries!: Beneficiary[];

	@OneToMany(() => Payroll, (b) => b.createdBy, { cascade: true, eager: true })
	payroll!: Payroll[];

	@OneToMany(() => Payroll, (b) => b.createdBy, { cascade: true, eager: true })
	creditScoreHistory!: Payroll[];
}
