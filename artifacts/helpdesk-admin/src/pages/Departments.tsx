import React from "react";
import { useGetDepartments } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/Card";
import { Mail, Phone, Ticket } from "lucide-react";
import * as Icons from "lucide-react";

export default function Departments() {
  const { data: departments, isLoading } = useGetDepartments();

  const renderIcon = (name: string, color: string) => {
    // Basic dynamic icon mapping with a fallback
    const IconComponent = (Icons as any)[name.charAt(0).toUpperCase() + name.slice(1)] || Icons.Building2;
    return <IconComponent className="w-8 h-8" style={{ color }} />;
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Departments</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage organizational units and teams.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-card border border-border/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments?.map((dept) => (
            <Card key={dept.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${dept.color}15` }}
                  >
                    {renderIcon(dept.icon, dept.color)}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-display font-bold text-foreground">{dept.ticketCount}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tickets</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-2">{dept.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">
                  {dept.description || "No description provided."}
                </p>

                <div className="space-y-2 pt-4 border-t border-border/50">
                  {dept.contactEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" /> {dept.contactEmail}
                    </div>
                  )}
                  {dept.contactPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" /> {dept.contactPhone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
