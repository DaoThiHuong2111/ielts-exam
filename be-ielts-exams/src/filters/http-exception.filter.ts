import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();

    const res = Object(exception.getResponse());
    const status = statusCode >= 200 && statusCode < 300 ? "success" : "error";

    let message = res?.message || exception.message || "";
    if (Array.isArray(message)) {
      message = message.length ? message[0] : "";
    }

    response.status(statusCode).json({
      status,
      statusCode: statusCode,
      message
    });
  }
}
