import type { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../services/user.service";
import { BaseController } from "./base.controller";
import { z } from "zod";
import { BeneficiaryService } from "@/services/beneficiary.service";
import config from "@/config";

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  image: z.string().optional(),
  twitterId: z.string().optional(),
  website: z.string().optional(),
});

const addBeneficiarySchema = z.object({
  beneficiaryName: z.string(),
  beneficiaryEmail: z.string().optional(),
  beneficiaryWallet: z.string(),
});

export class UserController extends BaseController {
  private userService: UserService;
  private beneficiaryService: BeneficiaryService;

  constructor() {
    super();
    this.userService = new UserService();
    this.beneficiaryService = new BeneficiaryService();
  }

  /**
   * Get user profile
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.userService.getAuthenticatedUser(request);
      const beneficiaries = await this.beneficiaryService.getBeneficiaries(user.id);
      const tokenMintAddresses = config.primaryTokens;
      console.log('-----------------------------------------------------------------')
      const tokenResponse = await this.userService.getTokenAccounts(user.address, tokenMintAddresses)
      console.log(tokenResponse)
      console.log('-----------------------------------------------------------------')

      return this.sendSuccess(
        reply,
        {
          user: {
            id: user.id,
            email: user.email,
            address: user.address,
            username: user.username,
            name: user.name,
            status: user.status,
            image: user.image,
            twitterId: user.twitterId,
            website: user.website,
            beneficiaries: beneficiaries.map((b: any) => ({
              id: b.id,
              name: b.name,
              email: b.email,
              walletAddress: b.walletAddress,
            })),
            creditScoreHistory: [],
          },
        },
        "User profile retrieved successfully"
      );
    } catch (error) {
      return this.handleError(error as Error, reply, request.requestId);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const profileData = updateProfileSchema.parse(request.body);
      const user = await this.userService.updateProfile(request, profileData);

      return this.sendSuccess(
        reply,
        {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            address: user.address,
            image: user.image,
            twitterId: user.twitterId,
            website: user.website,
          },
        },
        "Profile updated successfully"
      );
    } catch (error) {
      return this.handleError(error as Error, reply, request.requestId);
    }
  }

  /**
   * Add beneficiary
   */
  async addBeneficiary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = addBeneficiarySchema.parse(request.body);
      const user = await this.userService.getAuthenticatedUser(request);

      const beneficiary = await this.beneficiaryService.addBeneficiary(user.id, {
        name: body.beneficiaryName,
        email: body.beneficiaryEmail || "",
        walletAddress: body.beneficiaryWallet,
      });

      return this.sendSuccess(
        reply,
        { beneficiary },
        "Beneficiary added successfully"
      );
    } catch (error) {
      return this.handleError(error as Error, reply, request.requestId);
    }
  }
}
