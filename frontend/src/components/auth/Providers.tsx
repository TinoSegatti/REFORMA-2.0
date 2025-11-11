'use client';

import BackgroundProvider from "@/components/theme/BackgroundProvider";
import GoogleOAuthProviderWrapper from "@/components/auth/GoogleOAuthProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <GoogleOAuthProviderWrapper>
      <BackgroundProvider />
      {children}
    </GoogleOAuthProviderWrapper>
  );
}

