"use client";

import { useState, useEffect } from 'react';
import styles from './estoque.module.css';
import { useToast } from '../_components/Toast';
import { useAuth } from '../_components/AuthProvider';
import ConfirmModal from '../_components/ConfirmModal';
import { IconEdit, IconPlus, IconWarning, IconCheck, IconTrash } from '../_components/Icons';
import { api } from '../../lib/api';

const UNIDADES_PADRAO = ['metros', 'cm', 'mm', 'unidade', 'kg', 'g', 'litros', 'folha', 'rolo'];

type Insumo = {
  id: number;
  nome: string;
  unidade: string;
  custoUnit: number;
  qtdMinima: number;
  quantidade: number;
  fornecedor: string | null;
  codigoCor: string | null;
};

export default function EstoquePage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { token } = useAuth();

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('');
  const [custoUnit, setCustoUnit] = useState('');
  const [qtdMinima, setQtdMinima] = useState('');
  const [qtdAtual, setQtdAtual] = useState('');
  const [fornecedor, setFornecedor] = useState('');

  // Color Toggle
  const [isColor, setIsColor] = useState(false);
  const [codigoCor, setCodigoCor] = useState('#ff0000');

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; insumoId: number | null; nome: string }>({
    isOpen: false,
    insumoId: null,
    nome: '',
  });

  // Labels dinâmicos baseados no tipo
  const labelUnidade = isColor ? 'Unidade (ml — fixo para cores)' : 'Unidade de Medida';
  const labelCusto = isColor
    ? 'Custo por ml (R$)'
    : unidade
    ? `Custo por ${unidade} (R$)`
    : 'Custo Unitário (R$)';
  const labelQtdAtual = isColor
    ? 'Estoque Atual (ml)'
    : unidade
    ? `Estoque Atual (${unidade})`
    : 'Estoque Atual';
  const labelQtdMinima = isColor
    ? 'Estoque Mínimo (ml)'
    : unidade
    ? `Estoque Mínimo (${unidade})`
    : 'Estoque Mínimo (Alerta)';

  const fetchInsumos = async () => {
    try {
      const data = await api.get<Insumo[]>('/insumos', token);
      setInsumos(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar insumos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const resetForm = () => {
    setNome('');
    setUnidade('');
    setCustoUnit('');
    setQtdMinima('');
    setQtdAtual('');
    setFornecedor('');
    setIsColor(false);
    setCodigoCor('#ff0000');
    setIsEditing(false);
    setEditId(null);
  };

  const handleEditClick = (insumo: Insumo) => {
    setNome(insumo.nome);
    setUnidade(insumo.codigoCor ? 'ml' : insumo.unidade);
    setCustoUnit(insumo.custoUnit.toString());
    setQtdMinima(insumo.qtdMinima.toString());
    setQtdAtual(insumo.quantidade.toString());
    setFornecedor(insumo.fornecedor || '');
    if (insumo.codigoCor) {
      setIsColor(true);
      setCodigoCor(insumo.codigoCor);
    } else {
      setIsColor(false);
      setCodigoCor('#ff0000');
    }
    setEditId(insumo.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const unidadeFinal = isColor ? 'ml' : unidade.trim();
    if (!unidadeFinal) {
      toast.error('Informe a unidade de medida.');
      return;
    }

    const payload = {
      nome: nome.trim(),
      unidade: unidadeFinal,
      custoUnit: parseFloat(custoUnit) || 0,
      qtdMinima: parseFloat(qtdMinima) || 0,
      quantidade: parseFloat(qtdAtual) || 0,
      codigoCor: isColor ? codigoCor : null,
      fornecedor: fornecedor.trim() || null,
    };

    setSaving(true);
    try {
      if (isEditing && editId) {
        await api.patch(`/insumos/${editId}`, token, payload);
      } else {
        await api.post('/insumos', token, payload);
      }
      toast.success(isEditing ? 'Insumo atualizado com sucesso!' : 'Insumo cadastrado com sucesso!');
      resetForm();
      fetchInsumos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar insumo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmModal.insumoId) return;
    try {
      await api.delete(`/insumos/${confirmModal.insumoId}`, token);
      toast.success('Insumo excluído com sucesso!');
      if (editId === confirmModal.insumoId) resetForm();
      fetchInsumos();
    } catch {
      toast.error('Erro ao excluir. Verifique se ele está sendo usado em receitas.');
    } finally {
      setConfirmModal({ isOpen: false, insumoId: null, nome: '' });
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h2>Estoque (Insumos)</h2>
        <p>Gerencie seu catálogo de materiais, custos e limites de alerta.</p>
      </header>

      <div className={styles.grid}>
        {/* Formulário */}
        <section className={`${styles.card} ${styles.glassPanel}`}>
          <div className={styles.cardTitleRow}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isEditing ? <IconEdit size={20} /> : <IconPlus size={20} />}
              {isEditing ? 'Editar Insumo' : 'Novo Insumo'}
            </h3>
            {isEditing && (
              <span className={styles.editingBadge}>Editando</span>
            )}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Nome */}
            <div className={styles.inputGroup}>
              <label>Nome do Insumo *</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                placeholder="Ex: Moldura Madeira 2cm"
                autoComplete="off"
              />
            </div>

            {/* Toggle Cor */}
            <div className={styles.colorToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={isColor}
                  onChange={e => {
                    setIsColor(e.target.checked);
                    if (e.target.checked) setUnidade('ml');
                    else setUnidade('');
                  }}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleSwitch} />
                <span>Este insumo é uma <strong>Cor / Tinta</strong></span>
              </label>
            </div>

            {/* Seletor de cor */}
            {isColor && (
              <div className={styles.colorPicker}>
                <label>Cor da Tinta</label>
                <div className={styles.colorPickerRow}>
                  <input
                    type="color"
                    value={codigoCor}
                    onChange={e => setCodigoCor(e.target.value)}
                    className={styles.colorInput}
                  />
                  <div
                    className={styles.colorPreview}
                    style={{ backgroundColor: codigoCor }}
                  />
                  <code className={styles.colorCode}>{codigoCor.toUpperCase()}</code>
                </div>
              </div>
            )}

            {/* Unidade + Custo */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>{labelUnidade}</label>
                {isColor ? (
                  <input type="text" value="ml" disabled className={styles.disabledInput} />
                ) : (
                  <>
                    <input
                      type="text"
                      list="unidades-list"
                      value={unidade}
                      onChange={e => setUnidade(e.target.value)}
                      required
                      placeholder="metros, cm, unidade…"
                      autoComplete="off"
                    />
                    <datalist id="unidades-list">
                      {UNIDADES_PADRAO.map(u => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                  </>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label>{labelCusto} *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={custoUnit}
                  onChange={e => setCustoUnit(e.target.value)}
                  required
                  placeholder="0.000"
                />
              </div>
            </div>

            {/* Qtd Atual + Qtd Mínima */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>{labelQtdAtual} *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={qtdAtual}
                  onChange={e => setQtdAtual(e.target.value)}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>{labelQtdMinima} *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={qtdMinima}
                  onChange={e => setQtdMinima(e.target.value)}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Fornecedor */}
            <div className={styles.inputGroup}>
              <label>Fornecedor <span className={styles.optional}>(opcional)</span></label>
              <input
                type="text"
                value={fornecedor}
                onChange={e => setFornecedor(e.target.value)}
                placeholder="Ex: Arte Fácil, Atacado das Tintas…"
              />
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Salvando…' : isEditing ? 'Salvar Alterações' : 'Cadastrar Insumo'}
              </button>
              {isEditing && (
                <button type="button" className={styles.btnSecondary} onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Tabela */}
        <section className={`${styles.card} ${styles.glassPanel}`}>
          <h3>Catálogo Atual <span className={styles.countBadge}>{insumos.length}</span></h3>
          {loading ? (
            <p className={styles.emptyState}>Carregando insumos…</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Unid.</th>
                    <th>Custo / Unid.</th>
                    <th>Estoque</th>
                    <th>Mínimo</th>
                    <th>Fornecedor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((insumo) => {
                    const isAlert = insumo.quantidade <= insumo.qtdMinima * 1.15;
                    return (
                      <tr key={insumo.id}>
                        <td data-label="Nome">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {insumo.codigoCor && (
                              <div
                                style={{
                                  width: '14px', height: '14px', borderRadius: '50%',
                                  backgroundColor: insumo.codigoCor,
                                  border: '1px solid var(--border)', flexShrink: 0,
                                }}
                                title={insumo.codigoCor}
                              />
                            )}
                            <strong>{insumo.nome}</strong>
                          </div>
                        </td>
                        <td data-label="Unid.">{insumo.unidade}</td>
                        <td data-label="Custo">{fmt(insumo.custoUnit)}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '2px' }}>/{insumo.unidade}</span></td>
                        <td data-label="Estoque" className={isAlert ? styles.textError : styles.textSuccess}>
                          <strong>{insumo.quantidade}</strong>
                        </td>
                        <td data-label="Mínimo" style={{ color: 'var(--text-muted)' }}>{insumo.qtdMinima}</td>
                        <td data-label="Fornecedor" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {insumo.fornecedor || <em>—</em>}
                        </td>
                        <td data-label="Status">
                          {isAlert ? (
                            <span className={styles.badgeError} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <IconWarning size={14} /> Baixo
                            </span>
                          ) : (
                            <span className={styles.badgeSuccess} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <IconCheck size={14} /> OK
                            </span>
                          )}
                        </td>
                        <td data-label="Ações">
                          <div className={styles.actions}>
                            <button
                              className={styles.btnAction}
                              onClick={() => handleEditClick(insumo)}
                              title="Editar"
                              aria-label="Editar"
                            >
                              <IconEdit size={16} />
                            </button>
                            <button
                              className={`${styles.btnAction} ${styles.delete}`}
                              onClick={() => setConfirmModal({ isOpen: true, insumoId: insumo.id, nome: insumo.nome })}
                              title="Excluir"
                              aria-label="Excluir"
                            >
                              <IconTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {insumos.length === 0 && (
                    <tr>
                      <td colSpan={8} className={styles.emptyState}>
                        Nenhum insumo cadastrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Excluir Insumo"
        message={`Tem certeza que deseja excluir "${confirmModal.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, insumoId: null, nome: '' })}
      />
    </div>
  );
}
