'use client';

import BackgroundProvider from "@/components/theme/BackgroundProvider";
import GoogleOAuthProviderWrapper from "@/components/auth/GoogleOAuthProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <GoogleOAuthProviderWrapper>
      <NotificationProvider>
        <BackgroundProvider />
        {children}
      </NotificationProvider>
    </GoogleOAuthProviderWrapper>
  );
}

