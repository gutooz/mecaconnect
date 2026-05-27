# KePlaca Scraper

Scraper Python para consultar dados de veículos pelo site [keplaca.com](https://www.keplaca.com).

## Instalação

```bash
cd keplaca_scraper
pip install -r requirements.txt
```

## Uso

### Consulta individual

```bash
# Passando a placa como argumento
python main.py ABC1D23

# Ou sem argumento (o programa pergunta)
python main.py
```

**Saída esperada:**

```
===============================
  DADOS DO VEÍCULO - ABC1D23
===============================
🏷️  Marca:       VOLKSWAGEN
📋 Modelo:      PASSAT TS
📅 Ano:         1979
⛽ Combustível:  Gasolina
🔩 Chassi:      *****T269144
📍 Município:   CURITIBA
🗺️  UF:          PR
🚗 Segmento:    Auto
===============================
```

### Consulta em lote

1. Edite o arquivo `placas.txt` e coloque uma placa por linha:

```
ABC1D23
XYZ9876
DEF4G56
```

2. Execute:

```bash
python lote.py
```

3. Os resultados serão salvos em `resultados.csv`.

Você também pode especificar arquivos alternativos:

```bash
python lote.py minha_lista.txt meus_resultados.csv
```

## Formatos de placa aceitos

| Formato | Exemplo | Tipo |
|---------|---------|------|
| AAA0000 | ABC1234 | Antigo |
| AAA0A00 | ABC1D23 | Mercosul |

## Observações

- Entre consultas em lote há um delay de **2 segundos** para não sobrecarregar o servidor.
- Placas não encontradas retornam erro `404` tratado com mensagem amigável.
- O campo `Chassi` costuma vir parcialmente mascarado pelo site.
