import React from "react";
import { useGetStats, useGetTickets } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Layout } from "@/components/layout/Layout";
import { 
  Ticket, CheckCircle2, Clock, AlertCircle, 
  Users, Building2, TrendingUp, Inbox
} from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ title, value, icon: Icon, colorClass, delay }: { title: string, value: string | number, icon: any, colorClass: string, delay: number }) {
  return (
    <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-8 -mr-4 -mt-4 rounded-full opacity-5 transition-transform group-hover:scale-150 ${colorClass}`} />
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h4 className="text-3xl font-display font-bold text-foreground">{value}</h4>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: tickets, isLoading: ticketsLoading } = useGetTickets({ status: "open" });

  const chartData = stats ? [
    { name: 'Open', value: stats.openTickets },
    { name: 'In Progress', value: stats.inProgressTickets },
    { name: 'Resolved', value: stats.resolvedTickets },
    { name: 'Closed', value: stats.closedTickets },
  ] : [];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1 text-lg">Welcome back. Here's what's happening today.</p>
        </div>
        <Link href="/tickets" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          View All Tickets
        </Link>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border/50 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Tickets" value={stats.totalTickets} icon={Inbox} colorClass="bg-primary" delay={0} />
          <StatCard title="Open" value={stats.openTickets} icon={AlertCircle} colorClass="bg-blue-500" delay={0.1} />
          <StatCard title="In Progress" value={stats.inProgressTickets} icon={Clock} colorClass="bg-amber-500" delay={0.2} />
          <StatCard title="Resolved" value={stats.resolvedTickets} icon={CheckCircle2} colorClass="bg-emerald-500" delay={0.3} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Recent Open Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {ticketsLoading ? (
              <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : tickets && tickets.length > 0 ? (
              <div className="divide-y divide-border/50">
                {tickets.slice(0, 5).map(ticket => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors group">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-semibold text-muted-foreground">#{ticket.id}</span>
                        <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{ticket.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {ticket.departmentName}</span>
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {ticket.createdBy}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PriorityBadge priority={ticket.priority} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{formatDate(ticket.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/50" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No open tickets at the moment.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">System Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-[200px] animate-pulse bg-muted rounded-xl" />
              ) : (
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-primary text-primary-foreground border-transparent">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Weekly Performance</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">You have resolved 15% more tickets this week compared to last week.</p>
              <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90">View Report</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
