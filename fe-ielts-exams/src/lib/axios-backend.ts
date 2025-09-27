import { cookies } from 'next/headers';
import { appConfig } from '@/config/app.config';

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

const BASE_URL = appConfig.api.baseUrl;

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {},
  retry: boolean = true
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Token hết hạn, refresh và retry
  if (response.status === 401 && retry) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${accessToken}; refreshToken=${refreshToken}`,
      },
      credentials: 'include', // cần thiết khi gọi nội bộ để forward cookie
    });
    const resData = await res.json();
    headers.Authorization = `Bearer ${resData?.accessToken}`;
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  }

  // if (!response.ok) {
  //   console.log(`API Error: ${response.statusText}`)
  // }

  return response.json();
}
