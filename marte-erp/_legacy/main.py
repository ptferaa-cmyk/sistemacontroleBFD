"""
Sistema de Gestão de Estoque — Molduraria
Módulo: Insumos + Receita de Artes + Custos + Margem de Segurança + Autenticação
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import sqlite3, math, os

# Auth dependencies
from passlib.context import CryptContext
from jose import JWTError, jwt

from fastapi.middleware.cors import CORSMiddleware

# ─────────────────────────── CONFIGURAÇÕES JWT ────────────────────────────────
SECRET_KEY = os.environ.get("JWT_SECRET", "marte-erp-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# ─────────────────────────── DB ───────────────────────────────────────────────
DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "estoque.db")

def get_conn():
    db_dir = os.path.dirname(DB)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_conn() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS insumos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nome        TEXT    NOT NULL UNIQUE,
            unidade     TEXT    NOT NULL,
            quantidade  REAL    NOT NULL DEFAULT 0,
            custo_unit  REAL    NOT NULL DEFAULT 0,
            qtd_minima  REAL    NOT NULL DEFAULT 0,
            fornecedor  TEXT,
            criado_em   TEXT    DEFAULT (datetime('now')),
            atualizado_em TEXT  DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS movimentacoes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            insumo_id   INTEGER NOT NULL REFERENCES insumos(id),
            tipo        TEXT    NOT NULL CHECK(tipo IN ('entrada','saida')),
            quantidade  REAL    NOT NULL,
            motivo      TEXT,
            criado_em   TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS artes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nome        TEXT    NOT NULL UNIQUE,
            descricao   TEXT,
            preco_venda REAL    DEFAULT 0,
            ativo       INTEGER DEFAULT 1,
            criado_em   TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS receitas (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            arte_id     INTEGER NOT NULL REFERENCES artes(id) ON DELETE CASCADE,
            insumo_id   INTEGER NOT NULL REFERENCES insumos(id),
            quantidade  REAL    NOT NULL,
            UNIQUE(arte_id, insumo_id)
        );

        CREATE TABLE IF NOT EXISTS usuarios (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            nome          TEXT    NOT NULL,
            email         TEXT    NOT NULL UNIQUE,
            senha_hash    TEXT    NOT NULL,
            cargo         TEXT    NOT NULL DEFAULT 'funcionario',
            ativo         INTEGER NOT NULL DEFAULT 1,
            criado_em     TEXT    DEFAULT (datetime('now')),
            atualizado_em TEXT    DEFAULT (datetime('now'))
        );
        """)

        # Seed: cria admin inicial se não houver nenhum usuário
        count = c.execute("SELECT COUNT(*) FROM usuarios").fetchone()[0]
        if count == 0:
            senha_hash = pwd_context.hash("Admin@1234")
            c.execute(
                "INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES (?,?,?,?)",
                ("Administrador", "admin@marte.com", senha_hash, "admin")
            )

init_db()

# ─────────────────────────── SCHEMAS — existentes ─────────────────────────────
MARGEM_SEGURANCA = 0.15

class InsumoIn(BaseModel):
    nome: str
    unidade: str
    quantidade: float = 0
    custo_unit: float = 0
    qtd_minima: float = 0
    fornecedor: Optional[str] = None

class MovimentacaoIn(BaseModel):
    tipo: str
    quantidade: float = Field(..., gt=0)
    motivo: Optional[str] = None

class ArteIn(BaseModel):
    nome: str
    descricao: Optional[str] = None
    preco_venda: float = 0

class ReceitaItem(BaseModel):
    insumo_id: int
    quantidade: float = Field(..., gt=0)

# ─────────────────────────── SCHEMAS — auth ───────────────────────────────────

class UsuarioIn(BaseModel):
    nome: str
    email: str
    senha: str
    cargo: str = "funcionario"  # "admin" | "funcionario"

class UsuarioUpdate(BaseModel):
    nome: str
    cargo: str
    ativo: bool = True

class SenhaUpdate(BaseModel):
    nova_senha: str

class SenhaAlteracao(BaseModel):
    senha_atual: str
    nova_senha: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: dict

# ─────────────────────────── AUTH HELPERS ─────────────────────────────────────

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user_by_email(email: str):
    with get_conn() as c:
        row = c.execute("SELECT * FROM usuarios WHERE email=?", (email,)).fetchone()
    return dict(row) if row else None

def get_user_by_id(user_id: int):
    with get_conn() as c:
        row = c.execute("SELECT * FROM usuarios WHERE id=?", (user_id,)).fetchone()
    return dict(row) if row else None

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependência: valida JWT e retorna usuário atual. Levanta 401 se inválido."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_by_id(int(user_id))
    if not user:
        raise credentials_exception
    if not user.get("ativo"):
        raise HTTPException(status_code=403, detail="Usuário inativo.")
    return user

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("cargo") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return current_user

def safe_user(u: dict) -> dict:
    """Remove senha_hash antes de retornar ao cliente."""
    return {k: v for k, v in u.items() if k != "senha_hash"}

# ─────────────────────────── APP ──────────────────────────────────────────────
app = FastAPI(
    title="Estoque Molduraria",
    version="2.0",
    description="Gestão de insumos, receitas de artes, controle de custos e autenticação"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ══════════════════════════ AUTH ══════════════════════════════════════════════

@app.post("/auth/login", response_model=TokenOut, tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Autentica com email e senha, retorna JWT."""
    user = get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["senha_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user["ativo"]:
        raise HTTPException(status_code=403, detail="Usuário inativo. Contate o administrador.")

    token = create_access_token({"sub": str(user["id"])})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": safe_user(user),
    }

@app.get("/auth/me", tags=["Auth"])
def me(current_user: dict = Depends(get_current_user)):
    """Retorna dados do usuário autenticado."""
    return safe_user(current_user)

@app.patch("/auth/me/senha", tags=["Auth"])
def alterar_minha_senha(body: SenhaAlteracao, current_user: dict = Depends(get_current_user)):
    """Permite que o próprio usuário altere sua senha."""
    if not verify_password(body.senha_atual, current_user["senha_hash"]):
        raise HTTPException(400, "Senha atual incorreta.")
    if len(body.nova_senha) < 6:
        raise HTTPException(400, "A nova senha deve ter pelo menos 6 caracteres.")
    novo_hash = hash_password(body.nova_senha)
    with get_conn() as c:
        c.execute(
            "UPDATE usuarios SET senha_hash=?, atualizado_em=datetime('now') WHERE id=?",
            (novo_hash, current_user["id"])
        )
    return {"ok": True}

# ══════════════════════════ USUÁRIOS ══════════════════════════════════════════

@app.get("/usuarios", tags=["Usuários"])
def listar_usuarios(current_user: dict = Depends(require_admin)):
    """Lista todos os usuários (admin only)."""
    with get_conn() as c:
        rows = c.execute("SELECT * FROM usuarios ORDER BY nome").fetchall()
    return [safe_user(dict(r)) for r in rows]

@app.post("/usuarios", status_code=201, tags=["Usuários"])
def criar_usuario(body: UsuarioIn, current_user: dict = Depends(require_admin)):
    """Cria novo usuário (admin only)."""
    if body.cargo not in ("admin", "funcionario"):
        raise HTTPException(400, "Cargo inválido. Use 'admin' ou 'funcionario'.")
    if len(body.senha) < 6:
        raise HTTPException(400, "A senha deve ter pelo menos 6 caracteres.")
    senha_hash = hash_password(body.senha)
    with get_conn() as c:
        try:
            cur = c.execute(
                "INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES (?,?,?,?)",
                (body.nome, body.email, senha_hash, body.cargo)
            )
            return {"id": cur.lastrowid, "nome": body.nome, "email": body.email, "cargo": body.cargo}
        except sqlite3.IntegrityError:
            raise HTTPException(400, f"E-mail '{body.email}' já está em uso.")

@app.get("/usuarios/{usuario_id}", tags=["Usuários"])
def detalhar_usuario(usuario_id: int, current_user: dict = Depends(require_admin)):
    user = get_user_by_id(usuario_id)
    if not user:
        raise HTTPException(404, "Usuário não encontrado.")
    return safe_user(user)

@app.patch("/usuarios/{usuario_id}", tags=["Usuários"])
def atualizar_usuario(usuario_id: int, body: UsuarioUpdate, current_user: dict = Depends(require_admin)):
    """Atualiza nome, cargo e status do usuário (admin only)."""
    if body.cargo not in ("admin", "funcionario"):
        raise HTTPException(400, "Cargo inválido.")
    with get_conn() as c:
        cur = c.execute(
            "UPDATE usuarios SET nome=?, cargo=?, ativo=?, atualizado_em=datetime('now') WHERE id=?",
            (body.nome, body.cargo, 1 if body.ativo else 0, usuario_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Usuário não encontrado.")
    return {"ok": True}

@app.patch("/usuarios/{usuario_id}/senha", tags=["Usuários"])
def redefinir_senha(usuario_id: int, body: SenhaUpdate, current_user: dict = Depends(require_admin)):
    """Redefine a senha de um usuário (admin only)."""
    if len(body.nova_senha) < 6:
        raise HTTPException(400, "A senha deve ter pelo menos 6 caracteres.")
    novo_hash = hash_password(body.nova_senha)
    with get_conn() as c:
        cur = c.execute(
            "UPDATE usuarios SET senha_hash=?, atualizado_em=datetime('now') WHERE id=?",
            (novo_hash, usuario_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Usuário não encontrado.")
    return {"ok": True}

@app.patch("/usuarios/{usuario_id}/toggle", tags=["Usuários"])
def toggle_usuario(usuario_id: int, current_user: dict = Depends(require_admin)):
    """Ativa ou desativa um usuário (admin only). Não pode desativar a si mesmo."""
    if usuario_id == current_user["id"]:
        raise HTTPException(400, "Você não pode desativar sua própria conta.")
    with get_conn() as c:
        row = c.execute("SELECT ativo FROM usuarios WHERE id=?", (usuario_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Usuário não encontrado.")
        novo_status = 0 if row["ativo"] else 1
        c.execute(
            "UPDATE usuarios SET ativo=?, atualizado_em=datetime('now') WHERE id=?",
            (novo_status, usuario_id)
        )
    return {"ok": True, "ativo": bool(novo_status)}

@app.delete("/usuarios/{usuario_id}", tags=["Usuários"])
def excluir_usuario(usuario_id: int, current_user: dict = Depends(require_admin)):
    """Exclui um usuário (admin only). Não pode excluir a si mesmo."""
    if usuario_id == current_user["id"]:
        raise HTTPException(400, "Você não pode excluir sua própria conta.")
    with get_conn() as c:
        cur = c.execute("DELETE FROM usuarios WHERE id=?", (usuario_id,))
        if cur.rowcount == 0:
            raise HTTPException(404, "Usuário não encontrado.")
    return {"ok": True}

# ══════════════════════════ INSUMOS ══════════════════════════════════════════

@app.post("/insumos", status_code=201, tags=["Insumos"])
def criar_insumo(body: InsumoIn):
    """Cadastra um novo insumo (tinta, moldura, vidro, etc.)."""
    with get_conn() as c:
        try:
            cur = c.execute(
                "INSERT INTO insumos (nome,unidade,quantidade,custo_unit,qtd_minima,fornecedor) "
                "VALUES (?,?,?,?,?,?)",
                (body.nome, body.unidade, body.quantidade, body.custo_unit,
                 body.qtd_minima, body.fornecedor)
            )
            return {"id": cur.lastrowid, **body.model_dump()}
        except sqlite3.IntegrityError:
            raise HTTPException(400, f"Insumo '{body.nome}' já existe.")


@app.get("/insumos", tags=["Insumos"])
def listar_insumos():
    """Lista todos os insumos com status de alerta."""
    with get_conn() as c:
        rows = c.execute("SELECT * FROM insumos ORDER BY nome").fetchall()
    result = []
    for r in rows:
        limite = r["qtd_minima"] * (1 + MARGEM_SEGURANCA)
        alerta = r["quantidade"] <= limite
        result.append({**dict(r), "limite_seguranca": round(limite, 4), "alerta": alerta})
    return result


@app.get("/insumos/{insumo_id}", tags=["Insumos"])
def detalhar_insumo(insumo_id: int):
    with get_conn() as c:
        row = c.execute("SELECT * FROM insumos WHERE id=?", (insumo_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Insumo não encontrado.")
    r = dict(row)
    r["limite_seguranca"] = round(r["qtd_minima"] * (1 + MARGEM_SEGURANCA), 4)
    r["alerta"] = r["quantidade"] <= r["limite_seguranca"]
    return r


@app.patch("/insumos/{insumo_id}", tags=["Insumos"])
def atualizar_insumo(insumo_id: int, body: InsumoIn):
    """Atualiza dados cadastrais do insumo (não movimenta estoque)."""
    with get_conn() as c:
        cur = c.execute(
            "UPDATE insumos SET nome=?,unidade=?,custo_unit=?,qtd_minima=?,fornecedor=?,"
            "atualizado_em=datetime('now') WHERE id=?",
            (body.nome, body.unidade, body.custo_unit, body.qtd_minima,
             body.fornecedor, insumo_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Insumo não encontrado.")
    return {"ok": True}


@app.post("/insumos/{insumo_id}/movimentacao", tags=["Insumos"])
def movimentar(insumo_id: int, body: MovimentacaoIn):
    """
    Entrada (compra chegou) ou saída manual (venda, descarte, ajuste).
    Baixa automática de produção é feita via POST /artes/{id}/baixa.
    """
    with get_conn() as c:
        row = c.execute("SELECT * FROM insumos WHERE id=?", (insumo_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Insumo não encontrado.")
        if body.tipo == "saida" and row["quantidade"] < body.quantidade:
            raise HTTPException(400, f"Estoque insuficiente. Disponível: {row['quantidade']} {row['unidade']}.")

        delta = body.quantidade if body.tipo == "entrada" else -body.quantidade
        c.execute(
            "UPDATE insumos SET quantidade=quantidade+?, atualizado_em=datetime('now') WHERE id=?",
            (delta, insumo_id)
        )
        c.execute(
            "INSERT INTO movimentacoes (insumo_id,tipo,quantidade,motivo) VALUES (?,?,?,?)",
            (insumo_id, body.tipo, body.quantidade, body.motivo)
        )
        nova_qtd = row["quantidade"] + delta
        limite = row["qtd_minima"] * (1 + MARGEM_SEGURANCA)
    return {
        "ok": True,
        "nova_quantidade": round(nova_qtd, 4),
        "alerta": nova_qtd <= limite,
        "limite_seguranca": round(limite, 4)
    }


@app.get("/insumos/{insumo_id}/historico", tags=["Insumos"])
def historico_insumo(insumo_id: int):
    with get_conn() as c:
        rows = c.execute(
            "SELECT * FROM movimentacoes WHERE insumo_id=? ORDER BY criado_em DESC LIMIT 100",
            (insumo_id,)
        ).fetchall()
    return [dict(r) for r in rows]


@app.get("/alertas", tags=["Insumos"])
def alertas_estoque():
    """Retorna apenas insumos abaixo do limite de segurança (qtd_min × 1.15)."""
    with get_conn() as c:
        rows = c.execute("SELECT * FROM insumos").fetchall()
    alertas = []
    for r in rows:
        limite = r["qtd_minima"] * (1 + MARGEM_SEGURANCA)
        if r["quantidade"] <= limite:
            alertas.append({
                "id": r["id"],
                "nome": r["nome"],
                "unidade": r["unidade"],
                "quantidade": r["quantidade"],
                "qtdMinima": r["qtd_minima"],
                "limite_seguranca": round(limite, 4),
                "falta": round(limite - r["quantidade"], 4)
            })
    return alertas

# ══════════════════════════ MOVIMENTAÇÕES ═════════════════════════════════════

@app.get("/movimentacoes", tags=["Movimentações"])
def listar_movimentacoes():
    """Lista as últimas 200 movimentações com dados do insumo."""
    with get_conn() as c:
        rows = c.execute("""
            SELECT m.id, m.tipo, m.quantidade, m.motivo, m.criado_em,
                   i.id AS insumo_id, i.nome AS insumo_nome, i.unidade
            FROM movimentacoes m
            JOIN insumos i ON i.id = m.insumo_id
            ORDER BY m.criado_em DESC
            LIMIT 200
        """).fetchall()
    return [dict(r) for r in rows]

# ══════════════════════════ ARTES ════════════════════════════════════════════

@app.post("/artes", status_code=201, tags=["Artes"])
def criar_arte(body: ArteIn):
    """Cria um novo quadro/produto. Receita de insumos é adicionada depois."""
    with get_conn() as c:
        try:
            cur = c.execute(
                "INSERT INTO artes (nome,descricao,preco_venda) VALUES (?,?,?)",
                (body.nome, body.descricao, body.preco_venda)
            )
            return {"id": cur.lastrowid, **body.model_dump()}
        except sqlite3.IntegrityError:
            raise HTTPException(400, f"Arte '{body.nome}' já existe.")


@app.get("/artes", tags=["Artes"])
def listar_artes():
    with get_conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM artes ORDER BY nome")]


@app.post("/artes/{arte_id}/receita", status_code=201, tags=["Artes"])
def adicionar_receita(arte_id: int, items: list[ReceitaItem]):
    """
    Define (ou substitui) a receita da arte.
    Exemplo: [{"insumo_id":1,"quantidade":2}, {"insumo_id":2,"quantidade":0.5}]
    """
    with get_conn() as c:
        arte = c.execute("SELECT id FROM artes WHERE id=?", (arte_id,)).fetchone()
        if not arte:
            raise HTTPException(404, "Arte não encontrada.")
        c.execute("DELETE FROM receitas WHERE arte_id=?", (arte_id,))
        for item in items:
            ins = c.execute("SELECT id FROM insumos WHERE id=?", (item.insumo_id,)).fetchone()
            if not ins:
                raise HTTPException(400, f"Insumo id={item.insumo_id} não existe.")
            c.execute(
                "INSERT INTO receitas (arte_id,insumo_id,quantidade) VALUES (?,?,?)",
                (arte_id, item.insumo_id, item.quantidade)
            )
    return {"ok": True, "itens": len(items)}


@app.get("/artes/{arte_id}/receita", tags=["Artes"])
def ver_receita(arte_id: int):
    """Retorna a receita detalhada com custo de cada insumo."""
    with get_conn() as c:
        arte = c.execute("SELECT * FROM artes WHERE id=?", (arte_id,)).fetchone()
        if not arte:
            raise HTTPException(404, "Arte não encontrada.")
        rows = c.execute("""
            SELECT r.quantidade, i.id AS insumo_id, i.nome, i.unidade, i.custo_unit
            FROM receitas r JOIN insumos i ON i.id = r.insumo_id
            WHERE r.arte_id=?
        """, (arte_id,)).fetchall()

    itens = []
    custo_total = 0.0
    for r in rows:
        sub = r["quantidade"] * r["custo_unit"]
        custo_total += sub
        itens.append({
            "insumo_id": r["insumo_id"],
            "nome": r["nome"],
            "quantidade": r["quantidade"],
            "unidade": r["unidade"],
            "custo_unit": r["custo_unit"],
            "subtotal": round(sub, 4)
        })

    preco = dict(arte)["preco_venda"]
    margem_bruta = round(preco - custo_total, 2) if preco else None
    markup = round((preco / custo_total - 1) * 100, 1) if preco and custo_total else None

    return {
        "arte": dict(arte),
        "receita": itens,
        "custo_insumos": round(custo_total, 4),
        "preco_venda": preco,
        "margem_bruta": margem_bruta,
        "markup_pct": markup
    }


@app.post("/artes/{arte_id}/baixa", tags=["Artes"])
def baixa_producao(arte_id: int, quantidade: int = 1):
    """
    Dá baixa manual nos insumos conforme a receita × quantidade produzida.
    Retorna alertas se algum insumo ficou abaixo do limite de segurança.
    """
    with get_conn() as c:
        arte = c.execute("SELECT * FROM artes WHERE id=?", (arte_id,)).fetchone()
        if not arte:
            raise HTTPException(404, "Arte não encontrada.")
        receita = c.execute("""
            SELECT r.insumo_id, r.quantidade AS qtd_receita,
                   i.nome, i.unidade, i.quantidade AS estoque, i.qtd_minima
            FROM receitas r JOIN insumos i ON i.id=r.insumo_id
            WHERE r.arte_id=?
        """, (arte_id,)).fetchall()

        if not receita:
            raise HTTPException(400, "Arte sem receita cadastrada.")

        for r in receita:
            necessario = r["qtd_receita"] * quantidade
            if r["estoque"] < necessario:
                raise HTTPException(400,
                    f"Estoque insuficiente de '{r['nome']}': "
                    f"precisa {necessario} {r['unidade']}, tem {r['estoque']}."
                )

        alertas = []
        movs = []
        for r in receita:
            consume = r["qtd_receita"] * quantidade
            c.execute(
                "UPDATE insumos SET quantidade=quantidade-?, atualizado_em=datetime('now') WHERE id=?",
                (consume, r["insumo_id"])
            )
            c.execute(
                "INSERT INTO movimentacoes (insumo_id,tipo,quantidade,motivo) VALUES (?,?,?,?)",
                (r["insumo_id"], "saida", consume, f"Baixa produção — {arte['nome']} ×{quantidade}")
            )
            nova = r["estoque"] - consume
            limite = r["qtd_minima"] * (1 + MARGEM_SEGURANCA)
            movs.append({"insumo": r["nome"], "consumido": consume, "novo_estoque": round(nova, 4)})
            if nova <= limite:
                alertas.append({
                    "insumo": r["nome"],
                    "novo_estoque": round(nova, 4),
                    "limite_seguranca": round(limite, 4)
                })

    return {"ok": True, "movimentacoes": movs, "alertas_gerados": alertas}
