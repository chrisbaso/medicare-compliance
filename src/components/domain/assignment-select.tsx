import { Select } from "@/components/ui/filter-bar";
import { User } from "@/lib/types";

export function AssignmentSelect({
  users,
  value,
  onChange
}: {
  users: User[];
  value?: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <Select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
      <option value="">Unassigned</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.fullName}
        </option>
      ))}
    </Select>
  );
}
