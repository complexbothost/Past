import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-purple-600/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-3xl"></div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 flex flex-col items-center">
        <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center border border-white/10">
          <AlertCircle className="h-12 w-12 text-purple-400" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-3 text-center">404</h1>
        <p className="text-xl font-semibold text-white/80 mb-6 text-center">Page Not Found</p>

        <p className="mb-8 text-center text-white/60">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <Button className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}