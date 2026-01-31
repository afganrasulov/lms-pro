import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileService } from "@/services/profile-service";
import { Profile } from "@/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UserManageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: Profile | null;
    onSuccess: () => void;
}

export function UserManageDialog({ open, onOpenChange, user, onSuccess }: UserManageDialogProps) {
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<string>('student');

    useEffect(() => {
        if (user) {
            setRole(user.role || 'student');
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await ProfileService.updateUserRole(user.id, role as any);
            toast.success("User role updated successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update user role");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle>Manage User</DialogTitle>
                    <DialogDescription>
                        Update role and permissions for {user?.full_name || 'this user'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            Role
                        </Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="col-span-3 bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="instructor">Instructor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
