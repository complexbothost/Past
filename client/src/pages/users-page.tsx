import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { User as UserIcon } from "lucide-react";

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Card key={user.id} className="border-zinc-800">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-zinc-800 text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{user.username}</CardTitle>
                      <CardDescription>
                        Joined {formatDate(user.createdAt)}
                        {user.isAdmin && (
                          <span className="ml-2 bg-zinc-800 text-white text-xs px-2 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/user/${user.id}`)}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </CardContent>
              </Card>
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