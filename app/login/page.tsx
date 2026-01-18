'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Building, Wrench, Truck, Flame } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Show session expired notification
  useEffect(() => {
    if (searchParams.get('session_expired') === '1') {
      toast.error('Session Expired', {
        description: 'Your session has expired. Please log in again.',
        duration: 5000,
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Diagonal stripes pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)',
          }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Flame className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Singh Fire</h1>
              <p className="text-white/80 text-sm">Engineers</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Fire Safety &<br />Construction Solutions<br />You Can Trust
          </h2>
          
          <p className="text-white/80 text-lg mb-12 max-w-md">
            Track workers, materials, attendance, and expenses - all in one powerful platform built for fire safety and construction teams.
          </p>
          
          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building className="h-5 w-5" />
              </div>
              <span className="text-white/90">Multi-site project management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="text-white/90">Worker attendance & overtime tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-white/90">Material dispatch & inventory</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-tl-full" />
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-primary rounded-xl">
              <Flame className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Singh Fire</h1>
              <p className="text-muted-foreground text-sm">Engineers</p>
            </div>
          </div>

          <Card className="border-0 shadow-xl lg:border lg:shadow-lg">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Need help? Contact your administrator
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2026 Singh Fire Engineers. <br></br>Crafted by Himanshu Mall & Piyush Kumar.
          </p>
        </div>
      </div>
    </div>
  );
}
