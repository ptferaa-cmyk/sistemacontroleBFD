"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './quadros.module.css';
import { useToast } from '../_components/Toast';
import { useAuth } from '../_components/AuthProvider';
import ConfirmModal from '../_components/ConfirmModal';
import { IconFrame, IconCamera } from '../_components/Icons';
import { api } from '../../lib/api';

type Insumo = { id: number; nome: string; unidade: string; custoUnit: number; codigoCor: string | null };
type ReceitaItem = { insumoId: string; quantidade: string };
type Quadro = {
  id: number;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  precoVenda: number;
  custoProducao: number;
  margemBruta: number;
  receitas: { id: number; insumoId: number; quantidade: number; insumo: Insumo }[];
};

export default function QuadrosPage() {
  const [quadros, setQuadros] = useState<Quadro[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'withImage' | 'withoutImage'>('all');
  const toast = useToast();
  const { token } = useAuth();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receitas, setReceitas] = useState<ReceitaItem[]>([]);
  
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm Delete State
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: number | null, nome: string}>({
    isOpen: false, id: null, nome: ''
  });

  const fetchData = async () => {
    try {
      const [quadrosData, insumosData] = await Promise.all([
        api.get<Quadro[]>('/artes', token),
        api.get<Insumo[]>('/insumos', token),
      ]);
      setQuadros(quadrosData);
      setInsumos(insumosData);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openNewModal = () => {
    setEditingId(null);
    setNome('');
    setDescricao('');
    setPrecoVenda('');
    setImagemUrl(null);
    setSelectedFile(null);
    setReceitas([]);
    setIsModalOpen(true);
  };

  const openEditModal = (q: Quadro) => {
    setEditingId(q.id);
    setNome(q.nome);
    setDescricao(q.descricao || '');
    setPrecoVenda(q.precoVenda.toString());
    setImagemUrl(q.imagemUrl);
    setSelectedFile(null);
    setReceitas(q.receitas.map(r => ({
      insumoId: r.insumoId.toString(),
      quantidade: r.quantidade.toString()
    })));
    setIsModalOpen(true);
  };

  const handleAddReceitaRow = () => {
    setReceitas([...receitas, { insumoId: '', quantidade: '' }]);
  };

  const handleRemoveReceitaRow = (index: number) => {
    setReceitas(receitas.filter((_, i) => i !== index));
  };

  const handleReceitaChange = (index: number, field: keyof ReceitaItem, value: string) => {
    const newReceitas = [...receitas];
    newReceitas[index][field] = value;
    setReceitas(newReceitas);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagemUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setImagemUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveQuadro = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let finalImageUrl = imagemUrl;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('imagem', selectedFile);
        try {
          const uploadData = await api.upload<{ imagemUrl: string }>('/upload', token, formData);
          finalImageUrl = uploadData.imagemUrl;
        } catch {
          toast.error('Erro no upload da imagem.');
          setSaving(false);
          return;
        }
      }

      const payload = {
        nome,
        descricao,
        precoVenda: parseFloat(precoVenda) || 0,
        imagemUrl: finalImageUrl,
      };

      let arteId = editingId;
      if (editingId) {
        await api.patch(`/artes/${editingId}`, token, payload);
      } else {
        const created = await api.post<{ id: number }>('/artes', token, payload);
        arteId = created.id;
      }

      if (arteId) {
        const validReceitas = receitas.filter(r => r.insumoId && r.quantidade);
        await api.post(`/artes/${arteId}/receita/bulk`, token, { receitas: validReceitas });
      }

      toast.success(editingId ? 'Quadro atualizado!' : 'Quadro criado!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar quadro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/artes/${confirmDelete.id}`, token);
      toast.success('Quadro excluído.');
      fetchData();
    } catch {
      toast.error('Erro ao excluir quadro.');
    } finally {
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
      setIsModalOpen(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  const totalProdutos = quadros.length;
  const valorMedioVenda = totalProdutos ? quadros.reduce((sum, item) => sum + item.precoVenda, 0) / totalProdutos : 0;
  const margemMedia = totalProdutos ? quadros.reduce((sum, item) => sum + item.margemBruta, 0) / totalProdutos : 0;
  const produtosSemImagem = quadros.filter(q => !q.imagemUrl).length;

  const filteredProdutos = quadros.filter((q) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || q.nome.toLowerCase().includes(query) || (q.descricao || '').toLowerCase().includes(query);
    const matchesFilter = activeFilter === 'all'
      || (activeFilter === 'withImage' && !!q.imagemUrl)
      || (activeFilter === 'withoutImage' && !q.imagemUrl);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.pageHeaderText}>
          <h1>Produtos</h1>
          <p>Gerencie todos os produtos cadastrados, preços, imagens e margens de lucro.</p>
        </div>

        <div className={styles.pageActions}>
          <button type="button" className={styles.iconButton} onClick={fetchData} title="Atualizar lista">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4V10H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 20V14H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 7.99988C19.3333 6.66621 18.3333 5.59988 17.0833 4.89988C15.8333 4.19988 14.375 3.99988 12.9167 4.29988C11.4583 4.59988 10.1667 5.39988 9.20833 6.54988C8.25 7.69988 7.70833 9.11988 7.66667 10.5999C7.625 12.0799 8.08333 13.4999 8.95833 14.6499C9.83333 15.7999 11.0833 16.5999 12.5 16.8499C13.9167 17.0999 15.375 16.7999 16.5833 15.9999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.btnAdd} onClick={openNewModal}>+ Novo Produto</button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total de produtos</span>
          <strong>{totalProdutos}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Valor médio de venda</span>
          <strong>{fmt(valorMedioVenda)}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Margem média</span>
          <strong>{fmt(margemMedia)}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Produtos sem imagem</span>
          <strong>{produtosSemImagem}</strong>
        </div>
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M16.6569 16.6569L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar produto..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <button
            type="button"
            className={`${styles.filterButton} ${activeFilter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Todos
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${activeFilter === 'withImage' ? styles.filterActive : ''}`}
            onClick={() => setActiveFilter('withImage')}
          >
            Com imagem
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${activeFilter === 'withoutImage' ? styles.filterActive : ''}`}
            onClick={() => setActiveFilter('withoutImage')}
          >
            Sem imagem
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyCard}>Carregando produtos…</div>
      ) : totalProdutos === 0 ? (
        <div className={styles.emptyState}>
          <IconFrame size={56} />
          <h2>Nenhum produto cadastrado</h2>
          <p>Clique em &quot;Novo Produto&quot; para começar.</p>
          <button className={styles.btnAdd} onClick={openNewModal}>Novo Produto</button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Custo</th>
                <th>Venda</th>
                <th>Margem</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProdutos.map((q) => (
                <tr key={q.id}>
                  <td>
                    <div className={styles.tableImageCell}>
                      {q.imagemUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={api.imageUrl(q.imagemUrl) ?? ''} alt={q.nome} />
                        </>
                      ) : (
                        <span className={styles.tableEmptyImage}>Sem imagem</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{q.nome}</strong>
                    {q.descricao && <p className={styles.cellSubtext}>{q.descricao}</p>}
                  </td>
                  <td>{q.descricao || 'Sem categoria'}</td>
                  <td>{fmt(q.custoProducao)}</td>
                  <td>{fmt(q.precoVenda)}</td>
                  <td>{fmt(q.margemBruta)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${q.imagemUrl ? styles.statusActive : styles.statusNeutral}`}>
                      {q.imagemUrl ? 'Ativo' : 'Sem imagem'}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.btnView} onClick={() => openEditModal(q)}>Visualizar</button>
                    <button type="button" className={styles.btnEdit} onClick={() => openEditModal(q)}>Editar</button>
                    <button type="button" className={styles.btnDelete} onClick={() => setConfirmDelete({ isOpen: true, id: q.id, nome: q.nome })}>Excluir</button>
                  </td>
                </tr>
              ))}
              {filteredProdutos.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>
                    Nenhum produto corresponde aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Produto</p>
                <h3>{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveQuadro} className={styles.modalForm}>
              <div className={styles.modalBody}>
                <div className={styles.formColumn}>
                  <div className={styles.field}>
                    <label>Nome do Produto</label>
                    <input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Van Gogh — Noite Estrelada" />
                  </div>

                  <div className={styles.field}>
                    <label>Categoria</label>
                    <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Pintura, Digital, Gravura" />
                  </div>

                  <div className={styles.field}>
                    <label>Preço de Venda (R$)</label>
                    <input type="number" step="0.01" value={precoVenda} onChange={e => setPrecoVenda(e.target.value)} required placeholder="0.00" />
                  </div>
                </div>

                <div className={styles.formColumn}>
                  <div
                    className={styles.imageUploadArea}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    {imagemUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagemUrl.startsWith('blob:') ? imagemUrl : (api.imageUrl(imagemUrl) ?? '')} alt="Preview" />
                    ) : (
                      <>
                        <IconCamera size={36} style={{ color: 'var(--text-muted)' }} />
                        <strong>Clique ou arraste uma imagem</strong>
                        <span className={styles.uploadHint}>A imagem será exibida assim que selecionada.</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formColumnWide}>
                  <div className={styles.sectionTitle}>Receita de Materiais</div>
                  <p className={styles.sectionDescription}>Adicione as cores, tintas e madeiras que compõem este produto.</p>
                  <div className={styles.receitaList}>
                    {receitas.map((rec, index) => (
                      <div key={index} className={styles.receitaRow}>
                        <select
                          value={rec.insumoId}
                          onChange={(e) => handleReceitaChange(index, 'insumoId', e.target.value)}
                          required
                        >
                          <option value="">Selecione um material...</option>
                          {insumos.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.codigoCor ? '● ' : '■ '}{i.nome} ({i.unidade})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Qtd"
                          value={rec.quantidade}
                          onChange={(e) => handleReceitaChange(index, 'quantidade', e.target.value)}
                          required
                        />
                        <button type="button" className={styles.btnRemoveRow} onClick={() => handleRemoveReceitaRow(index)} title="Remover">✕</button>
                      </div>
                    ))}
                    <button type="button" className={styles.btnAddRow} onClick={handleAddReceitaRow}>
                      + Adicionar Material / Cor
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <div>
                  {editingId && (
                    <button
                      type="button"
                      className={styles.btnDelete}
                      onClick={() => setConfirmDelete({ isOpen: true, id: editingId, nome })}
                    >
                      Excluir Produto
                    </button>
                  )}
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className={styles.btnSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Produto'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir o produto "${confirmDelete.nome}"? A receita também será perdida.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })}
      />
    </div>
  );
}
