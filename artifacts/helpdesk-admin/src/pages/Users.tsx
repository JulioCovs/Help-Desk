import React from "react";
import { useGetUsers } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default function Users() {
  const { data: users, isLoading } = useGetUsers();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "manager":
        return <Badge variant="secondary">Manager</Badge>;
      default:
        return <Badge variant="default">Employee</Badge>;
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1 text-lg">System access and roles.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
                  </td>
                </tr>
              ) : users?.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
}
