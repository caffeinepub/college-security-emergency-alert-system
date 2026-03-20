import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfileSetupModal({ open, onClose }: Props) {
  const [form, setForm] = useState({
    name: "",
    studentId: "",
    department: "",
    phoneNumber: "",
  });
  const save = useSaveProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.studentId ||
      !form.department ||
      !form.phoneNumber
    ) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await save.mutateAsync(form);
      toast.success("Profile saved!");
      onClose();
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="profile_setup.dialog">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle>Complete Your Profile</DialogTitle>
          </div>
          <DialogDescription>
            Please complete your profile to use all features of Guardian.
          </DialogDescription>
        </DialogHeader>
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4 mt-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Full Name</Label>
            <Input
              id="p-name"
              data-ocid="profile_setup.input"
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-sid">Student ID</Label>
            <Input
              id="p-sid"
              placeholder="e.g. GHRCEM2024001"
              value={form.studentId}
              onChange={(e) =>
                setForm((f) => ({ ...f, studentId: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-dept">Department</Label>
            <Input
              id="p-dept"
              placeholder="e.g. Computer Engineering"
              value={form.department}
              onChange={(e) =>
                setForm((f) => ({ ...f, department: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-phone">Phone Number</Label>
            <Input
              id="p-phone"
              placeholder="e.g. +91 98765 43210"
              value={form.phoneNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, phoneNumber: e.target.value }))
              }
            />
          </div>
          <Button
            data-ocid="profile_setup.submit_button"
            type="submit"
            className="w-full"
            disabled={save.isPending}
          >
            {save.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
