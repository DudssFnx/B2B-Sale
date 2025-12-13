import { ThemeToggle } from "../ThemeToggle";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="text-sm text-muted-foreground">Toggle theme</span>
      </div>
    </ThemeProvider>
  );
}
