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
	BeforeInsert,
	PrimaryColumn,
	ObjectIdColumn,
} from "typeorm";

// @Entity()
export abstract class DecoratedEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	@ObjectIdColumn()
	_id!: string;

	@Column({ type: 'int', length: 255, nullable: false })
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

	@BeforeInsert()
	generateId() {
		this.id = Number(this.generate10DigitId());
	}

	private generate10DigitId(): string {
		const min = 1_000_000_000; // 10-digit minimum
		const max = 9_999_999_999; // 10-digit maximum
		return Math.floor(Math.random() * (max - min + 1)) + min + '';
	}
}
