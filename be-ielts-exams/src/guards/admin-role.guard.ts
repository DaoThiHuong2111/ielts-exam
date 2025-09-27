import { CanActivate, ExecutionContext, HttpException, HttpStatus, mixin, Type } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { UserService } from "src/modules/user/user.service";

const RoleGuard = (role: UserRole | UserRole[]): Type<CanActivate> => {
  class RoleGuardMixin implements CanActivate {
    private userService = new UserService(PrismaService.getInstance());

    async canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const userEntity = await this.userService.findById(user?.id);

      if (!userEntity) {
        throw new HttpException("Người dùng không tồn tại.", HttpStatus.UNAUTHORIZED);
      }

      if (!userEntity.active) {
        throw new HttpException("Tài khoản của bạn đã bị khóa.", HttpStatus.NOT_ACCEPTABLE); // 406
      }
      // Use the role from the database, not the token
      return Array.isArray(role) ? role.includes(userEntity.role as UserRole) : userEntity.role === role;
    }
  }

  return mixin(RoleGuardMixin);
};

export default RoleGuard;