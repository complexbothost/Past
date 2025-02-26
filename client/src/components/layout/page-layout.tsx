import { ReactNode } from "react";
import Header from "./header";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 relative overflow-hidden">
      {/* Background design elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[60%] bg-zinc-800/10 rounded-[40%] blur-3xl"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-zinc-700/10 rounded-[40%] blur-3xl"></div>
        <div className="absolute top-[50%] right-[15%] w-[25%] h-[25%] bg-zinc-600/10 rounded-[40%] blur-3xl"></div>
        <div className="absolute top-[20%] left-[50%] w-[15%] h-[15%] bg-zinc-500/10 rounded-[40%] blur-3xl"></div>
        <div className="hidden md:block absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-zinc-600/5 rounded-[40%] blur-3xl"></div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow z-10 py-8">
          {children}
        </main>
        <footer className="py-6 bg-zinc-900/50 backdrop-blur-md border-t border-white/5 z-10">
          <div className="container max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <p className="text-sm font-medium text-white/70">Pastebin</p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-xs text-white/50">© 2025 Pastebin. Secure paste-sharing with role management.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}