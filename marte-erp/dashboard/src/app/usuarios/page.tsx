"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../estoque/estoque.module.css";
import pageStyles from "./usuarios.module.css";
import { useToast } from "../_components/Toast";
import { useAuth } from "../_components/AuthProvider";
import ConfirmModal from "../_components/ConfirmModal";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconKey,
  IconCheck,
  IconWarning,
} from "../_components/Icons";
import { api } from "../../lib/api";

type Cargo = "admin" | "funcionario";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: Cargo;
  ativo: boolean;
  criadoEm: string;
}

type Tab = "usuarios" | "minha-senha";


export default function UsuariosPage() {
  const { token, user: me, isAdmin } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("usuarios");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form — novo/editar usuário
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cargo, setCargo] = useState<Cargo>("funcionario");

  // Minha senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Redefinir senha de outro usuário
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetNovaSenha, setResetNovaSenha] = useState("");

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    usuarioId: number | null;
    nome: string;
  }>({ isOpen: false, usuarioId: null, nome: "" });

  const fetchUsuarios = useCallback(async () => {
    if (!isAdmin()) return;
    try {
      const data = await api.get<Usuario[]>('/usuarios', token);
      setUsuarios(data);
    } catch {
      toast.error("Erro ao buscar usuários.");
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, toast]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const resetForm = () => {
    setNome(""); setEmail(""); setSenha(""); setCargo("funcionario");
    setIsEditing(false); setEditId(null);
  };

  const handleEditClick = (u: Usuario) => {
    setNome(u.nome); setEmail(u.email); setSenha(""); setCargo(u.cargo);
    setEditId(u.id); setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && senha.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { nome, email, cargo };
      if (senha) body.senha = senha;
      if (isEditing && editId) {
        await api.patch(`/usuarios/${editId}`, token, body);
      } else {
        await api.post('/usuarios', token, body);
      }
      toast.success(isEditing ? "Usuário atualizado!" : "Usuário criado!");
      resetForm();
      fetchUsuarios();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (u: Usuario) => {
    try {
      await api.patch(`/usuarios/${u.id}/toggle`, token, {});
      toast.success(`Usuário ${u.ativo ? "desativado" : "ativado"}.`);
      fetchUsuarios();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao alterar status.");
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.usuarioId) return;
    try {
      await api.delete(`/usuarios/${confirmModal.usuarioId}`, token);
      toast.success("Usuário excluído.");
      if (editId === confirmModal.usuarioId) resetForm();
      fetchUsuarios();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao excluir.");
    } finally {
      setConfirmModal({ isOpen: false, usuarioId: null, nome: "" });
    }
  };

  const handleResetSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetId || resetNovaSenha.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/usuarios/${resetId}/senha`, token, { nova_senha: resetNovaSenha });
      toast.success("Senha redefinida com sucesso.");
      setResetId(null);
      setResetNovaSenha("");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao redefinir senha.");
    } finally {
      setSaving(false);
    }
  };

  const handleMinhaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/me/senha', token, { senha_atual: senhaAtual, nova_senha: novaSenha });
      toast.success("Senha alterada com sucesso.");
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao alterar senha.");
    } finally {
      setSaving(false);
    }
  };

  const cargoLabel = (c: Cargo) => c === "admin" ? "Administrador" : "Funcionário";
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h2>Usuários &amp; Conta</h2>
        <p>Gerencie acessos e altere sua senha.</p>
      </header>

      {/* Tabs */}
      <div className={pageStyles.tabs}>
        <button
          className={`${pageStyles.tab} ${tab === "usuarios" ? pageStyles.tabActive : ""}`}
          onClick={() => setTab("usuarios")}
        >
          <IconUsers size={16} /> Usuários
        </button>
        <button
          className={`${pageStyles.tab} ${tab === "minha-senha" ? pageStyles.tabActive : ""}`}
          onClick={() => setTab("minha-senha")}
        >
          <IconKey size={16} /> Minha Senha
        </button>
      </div>

      {/* ── Tab: Minha Senha ── */}
      {tab === "minha-senha" && (
        <section className={`${styles.card} ${styles.glassPanel} ${pageStyles.narrowCard}`}>
          <div className={styles.cardTitleRow}>
            <h3><IconKey size={18} /> Alterar Minha Senha</h3>
          </div>
          <form className={styles.form} onSubmit={handleMinhaSenha}>
            <div className={styles.inputGroup}>
              <label>Senha Atual *</label>
              <input
                type="password"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Nova Senha * <span className={styles.optional}>(mín. 8 caracteres)</span></label>
              <input
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Confirmar Nova Senha *</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? "Salvando…" : "Alterar Senha"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Tab: Usuários (admin only) ── */}
      {tab === "usuarios" && (
        <div className={styles.grid}>
          {/* Formulário */}
          {isAdmin() && (
            <section className={`${styles.card} ${styles.glassPanel}`}>
              <div className={styles.cardTitleRow}>
                <h3>
                  {isEditing ? <IconEdit size={18} /> : <IconPlus size={18} />}
                  {isEditing ? "Editar Usuário" : "Novo Usuário"}
                </h3>
                {isEditing && <span className={styles.editingBadge}>Editando</span>}
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                    placeholder="Nome completo"
                    autoComplete="off"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>E-mail *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="usuario@exemplo.com"
                    autoComplete="off"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>
                    {isEditing ? (
                      <>Senha <span className={styles.optional}>(deixe em branco para não alterar)</span></>
                    ) : (
                      <>Senha * <span className={styles.optional}>(mín. 8 caracteres)</span></>
                    )}
                  </label>
                  <input
                    type="password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    required={!isEditing}
                    minLength={isEditing ? 0 : 8}
                    placeholder={isEditing ? "••••••••" : "Mínimo 8 caracteres"}
                    autoComplete="new-password"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Cargo *</label>
                  <select value={cargo} onChange={e => setCargo(e.target.value as Cargo)}>
                    <option value="funcionario">Funcionário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary} disabled={saving}>
                    {saving ? "Salvando…" : isEditing ? "Salvar Alterações" : "Criar Usuário"}
                  </button>
                  {isEditing && (
                    <button type="button" className={styles.btnSecondary} onClick={resetForm}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              {/* Redefinir senha de outro usuário */}
              {isEditing && editId && editId !== me?.id && (
                <div className={pageStyles.resetBlock}>
                  <h4><IconKey size={15} /> Redefinir senha deste usuário</h4>
                  <form className={pageStyles.resetForm} onSubmit={handleResetSenha}>
                    <input
                      type="password"
                      value={resetNovaSenha}
                      onChange={e => { setResetId(editId); setResetNovaSenha(e.target.value); }}
                      placeholder="Nova senha (mín. 8 caracteres)"
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button type="submit" className={styles.btnSecondary} disabled={saving}>
                      Redefinir
                    </button>
                  </form>
                </div>
              )}
            </section>
          )}

          {/* Tabela */}
          <section className={`${styles.card} ${styles.glassPanel}`}>
            <h3>
              Usuários cadastrados <span className={styles.countBadge}>{usuarios.length}</span>
            </h3>
            {loading ? (
              <p className={styles.emptyState}>Carregando…</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Cargo</th>
                      <th>Status</th>
                      <th>Criado em</th>
                      {isAdmin() && <th>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.nome}</strong>
                          {u.id === me?.id && (
                            <span className={pageStyles.youBadge}>você</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{u.email}</td>
                        <td>
                          <span className={u.cargo === "admin" ? pageStyles.badgeAdmin : pageStyles.badgeFuncionario}>
                            {cargoLabel(u.cargo)}
                          </span>
                        </td>
                        <td>
                          {u.ativo ? (
                            <span className={styles.badgeSuccess} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <IconCheck size={12} /> Ativo
                            </span>
                          ) : (
                            <span className={styles.badgeError} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <IconWarning size={12} /> Inativo
                            </span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{fmtDate(u.criadoEm)}</td>
                        {isAdmin() && (
                          <td>
                            <div className={styles.actions}>
                              <button
                                className={styles.btnAction}
                                onClick={() => handleEditClick(u)}
                                title="Editar"
                              >
                                <IconEdit size={15} />
                              </button>
                              <button
                                className={styles.btnAction}
                                onClick={() => handleToggle(u)}
                                title={u.ativo ? "Desativar" : "Ativar"}
                                disabled={u.id === me?.id}
                                style={{ opacity: u.id === me?.id ? 0.3 : 1 }}
                              >
                                {u.ativo ? <IconWarning size={15} /> : <IconCheck size={15} />}
                              </button>
                              <button
                                className={`${styles.btnAction} ${styles.delete}`}
                                onClick={() => setConfirmModal({ isOpen: true, usuarioId: u.id, nome: u.nome })}
                                title="Excluir"
                                disabled={u.id === me?.id}
                                style={{ opacity: u.id === me?.id ? 0.3 : 1 }}
                              >
                                <IconTrash size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {usuarios.length === 0 && (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>Nenhum usuário encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir "${confirmModal.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, usuarioId: null, nome: "" })}
      />
    </div>
  );
}
