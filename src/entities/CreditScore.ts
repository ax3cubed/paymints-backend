import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsNumber, IsBoolean, IsString, IsDate, IsOptional } from "class-validator";
import { User } from "./User";
import { DecoratedEntity } from "./decorated.entity";

@Entity()
export class CreditScore extends DecoratedEntity {
  
  @Column({ length: 255, nullable: true })
  @IsString()
  name!: string;

  @ManyToOne(() => User, (user) => user.creditScoreHistory, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "createdById" })
  user!: User;

  // ---------- Identity & Wallet ----------
  @Column({ type: "int", default: 0 })
  @IsNumber()
  walletAgeDays!: number;

  @Column({ type: "boolean", default: false })
  @IsBoolean()
  kycVerified!: boolean;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  countryRiskRating!: string;

  // ---------- On-chain Behavior ----------
  @Column({ type: "float", default: 0 })
  @IsNumber()
  txVolume30d!: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  txFrequency30d!: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  protocolInteractionsCount!: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  daoVotesCast!: number;

  // ---------- Payroll / Invoicing ----------
  @Column({ type: "float", default: 0 })
  @IsNumber()
  invoicesPaidReceivedRatio!: number;

  @Column({ type: "float", default: 0 })
  @IsNumber()
  avgInvoiceAmount!: number;

  @Column({ type: "float", default: 0 })
  @IsNumber()
  invoiceOnTimeRate!: number;

  @Column({ type: "boolean", default: false })
  @IsBoolean()
  invoiceFactoringUsed!: boolean;

  // ---------- DAO / Reputation ----------
  @Column({ type: "float", default: 0 })
  @IsNumber()
  reputationScore!: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  linkedSocialsCount!: number;

  @Column({ type: "float", default: 0 })
  @IsNumber()
  peerReviewsScore!: number;

  // ---------- Lending Behavior ----------
  @Column({ type: "float", default: 0 })
  @IsNumber()
  loanRepaymentRate!: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  loanDefaultsCount!: number;

  @Column({ type: "float", default: 0 })
  @IsNumber()
  borrowedToEarnedRatio!: number;

  // ---------- AI Behavior Signals ----------
  @Column({ type: "float", default: 0 })
  @IsNumber()
  consistencyScore!: number;

  @Column({ type: "boolean", default: false })
  @IsBoolean()
  riskAnomaliesDetected!: boolean;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  activityCluster!: string;

  // ---------- Final Credit Score ----------
  @Column({ type: "float", default: 0 })
  @IsNumber()
  finalCreditScore!: number;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  creditTier!: string; // e.g., "Excellent", "Fair", "High Risk"
}
