import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase, type AdminUserProfile } from "@/lib/supabase";

type AdminRole = AdminUserProfile["role"];

const roleOptions: AdminRole[] = ["owner", "manager", "sales"];
const ownerColorOptions = [
  "#60a5fa",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("sales");

  const activeCount = useMemo(() => users.filter((user) => user.is_active).length, [users]);

  const setSaving = (key: string, value: boolean) => {
    setSavingKeys((current) => {
      if (value) return { ...current, [key]: true };
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const loadUsers = async (refresh = false) => {
    if (!supabase) return;
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, is_active, owner_color, last_login_at")
      .order("created_at", { ascending: false });

    if (refresh) {
      setIsRefreshing(false);
    } else {
      setIsLoading(false);
    }

    if (error) {
      toast({
        title: "Could not load users",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setUsers((data as AdminUserProfile[]) ?? []);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!supabase) return;
    const email = newEmail.trim().toLowerCase();
    const fullName = newFullName.trim();

    if (!email) {
      toast({ title: "Email required", description: "Add an email before creating the account.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }

    setSaving("create-user", true);
    const { error } = await supabase.rpc("admin_create_user", {
      input_email: email,
      input_full_name: fullName || null,
      input_is_active: true,
      input_password: newPassword,
      input_role: newRole,
    });
    setSaving("create-user", false);

    if (error) {
      toast({
        title: "User creation failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "User created",
      description: `${email} is ready and can sign in immediately.`,
    });

    setNewEmail("");
    setNewPassword("");
    setNewFullName("");
    setNewRole("sales");
    void loadUsers(true);
  };

  const handleUserUpdate = async (
    userId: string,
    patch: Partial<Pick<AdminUserProfile, "role" | "is_active" | "owner_color">>,
  ) => {
    if (!supabase) return;

    const saveKey = `update:${userId}`;
    setSaving(saveKey, true);
    const { error } = await supabase.from("admin_users").update(patch).eq("id", userId);
    setSaving(saveKey, false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, ...patch } : user)),
    );
  };

  return (
    <AdminShell
      title="User Management"
      description="Create admin-platform accounts directly with email and password, then adjust role and active status without leaving the dashboard."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total users</p>
          <p className="mt-3 text-3xl font-semibold text-white">{users.length}</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Active users</p>
          <p className="mt-3 text-3xl font-semibold text-white">{activeCount}</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Owners</p>
          <p className="mt-3 text-3xl font-semibold text-white">{users.filter((user) => user.role === "owner").length}</p>
        </Card>
      </div>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Create account</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Add user inside admin</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-black/20 text-white hover:bg-white/10"
            onClick={() => void loadUsers(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Input
            value={newFullName}
            onChange={(event) => setNewFullName(event.target.value)}
            placeholder="Display name"
            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
          />
          <Input
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="Email"
            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
          />
          <Input
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            placeholder="Password"
            className="border-white/10 bg-black/20 text-white placeholder:text-slate-500"
          />
          <Select value={newRole} onValueChange={(value) => setNewRole(value as AdminRole)}>
            <SelectTrigger className="border-white/10 bg-black/20 text-white">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={() => void handleCreateUser()}
            disabled={Boolean(savingKeys["create-user"])}
          >
            Create user
          </Button>
        </div>
      </Card>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Current users</h2>
          <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
            {users.length} total
          </Badge>
        </div>

        <div className="mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-slate-400">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-white">{user.full_name || "No display name"}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          void handleUserUpdate(user.id, { role: value as AdminRole })
                        }
                      >
                        <SelectTrigger className="h-9 w-[140px] border-white/10 bg-black/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.owner_color}
                          onValueChange={(value) =>
                            void handleUserUpdate(user.id, { owner_color: value })
                          }
                        >
                          <SelectTrigger className="h-9 w-[120px] border-white/10 bg-black/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ownerColorOptions.map((color) => (
                              <SelectItem key={color} value={color}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  {color}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: user.owner_color }}
                          title={user.owner_color}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-white/10 bg-black/20 text-white hover:bg-white/10"
                        disabled={Boolean(savingKeys[`update:${user.id}`])}
                        onClick={() =>
                          void handleUserUpdate(user.id, {
                            is_active: !user.is_active,
                          })
                        }
                      >
                        {user.is_active ? "Active" : "Disabled"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-slate-400">
                    No users found yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AdminShell>
  );
};

export default AdminUsers;
