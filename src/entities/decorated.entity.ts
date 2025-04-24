// Project: @app/entities/decorated.entity.ts
// Description: This file defines the DecoratedEntity class, which is an abstract base class for entities in a TypeORM application. It includes common properties such as _id, createdAt, updatedAt, and softDeleted. The class uses decorators from TypeORM to define the entity structure and behavior.
import { IsOptional } from "class-validator";

import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	UpdateDateColumn,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export abstract class DecoratedEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@CreateDateColumn()
	createdAt?: Date;

	@UpdateDateColumn()
	updatedAt?: Date;

	@Column({ type: 'varchar', length: 255, nullable: true })
	updatedBy?: string;

	@Column({ default: false, type: "boolean" })
	@IsOptional()
	softDeleted?: boolean;
}
