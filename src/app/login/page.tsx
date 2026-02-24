"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [loginData, setLoginData] = useState({ login: "", password: "" });
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Wait for auth check before rendering
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      if (session) {
        router.push("/");
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  // Disable button if fields are empty
  useEffect(() => {
    setButtonDisabled(!(loginData.login && loginData.password));
  }, [loginData]);

  const handleLogin = async () => {
    console.log('Login Page: Starting login process');
    console.log('Login Page: Email:', loginData.login);
    setLoading(true);
    try {
      console.log('Login Page: Calling signIn with credentials');
      const result = await signIn("credentials", {
        email: loginData.login,
        password: loginData.password,
        redirect: false,
      });

      console.log('Login Page: signIn result:', result);

      if (result?.error) {
        console.log('Login Page: signIn error:', result.error);
        toast.error("Invalid login credentials.");
      } else if (result?.ok) {
        console.log('Login Page: signIn successful');
        toast.success("🎉 Welcome back to Kayapalat family!");
        // Get the session to determine redirect
        console.log('Login Page: Getting session after login');
        const session = await getSession();
        console.log('Login Page: Session after login:', session);

        if (session?.user) {
          console.log('Login Page: User in session:', session.user);
          console.log('Login Page: User role:', session.user.role);
          console.log('Login Page: User id:', session.user.id);
          console.log('Login Page: User name:', session.user.name);
          console.log('Login Page: User email:', session.user.email);

          const role = session.user.role;
          switch (role) {
            case "referuser":
              console.log('Login Page: Redirecting to /referuser');
              router.push("/referuser");
              break;
            case "sales_admin":
              console.log('Login Page: Redirecting to /sales-admin');
              router.push("/sales-admin");
              break;
            case "superadmin":
              console.log('Login Page: Redirecting to /superadmin');
              router.push("/superadmin");
              break;
            case "client":
              console.log('Login Page: Redirecting to /client');
              router.push("/client");
              break;
            case "designer":
              console.log('Login Page: Redirecting to /designer');
              router.push("/designer");
              break;
            default:
              console.log('Login Page: Unknown role, redirecting to /');
              router.push("/");
          }
        } else {
          console.log('Login Page: No user in session after login');
        }
      }
    } catch (error) {
      console.error("Login Page: Error during login:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#D2EBD0]">
        <span className="text-teal-700 text-lg font-semibold">Checking authentication...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#D2EBD0] sm:bg-[#E8F5E9] transition-all duration-300 text-black p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200 transition-all duration-300">
        <h1 className="text-2xl font-bold text-center mb-4 text-teal-700">
          Welcome Back!
        </h1>
        <p className="text-gray-600 text-center mb-6">Log in to your Kayapalat account.</p>

        <div className="flex flex-col">
          <label htmlFor="login" className="mb-1 text-sm text-gray-700">Email</label>
          <input
            id="login"
            type="text"
            value={loginData.login}
            onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
            placeholder="Enter Your Email"
            className="p-3 border border-gray-300 rounded-lg mb-4 bg-white text-black focus:outline-none focus:border-teal-500"
          />

          <label htmlFor="password" className="mb-1 text-sm text-gray-700">Password</label>
          <div className="relative mb-4">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              placeholder="Enter password"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !buttonDisabled && !loading) handleLogin();
              }}
              className="p-3 border border-gray-300 rounded-lg w-full bg-white text-black focus:outline-none focus:border-teal-500"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-600 hover:text-teal-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="mb-4 text-right">
            <Link href="/forgot-password" className="text-sm text-teal-600 hover:underline">Forgot password?</Link>
          </div>

          <button
            onClick={handleLogin}
            disabled={buttonDisabled || loading}
            className={`w-full p-3 rounded-lg font-bold text-white transition duration-300 ${
              buttonDisabled || loading ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className="text-center text-gray-600 mt-4">
            New to Kayapalat?{" "}
            <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-semibold">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
