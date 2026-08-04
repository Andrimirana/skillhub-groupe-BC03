import { useState } from "react";

function EditUserModal({ user, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    nom: user?.nom || "",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
    role: user?.role || "apprenant",
    status: user?.status || "actif",
    bio: user?.bio || "",
    expertise: user?.expertise || "",
  }));

  if (!user) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="admin-users-modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-users-modal" role="dialog" aria-modal="true" aria-labelledby="admin-edit-title">
        <button type="button" className="admin-users-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2 id="admin-edit-title">Modifier l’utilisateur</h2>
        <p>Seules les informations autorisées sont modifiables.</p>
        <form className="admin-users-edit-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
          <label>Nom complet<input value={form.nom} onChange={(event) => update("nom", event.target.value)} required /></label>
          <label>Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></label>
          <label>Avatar URL<input value={form.avatarUrl} onChange={(event) => update("avatarUrl", event.target.value)} /></label>
          <label>Rôle
            <select value={form.role} onChange={(event) => update("role", event.target.value)}>
              <option value="apprenant">Apprenant</option>
              <option value="formateur">Formateur</option>
              <option value="administrateur">Administrateur</option>
            </select>
          </label>
          <label>Statut
            <select value={form.status} onChange={(event) => update("status", event.target.value)}>
              <option value="actif">Actif</option>
              <option value="desactive">Désactivé</option>
              <option value="en_attente">En attente</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </label>
          <label>Expertise formateur<input value={form.expertise} onChange={(event) => update("expertise", event.target.value)} /></label>
          <label className="admin-users-field-full">Biographie courte<textarea value={form.bio} onChange={(event) => update("bio", event.target.value)} rows="4" /></label>
          <div className="admin-users-modal-actions">
            <button type="button" className="admin-users-btn admin-users-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="admin-users-btn admin-users-btn--primary">Enregistrer</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default EditUserModal;
