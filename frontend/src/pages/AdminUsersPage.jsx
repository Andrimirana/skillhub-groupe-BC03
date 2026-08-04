import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import AdminUsersHeader from "../components/admin-users/AdminUsersHeader";
import UserStats from "../components/admin-users/UserStats";
import UserFilters from "../components/admin-users/UserFilters";
import UsersTable from "../components/admin-users/UsersTable";
import UserDetailsDrawer from "../components/admin-users/UserDetailsDrawer";
import EditUserModal from "../components/admin-users/EditUserModal";
import ConfirmModal from "../components/admin-users/ConfirmModal";
import BulkActionsBar from "../components/admin-users/BulkActionsBar";
import Pagination from "../components/admin-users/Pagination";
import {
  actionGroupeeUtilisateursAdmin,
  changerRoleUtilisateurAdmin,
  changerStatutUtilisateurAdmin,
  chargerDetailUtilisateurAdmin,
  chargerStatsUtilisateursAdmin,
  chargerUtilisateursAdmin,
  modifierUtilisateurAdmin,
  supprimerUtilisateurAdmin,
} from "../services/adminUsersApi";
import "../styles/admin-users.css";

const FILTRES_INITIAUX = {
  search: "",
  role: "tous",
  status: "tous",
  period: "toutes",
  page: 0,
  size: 10,
  sort: "createdAt",
  direction: "desc",
};

function AdminUsersPage() {
  const [filters, setFilters] = useState(FILTRES_INITIAUX);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0, pages: 1 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerUser, setDrawerUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadStats = useCallback(async () => {
    const data = await chargerStatsUtilisateursAdmin();
    setStats(data);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await chargerUtilisateursAdmin(filters);
      setUsers(data.utilisateurs || []);
      setPagination(data.pagination || { page: 0, size: filters.size, total: 0, pages: 1 });
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStats().catch(() => setStats(null));
  }, [loadStats]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const selectedCount = selectedIds.length;

  const refresh = async () => {
    await Promise.all([loadUsers(), loadStats()]);
    if (drawerUser?.id) {
      const fresh = await chargerDetailUtilisateurAdmin(drawerUser.id);
      setDrawerUser(fresh);
    }
  };

  const openDetail = async (user) => {
    setDrawerUser(await chargerDetailUtilisateurAdmin(user.id));
  };

  const toggleSelection = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleAll = () => {
    setSelectedIds((current) => current.length === users.length ? [] : users.map((user) => user.id));
  };

  const sortBy = (sort) => {
    setFilters((current) => ({
      ...current,
      sort,
      direction: current.sort === sort && current.direction === "asc" ? "desc" : "asc",
      page: 0,
    }));
  };

  const requestStatusChange = (user) => {
    const nextStatus = user.status === "actif" ? "desactive" : "actif";
    setConfirm({
      title: user.status === "actif" ? "Désactiver ce compte ?" : "Réactiver ce compte ?",
      message: user.status === "actif"
        ? "L’utilisateur ne pourra plus se connecter jusqu’à sa réactivation."
        : "L’utilisateur pourra à nouveau accéder à son compte.",
      confirmLabel: user.status === "actif" ? "Désactiver" : "Activer",
      onConfirm: async () => {
        await changerStatutUtilisateurAdmin(user.id, nextStatus);
        setConfirm(null);
        await refresh();
      },
    });
  };

  const requestDelete = (user) => {
    setConfirm({
      title: "Archiver cet utilisateur ?",
      message: `${user.nom} (${user.email}) sera archivé logiquement. Les données liées sont conservées.`,
      confirmLabel: "Archiver",
      danger: true,
      onConfirm: async () => {
        await supprimerUtilisateurAdmin(user.id);
        setConfirm(null);
        setDrawerUser(null);
        await refresh();
      },
    });
  };

  const requestRoleChange = (user) => {
    const nextRole = user.role === "apprenant" ? "formateur" : "apprenant";
    setConfirm({
      title: "Changer le rôle ?",
      message: `Confirmer le changement de rôle de ${user.nom} vers « ${nextRole} » ?`,
      confirmLabel: "Changer le rôle",
      onConfirm: async () => {
        await changerRoleUtilisateurAdmin(user.id, nextRole);
        setConfirm(null);
        await refresh();
      },
    });
  };

  const saveEdit = async (payload) => {
    await modifierUtilisateurAdmin(editUser.id, payload);
    setEditUser(null);
    await refresh();
  };

  const bulkAction = (action, value = "") => {
    setConfirm({
      title: action === "delete" ? "Archiver la sélection ?" : "Appliquer l’action groupée ?",
      message: `${selectedCount} utilisateur(s) seront modifiés.`,
      confirmLabel: "Confirmer",
      danger: action === "delete",
      onConfirm: async () => {
        await actionGroupeeUtilisateursAdmin(action, selectedIds, value);
        setConfirm(null);
        await refresh();
      },
    });
  };

  const exportCsv = () => {
    const header = ["id", "nom", "email", "role", "status", "createdAt", "lastLoginAt"].join(";");
    const rows = users.map((user) => [user.id, user.nom, user.email, user.role, user.status, user.createdAt, user.lastLoginAt].join(";"));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "skillhub-utilisateurs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const tableState = useMemo(() => ({ users, selectedIds, loading }), [users, selectedIds, loading]);

  return (
    <>
      <DashboardNavbar />
      <main className="admin-users-page">
        <AdminUsersHeader onExport={exportCsv} />
        <UserStats stats={stats} loading={!stats} />
        <UserFilters filters={filters} onChange={setFilters} onReset={() => setFilters(FILTRES_INITIAUX)} disabled={loading} />
        <BulkActionsBar count={selectedCount} onAction={bulkAction} onClear={() => setSelectedIds([])} />
        {error ? (
          <section className="admin-users-error">
            <p>{error}</p>
            <button type="button" className="admin-users-btn admin-users-btn--primary" onClick={loadUsers}>Réessayer</button>
          </section>
        ) : (
          <>
            <UsersTable
              {...tableState}
              onToggle={toggleSelection}
              onToggleAll={toggleAll}
              onView={openDetail}
              onEdit={setEditUser}
              onRole={requestRoleChange}
              onStatus={requestStatusChange}
              onDelete={requestDelete}
              onSort={sortBy}
            />
            <Pagination
              pagination={pagination}
              onChangePage={(page) => setFilters((current) => ({ ...current, page }))}
              onChangeSize={(size) => setFilters((current) => ({ ...current, size, page: 0 }))}
            />
          </>
        )}
      </main>
      <UserDetailsDrawer user={drawerUser} onClose={() => setDrawerUser(null)} onEdit={setEditUser} onStatus={requestStatusChange} onDelete={requestDelete} />
      <EditUserModal key={editUser?.id || "admin-edit-empty"} user={editUser} onSave={saveEdit} onClose={() => setEditUser(null)} />
      {confirm && <ConfirmModal {...confirm} onClose={() => setConfirm(null)} />}
    </>
  );
}

export default AdminUsersPage;
