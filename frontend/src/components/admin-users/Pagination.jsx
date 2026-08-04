function Pagination({ pagination, onChangePage, onChangeSize }) {
  const page = pagination?.page ?? 0;
  const pages = Math.max(pagination?.pages ?? 1, 1);

  return (
    <footer className="admin-users-pagination">
      <p>{pagination?.total ?? 0} utilisateur(s)</p>
      <label>
        Lignes
        <select value={pagination?.size ?? 10} onChange={(event) => onChangeSize(Number(event.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </label>
      <div>
        <button type="button" className="admin-users-btn admin-users-btn--ghost" disabled={page <= 0} onClick={() => onChangePage(page - 1)}>Précédent</button>
        <span>{page + 1} / {pages}</span>
        <button type="button" className="admin-users-btn admin-users-btn--ghost" disabled={page + 1 >= pages} onClick={() => onChangePage(page + 1)}>Suivant</button>
      </div>
    </footer>
  );
}

export default Pagination;

