import { UserCard } from "../UserCard";

// todo: remove mock functionality
const mockUser = {
  id: "1",
  name: "John Smith",
  email: "john@clientcorp.com",
  company: "Client Corp",
  role: "customer" as const,
  status: "pending" as const,
};

export default function UserCardExample() {
  return (
    <div className="max-w-md">
      <UserCard
        user={mockUser}
        onApprove={(u) => console.log("Approve:", u.name)}
        onReject={(u) => console.log("Reject:", u.name)}
        onChangeRole={(u, r) => console.log("Change role:", u.name, "to", r)}
      />
    </div>
  );
}
