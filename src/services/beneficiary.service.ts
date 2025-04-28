import { AppDataSource } from "../database";
import { Beneficiary } from "../entities/Beneficiary";
import { User } from "../entities/User";
import { NotFoundError } from "../core/errors";
import { logger } from "../core/logger";

export class BeneficiaryService {
  private beneficiaryRepository = AppDataSource.getRepository(Beneficiary);
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Get all beneficiaries for a user
   *
   * @param userId - ID of the user
   * @returns List of beneficiaries
   */
  async getBeneficiaries(userId: number): Promise<Beneficiary[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const beneficiaries = await this.beneficiaryRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });

    return beneficiaries;
  }

  /**
   * Add a new beneficiary for a user
   *
   * @param userId - ID of the user
   * @param data - Beneficiary data
   * @returns The newly added beneficiary
   */
  async addBeneficiary(userId: number, data: {
    name: string;
    email?: string;
    walletAddress: string;
  }): Promise<Beneficiary> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const beneficiary = this.beneficiaryRepository.create({
      name: data.name,
      email: data.email ?? "",
      walletAddress: data.walletAddress,
      user: user,
    });

    await this.beneficiaryRepository.save(beneficiary);
    logger.info({ userId, beneficiaryId: beneficiary.id }, "Beneficiary added");

    return beneficiary;
  }

  /**
   * Delete a beneficiary
   *
   * @param beneficiaryId - ID of the beneficiary
   * @param userId - ID of the user performing the delete (to validate ownership)
   */
  async deleteBeneficiary(beneficiaryId: number, userId: number): Promise<void> {
    const beneficiary = await this.beneficiaryRepository.findOne({
      where: {
        id: beneficiaryId,
        user: { id: userId },
      },
    });

    if (!beneficiary) {
      throw new NotFoundError("Beneficiary", beneficiaryId);
    }

    await this.beneficiaryRepository.remove(beneficiary);
    logger.info({ beneficiaryId }, "Beneficiary deleted");
  }
}
