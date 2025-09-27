import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { User, UserRole } from "@prisma/client";
import { GetCurrentUser } from "src/decorators";
import { AccessTokenGuard } from "src/guards";
import RoleGuard from "src/guards/admin-role.guard";
import { EditUserDto, CreateUserDto, GetUserDto, ChangeUserPasswordDto } from "./dto";
import { UserService } from "./user.service";

@Controller({
  path: "/users",
  version: "1"
})
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post("changePassword/:id")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  changePasswordUser(@Param("id") uid: string, @Body() changePasswordDto: ChangeUserPasswordDto): Promise<boolean> {
    return this.userService.changePasswordUser(uid, changePasswordDto.newPassword);
  }

  @Get("me")
  @UseGuards(AccessTokenGuard)
  getMe(@GetCurrentUser("id") userId: string) {
    return this.userService.findById(userId);
  }

  @Get()
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  getUserList(@Query() query: GetUserDto) {
    return this.userService.getUserList(query);
  }

  @Get(":id")
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  getUserById(@Param("id") id: string) {
    return this.userService.findById(id);
  }

  @Put("me")
  @UseGuards(AccessTokenGuard)
  updateMe(@GetCurrentUser() currentUser: User, @Body() dto: EditUserDto) {
    return this.userService.editUser(currentUser.id, dto, currentUser);
  }

  @Put(":id")
  // @UseInterceptors(new ActionLogInterceptor(ModalType.USER, ActionType.UPDATE))
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  editUser(@Param("id") uid: string, @Body() dto: EditUserDto, @GetCurrentUser() currentUser: User) {
    return this.userService.editUser(uid, dto, currentUser);
  }
}
