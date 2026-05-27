import sys
import re
from scraper import consultar_placa

PADRAO_PLACA = re.compile(r"^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$", re.IGNORECASE)

ICONES = {
    "Marca": "🏷️ ",
    "Modelo": "📋",
    "Importado": "🌍",
    "Ano": "📅",
    "Combustível": "⛽",
    "Chassi": "🔩",
    "Município": "📍",
    "UF": "🗺️ ",
    "Segmento": "🚗",
}


def validar_placa(placa: str) -> bool:
    return bool(PADRAO_PLACA.match(placa))


def exibir_resultado(dados: dict) -> None:
    placa = dados.get("placa", "")
    linha = "=" * 31

    print(f"\n{linha}")
    print(f"  DADOS DO VEÍCULO - {placa}")
    print(linha)

    for campo, icone in ICONES.items():
        valor = dados.get(campo) or "—"
        label = f"{campo}:".ljust(12)
        print(f"{icone} {label} {valor}")

    print(linha)

    resumo = dados.get("resumo", "")
    if resumo:
        print(f"\n📝 {resumo}\n")


def main():
    if len(sys.argv) > 1:
        placa = sys.argv[1]
    else:
        placa = input("Digite a placa: ").strip()

    placa = placa.upper().replace("-", "").replace(" ", "")

    if not validar_placa(placa):
        print(
            f"❌ Formato de placa inválido: '{placa}'\n"
            "   Use o formato antigo (ABC1234) ou Mercosul (ABC1D23)."
        )
        sys.exit(1)

    print(f"\n🔍 Consultando placa {placa}...")

    try:
        dados = consultar_placa(placa)
        exibir_resultado(dados)
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(1)
    except ConnectionError as e:
        print(f"🌐 Erro de conexão: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
