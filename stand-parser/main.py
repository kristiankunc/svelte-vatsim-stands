# CSV -> JSON convertor for FAA Aircraft Characteristics Database (https://www.faa.gov/airports/engineering/aircraft_char_database)
# Outputs a json file with an array of objects, each object containing the ICAO code and the wingspan of the aircraft in feet.


import csv, requests, json, warnings
from io import BytesIO
import pandas as pd

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

res = requests.get(
    "https://www.faa.gov/airports/engineering/aircraft_char_database/aircraft_data"
)

excel_data = pd.read_excel(BytesIO(res.content))
csv_data = excel_data.to_csv(index=False)

lines = csv_data.splitlines()
csv_reader = csv.reader(lines)
header = next(csv_reader)

aircraft_data = {}

icao_index = header.index("ICAO_Code")
wingspan_without_winglets_index = header.index("Wingspan_ft_without_winglets_sharklets")
wingspan_with_winglets_index = header.index("Wingspan_ft_with_winglets_sharklets")

for row in csv_reader:
    icao_code = row[icao_index]
    wingspan_without_winglets = row[wingspan_without_winglets_index]
    wingspan_with_winglets = row[wingspan_with_winglets_index]
    aircraft_data[icao_code] = float(
        wingspan_with_winglets if wingspan_with_winglets else wingspan_without_winglets
    )


with open("../src/lib/data/aircraft_data.json", "w", encoding="utf-8") as f:
    json.dump(aircraft_data, f, indent=4)
