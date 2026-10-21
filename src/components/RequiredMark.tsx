/** Asterisco vermelho que marca um campo obrigatório (vai dentro do <label>). */
export default function RequiredMark() {
  return <span aria-hidden="true" title="Obrigatório" style={{ color: "#d6334a", marginLeft: 3, fontWeight: 700 }}>*</span>;
}
