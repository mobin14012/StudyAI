import { useState } from "react";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/use-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, FileText, Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { Note } from "@/types";

export function NotesPage() {
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: notes, isLoading } = useNotes(search || undefined);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();

  const handleCreate = () => {
    createMutation.mutate(
      { title, content },
      {
        onSuccess: () => {
          setIsCreating(false);
          setTitle("");
          setContent("");
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!editingNote) return;
    updateMutation.mutate(
      { id: editingNote.id, input: { title, content } },
      {
        onSuccess: () => {
          setEditingNote(null);
          setTitle("");
          setContent("");
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this note?")) {
      deleteMutation.mutate(id);
    }
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const closeDialog = () => {
    setIsCreating(false);
    setEditingNote(null);
    setTitle("");
    setContent("");
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 md:h-6 md:w-6" />
          Notes
        </h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger render={<Button className="w-full sm:w-auto min-h-11" />}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="min-h-11"
              />
              <Textarea
                placeholder="Write your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="min-h-[120px]"
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={closeDialog} className="min-h-11">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!title.trim() || !content.trim() || createMutation.isPending}
                  className="min-h-11"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 min-h-11"
        />
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !notes || notes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {search ? "No notes found" : "No notes yet"}
            </h3>
            <p className="text-muted-foreground">
              {search ? "Try a different search term." : "Create your first note to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base md:text-lg line-clamp-1">{note.title}</CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="min-h-10 min-w-10" onClick={() => openEdit(note)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-10 min-w-10"
                      onClick={() => handleDelete(note.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-11"
            />
            <Textarea
              placeholder="Write your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="min-h-[120px]"
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={closeDialog} className="min-h-11">
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={!title.trim() || !content.trim() || updateMutation.isPending}
                className="min-h-11"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
