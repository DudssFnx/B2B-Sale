import { LoginForm } from "../LoginForm";
import { useState } from "react";

export default function LoginFormExample() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    console.log("Login attempt:", email, password);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    return email.includes("@");
  };

  return (
    <div className="flex items-center justify-center">
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </div>
  );
}
