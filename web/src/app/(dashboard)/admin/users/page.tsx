'use client';

import { useEffect, useState, useRef } from 'react';
import { ProfileService } from '@/services/profile-service';
import { Profile } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, ShieldCheck, User as UserIcon, Trash2, Download, Upload, Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UserManageDialog } from '@/components/admin/user-manage-dialog';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    // Manage Dialog State
    const [manageOpen, setManageOpen] = useState(false);
    const [manageUser, setManageUser] = useState<Profile | null>(null);

    // File Input for Import
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await ProfileService.getAllProfiles();
            setUsers(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        user.id.toLowerCase().includes(search.toLowerCase())
    );

    // Bulk Actions
    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
        } else {
            setSelectedUsers(new Set());
        }
    };

    const toggleSelect = (userId: string, checked: boolean) => {
        const newSelected = new Set(selectedUsers);
        if (checked) {
            newSelected.add(userId);
        } else {
            newSelected.delete(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedUsers.size} users? This is destructive.`)) return;

        try {
            await ProfileService.deleteUsers(Array.from(selectedUsers));
            toast.success(`${selectedUsers.size} users deleted`);
            setSelectedUsers(new Set());
            loadUsers();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete users');
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(users, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (!Array.isArray(json)) throw new Error("Invalid format: Expected an array of user objects");

                // Allow partial import (id is required for update, others optional)
                // Filter out critical fields we shouldn't touch via simple import if needed, 
                // but for now we trust the admin import.
                await ProfileService.importProfiles(json);
                toast.success(`Successfully imported/updated ${json.length} users`);
                loadUsers();
            } catch (error) {
                console.error(error);
                toast.error('Failed to import users. Check file format.');
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const openManageDialog = (user: Profile) => {
        setManageUser(user);
        setManageOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Kullanıcı Yönetimi</h1>
                    <p className="text-slate-400">Platform kullanıcılarını görüntüleyin ve yönetin.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={handleExport} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                        <Download className="w-4 h-4 mr-2" />
                        Dışa Aktar
                    </Button>
                    <Button onClick={handleImportClick} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                        <Upload className="w-4 h-4 mr-2" />
                        İçe Aktar
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />

                    {selectedUsers.size > 0 && (
                        <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                            className="bg-red-900/50 text-red-400 hover:bg-red-900/80 border border-red-900"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Seçilenleri Sil ({selectedUsers.size})
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-2 max-w-sm">
                <Search className="w-5 h-5 text-slate-400" />
                <Input
                    placeholder="Kullanıcı ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-slate-500"
                />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-950">
                        <TableRow className="hover:bg-transparent border-slate-800">
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all"
                                    className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                            </TableHead>
                            <TableHead className="text-slate-400">Kullanıcı</TableHead>
                            <TableHead className="text-slate-400">Rol</TableHead>
                            <TableHead className="text-slate-400">Seviye</TableHead>
                            <TableHead className="text-slate-400">Katılım</TableHead>
                            <TableHead className="text-right text-slate-400">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                                    Aramanızla eşleşen kullanıcı bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUsers.has(user.id)}
                                            onCheckedChange={(checked) => toggleSelect(user.id, checked as boolean)}
                                            aria-label={`Select ${user.full_name}`}
                                            className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-white">
                                        <div className="flex items-center max-w-[250px]">
                                            <Avatar className="h-8 w-8 mr-3">
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback className="bg-slate-700 text-slate-300">
                                                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="truncate">
                                                <div className="truncate font-semibold">{user.full_name || 'İsimsiz Kullanıcı'}</div>
                                                <div className="truncate text-xs text-slate-400">{'User ID: ' + user.id.slice(0, 8)}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' : 'bg-slate-800 text-slate-400'}>
                                            {user.role === 'admin' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-300">
                                        Lvl {user.level} <span className="text-slate-500 text-xs">({user.xp_points} XP)</span>
                                    </TableCell>
                                    <TableCell className="text-slate-400">
                                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: tr })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openManageDialog(user)}
                                            className="text-slate-500 hover:text-white hover:bg-blue-900/20"
                                        >
                                            <Settings2 className="w-4 h-4 mr-1" />
                                            Yönet
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <UserManageDialog
                open={manageOpen}
                onOpenChange={setManageOpen}
                user={manageUser}
                onSuccess={() => {
                    loadUsers();
                    setManageUser(null);
                }}
            />
        </div>
    );
}
