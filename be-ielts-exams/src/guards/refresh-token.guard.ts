import { AuthGuard } from "@nestjs/passport";

export class RefeshTokenGuard extends AuthGuard("jwt-refresh") {
  constructor() {
    super();
  }
}
