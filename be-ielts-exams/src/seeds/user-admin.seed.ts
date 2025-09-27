import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import * as argon from "argon2";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { BaseSeed } from "./common/base.seed";
import UserAdminDatas from "./data/user-admin.json";

@Injectable()
export class UserAdminSeed extends BaseSeed {
  constructor(protected prisma: PrismaService) {
    super(prisma);
  }

  async checkRun(): Promise<boolean> {
    return (
      (await this.prisma.user.count({
        where: {
          role: UserRole.ADMIN
        }
      })) === 0
    );
  }

  async importSeed(): Promise<void> {
    let indexDataUserAdmin = 0;
    if (
      await this.prisma.user.count({
        where: {
          username: "ADMIN"
        }
      })
    )
      indexDataUserAdmin++;
    const hash = await argon.hash(UserAdminDatas[0].password);
    await this.prisma.user.create({
      data: { ...UserAdminDatas[indexDataUserAdmin], password: hash, role: UserRole.ADMIN }
    });
    console.log("User Admin Seeded Successfully");
  }
}
