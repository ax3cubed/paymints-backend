import {
	Entity,
	Column,
} from "typeorm";
import {
	IsEmail,
	IsNotEmpty,
	MinLength,
	IsOptional,
	IsBoolean,
	IsDecimal,
	IsString,
	Length,
} from "class-validator";
import { DecoratedEntity } from "./decorated.entity";


@Entity()
export class User extends DecoratedEntity {
	@Column({ unique: true, length: 255, type: "varchar" })
	@IsEmail({}, { message: "Invalid email format" })
	@IsNotEmpty({ message: "Email is required" })
	email!: string;

	@Column({ unique: true, length: 100, type: "varchar" })
	@IsNotEmpty({ message: "Username is required" })
	@MinLength(3, { message: "Username must be at least 3 characters" })
	username!: string;

	@Column({ length: 255, type: "varchar" })
	@IsNotEmpty({ message: "Password is required" })
	password!: string; // Hashed password

	@Column({ nullable: true, length: 255, type: "varchar" })
	@IsOptional()
	fullName!: string;


	@Column({ nullable: true, length: 500, type: "varchar" })
	@IsOptional()
	address!: string;

	@Column({ default: false, type: "boolean" })
	@IsBoolean()
	emailVerified!: boolean;



	@Column({ default: "", length: 500, type: "varchar" })
	@IsString()
	profileImage!: string;





	@Column({ nullable: true, length: 100, type: "varchar" })
	@IsOptional()
	@IsString()
	refererUsername!: string;

	@Column({ default: true, type: "boolean" })
	@IsBoolean()
	accountsVerified!: boolean;

	@Column({ default: true, type: "boolean" })
	@IsBoolean()
	allowPushNotification!: boolean;

	@Column({ default: false, type: "boolean" })
	@IsBoolean()
	allowEmailNotification!: boolean;

	@Column({ default: false, type: "boolean" })
	@IsBoolean()
	allowBiometricsLogin!: boolean;



	@Column({ default: false, type: "datetime" })
	lastLogin?: Date;
	@Column({ default: "active", length: 50, type: "varchar" })
	status!: "active" | "inactive" | "suspended";


}
