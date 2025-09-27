import { Exclude } from "class-transformer";

export class UserEntity {
  id: string;
  name: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;

  @Exclude()
  password: string;
  @Exclude()
  hashedRt: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
