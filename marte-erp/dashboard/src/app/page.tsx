"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from './_components/AuthProvider';
import {
  IconDashboard,
  IconPackage,
  IconDollar,
  IconFrame,
  IconWarning,
  IconAlertCircle,
  IconEdit,
  IconCheckCircle,
  IconArrowsUpDown,
} from './_components/Icons';
import { api } from '../lib/api';

interface MovDia {
  label: string;
  entradas: number;
  saidas: number;
  total: number;
}

interface TopInsumo {
  label: string;
  nome: string;
  value: number;
}

interface DashboardData {
  totalInsumos: number;
  valorTotalEstoque: number;
  totalArtes: number;
  totalAlertas: number;
  entradasHoje: number;
  saidasHoje: number;
  alertas: any[];
  artesRecentes: any[];
  topInsumos: TopInsumo[];
  movPorDia: MovDia[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    try {
      const result = await api.get<DashboardData>('/dashboard', token);
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.dashboardHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.brandLabel}><IconDashboard size={20} /><span>Dashboard</span></div>
            <h1>Carregando dados…</h1>
            <p>Buscando informações do sistema.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.dashboardHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.brandLabel}><IconDashboard size={20} /><span>Dashboard</span></div>
            <h1>Erro ao carregar</h1>
            <p>Não foi possível conectar ao servidor.</p>
          </div>
          <div className={styles.headerControls}>
            <button onClick={fetchData} className={styles.refreshButton}>Tentar novamente</button>
          </div>
        </div>
      </div>
    );
  }

  const maxMov = Math.max(...data.movPorDia.map(m => m.total), 1);
  const maxInsumo = Math.max(...data.topInsumos.map(i => i.value), 1);

  return (
    <div className={styles.container}>
      <div className={styles.dashboardHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.brandLabel}>
            <IconDashboard size={20} />
            <span>Dashboard</span>
          </div>
          <h1>Bem-vindo ao sistema de gestão</h1>
          <p>Acompanhe em tempo real o desempenho do seu estoque.</p>
        </div>

        <div className={styles.headerControls}>
          <button onClick={fetchData} className={styles.refreshButton}>Atualizar</button>
          <div className={styles.headerMeta}>
            <div>
              <span className={styles.metaLabel}>Data atual</span>
              <p>{currentDate}</p>
            </div>
            <div>
              <span className={styles.metaLabel}>Status</span>
              <div className={styles.onlineBadge}>
                <IconCheckCircle size={16} />
                <span>Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className={styles.statsGrid}>
        <article className={`${styles.statCard} ${styles.glassPanel}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(8,145,178,0.18)', color: '#0891B2' }}>
            <IconPackage size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Insumos</span>
            <span className={styles.statValue}>{data.totalInsumos}</span>
          </div>
        </article>

        <article className={`${styles.statCard} ${styles.glassPanel}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.18)', color: '#10B981' }}>
            <IconDollar size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Valor do Estoque</span>
            <span className={styles.statValue}>{fmt(data.valorTotalEstoque)}</span>
          </div>
        </article>

        <article className={`${styles.statCard} ${styles.glassPanel}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(6,182,212,0.18)', color: '#06B6D4' }}>
            <IconFrame size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Produtos</span>
            <span className={styles.statValue}>{data.totalArtes}</span>
          </div>
        </article>

        <article className={`${styles.statCard} ${styles.glassPanel}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(239,68,68,0.18)', color: '#EF4444' }}>
            <IconWarning size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Alertas</span>
            <span className={styles.statValue}>{data.totalAlertas}</span>
          </div>
        </article>
      </div>

      <div className={styles.pageGrid}>
        <main className={styles.mainBoard}>
          <div className={styles.chartsGrid}>
            {/* Gráfico de barras — top insumos por quantidade */}
            <section className={`${styles.chartCard} ${styles.glassPanel}`}>
              <div className={styles.chartHeader}>
                <div>
                  <h2>Insumos em estoque</h2>
                  <p>Top {data.topInsumos.length} materiais por quantidade disponível.</p>
                </div>
                <span className={styles.chartBadge}>{data.topInsumos.length} itens</span>
              </div>
              <div className={styles.chartPreview}>
                {data.topInsumos.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                    Nenhum insumo cadastrado ainda.
                  </p>
                ) : (
                  <div className={styles.chartBars}>
                    {data.topInsumos.map(item => {
                      const height = Math.max(12, Math.round((item.value / maxInsumo) * 100));
                      return (
                        <div key={item.label} className={styles.chartBar} title={item.nome}>
                          <div className={styles.barFill} style={{ height: `${height}%` }} />
                          <strong>{item.value}</strong>
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Gráfico de linha — movimentações últimos 7 dias */}
            <section className={`${styles.chartCard} ${styles.glassPanel}`}>
              <div className={styles.chartHeader}>
                <div>
                  <h2>Movimentações — últimos 7 dias</h2>
                  <p>Total de entradas e saídas por dia.</p>
                </div>
                <span className={styles.chartBadge}>
                  {data.movPorDia.reduce((a, m) => a + m.total, 0)} movs.
                </span>
              </div>
              <div className={styles.chartPreview}>
                {maxMov === 1 && data.movPorDia.every(m => m.total === 0) ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                    Sem movimentações nos últimos 7 dias.
                  </p>
                ) : (
                  <>
                    <svg viewBox="0 0 260 100" className={styles.lineChart}>
                      <polyline
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        points={data.movPorDia
                          .map((m, i) => {
                            const x = 20 + i * 34;
                            const y = 84 - (m.total / maxMov) * 64;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />
                      {data.movPorDia.map((m, i) => {
                        const x = 20 + i * 34;
                        const y = 84 - (m.total / maxMov) * 64;
                        return (
                          <circle key={m.label + i} cx={x} cy={y} r="4" fill="var(--primary)" />
                        );
                      })}
                    </svg>
                    <div className={styles.lineLabels}>
                      {data.movPorDia.map((m, i) => (
                        <span key={m.label + i}>{m.label}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          <div className={styles.cardsGrid}>
            {/* Produtos recentes */}
            <section className={`${styles.listCard} ${styles.glassPanel}`}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>Produtos recentes</h2>
                  <p>Últimos itens adicionados ao catálogo.</p>
                </div>
                <Link href="/quadros" className={styles.sectionLink}>Ver todos</Link>
              </div>
              <div className={styles.productList}>
                {data.artesRecentes.length === 0 ? (
                  <div className={styles.emptyState}>Nenhum produto cadastrado ainda.</div>
                ) : (
                  data.artesRecentes.map((arte: any) => (
                    <article key={arte.id} className={styles.productCard}>
                      <div className={styles.productImage}>
                        <span>{arte.nome?.charAt(0) ?? 'Q'}</span>
                      </div>
                      <div className={styles.productDetails}>
                        <strong>{arte.nome}</strong>
                        <p className={styles.productPrice}>{fmt(arte.precoVenda)}</p>
                        <span className={styles.productMargin}>
                          Margem {fmt(arte.margemBruta)}
                        </span>
                      </div>
                      <Link href="/quadros" className={styles.actionButton}>
                        <IconEdit size={14} /> Editar
                      </Link>
                    </article>
                  ))
                )}
              </div>
            </section>

            {/* Alertas ativos */}
            <section className={`${styles.listCard} ${styles.glassPanel}`}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>Alertas ativos</h2>
                  <p>Itens com estoque abaixo do mínimo.</p>
                </div>
                <Link href="/estoque" className={styles.sectionLink}>Ver Estoque</Link>
              </div>
              <div className={styles.alertGrid}>
                {data.alertas.length === 0 ? (
                  <div className={styles.emptyState}>Nenhum alerta ativo no momento.</div>
                ) : (
                  data.alertas.map((alerta: any) => (
                    <article key={alerta.id} className={styles.alertCard}>
                      <div className={styles.alertCardTop}>
                        <div className={styles.alertBadge}>
                          <IconAlertCircle size={18} />
                        </div>
                        <div>
                          <strong>{alerta.nome}</strong>
                          <span>Mínimo: {alerta.qtdMinima} {alerta.unidade}</span>
                        </div>
                      </div>
                      <div className={styles.alertCardFooter}>
                        <span>{alerta.quantidade} {alerta.unidade}</span>
                        <Link href="/estoque" className={styles.viewButton}>Ver Estoque</Link>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>

        {/* Resumo rápido */}
        <aside className={styles.sidebar}>
          <div className={`${styles.sidebarCard} ${styles.glassPanel}`}>
            <div className={styles.sidebarTitle}>
              <h2>Resumo rápido</h2>
              <p>Indicadores do dia atual.</p>
            </div>
            <div className={styles.sidebarList}>
              <div className={styles.sidebarItem}>
                <span>Insumos cadastrados</span>
                <strong>{data.totalInsumos}</strong>
              </div>
              <div className={styles.sidebarItem}>
                <span>Produtos cadastrados</span>
                <strong>{data.totalArtes}</strong>
              </div>
              <div className={styles.sidebarItem}>
                <span>Entradas hoje</span>
                <strong style={{ color: '#10B981' }}>
                  <IconArrowsUpDown size={13} style={{ display: 'inline', marginRight: 3 }} />
                  {data.entradasHoje}
                </strong>
              </div>
              <div className={styles.sidebarItem}>
                <span>Saídas hoje</span>
                <strong style={{ color: '#EF4444' }}>
                  <IconArrowsUpDown size={13} style={{ display: 'inline', marginRight: 3 }} />
                  {data.saidasHoje}
                </strong>
              </div>
              <div className={styles.sidebarItem}>
                <span>Alertas de estoque</span>
                <strong style={{ color: data.totalAlertas > 0 ? '#EF4444' : 'var(--success)' }}>
                  {data.totalAlertas}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
