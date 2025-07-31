"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "../contexts/ToastContext";
// import { useToast } from "@/contexts/ToastContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      console.log(data,"data")
      
      if (!res.ok) {
        error(data.error || "Login failed");
      } else {
        success("Login successful!");
        router.push("/dashboard/overview");
      }
    } catch (err) {
      error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="body-container">
      <div className="body-container-left relative">
        <Image
          src="/images/frydge_products_diagonal.webp"
          alt="FRYDGE products"
          fill
          sizes="(max-width: 800px) 0vw, (max-width: 1100px) 30vw, 50vw"
          style={{ objectFit: "cover" }}
          priority
        />
      </div>
      <div className="body-container-right">
        <div className="body-container-right-header">
          <Image
            className="header-logo"
            src="/images/frydge_logo.svg"
            alt="FRYDGE logo"
            width={150}
            height={40}
            priority
          />
        </div>
        <div className="body-container-right-main">
          <div className="body-container-right-text">
            <h1>Login</h1>
            <h2>Welcome to your Frydge portal</h2>
          </div>
          <form className="body-container-right-form" onSubmit={handleSubmit}>
            <label className="form-input-label" htmlFor="email">
              Username
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <label className="form-input-label" htmlFor="password">
              Password
            </label>
            <input
              className="form-input"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button 
              className="form-input-button fmdef" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
        <div className="body-container-right-footer">
          <a href="#" className="body-container-right-footer-link">
            Impressum
          </a>
          <div className="divider-vert-small" />
          <a href="#" className="body-container-right-footer-link">
            Datenschutz
          </a>
        </div>
      </div>
    </div>
  );
}