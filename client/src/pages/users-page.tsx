import { useQuery } from "@tanstack/react-query";
import { User, UserRole } from "@shared/schema";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import RoleUsername from "@/components/role-username";

export default function UsersPage() {
  const [_, navigate] = useLocation();

  // Get all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  // Group users by role
  const richUsers = users?.filter(user => user.role === UserRole.RICH) || [];
  const fraudUsers = users?.filter(user => user.role === UserRole.FRAUD) || [];
  const gangUsers = users?.filter(user => user.role === UserRole.GANG) || [];
  const regularUsers = users?.filter(user => !user.role) || [];

  // Render a group of users
  const renderUserGroup = (groupUsers: User[], title: string) => {
    if (groupUsers.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="space-y-3">
          {groupUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-4 py-2 hover:bg-zinc-800/50 px-4 rounded-lg transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-zinc-800 text-white">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 
                  className="text-lg font-medium cursor-pointer transition-colors"
                  onClick={() => navigate(`/user/${user.id}`)}
                >
                  <RoleUsername user={user} />
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
      </div>
    );
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
          <div>
            {renderUserGroup(richUsers, "Rich Users")}
            {richUsers.length > 0 && (fraudUsers.length > 0 || gangUsers.length > 0 || regularUsers.length > 0) && (
              <Separator className="my-6" />
            )}

            {renderUserGroup(fraudUsers, "Fraud Users")}
            {fraudUsers.length > 0 && (gangUsers.length > 0 || regularUsers.length > 0) && (
              <Separator className="my-6" />
            )}

            {renderUserGroup(gangUsers, "Gang Users")}
            {gangUsers.length > 0 && regularUsers.length > 0 && (
              <Separator className="my-6" />
            )}

            {renderUserGroup(regularUsers, "Regular Users")}
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