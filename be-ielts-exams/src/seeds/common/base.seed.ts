import { Logger } from "@nestjs/common";
import { PrismaService } from "../../modules/prisma/prisma.service";

export abstract class BaseSeed {
  protected logger = new Logger(this.constructor.name);
  protected constructor(protected prisma: PrismaService) {}
  abstract checkRun(): Promise<boolean>;
  abstract importSeed(): Promise<void>;

  async run(): Promise<boolean> {
    const canRun = await this.checkRun();
    if (!canRun) {
      this.logger.log(`Nothing to seed.`);
      return;
    }
    try {
      await this.importSeed();
      this.logger.log(`Seed Success.`);
      return true;
    } catch (error) {
      this.logger.log(`Seed Error.`);
      console.error(error);
      return false;
    }
  }
}
