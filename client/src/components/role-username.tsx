import { useEffect, useState } from "react";
import { User, UserRole } from "@shared/schema";
import { cn } from "@/lib/utils";

interface RoleUsernameProps {
  user: Pick<User, "username" | "role">;
  className?: string;
  onClick?: () => void;
}

export default function RoleUsername({ user, className, onClick }: RoleUsernameProps) {
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    if (user.role === UserRole.GANG) {
      const interval = setInterval(() => {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 100);
      }, 1200);

      return () => clearInterval(interval);
    }
  }, [user.role]);

  if (!user.role) {
    return (
      <span 
        className={cn("cursor-pointer", className)}
        onClick={onClick}
      >
        {user.username}
      </span>
    );
  }

  switch (user.role) {
    case UserRole.RICH:
      return (
        <span 
          className={cn(
            "cursor-pointer relative",
            "text-yellow-300",
            "animate-pulse",
            "after:content-['✨'] after:absolute after:-right-4 after:top-0",
            "before:content-['✨'] before:absolute before:-left-4 before:top-0",
            className
          )}
          onClick={onClick}
        >
          {user.username}
        </span>
      );

    case UserRole.FRAUD:
      return (
        <span 
          className={cn(
            "cursor-pointer",
            "text-blue-400",
            "animate-pulse",
            "drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]",
            className
          )}
          onClick={onClick}
        >
          {user.username}
        </span>
      );

    case UserRole.GANG:
      return (
        <span 
          className={cn(
            "cursor-pointer",
            "text-purple-400",
            glitchActive && "animate-[glitch_0.1s_ease-in-out]",
            className
          )}
          onClick={onClick}
          style={{
            textShadow: glitchActive 
              ? "2px 2px #ff00ea, -2px -2px #00ff9d" 
              : "none"
          }}
        >
          {user.username}
        </span>
      );

    default:
      return (
        <span 
          className={cn("cursor-pointer", className)}
          onClick={onClick}
        >
          {user.username}
        </span>
      );
  }
}
