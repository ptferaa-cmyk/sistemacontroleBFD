"use client";

import { useState, useEffect } from 'react';
import styles from './movimentacoes.module.css';
import { useToast } from '../_components/Toast';
import { useAuth } from '../_components/AuthProvider';
import { api } from '../../lib/api';

type Insumo = { id: number; nome: string; unidade: string; codigoCor: string | null; quantidade: number };
type ReceitaItem = {
  insumo: { id: number; nome: string; unidade: string; codigoCor: string | null };
  quantidade: number;
};
type Arte = { id: number; nome: string; receitas: ReceitaItem[] };
type ConsumoItem = {
  insumoId: number;
  nome: string;
  unidade: string;
  codigoCor: string | null;
  isColor: boolean;
  quantidadeSugerida: number;
  quantidadeFinal: string;
};
type Movimentacao = {
  id: number;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  criadoEm: string;
  insumo: Insumo;
  usuario: { id: number; nome: string; cargo: string } | null;
};

export default function MovimentacoesPage() {
  const [activeTab, setActiveTab] = useState<'baixa' | 'avulsa' | 'historico'>('historico');
  const toast = useToast();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [artes, setArtes] = useState<Arte[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [historico, setHistorico] = useState<Movimentacao[]>([]);

  // State: Baixa
  const [selectedArteId, setSelectedArteId] = useState('');
  const [selectedArte, setSelectedArte] = useState<Arte | null>(null);
  const [qtdProduzida, setQtdProduzida] = useState(1);
  const [consumos, setConsumos] = useState<ConsumoItem[]>([]);

  // State: Avulsa
  const [avInsumoId, setAvInsumoId] = useState('');
  const [avTipo, setAvTipo] = useState<'entrada'|'saida'>('entrada');
  const [avQtd, setAvQtd] = useState('');
  const [avMotivo, setAvMotivo] = useState('');

  const fetchData = async () => {
    try {
      const [artesData, insumosData, historicoData] = await Promise.all([
        api.get<Arte[]>('/artes', token),
        api.get<Insumo[]>('/insumos', token),
        api.get<Movimentacao[]>('/movimentacoes', token),
      ]);
      setArtes(artesData);
      setInsumos(insumosData);
      setHistorico(historicoData);
    } catch {
      toast.error('Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Recalculate Consumos when Arte changes
  useEffect(() => {
    if (selectedArteId) {
      const arte = artes.find(a => a.id === parseInt(selectedArteId)) || null;
      setSelectedArte(arte);
      
      if (arte) {
        const novosConsumos = arte.receitas.map(r => {
          const isColor = !!r.insumo.codigoCor;
          const margem = isColor ? 1.25 : 1.0;
          const totalSugerido = r.quantidade * qtdProduzida * margem;
          return {
            insumoId: r.insumo.id,
            nome: r.insumo.nome,
            unidade: r.insumo.unidade,
            codigoCor: r.insumo.codigoCor,
            isColor,
            quantidadeSugerida: totalSugerido,
            quantidadeFinal: totalSugerido.toFixed(2),
          };
        });
        setConsumos(novosConsumos);
      }
    } else {
      setSelectedArte(null);
      setConsumos([]);
    }
  }, [selectedArteId, qtdProduzida, artes]);

  const handleUpdateConsumo = (insumoId: number, value: string) => {
    setConsumos(prev => prev.map(c => 
      c.insumoId === insumoId ? { ...c, quantidadeFinal: value } : c
    ));
  };

  const handleBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArteId) return;

    const insumosGastos = consumos.map(c => ({
      insumoId: c.insumoId,
      quantidade: parseFloat(c.quantidadeFinal) || 0
    }));

    try {
      const data = await api.post<{ message: string }>(`/artes/${selectedArteId}/baixa`, token, { qtdProduzida, insumosGastos });
      toast.success(data.message);
      setSelectedArteId('');
      setQtdProduzida(1);
      fetchData();
      setActiveTab('historico');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao dar baixa.');
    }
  };

  const handleAvulsa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avInsumoId || !avQtd || !avMotivo) return;

    try {
      await api.post(`/insumos/${avInsumoId}/movimentacao`, token, {
        tipo: avTipo,
        quantidade: parseFloat(avQtd),
        motivo: avMotivo,
      });
      toast.success('Movimentação registrada com sucesso!');
      setAvInsumoId('');
      setAvQtd('');
      setAvMotivo('');
      fetchData();
      setActiveTab('historico');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar movimentação.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h2>Movimentações</h2>
        <p>Gerencie o histórico de entradas e saídas do seu estoque e registre produções.</p>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'historico' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          Histórico
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'baixa' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('baixa')}
        >
          Produção (Baixa)
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'avulsa' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('avulsa')}
        >
          Entrada/Saída Avulsa
        </button>
      </div>

      <div className={styles.layout}>
        {activeTab === 'historico' && (
          <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <h3 className={styles.cardTitle}>Histórico Recente</h3>
            {loading ? (
              <p className={styles.emptyState}>Carregando...</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Tipo</th>
                      <th>Material</th>
                      <th>Qtd</th>
                      <th>Motivo</th>
                      <th>Responsável</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map(h => (
                      <tr key={h.id}>
                        <td data-label="Data/Hora">{new Date(h.criadoEm).toLocaleString('pt-BR')}</td>
                        <td data-label="Tipo">
                          {h.tipo === 'entrada' ? (
                            <span className={styles.badgeSuccess}>Entrada</span>
                          ) : (
                            <span className={styles.badgeError}>Saída</span>
                          )}
                        </td>
                        <td data-label="Material">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {h.insumo.codigoCor && (
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: h.insumo.codigoCor, border: '1px solid var(--border)' }} />
                            )}
                            {h.insumo.nome}
                          </div>
                        </td>
                        <td data-label="Qtd">{h.quantidade} {h.insumo.unidade}</td>
                        <td data-label="Motivo" style={{ color: 'var(--text-muted)' }}>{h.motivo}</td>
                        <td data-label="Responsável" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {h.usuario ? h.usuario.nome : <em>—</em>}
                        </td>
                      </tr>
                    ))}
                    {historico.length === 0 && (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>Nenhuma movimentação registrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'baixa' && (
          <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <h3 className={styles.cardTitle}>Registrar Produção</h3>
            <div className={styles.form} style={{ flexDirection: 'row', gap: '1rem', alignItems: 'flex-end' }}>
              <div className={styles.field} style={{ flex: 2 }}>
                <label>Qual arte foi produzida?</label>
                <select value={selectedArteId} onChange={e => setSelectedArteId(e.target.value)}>
                  <option value="">-- Selecione a Arte --</option>
                  {artes.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field} style={{ flex: 1 }}>
                <label>Qtd Produzida</label>
                <input 
                  type="number" min="1" step="1" 
                  value={qtdProduzida} 
                  onChange={e => setQtdProduzida(parseInt(e.target.value) || 1)} 
                />
              </div>
            </div>

            {selectedArte && (
              <form onSubmit={handleBaixa} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Revisão de Materiais</h4>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Margem?</th>
                        <th>Valor Sugerido</th>
                        <th>Gasto Real (Editar)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumos.map(c => (
                        <tr key={c.insumoId}>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {c.codigoCor && (
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c.codigoCor, border: '1px solid var(--border)' }} title={c.codigoCor}></div>
                            )}
                            <strong>{c.nome}</strong>
                          </td>
                          <td>
                            {c.isColor ? (
                              <span className={styles.badgeWarning}>Sim (+25%)</span>
                            ) : (
                              <span className={styles.badgeNeutral}>Não</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {c.quantidadeSugerida.toFixed(2)} {c.unidade}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input 
                                type="number" step="0.01" value={c.quantidadeFinal}
                                onChange={(e) => handleUpdateConsumo(c.insumoId, e.target.value)}
                                className={styles.inlineInput} required
                              />
                              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{c.unidade}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {consumos.length === 0 && (
                        <tr><td colSpan={4} className={styles.emptyState}>Esta arte não possui receita definida.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className={styles.warningBox}>
                  <strong>Atenção:</strong> Os valores da coluna &quot;Gasto Real&quot; serão descontados do estoque.
                </div>

                <div style={{ alignSelf: 'flex-start' }}>
                  <button type="submit" className={styles.btnPrimary} disabled={consumos.length === 0}>
                    Confirmar Baixa
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'avulsa' && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Nova Movimentação Avulsa</h3>
            <form className={styles.form} onSubmit={handleAvulsa}>
              <div className={styles.field}>
                <label>Material</label>
                <select value={avInsumoId} onChange={e => setAvInsumoId(e.target.value)} required>
                  <option value="">-- Selecione --</option>
                  {insumos.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.nome} (Atual: {i.quantidade} {i.unidade})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Tipo</label>
                  <select value={avTipo} onChange={e => setAvTipo(e.target.value as 'entrada'|'saida')} required>
                    <option value="entrada">Entrada (Compra)</option>
                    <option value="saida">Saída (Perda/Ajuste)</option>
                  </select>
                </div>

                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Quantidade</label>
                  <input type="number" step="0.01" min="0.01" value={avQtd} onChange={e => setAvQtd(e.target.value)} required />
                </div>
              </div>

              <div className={styles.field}>
                <label>Motivo</label>
                <input type="text" value={avMotivo} onChange={e => setAvMotivo(e.target.value)} placeholder="Ex: Compra de estoque, Material danificado..." required />
              </div>

              <div style={{ alignSelf: 'flex-start' }}>
                <button type="submit" className={styles.btnPrimary}>
                  Registrar {avTipo === 'entrada' ? 'Entrada' : 'Saída'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
