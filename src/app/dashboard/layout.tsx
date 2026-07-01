import React from 'react';
import WelcomeTour from '@/components/WelcomeTour';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <WelcomeTour />
    </>
  );
}
