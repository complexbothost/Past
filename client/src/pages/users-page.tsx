import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function UsersPage() {
  const [_, navigate] = useLocation();

  // Get all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">
            Browse and discover other users on the platform
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 text-primary">Loading...</div>
          </div>
        ) : users && users.length > 0 ? (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 py-2 hover:bg-zinc-800/50 px-4 rounded-lg transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-zinc-800 text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 
                    className="text-lg font-medium hover:text-primary cursor-pointer transition-colors"
                    onClick={() => navigate(`/user/${user.id}`)}
                  >
                    {user.username}
                  </h3>
                  <div className="text-sm text-zinc-400">
                    ID: {user.id} • Joined {formatDate(user.createdAt)}
                    {user.isAdmin && (
                      <span className="ml-2 bg-zinc-800 text-white text-xs px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        )}
      </div>
    </PageLayout>
  );
}