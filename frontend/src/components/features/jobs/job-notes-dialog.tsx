"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateJobNotes } from "@/lib/actions/jobs.actions";
import type { JobRow } from "./jobs-table";

interface JobNotesDialogProps {
  job: JobRow | null;
  userId: string;
  onClose: () => void;
  onSaved: (jobId: string, notes: string) => void;
}

export function JobNotesDialog({ job, userId, onClose, onSaved }: JobNotesDialogProps) {
  const [notes, setNotes] = useState(job?.user_job?.notes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!job) return;
    startTransition(async () => {
      const result = await updateJobNotes({ jobId: job.id, userId, notes });
      if (result.success) {
        onSaved(job.id, notes);
        toast.success("Notes saved");
        onClose();
      } else {
        toast.error("Failed to save notes");
      }
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={!!job} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notes for {job?.title}</DialogTitle>
          <DialogDescription>
            {job?.company} · {job?.location ?? "Remote"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add notes about this application..."
            className="min-h-32 resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
