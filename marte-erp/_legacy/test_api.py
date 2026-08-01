"""
Testes completos da API de Estoque — Molduraria
Cobre todos os endpoints com dados realistas de quadros/artes
"""
import httpx, json, sys, time, subprocess, os, signal

BASE = "http://127.0.0.1:8765"
PASS = []
FAIL = []

# ─── helpers ─────────────────────────────────────────────────────────────────
def ok(label, cond, detail=""):
    if cond:
        PASS.append(label)
        print(f"  ✓  {label}")
    else:
        FAIL.append(label)
        print(f"  ✗  {label}  ← {detail}")

def post(path, body):
    r = httpx.post(f"{BASE}{path}", json=body)
    return r

def get(path):
    return httpx.get(f"{BASE}{path}")

def patch(path, body):
    return httpx.patch(f"{BASE}{path}", json=body)

# ─── seed ────────────────────────────────────────────────────────────────────
def seed_insumos(c: httpx.Client):
    print("\n── Criando insumos ──")
    insumos = [
        # (nome, unidade, quantidade, custo_unit, qtd_minima, fornecedor)
        ("tinta azul",    "ml",  500,  0.05,  100, "ColorMix"),
        ("tinta rosa",    "ml",  300,  0.06,   80, "ColorMix"),
        ("tinta branca",  "ml",  800,  0.03,  150, "ColorMix"),
        ("tinta preta",   "ml",  600,  0.04,  100, "ColorMix"),
        ("moldura 30x40", "un",   20,  8.50,    5, "MoldurasNorte"),
        ("moldura 60x80", "un",   10, 18.00,    3, "MoldurasNorte"),
        ("vidro 3mm",     "m²",   15,  9.00,    4, "VidrosBR"),
        ("eucatex",       "m²",   30,  4.50,    6, "MadeiraMax"),
        ("foam board",    "un",   40,  3.20,    8, "Papelaria Central"),
        ("cola branca",   "ml", 1200,  0.01,  200, "Compar"),
    ]
    ids = {}
    for nome, unid, qtd, cu, qm, forn in insumos:
        r = post("/insumos", {
            "nome": nome, "unidade": unid, "quantidade": qtd,
            "custo_unit": cu, "qtd_minima": qm, "fornecedor": forn
        })
        ok(f"POST /insumos — {nome}", r.status_code == 201)
        ids[nome] = r.json()["id"]
    return ids

def seed_artes(c: httpx.Client, ids):
    print("\n── Criando artes ──")
    artes = [
        ("Quadro Floresta A3",  "Floresta em tons frios", 120.00),
        ("Quadro Pôr do Sol A2","Céu gradiente quente",    180.00),
        ("Quadro Abstrato P",   "Formas geométricas",       90.00),
    ]
    arte_ids = {}
    for nome, desc, preco in artes:
        r = post("/artes", {"nome": nome, "descricao": desc, "preco_venda": preco})
        ok(f"POST /artes — {nome}", r.status_code == 201)
        arte_ids[nome] = r.json()["id"]

    print("\n── Adicionando receitas ──")

    # Floresta A3: bastante azul, pouco branco, moldura 30x40, vidro, eucatex
    r = post(f"/artes/{arte_ids['Quadro Floresta A3']}/receita", [
        {"insumo_id": ids["tinta azul"],    "quantidade": 12},
        {"insumo_id": ids["tinta branca"],  "quantidade": 5},
        {"insumo_id": ids["tinta preta"],   "quantidade": 2},
        {"insumo_id": ids["moldura 30x40"], "quantidade": 1},
        {"insumo_id": ids["vidro 3mm"],     "quantidade": 0.12},
        {"insumo_id": ids["eucatex"],       "quantidade": 0.12},
    ])
    ok("Receita Floresta A3", r.status_code == 201)

    # Pôr do Sol A2: rosa + laranja (sem laranja no estoque — usaremos rosa+amarelo sim)
    r = post(f"/artes/{arte_ids['Quadro Pôr do Sol A2']}/receita", [
        {"insumo_id": ids["tinta rosa"],    "quantidade": 8},
        {"insumo_id": ids["tinta branca"],  "quantidade": 4},
        {"insumo_id": ids["moldura 60x80"], "quantidade": 1},
        {"insumo_id": ids["vidro 3mm"],     "quantidade": 0.48},
        {"insumo_id": ids["eucatex"],       "quantidade": 0.48},
    ])
    ok("Receita Pôr do Sol A2", r.status_code == 201)

    # Abstrato P: misto, foam board no lugar de eucatex
    r = post(f"/artes/{arte_ids['Quadro Abstrato P']}/receita", [
        {"insumo_id": ids["tinta azul"],   "quantidade": 2},
        {"insumo_id": ids["tinta rosa"],   "quantidade": 1},
        {"insumo_id": ids["tinta preta"],  "quantidade": 1},
        {"insumo_id": ids["moldura 30x40"],"quantidade": 1},
        {"insumo_id": ids["foam board"],   "quantidade": 1},
        {"insumo_id": ids["cola branca"],  "quantidade": 30},
    ])
    ok("Receita Abstrato P", r.status_code == 201)

    return arte_ids

# ─── testes ──────────────────────────────────────────────────────────────────
def testar(ids, arte_ids):
    print("\n── Consultas ──")

    r = get("/insumos")
    ok("GET /insumos lista todos", r.status_code == 200 and len(r.json()) == 10)

    r = get(f"/insumos/{ids['tinta azul']}")
    d = r.json()
    ok("GET /insumos/:id retorna limite_seguranca",
       "limite_seguranca" in d and d["limite_seguranca"] == round(100 * 1.15, 4))

    r = get(f"/artes/{arte_ids['Quadro Abstrato P']}/receita")
    j = r.json()
    ok("GET /artes/:id/receita retorna custo_insumos", "custo_insumos" in j and j["custo_insumos"] > 0)
    ok("GET /artes/:id/receita retorna markup_pct", j["markup_pct"] is not None)
    print(f"     → custo insumos: R$ {j['custo_insumos']:.4f} | markup: {j['markup_pct']}%")

    r = get(f"/artes/{arte_ids['Quadro Floresta A3']}/receita")
    j = r.json()
    print(f"     → Floresta A3 custo: R$ {j['custo_insumos']:.4f} | venda: R$ {j['preco_venda']} | margem: R$ {j['margem_bruta']}")

    print("\n── Movimentações ──")

    # Entrada de estoque
    r = post(f"/insumos/{ids['moldura 30x40']}/movimentacao",
             {"tipo": "entrada", "quantidade": 10, "motivo": "compra NF#42"})
    ok("POST movimentacao — entrada moldura 30x40", r.status_code == 200)

    # Baixa de produção — 2 Quadros Abstrato P
    r = post(f"/artes/{arte_ids['Quadro Abstrato P']}/baixa?quantidade=2", {})
    ok("POST /artes/:id/baixa × 2", r.status_code == 200)
    j = r.json()
    print(f"     → movimentacoes: {[m['insumo']+' -'+str(m['consumido']) for m in j['movimentacoes']]}")
    if j["alertas_gerados"]:
        print(f"     ⚠  Alertas: {[a['insumo'] for a in j['alertas_gerados']]}")

    print("\n── Alertas de estoque ──")
    # Zerar moldura 60x80 para forçar alerta
    r = post(f"/insumos/{ids['moldura 60x80']}/movimentacao",
             {"tipo": "saida", "quantidade": 9, "motivo": "vendas semana"})
    ok("POST saida que gera alerta", r.status_code == 200 and r.json()["alerta"] == True)

    r = get("/alertas")
    ok("GET /alertas retorna ao menos 1 alerta", r.status_code == 200 and len(r.json()) >= 1)
    for a in r.json():
        print(f"     ⚠  {a['nome']}: {a['quantidade_atual']}/{a['limite_seguranca']} {a['insumo_id']}")

    print("\n── Validações e erros ──")
    r = post("/insumos", {"nome": "tinta azul", "unidade": "ml"})
    ok("POST /insumos duplicado retorna 400", r.status_code == 400)

    r = post(f"/insumos/{ids['foam board']}/movimentacao",
             {"tipo": "saida", "quantidade": 99999, "motivo": "teste"})
    ok("POST saida sem estoque retorna 400", r.status_code == 400)

    r = post(f"/artes/{arte_ids['Quadro Pôr do Sol A2']}/baixa?quantidade=1", {})
    ok("POST baixa producao Pôr do Sol A2 ok", r.status_code == 200)

    print("\n── Histórico ──")
    r = get(f"/insumos/{ids['tinta azul']}/historico")
    ok("GET historico tinta azul", r.status_code == 200 and isinstance(r.json(), list))

# ─── main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import os
    db = "/home/claude/estoque/estoque.db"
    if os.path.exists(db):
        os.remove(db)

    proc = subprocess.Popen(
        ["python3", "-m", "uvicorn", "main:app", "--port", "8765", "--log-level", "error"],
        cwd="/home/claude/estoque"
    )
    time.sleep(2.5)

    try:
        with httpx.Client(timeout=10) as c:
            ids = seed_insumos(c)
            arte_ids = seed_artes(c, ids)
            testar(ids, arte_ids)
    finally:
        proc.terminate()
        proc.wait()

    print(f"\n{'═'*48}")
    total = len(PASS) + len(FAIL)
    print(f"  Resultado: {len(PASS)}/{total} passou")
    if FAIL:
        print(f"  Falhou: {FAIL}")
        sys.exit(1)
    else:
        print("  Todos os testes passaram ✓")
