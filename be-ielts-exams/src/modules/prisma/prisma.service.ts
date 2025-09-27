import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private static instance: PrismaService;
  private static instanceCount = 0;

  public static getInstanceCount(): number {
    return this.instanceCount;
  }

  public static getInstance(): PrismaService {
    this.instanceCount++;
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on("beforeExit" as never, async () => {
      await app.close();
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}

export const prisma = PrismaService.getInstance();
