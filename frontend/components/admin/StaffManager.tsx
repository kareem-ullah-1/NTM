"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  MoreVertical,
  Pencil,
  Power,
  AlertTriangle,
  Check,
  Trash2
} from "lucide-react";
import {
  createStaff,
  fetchStaff,
  updateStaffRole,
  updateStaffStatus,
  deleteStaff,
  type ApiStaff
} from "@/lib/api/staff";
import type { AdminRole, AuthUser } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { permissionsForRole, STAFF_ASSIGNABLE_ROLES, isSuperAdminRole } from "@/config/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { useToastStore } from "@/store/use-toast-store";
import { cn } from "@/lib/utils";

const QUERY_KEY = ["admin", "staff"] as const;

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  product_manager: "Product Manager",
  order_manager: "Order Manager",
  support_staff: "Support Staff"
};

const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Full administrative access with all permissions",
  admin: "Broad operational administration",
  product_manager: "Products, categories, fabric types, colors, reviews",
  order_manager: "Orders, returns, coupons",
  support_staff: "Customers and returns"
};

const ROLE_VARIANTS: Record<AdminRole, "default" | "sand" | "rust" | "outline" | "muted"> = {
  super_admin: "default",
  admin: "sand",
  product_manager: "outline",
  order_manager: "outline",
  support_staff: "muted"
};

const ALL_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "product_manager",
  "order_manager",
  "support_staff"
];


function StatCard({
  label,
  count,
  icon: Icon,
  color
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-charcoal/[0.06] bg-white px-4 py-3.5">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          color
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-medium leading-tight text-charcoal">
          {count}
        </p>
        <p className="text-[11px] text-charcoal/40">{label}</p>
      </div>
    </div>
  );
}


function StaffSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-charcoal/[0.04] py-4"
        >
          <div className="h-9 w-9 animate-pulse rounded-full bg-charcoal/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded bg-charcoal/[0.06]" />
            <div className="h-3 w-40 animate-pulse rounded bg-charcoal/[0.04]" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-charcoal/[0.06]" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-charcoal/[0.06]" />
        </div>
      ))}
    </div>
  );
}


function ActionMenu({
  member,
  isSelf,
  isSuperAdmin,
  onChangeRole,
  onToggleStatus,
  onDelete,
  onViewPermissions
}: {
  member: ApiStaff;
  isSelf: boolean;
  isSuperAdmin: boolean;
  onChangeRole: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onViewPermissions: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const memberIsSuperAdmin = isSuperAdminRole(member.adminRole);
  const canChangeRole = isSuperAdmin && !isSelf && !memberIsSuperAdmin;
  const canToggleStatus = !isSelf && !memberIsSuperAdmin;
  const canDelete = isSuperAdmin && !isSelf && !memberIsSuperAdmin;
  const showDeleteDisabled = isSuperAdmin && (isSelf || memberIsSuperAdmin);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleAction = React.useCallback(
    (action: () => void) => {
      return () => {
        setOpen(false);
        action();
      };
    },
    []
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/35 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
        aria-label="Staff actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-[8px] border border-charcoal/[0.08] bg-white py-1 shadow-lg"
        >
          {/* Manage section */}
          {(canChangeRole || true) && (
            <>
              <div className="px-3.5 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/30">
                  Manage
                </p>
              </div>
              {canChangeRole && (
                <button
                  role="menuitem"
                  onClick={handleAction(onChangeRole)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-charcoal/70 transition-colors hover:bg-charcoal/[0.04] focus:bg-charcoal/[0.04] focus:outline-none"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Staff
                </button>
              )}
              <button
                role="menuitem"
                onClick={handleAction(onViewPermissions)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-charcoal/70 transition-colors hover:bg-charcoal/[0.04] focus:bg-charcoal/[0.04] focus:outline-none"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Permissions
              </button>
            </>
          )}

          {/* Account section */}
          {(canToggleStatus || canDelete || showDeleteDisabled) && (
            <>
              <div className="my-1 border-t border-charcoal/[0.06]" />
              <div className="px-3.5 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/30">
                  Account
                </p>
              </div>
              {canToggleStatus && (
                <button
                  role="menuitem"
                  onClick={handleAction(onToggleStatus)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] transition-colors focus:outline-none",
                    member.isActive
                      ? "text-charcoal/70 hover:bg-charcoal/[0.04] focus:bg-charcoal/[0.04]"
                      : "text-charcoal/70 hover:bg-charcoal/[0.04] focus:bg-charcoal/[0.04]"
                  )}
                >
                  <Power className="h-3.5 w-3.5" />
                  {member.isActive ? "Disable Account" : "Enable Account"}
                </button>
              )}
              {canDelete && (
                <button
                  role="menuitem"
                  onClick={handleAction(onDelete)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Account
                </button>
              )}
              {showDeleteDisabled && (
                <div
                  className="flex w-full cursor-not-allowed flex-col gap-0.5 px-3.5 py-2.5 text-[13px] text-charcoal/30"
                  title="Super Admin account cannot be deleted."
                >
                  <span className="flex items-center gap-2.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Account
                  </span>
                  <span className="pl-6 text-[10px] leading-snug text-charcoal/25">
                    Super Admin account cannot be deleted.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


export function StaffManager() {
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<AdminRole | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "disabled">("all");

  const [roleDialogMember, setRoleDialogMember] = React.useState<ApiStaff | null>(null);
  const [statusDialogMember, setStatusDialogMember] = React.useState<ApiStaff | null>(null);
  const [permissionsMember, setPermissionsMember] = React.useState<ApiStaff | null>(null);
  const [deleteDialogMember, setDeleteDialogMember] = React.useState<ApiStaff | null>(null);

  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const currentUser = useAdminAuthStore((state) => state.user);

  const isSuperAdmin = currentUser?.adminRole === "super_admin";

  const {
    data: staff,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchStaff
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, adminRole }: { id: string; adminRole: AdminRole }) =>
      updateStaffRole(id, adminRole),
    onSuccess: () => {
      showToast("Role updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setRoleDialogMember(null);
    },
    onError: (error) =>
      showToast(
        error instanceof ApiRequestError
          ? error.message
          : "Failed to update role.",
        "error"
      )
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateStaffStatus(id, isActive),
    onSuccess: (updated) => {
      showToast(
        updated.isActive
          ? "Staff account enabled"
          : "Staff account disabled"
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setStatusDialogMember(null);
    },
    onError: (error) =>
      showToast(
        error instanceof ApiRequestError
          ? error.message
          : "Failed to update status.",
        "error"
      )
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => {
      showToast("Staff account deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteDialogMember(null);
    },
    onError: (error) =>
      showToast(
        error instanceof ApiRequestError
          ? error.message
          : "Failed to delete staff account.",
        "error"
      )
  });

  const filtered = React.useMemo(() => {
    if (!staff) return [];
    return staff.filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.email.toLowerCase().includes(q)
        )
          return false;
      }
      if (roleFilter !== "all" && m.adminRole !== roleFilter) return false;
      if (statusFilter === "active" && !m.isActive) return false;
      if (statusFilter === "disabled" && m.isActive) return false;
      return true;
    });
  }, [staff, search, roleFilter, statusFilter]);

  const stats = React.useMemo(() => {
    if (!staff) return { total: 0, active: 0, disabled: 0, admins: 0 };
    return {
      total: staff.length,
      active: staff.filter((m) => m.isActive).length,
      disabled: staff.filter((m) => !m.isActive).length,
      admins: staff.filter((m) => m.adminRole === "super_admin").length
    };
  }, [staff]);

  const hasFilters = search || roleFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-display-md text-charcoal">
            Staff &amp; Team
          </h1>
          <p className="mt-1 text-[13px] text-charcoal/45">
            Manage staff access, roles, and administrative permissions.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="rounded-full"
        >
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && staff && staff.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total Staff"
            count={stats.total}
            icon={Users}
            color="bg-charcoal/[0.04] text-charcoal/60"
          />
          <StatCard
            label="Active"
            count={stats.active}
            icon={UserCheck}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Disabled"
            count={stats.disabled}
            icon={UserX}
            color="bg-red-50 text-red-500"
          />
          <StatCard
            label="Super Admin"
            count={stats.admins}
            icon={ShieldCheck}
            color="bg-amber-50 text-amber-600"
          />
        </div>
      )}

      {/* Search & Filters */}
      {staff && staff.length > 0 && (
        <div className="rounded-[10px] border border-charcoal/[0.06] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/35" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-8 text-[13px]"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as AdminRole | "all")
              }
              className="rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-[13px] text-charcoal"
            >
              <option value="all">All Roles</option>
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "disabled")
              }
              className="rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-[13px] text-charcoal"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="text-[12px] font-medium text-forest hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff account with appropriate access level.
            </DialogDescription>
          </DialogHeader>
          <CreateStaffForm
            isSuperAdmin={isSuperAdmin}
            onCreated={() => {
              setShowCreateForm(false);
              queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Staff Table / List */}
      <div className="rounded-[10px] border border-charcoal/[0.06] bg-white">
        {isLoading ? (
          <div className="p-5">
            <StaffSkeleton />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-[13px] font-medium text-charcoal">
              Failed to load staff
            </p>
            <p className="text-[12px] text-charcoal/45">
              Something went wrong while fetching staff data.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-full"
            >
              Try Again
            </Button>
          </div>
        ) : !staff || staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/[0.04]">
              <Users className="h-5 w-5 text-charcoal/25" />
            </div>
            <p className="text-[13px] font-medium text-charcoal/70">
              No staff accounts yet
            </p>
            <p className="text-[12px] text-charcoal/40">
              Add your first team member to get started.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="mt-2 rounded-full"
            >
              <Plus className="h-4 w-4" />
              Add Staff Member
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Search className="h-5 w-5 text-charcoal/20" />
            <p className="text-[13px] font-medium text-charcoal/60">
              No staff match your filters
            </p>
            <p className="text-[12px] text-charcoal/40">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-charcoal/[0.06] text-[11px] uppercase tracking-wider text-charcoal/35">
                    <th className="px-5 py-3 font-medium">Staff Member</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Permissions</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((member) => (
                    <StaffTableRow
                      key={member.id}
                      member={member}
                      currentUser={currentUser}
                      isSuperAdmin={isSuperAdmin}
                      onToggleStatus={() => setStatusDialogMember(member)}
                      onChangeRole={() => setRoleDialogMember(member)}
                      onViewPermissions={() => setPermissionsMember(member)}
                      onDelete={() => setDeleteDialogMember(member)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="divide-y divide-charcoal/[0.04] md:hidden">
              {filtered.map((member) => (
                <StaffMobileCard
                  key={member.id}
                  member={member}
                  currentUser={currentUser}
                  isSuperAdmin={isSuperAdmin}
                  onToggleStatus={() => setStatusDialogMember(member)}
                  onChangeRole={() => setRoleDialogMember(member)}
                  onViewPermissions={() => setPermissionsMember(member)}
                  onDelete={() => setDeleteDialogMember(member)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Change Role Dialog */}
      <ChangeRoleDialog
        member={roleDialogMember}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setRoleDialogMember(null)}
        onConfirm={(adminRole) => {
          if (roleDialogMember) {
            roleMutation.mutate({ id: roleDialogMember.id, adminRole });
          }
        }}
        isPending={roleMutation.isPending}
      />

      {/* Enable/Disable Confirmation Dialog */}
      <ToggleStatusDialog
        member={statusDialogMember}
        onClose={() => setStatusDialogMember(null)}
        onConfirm={() => {
          if (statusDialogMember) {
            statusMutation.mutate({
              id: statusDialogMember.id,
              isActive: !statusDialogMember.isActive
            });
          }
        }}
        isPending={statusMutation.isPending}
      />

      {/* Permissions Dialog */}
      <PermissionsDialog
        member={permissionsMember}
        onClose={() => setPermissionsMember(null)}
      />

      {/* Delete Account Confirmation */}
      <DeleteAccountDialog
        member={deleteDialogMember}
        onClose={() => setDeleteDialogMember(null)}
        onConfirm={() => {
          if (deleteDialogMember) {
            deleteMutation.mutate(deleteDialogMember.id);
          }
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}


function StaffTableRow({
  member,
  currentUser,
  isSuperAdmin,
  onToggleStatus,
  onChangeRole,
  onViewPermissions,
  onDelete
}: {
  member: ApiStaff;
  currentUser: AuthUser | null;
  isSuperAdmin: boolean;
  onToggleStatus: () => void;
  onChangeRole: () => void;
  onViewPermissions: () => void;
  onDelete: () => void;
}) {
  const isSelf = member.id === currentUser?.id;

  return (
    <tr className="border-b border-charcoal/[0.04] transition-colors hover:bg-charcoal/[0.01]">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-[12px] font-medium text-charcoal/60">
            {member.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-charcoal">
              {member.name}
              {isSelf && (
                <span className="ml-1.5 text-[10px] font-normal text-charcoal/35">
                  (You)
                </span>
              )}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-charcoal/55">{member.email}</td>
      <td className="px-5 py-3.5">
        <Badge
          variant={ROLE_VARIANTS[member.adminRole]}
          className="text-[10px]"
        >
          {ROLE_LABELS[member.adminRole]}
        </Badge>
      </td>
      <td className="px-5 py-3.5">
        <button
          onClick={onViewPermissions}
          className="text-[12px] font-medium text-charcoal/45 transition-colors hover:text-charcoal"
          title={`View ${member.name}'s permissions`}
        >
          {member.permissions.length} permission
          {member.permissions.length !== 1 ? "s" : ""}
        </button>
      </td>
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              member.isActive ? "bg-emerald-500" : "bg-charcoal/20"
            )}
          />
          <span
            className={cn(
              "text-[12px] font-medium",
              member.isActive ? "text-emerald-600" : "text-charcoal/40"
            )}
          >
            {member.isActive ? "Active" : "Disabled"}
          </span>
        </span>
      </td>
      <td className="px-5 py-3.5 text-[12px] text-charcoal/40">
        {new Date(member.createdAt).toLocaleDateString("en-PK", {
          year: "numeric",
          month: "short",
          day: "numeric"
        })}
      </td>
      <td className="px-5 py-3.5 text-right">
        <ActionMenu
          member={member}
          isSelf={isSelf}
          isSuperAdmin={isSuperAdmin}
          onChangeRole={onChangeRole}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          onViewPermissions={onViewPermissions}
        />
      </td>
    </tr>
  );
}


function StaffMobileCard({
  member,
  currentUser,
  isSuperAdmin,
  onToggleStatus,
  onChangeRole,
  onViewPermissions,
  onDelete
}: {
  member: ApiStaff;
  currentUser: AuthUser | null;
  isSuperAdmin: boolean;
  onToggleStatus: () => void;
  onChangeRole: () => void;
  onViewPermissions: () => void;
  onDelete: () => void;
}) {
  const isSelf = member.id === currentUser?.id;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-[12px] font-medium text-charcoal/60">
            {member.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-charcoal">
              {member.name}
              {isSelf && (
                <span className="ml-1.5 text-[10px] text-charcoal/35">
                  (You)
                </span>
              )}
            </p>
            <p className="text-[12px] text-charcoal/45">{member.email}</p>
          </div>
        </div>
        <ActionMenu
          member={member}
          isSelf={isSelf}
          isSuperAdmin={isSuperAdmin}
          onChangeRole={onChangeRole}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          onViewPermissions={onViewPermissions}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant={ROLE_VARIANTS[member.adminRole]}
          className="text-[10px]"
        >
          {ROLE_LABELS[member.adminRole]}
        </Badge>
        <span className="flex items-center gap-1">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              member.isActive ? "bg-emerald-500" : "bg-charcoal/20"
            )}
          />
          <span
            className={cn(
              "text-[11px] font-medium",
              member.isActive ? "text-emerald-600" : "text-charcoal/40"
            )}
          >
            {member.isActive ? "Active" : "Disabled"}
          </span>
        </span>
        <button
          onClick={onViewPermissions}
          className="text-[11px] font-medium text-charcoal/35 hover:text-charcoal"
        >
          {member.permissions.length} permissions
        </button>
        <span className="text-[11px] text-charcoal/30">
          Joined{" "}
          {new Date(member.createdAt).toLocaleDateString("en-PK", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </span>
      </div>
    </div>
  );
}


function CreateStaffForm({
  isSuperAdmin,
  onCreated
}: {
  isSuperAdmin: boolean;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [adminRole, setAdminRole] = React.useState<AdminRole>("support_staff");

  const availableRoles = isSuperAdmin
    ? STAFF_ASSIGNABLE_ROLES
    : STAFF_ASSIGNABLE_ROLES.filter((r) => r !== "admin");

  const mutation = useMutation({
    mutationFn: () =>
      createStaff({ name, email, password, adminRole }),
    onSuccess: onCreated
  });

  const error =
    mutation.error instanceof ApiRequestError
      ? mutation.error.message
      : mutation.isError
        ? "Failed to create staff account."
        : null;

  const previewPermissions = permissionsForRole(adminRole);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="staffName" className="text-[12px]">
            Full Name
          </Label>
          <Input
            id="staffName"
            className="mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ahmed Khan"
            required
            minLength={2}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="staffEmail" className="text-[12px]">
            Email Address
          </Label>
          <Input
            id="staffEmail"
            type="email"
            className="mt-1.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. ahmed@example.com"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="staffPassword" className="text-[12px]">
            Password
          </Label>
          <div className="relative">
            <Input
              id="staffPassword"
              type={showPassword ? "text" : "password"}
              className="mt-1.5 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-charcoal/40 hover:text-charcoal"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-charcoal/35">
            Minimum 6 characters
          </p>
        </div>
      </div>

      {/* Role Selection */}
      <div>
        <Label className="text-[12px]">Role</Label>
        <div className="mt-2 space-y-2">
          {availableRoles.map((role) => (
            <label
              key={role}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-all",
                adminRole === role
                  ? "border-forest bg-forest/[0.03] ring-1 ring-forest/20"
                  : "border-charcoal/10 hover:border-charcoal/20"
              )}
            >
              <input
                type="radio"
                name="staffRole"
                value={role}
                checked={adminRole === role}
                onChange={(e) => setAdminRole(e.target.value as AdminRole)}
                className="mt-0.5 h-3.5 w-3.5 accent-forest"
              />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-charcoal">
                  {ROLE_LABELS[role]}
                </p>
                <p className="mt-0.5 text-[11px] text-charcoal/45">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
              <Badge
                variant={ROLE_VARIANTS[role]}
                className="shrink-0 text-[9px]"
              >
                {permissionsForRole(role).length} perms
              </Badge>
            </label>
          ))}
        </div>
      </div>

      {/* Permission Preview */}
      {previewPermissions.length > 0 && (
        <div className="rounded-lg bg-charcoal/[0.02] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/35">
            Effective Permissions
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {previewPermissions.map((perm) => (
              <span
                key={perm}
                className="inline-flex items-center gap-1 rounded-full bg-white border border-charcoal/[0.08] px-2.5 py-1 text-[10px] text-charcoal/55"
              >
                <Check className="h-2.5 w-2.5 text-forest" />
                {perm}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[12px] text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-full"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Create Staff Account"
          )}
        </Button>
      </div>
    </form>
  );
}


function ChangeRoleDialog({
  member,
  isSuperAdmin,
  onClose,
  onConfirm,
  isPending
}: {
  member: ApiStaff | null;
  isSuperAdmin: boolean;
  onClose: () => void;
  onConfirm: (adminRole: AdminRole) => void;
  isPending: boolean;
}) {
  const [selectedRole, setSelectedRole] = React.useState<AdminRole>(
    member?.adminRole ?? "support_staff"
  );

  React.useEffect(() => {
    if (member) setSelectedRole(member.adminRole);
  }, [member]);

  const availableRoles = isSuperAdmin
    ? STAFF_ASSIGNABLE_ROLES
    : STAFF_ASSIGNABLE_ROLES.filter((r) => r !== "admin");

  const previewPermissions = permissionsForRole(selectedRole);
  const hasChange = member ? selectedRole !== member.adminRole : false;

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update the role for {member?.name}. This will change their access
            permissions immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current role */}
          {member && (
            <div className="flex items-center gap-3 rounded-lg bg-charcoal/[0.02] p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-[11px] font-medium text-charcoal/60">
                {member.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-[13px] font-medium text-charcoal">
                  {member.name}
                </p>
                <p className="text-[11px] text-charcoal/40">
                  Current role: {ROLE_LABELS[member.adminRole]}
                </p>
              </div>
            </div>
          )}

          {/* Role options */}
          <div className="space-y-2">
            {availableRoles.map((role) => (
              <label
                key={role}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all",
                  selectedRole === role
                    ? "border-forest bg-forest/[0.03] ring-1 ring-forest/20"
                    : "border-charcoal/10 hover:border-charcoal/20"
                )}
              >
                <input
                  type="radio"
                  name="changeRole"
                  value={role}
                  checked={selectedRole === role}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as AdminRole)
                  }
                  className="mt-0.5 h-3.5 w-3.5 accent-forest"
                />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-charcoal">
                    {ROLE_LABELS[role]}
                  </p>
                  <p className="mt-0.5 text-[11px] text-charcoal/45">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Permission preview */}
          <div className="rounded-lg bg-charcoal/[0.02] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/35">
              New Permissions
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {previewPermissions.map((perm) => (
                <span
                  key={perm}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-charcoal/[0.08] px-2 py-0.5 text-[10px] text-charcoal/55"
                >
                  <Check className="h-2 w-2 text-forest" />
                  {perm}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={isPending || !hasChange}
              onClick={() => onConfirm(selectedRole)}
              className="rounded-full"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Role"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function ToggleStatusDialog({
  member,
  onClose,
  onConfirm,
  isPending
}: {
  member: ApiStaff | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const isDisabling = member?.isActive;

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isDisabling ? "Disable Account" : "Enable Account"}
          </DialogTitle>
          <DialogDescription>
            {isDisabling
              ? `${member?.name} will no longer be able to access the admin area. They will be logged out immediately.`
              : `Restore ${member?.name}&apos;s access to the admin area.`}
          </DialogDescription>
        </DialogHeader>

        {member && (
          <div className="flex items-center gap-3 rounded-lg bg-charcoal/[0.02] p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-[11px] font-medium text-charcoal/60">
              {member.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-[13px] font-medium text-charcoal">
                {member.name}
              </p>
              <p className="text-[11px] text-charcoal/40">{member.email}</p>
            </div>
          </div>
        )}

        {isDisabling && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-[12px] text-amber-700">
              This action will immediately revoke {member?.name}&apos;s access to
              all admin areas. They will need to be re-enabled to regain
              access.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isDisabling ? "outline" : "default"}
            disabled={isPending}
            onClick={onConfirm}
            className={cn(
              "rounded-full",
              isDisabling &&
                "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            )}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isDisabling ? (
              "Disable Account"
            ) : (
              "Enable Account"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function PermissionsDialog({
  member,
  onClose
}: {
  member: ApiStaff | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Permissions</DialogTitle>
          <DialogDescription>
            {member?.name}&apos;s effective permissions based on their{" "}
            {member ? ROLE_LABELS[member.adminRole] : ""} role.
          </DialogDescription>
        </DialogHeader>

        {member && (
          <div className="space-y-2">
            {member.permissions.length === 0 ? (
              <p className="text-[13px] text-charcoal/45">
                No specific permissions assigned.
              </p>
            ) : (
              member.permissions.map((perm) => (
                <div
                  key={perm}
                  className="flex items-center gap-2.5 rounded-lg border border-charcoal/[0.06] bg-charcoal/[0.015] px-3.5 py-2.5"
                >
                  <Check className="h-3.5 w-3.5 text-forest" />
                  <span className="text-[13px] text-charcoal/75">{perm}</span>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose} className="rounded-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function DeleteAccountDialog({
  member,
  onClose,
  onConfirm,
  isPending
}: {
  member: ApiStaff | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Account?</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this staff account? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {member && (
          <div className="flex items-center gap-3 rounded-lg bg-charcoal/[0.02] p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-[11px] font-medium text-charcoal/60">
              {member.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-[13px] font-medium text-charcoal">
                {member.name}
              </p>
              <p className="text-[11px] text-charcoal/40">{member.email}</p>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[12px] text-red-700">
            This will permanently remove the account and revoke all admin access.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            className="rounded-full border border-red-200 bg-red-600 text-white hover:bg-red-700 hover:text-white"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Delete Account"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

