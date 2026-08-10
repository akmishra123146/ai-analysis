import './globals.css';
import React from 'react';

export const metadata = {
  title: 'CRM AI Analytics Platform | Secure Natural Language to SQL Assistant',
  description: 'Role-scoped internal CRM with natural-language-to-SQL AI query engine, sub-SQL PostgreSQL RLS security, and NVIDIA LLM API integration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
