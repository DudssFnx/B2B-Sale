import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, type UserStatus } from "./StatusBadge";
import { Check, X, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserRole = "admin" | "sales" | "customer";

export interface UserData {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: UserRole;
  status: UserStatus;
}

interface UserCardProps {
  user: UserData;
  onApprove?: (user: UserData) => void;
  onReject?: (user: UserData) => void;
  onChangeRole?: (user: UserData, role: UserRole) => void;
}

export function UserCard({ user, onApprove, onReject, onChangeRole }: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover-elevate" data-testid={`card-user-${user.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate" data-testid={`text-user-name-${user.id}`}>
                {user.name}
              </h3>
              <StatusBadge status={user.status} />
            </div>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            {user.company && (
              <p className="text-sm text-muted-foreground">{user.company}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1 capitalize">Role: {user.role}</p>
          </div>
          <div className="flex items-center gap-1">
            {user.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onApprove?.(user)}
                  className="text-green-600 dark:text-green-400"
                  data-testid={`button-approve-user-${user.id}`}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onReject?.(user)}
                  className="text-destructive"
                  data-testid={`button-reject-user-${user.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-user-menu-${user.id}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onChangeRole?.(user, "admin")}>
                  Set as Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeRole?.(user, "sales")}>
                  Set as Sales
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeRole?.(user, "customer")}>
                  Set as Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
