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
            "role-rich",
            "animate-pulse",
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
            "role-fraud",
            "animate-pulse",
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
            "role-gang",
            glitchActive && "glitch-active",
            className
          )}
          onClick={onClick}
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