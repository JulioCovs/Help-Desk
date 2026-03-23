import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetTicket, 
  useGetTicketComments, 
  useUpdateTicket, 
  useCreateComment, 
  useDeleteTicket 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, MessageSquare, Trash2, Calendar, User, Building2, Save } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function TicketDetail() {
  const { id } = useParams();
  const ticketId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading: isTicketLoading } = useGetTicket(ticketId);
  const { data: comments, isLoading: isCommentsLoading } = useGetTicketComments(ticketId);
  
  const updateMutation = useUpdateTicket();
  const deleteMutation = useDeleteTicket();
  const commentMutation = useCreateComment();

  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  
  const [statusEdit, setStatusEdit] = useState<string | null>(null);
  const [priorityEdit, setPriorityEdit] = useState<string | null>(null);

  if (isTicketLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-foreground mb-2">Ticket not found</h2>
          <Button onClick={() => setLocation("/tickets")} variant="outline">Back to Tickets</Button>
        </div>
      </Layout>
    );
  }

  const handleUpdate = async () => {
    try {
      const data: any = {};
      if (statusEdit) data.status = statusEdit;
      if (priorityEdit) data.priority = priorityEdit;
      
      await updateMutation.mutateAsync({ id: ticketId, data });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      setStatusEdit(null);
      setPriorityEdit(null);
    } catch (e) {
      console.error(e);
      alert("Failed to update ticket");
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      try {
        await deleteMutation.mutateAsync({ id: ticketId });
        queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
        setLocation("/tickets");
      } catch (e) {
        alert("Failed to delete ticket");
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await commentMutation.mutateAsync({
        id: ticketId,
        data: { content: commentText, authorName: "Admin", isInternal }
      });
      setCommentText("");
      setIsInternal(false);
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/comments`] });
    } catch (e) {
      alert("Failed to add comment");
    }
  };

  const hasChanges = statusEdit || priorityEdit;

  return (
    <Layout>
      <div className="mb-6">
        <button onClick={() => setLocation("/tickets")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tickets
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <Card>
            <CardHeader className="border-b border-border/50 bg-secondary/20">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-muted-foreground">#{ticket.id}</span>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDelete} className="opacity-50 hover:opacity-100">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{ticket.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> 
                Activity & Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto p-6 space-y-6">
                {isCommentsLoading ? (
                  <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : comments && comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment.id} className={`flex gap-4 ${comment.isInternal ? 'bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/50' : 'pt-6 first:pt-0'}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-foreground flex items-center gap-2">
                            {comment.authorName}
                            {comment.isInternal && <span className="text-[10px] uppercase tracking-wider bg-amber-200/50 text-amber-700 px-2 py-0.5 rounded-full">Internal Note</span>}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No comments yet.</p>
                )}
              </div>
              
              <div className="p-6 border-t border-border/50 bg-secondary/20">
                <form onSubmit={handleAddComment}>
                  <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full min-h-[120px] p-4 rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-y mb-4 text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 transition-all"
                      />
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Internal note (hidden from customer)</span>
                    </label>
                    <Button type="submit" isLoading={commentMutation.isPending} disabled={!commentText.trim()}>
                      Send Reply
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                <select 
                  value={statusEdit || ticket.status}
                  onChange={(e) => setStatusEdit(e.target.value !== ticket.status ? e.target.value : null)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
                <select 
                  value={priorityEdit || ticket.priority}
                  onChange={(e) => setPriorityEdit(e.target.value !== ticket.priority ? e.target.value : null)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-border bg-background text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {hasChanges && (
                <Button onClick={handleUpdate} isLoading={updateMutation.isPending} className="w-full">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Department</p>
                  <p className="font-medium text-foreground">{ticket.departmentName || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Requester</p>
                  <p className="font-medium text-foreground">{ticket.createdBy}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Created At</p>
                  <p className="font-medium text-foreground">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
