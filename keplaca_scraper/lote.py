import csv
import sys
import time
import re
from pathlib import Path
from scraper import consultar_placa, CAMPOS

PADRAO_PLACA = re.compile(r"^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$", re.IGNORECASE)
DELAY_SEGUNDOS = 2
ARQUIVO_ENTRADA = "placas.txt"
ARQUIVO_SAIDA = "resultados.csv"


def carregar_placas(caminho: str) -> list[str]:
    path = Path(caminho)
    if not path.exists():
        print(f"❌ Arquivo '{caminho}' não encontrado.")
        sys.exit(1)

    placas = []
    for linha in path.read_text(encoding="utf-8").splitlines():
        placa = linha.strip().upper().replace("-", "").replace(" ", "")
        if placa and not placa.startswith("#"):
            placas.append(placa)
    return placas


def salvar_csv(resultados: list[dict], caminho: str) -> None:
    if not resultados:
        return

    colunas = ["placa"] + CAMPOS + ["resumo", "erro"]
    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=colunas, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(resultados)


def main():
    arquivo_entrada = sys.argv[1] if len(sys.argv) > 1 else ARQUIVO_ENTRADA
    arquivo_saida = sys.argv[2] if len(sys.argv) > 2 else ARQUIVO_SAIDA

    placas = carregar_placas(arquivo_entrada)
    total = len(placas)

    if total == 0:
        print("⚠️  Nenhuma placa encontrada no arquivo.")
        sys.exit(0)

    print(f"\n📋 {total} placa(s) encontrada(s) em '{arquivo_entrada}'")
    print(f"💾 Resultados serão salvos em '{arquivo_saida}'\n")

    resultados = []

    for idx, placa in enumerate(placas, start=1):
        print(f"🔍 Consultando {idx}/{total}: {placa}...", end=" ", flush=True)

        if not PADRAO_PLACA.match(placa):
            print("⚠️  formato inválido, pulando.")
            resultados.append({"placa": placa, "erro": "formato inválido"})
            continue

        try:
            dados = consultar_placa(placa)
            dados["erro"] = ""
            resultados.append(dados)
            marca = dados.get("Marca") or "—"
            modelo = dados.get("Modelo") or "—"
            print(f"✅ {marca} {modelo}")
        except ValueError as e:
            print(f"❌ {e}")
            resultados.append({"placa": placa, "erro": str(e)})
        except ConnectionError as e:
            print(f"🌐 {e}")
            resultados.append({"placa": placa, "erro": str(e)})

        if idx < total:
            time.sleep(DELAY_SEGUNDOS)

    salvar_csv(resultados, arquivo_saida)
    sucessos = sum(1 for r in resultados if not r.get("erro"))
    print(f"\n✅ Concluído: {sucessos}/{total} consultas bem-sucedidas.")
    print(f"💾 Arquivo salvo: {arquivo_saida}")


if __name__ == "__main__":
    main()
