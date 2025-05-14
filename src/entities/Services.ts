import { Entity, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IsString, IsOptional, IsNumber } from "class-validator";
import { DecoratedEntity } from "./decorated.entity";

@Entity()
export class Services extends DecoratedEntity {
  @Column({ type: "varchar", length: 255, nullable: true })
  @IsOptional()
  @IsString()
  title!: string;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  @IsString()
  description!: string;

  @Column({ type: "int", default: 1 })
  @IsNumber()
  quantity!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  @IsOptional()
  image!: string;

  @Column({ type: "float", nullable: true })
  @IsOptional()
  unitPrice!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  invoice!: string; // Stores Invoice ObjectId as string
}