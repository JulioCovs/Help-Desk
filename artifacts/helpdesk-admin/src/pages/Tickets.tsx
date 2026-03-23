import React, { useState } from "react";
import { useGetTickets } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, Filter } from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";

export default function Tickets() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  
  // Need to cast to any to pass conditional undefined properly for the generated hook typing
  const params: any = {};
  if (statusFilter) params.status = statusFilter;
  if (priorityFilter) params.priority = priorityFilter;

  const { data: tickets, isLoading } = useGetTickets(params);

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Tickets</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage and track all support requests.</p>
        </div>
      </div>

      <Card className="mb-8 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input icon={<Search className="w-5 h-5" />} placeholder="Search tickets (simulated)..." />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 pl-10 pr-10 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-11 pl-10 pr-10 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Created By</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
                  </td>
                </tr>
              ) : tickets && tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-secondary/30 transition-colors group cursor-pointer relative">
                    <td className="px-6 py-4 font-medium text-muted-foreground">
                      <Link href={`/tickets/${ticket.id}`} className="absolute inset-0 z-10" />
                      #{ticket.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground group-hover:text-primary transition-colors max-w-xs truncate">
                      {ticket.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{ticket.departmentName || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                    <td className="px-6 py-4"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{ticket.createdBy}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                    No tickets found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
}
