import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.keplaca.com/placa/{}"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

CAMPOS = [
    "Marca",
    "Modelo",
    "Importado",
    "Ano",
    "Combustível",
    "Chassi",
    "UF",
    "Município",
    "Segmento",
]


def consultar_placa(placa: str) -> dict:
    """
    Consulta dados de um veículo pelo número de placa no site keplaca.com.

    Retorna um dicionário com os campos do veículo.
    Lança ValueError se a placa não for encontrada.
    Lança ConnectionError em caso de falha de rede.
    """
    url = BASE_URL.format(placa.upper().strip())

    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
    except requests.exceptions.ConnectionError:
        raise ConnectionError(
            "Não foi possível conectar ao servidor. Verifique sua internet."
        )
    except requests.exceptions.Timeout:
        raise ConnectionError("A requisição excedeu o tempo limite. Tente novamente.")
    except requests.exceptions.RequestException as e:
        raise ConnectionError(f"Erro ao fazer requisição: {e}")

    if response.status_code == 404:
        raise ValueError(f"Placa '{placa}' não encontrada.")
    if response.status_code != 200:
        raise ConnectionError(
            f"Resposta inesperada do servidor: HTTP {response.status_code}"
        )

    soup = BeautifulSoup(response.text, "html.parser")
    dados = {"placa": placa.upper().strip()}

    # Extrai o resumo descritivo (div acima da tabela)
    resumo = soup.find("div", class_=lambda c: c and "resumo" in c.lower())
    if resumo is None:
        # Tenta encontrar pelo conteúdo "A placa"
        for div in soup.find_all("div"):
            texto = div.get_text(strip=True)
            if texto.startswith("A placa"):
                resumo = div
                break
    dados["resumo"] = resumo.get_text(strip=True) if resumo else ""

    # Extrai campos da <table>
    table = soup.find("table")
    if table:
        divs = table.find_all("div")
        # Os divs vêm em pares: label / valor
        i = 0
        while i < len(divs) - 1:
            label = divs[i].get_text(strip=True).rstrip(":")
            valor = divs[i + 1].get_text(strip=True)
            if label in CAMPOS:
                dados[label] = valor
            i += 2

    # Garante que todos os campos esperados existam (None se ausente)
    for campo in CAMPOS:
        dados.setdefault(campo, None)

    return dados
