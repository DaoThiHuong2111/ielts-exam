import FooterApp from "@/components/footer";
import HeaderApp from "@/components/header";
import { AppProvider } from "@/contexts/app-context";
import { Toaster } from "react-hot-toast";
import { cookies } from "next/headers";

async function getUserData() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return null;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/profile`, {
      headers: {
        'Cookie': `accessToken=${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export default async function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const resUser = await getUserData()
  return (
    <AppProvider initUser={resUser}>
      <HeaderApp />
      {children}
      <FooterApp />
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </AppProvider>
  );
}
