import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import * as argon from "argon2";
import { plainToClass } from "class-transformer";
import { PrismaService } from "../prisma/prisma.service";
import { EditUserDto } from "./dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { GetUserDto } from "./dto/get-user.dto";
import { UserEntity } from "./entities/user.entity";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const usernameUnique = await this.prisma.user.count({
      where: {
        username: createUserDto.username
      }
    });
    if (usernameUnique) {
      throw new ConflictException("Username đã tồn tại. Vui lòng thử lại!");
    }

    const emailUnique = await this.prisma.user.count({
      where: {
        email: createUserDto.email
      }
    });
    if (emailUnique) {
      throw new ConflictException("Email đã được sử dụng. Vui lòng thử lại!");
    }

    const hash = await argon.hash(createUserDto.password);
    const user = await this.prisma.user
      .create({
        data: {
          username: createUserDto.username,
          email: createUserDto.email,
          phoneNumber: createUserDto.phoneNumber,
          password: hash,
          name: createUserDto.name
        }
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new ForbiddenException("Credentials incorrect");
          }
        }
        throw error;
      });

    return plainToClass(UserEntity, user);
  }

  async changePasswordUser(uid: string, newPassword: string): Promise<boolean> {
    const hash = await argon.hash(newPassword);
    await this.prisma.user.updateMany({
      where: {
        id: uid
      },
      data: {
        password: hash
      }
    });
    return true;
  }

  async findById(userId: string): Promise<UserEntity> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId
      }
    });

    return plainToClass(UserEntity, user);
  }

  async editUser(userId: string, dto: EditUserDto, currentUser: User): Promise<UserEntity> {
    const userToEdit = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToEdit) {
      throw new NotFoundException('Tài khoản không tồn tại!');
    }

    // Security: Prevent a non-admin from editing other users
    if (currentUser.role !== 'ADMIN' && currentUser.id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa người dùng này.');
    }

    // Security: Prevent an admin from downgrading another admin's role
    if (
      dto.role &&
      dto.role !== userToEdit.role &&
      userToEdit.role === 'ADMIN' &&
      currentUser.id !== userToEdit.id
    ) {
      throw new ForbiddenException('Admin không thể thay đổi vai trò của admin khác.');
    }

    if (dto.email && dto.email !== userToEdit.email) {
      const emailUnique = await this.prisma.user.count({
        where: {
          email: dto.email,
          NOT: {
            id: userId,
          },
        },
      });
      if (emailUnique) {
        throw new ConflictException('Email đã được sử dụng. Vui lòng thử lại!');
      }
    }

    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
    });

    return plainToClass(UserEntity, user);
  }

  // get user list
  async getUserList(query: GetUserDto) {
    const { page = 1, size = 10, _q, active, role, name } = query;
    const skip = (page - 1) * size;
    const queryCustom = {
      skip,
      take: +size,
      where: {
        active: typeof active === "number" ? !!active : undefined,
        role,
        name: {
          contains: name
        }
      }
    };
    if (_q) {
      queryCustom.where["OR"] = {
        OR: [
          {
            name: {
              contains: _q
            }
          },
          {
            username: {
              contains: _q
            }
          },
          {
            email: {
              contains: _q
            }
          },
          {
            phoneNumber: {
              contains: _q
            }
          }
        ]
      };
    }
    const [total, userList] = await Promise.all([
      this.prisma.user.count({ where: queryCustom.where }),
      this.prisma.user.findMany({
        ...queryCustom,
        orderBy: [
          {
            firstName: "asc"
          },
          { lastName: "asc" },
          {
            middleName: "asc"
          }
        ]
      })
    ]);
    return {
      data: plainToClass(UserEntity, <any[]>userList),
      pagination: {
        total,
        page,
        size,
        pageCount: Math.ceil(parseInt(total + "") / size)
      }
    };
  }
}