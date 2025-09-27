import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface IResponse<T> {
  status: "success" | "error";
  statusCode: number;
  message?: string;
  data?: T;
}

export interface IMakeErrorResponseProps {
  statusCode: number;
  message: string;
}

export function makeResponse(response: IResponse<any>) {
  return response;
}

export function makeErrorResponse({ statusCode, message }: IMakeErrorResponseProps): IResponse<undefined> {
  return makeResponse({
    status: "error",
    statusCode,
    message
  });
}

export function makeSuccessResponse(data: any, statusCode?: number, message?: string) {
  return makeResponse({
    status: "success",
    statusCode: statusCode || 200,
    message: message || "OK",
    data
  });
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    return next.handle().pipe(
      map((data: any): IResponse<any> => {
        if (data?.status && data?.statusCode && data?.message) {
          return data;
        }

        const message = context.switchToHttp().getResponse().statusMessage || "OK";
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const status = statusCode >= 200 && statusCode < 300 ? "success" : "error";
        return {
          status,
          statusCode: statusCode >= 200 && statusCode < 300 ? statusCode : -10001,
          message,
          data
        };
      })
    );
  }
}
