import React, { useState } from "react";
import { useGetTickets, useGetDepartments, useCreateTicket } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Filter, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

function NewTicketModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: departments } = useGetDepartments();
  const createTicket = useCreateTicket();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [departmentId, setDepartmentId] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("El título es obligatorio.");
    if (!description.trim()) return setError("La descripción es obligatoria.");
    if (!departmentId) return setError("Selecciona un departamento.");
    if (!createdBy.trim()) return setError("Indica quién crea el ticket.");

    try {
      await createTicket.mutateAsync({
        data: {
          title: title.trim(),
          description: description.trim(),
          priority: priority as any,
          departmentId: Number(departmentId),
          createdBy: createdBy.trim(),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["getTickets"] });
      queryClient.invalidateQueries({ queryKey: ["getStats"] });
      onClose();
    } catch {
      setError("No se pudo crear el ticket. Intenta de nuevo.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-xl font-display font-bold text-foreground">Nuevo Ticket</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe el problema brevemente"
              maxLength={120}
              className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Descripción *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla el problema, pasos para reproducirlo, impacto..."
              maxLength={1000}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Prioridad *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Departamento *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
              >
                <option value="">Seleccionar...</option>
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Creado por *</label>
            <input
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="Nombre del solicitante"
              className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={createTicket.isPending}>
              Crear Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tickets() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [showNewModal, setShowNewModal] = useState(false);

  const params: any = {};
  if (statusFilter) params.status = statusFilter;
  if (priorityFilter) params.priority = priorityFilter;

  const { data: tickets, isLoading } = useGetTickets(params);

  return (
    <Layout>
      {showNewModal && <NewTicketModal onClose={() => setShowNewModal(false)} />}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Tickets</h1>
          <p className="text-muted-foreground mt-1 text-lg">Gestiona y da seguimiento a todas las solicitudes.</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </Button>
      </div>

      <Card className="mb-8 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input icon={<Search className="w-5 h-5" />} placeholder="Buscar tickets..." />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 pl-10 pr-10 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="">Todos los estados</option>
                <option value="open">Abierto</option>
                <option value="in_progress">En progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-11 pl-10 pr-10 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="">Todas las prioridades</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
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
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Departamento</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Prioridad</th>
                <th className="px-6 py-4">Creado por</th>
                <th className="px-6 py-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
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
                    <td className="px-6 py-4 text-muted-foreground">{ticket.departmentName || "—"}</td>
                    <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                    <td className="px-6 py-4"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{ticket.createdBy}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-muted-foreground">No hay tickets con los filtros seleccionados.</p>
                      <Button variant="outline" size="sm" onClick={() => setShowNewModal(true)} className="gap-1.5">
                        <Plus className="w-4 h-4" />
                        Crear primer ticket
                      </Button>
                    </div>
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
