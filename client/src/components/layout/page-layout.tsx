import { ReactNode } from "react";
import Header from "./header";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="py-6 border-t border-zinc-800 bg-zinc-900">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2023 DoxNightmare. All rights reserved.</p>
          <p className="mt-1">
            A secure paste-sharing platform with moderation capabilities.
          </p>
        </div>
      </footer>
    </div>
  );
}
