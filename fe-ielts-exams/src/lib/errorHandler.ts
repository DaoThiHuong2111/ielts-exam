// lib/axios/error.ts
import { AxiosError } from 'axios';

export function parseAxiosError(error: unknown): string {
  if (!(error instanceof AxiosError)) return 'Lỗi không xác định';

  const status = error.response?.status;
  const message = error.response?.data?.message;

  if (error.code === 'ECONNABORTED') return 'Quá thời gian kết nối';
  if (!error.response) return 'Không thể kết nối đến máy chủ';

  switch (status) {
    case 400: return message || 'Yêu cầu không hợp lệ';
    case 401: return message || 'Phiên đăng nhập đã hết hạn';
    case 403: return message || 'Không đủ quyền truy cập';
    case 404: return message || 'Không tìm thấy tài nguyên';
    case 500: return message || 'Lỗi hệ thống';
    default: return message || `Lỗi hệ thống (${status})`;
  }
}
