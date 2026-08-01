"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "../_components/AuthProvider";
import { IconEye, IconEyeOff, IconShield } from "../_components/Icons";
import styles from "./login.module.css";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !senha) {
      setError("Preencha todos os campos.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email, senha);
    } catch (err: any) {
      setError(err.message || "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Background decorativo */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.bgOrb3} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>M</div>
          <div className={styles.logoText}>
            <span className={styles.logoBrand}>MARTE ERP</span>
            <span className={styles.logoSub}>Gestão para Moldurarias</span>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Cabeçalho do card */}
        <div className={styles.cardHead}>
          <h1 className={styles.title}>Bem-vindo de volta</h1>
          <p className={styles.subtitle}>
            Acesse sua conta para continuar gerenciando seu estoque.
          </p>
        </div>

        {/* Formulário */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="senha" className={styles.label}>
                Senha
              </label>
              <button
                type="button"
                className={styles.forgotLink}
                onClick={() => alert("Funcionalidade disponível em breve.")}
                tabIndex={-1}
              >
                Esqueci minha senha
              </button>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                id="senha"
                type={showSenha ? "text" : "password"}
                className={styles.input}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowSenha((v) => !v)}
                tabIndex={-1}
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              <IconShield size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Sistema MARTE ERP &copy; {new Date().getFullYear()} — Uso exclusivo
          interno
        </p>
      </div>
    </div>
  );
}
