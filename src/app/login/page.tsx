"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const [username, setUsername] = useState("1313131313"); // Test number for "Balanced Growth Tracker"
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate network delay
    setTimeout(() => {
      // In a real app, you'd authenticate. Here we just check for the test user.
      // The fi-mcp-dev server uses the phone number for identity but doesn't validate passwords.
      if (username === "1313131313" && password === "amma") {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("isLoggedIn", "true");
          sessionStorage.setItem("mcp-user", username);
        }
        router.push("/");
      } else {
        setError("Invalid username or password. Use test user 1313131313 and password 'amma'.");
        setIsLoading(false);
      }
    }, 500);
  };

  const handleForgotPassword = () => {
    // A real implementation would navigate to a password reset page
    alert("Forgot password functionality is a placeholder in this prototype.");
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-black">
      <Card className="w-full max-w-sm bg-gray-950 border border-green-500/30 text-white shadow-lg shadow-green-500/20">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
                <Logo />
            </div>
          <CardDescription className="text-gray-400">Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Phone Number</Label>
              <Input
                id="username"
                type="text"
                placeholder="1313131313"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-gray-800/50 border-gray-700 placeholder:text-gray-500 focus:border-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (use 'amma')"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800/50 border-gray-700 placeholder:text-gray-500 focus:border-green-500"
              />
            </div>
            <div className="flex justify-end">
                <Button
                    onClick={handleForgotPassword}
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm font-normal text-gray-400 hover:text-green-400"
                >
                    Forgot Password?
                </Button>
            </div>
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground" disabled={isLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Log in
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
