import { useEffect } from "react";
import { useLocation } from "wouter";
import { insertUserSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Lock, Shield, UserCheck, Key } from "lucide-react";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Redirect if already logged in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {/* Left side - Branding Area */}
      <div className="w-full lg:w-1/2 p-6 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-indigo-900/30"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>

          {/* Abstract shapes */}
          <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-xl px-6 py-12 text-center relative z-10">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-xl">
              <FileText className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white">
            Paste<span className="text-purple-400">bin</span>
          </h1>
          <p className="mb-8 text-xl text-white/80 leading-relaxed">
            Share code snippets, text, and pastes securely with role-based access control and advanced management features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="rounded-xl bg-white/5 p-6 backdrop-blur-sm border border-white/10 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-600/20">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Secure Sharing</h3>
              </div>
              <p className="text-sm text-white/70">
                Control who can view your pastes with advanced role-based permissions and privacy settings.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-6 backdrop-blur-sm border border-white/10 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-indigo-600/20">
                  <UserCheck className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">User Roles</h3>
              </div>
              <p className="text-sm text-white/70">
                Assign custom roles to community members with different permissions and interaction capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="w-full lg:w-1/2 p-6 flex items-center justify-center bg-zinc-950">
        <Tabs defaultValue="login" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-900/70">
            <TabsTrigger value="login" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
                <CardDescription className="text-white/70">
                  Sign in to access your pastes and create new ones
                </CardDescription>
              </CardHeader>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white/80">Username</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <UserCheck className="h-4 w-4 text-white/50" />
                      </div>
                      <Input 
                        id="username" 
                        type="text" 
                        className="pl-10 bg-zinc-800 border-white/10 text-white"
                        {...loginForm.register("username")} 
                      />
                    </div>
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-red-400">{loginForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/80">Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Key className="h-4 w-4 text-white/50" />
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        className="pl-10 bg-zinc-800 border-white/10 text-white"
                        {...loginForm.register("password")} 
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-400">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
                <CardDescription className="text-white/70">
                  Join Pastebin to share and manage your pastes
                </CardDescription>
              </CardHeader>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="reg-username" className="text-white/80">Username</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <UserCheck className="h-4 w-4 text-white/50" />
                      </div>
                      <Input 
                        id="reg-username" 
                        type="text"
                        className="pl-10 bg-zinc-800 border-white/10 text-white"
                        {...registerForm.register("username")} 
                      />
                    </div>
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-red-400">{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-white/80">Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Key className="h-4 w-4 text-white/50" />
                      </div>
                      <Input 
                        id="reg-password" 
                        type="password"
                        className="pl-10 bg-zinc-800 border-white/10 text-white"
                        {...registerForm.register("password")} 
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-400">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-white/80">Confirm Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Lock className="h-4 w-4 text-white/50" />
                      </div>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        className="pl-10 bg-zinc-800 border-white/10 text-white"
                        {...registerForm.register("confirmPassword")} 
                      />
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-400">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}