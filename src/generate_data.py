
import pandas as pd
import numpy as np

# --------------------------------------------------
# SETTINGS
# --------------------------------------------------

np.random.seed(42)

# 3 years of historical data
dates = pd.date_range(
    start="2023-01-01",
    end="2025-12-31",
    freq="D"
)

origins = [
    "Australia",
    "Indonesia",
    "South Africa",
    "Brazil",
    "Russia"
]

destinations = [
    "Paradip",
    "Visakhapatnam",
    "Kakinada",
    "Chennai",
    "Krishnapatnam"
]

cargo_types = [
    "Coal",
    "Iron Ore",
    "Wheat",
    "Fertilizer",
    "Bauxite"
]

vessel_types = [
    "Handysize",
    "Handymax",
    "Supramax",
    "Panamax",
    "Capesize"
]

rows = []

# --------------------------------------------------
# CREATE HISTORICAL DATA
# --------------------------------------------------

for date in dates:

    # Seasonal market behaviour
    month = date.month

    seasonal_factor = (
        5 * np.sin(
            2 * np.pi * month / 12
        )
    )

    # Market conditions for this day
    fuel_price = np.random.uniform(500, 850)

    commodity_price = (
        np.random.uniform(80, 180)
        + seasonal_factor
    )

    port_congestion = np.clip(
        np.random.normal(45, 15),
        5,
        95
    )

    demand_index = np.clip(
        np.random.normal(70, 15)
        + seasonal_factor,
        10,
        100
    )

    supply_index = np.clip(
        np.random.normal(60, 15),
        10,
        100
    )

    # Create several shipment scenarios per day
    for _ in range(8):

        origin = np.random.choice(origins)

        destination = np.random.choice(
            destinations
        )

        cargo = np.random.choice(
            cargo_types
        )

        vessel = np.random.choice(
            vessel_types
        )

        quantity = np.random.randint(
            20000,
            120001
        )

        # --------------------------------------------------
        # BASE FREIGHT RATE
        # --------------------------------------------------

        base_rate = 25

        # Vessel effect
        if vessel == "Handysize":
            base_rate += 8

        elif vessel == "Handymax":
            base_rate += 10

        elif vessel == "Supramax":
            base_rate += 13

        elif vessel == "Panamax":
            base_rate += 16

        elif vessel == "Capesize":
            base_rate += 20

        # Cargo effect
        if cargo == "Coal":
            base_rate += 5

        elif cargo == "Iron Ore":
            base_rate += 7

        elif cargo == "Wheat":
            base_rate += 3

        elif cargo == "Fertilizer":
            base_rate += 4

        elif cargo == "Bauxite":
            base_rate += 6

        # --------------------------------------------------
        # FREIGHT RATE
        # --------------------------------------------------

        freight_rate = (
            base_rate
            + fuel_price * 0.025
            + commodity_price * 0.08
            + port_congestion * 0.10
            + demand_index * 0.12
            - supply_index * 0.08
            + quantity * 0.00003
            + seasonal_factor
            + np.random.normal(0, 2)
        )

        rows.append([
            date,
            origin,
            destination,
            cargo,
            vessel,
            quantity,
            round(freight_rate, 2),
            round(fuel_price, 2),
            round(commodity_price, 2),
            round(port_congestion, 2),
            round(demand_index, 2),
            round(supply_index, 2)
        ])

# --------------------------------------------------
# CREATE DATAFRAME
# --------------------------------------------------

columns = [
    "date",
    "origin",
    "destination",
    "cargo",
    "vessel_type",
    "quantity_mt",
    "freight_rate",
    "fuel_price",
    "commodity_price",
    "port_congestion",
    "demand_index",
    "supply_index"
]

df = pd.DataFrame(
    rows,
    columns=columns
)

# Sort chronologically
df = df.sort_values(
    "date"
).reset_index(drop=True)

# --------------------------------------------------
# SAVE DATASET
# --------------------------------------------------

df.to_csv(
    "data/freight_data.csv",
    index=False
)

print("========================================")
print("TIME-BASED DATASET CREATED")
print("========================================")

print("Rows:", len(df))
print("Columns:", len(df.columns))

print(
    "Start date:",
    df["date"].min()
)

print(
    "End date:",
    df["date"].max()
)

print("\nFirst 5 rows:")
print(df.head())

print("\nDataset saved to:")
print("data/freight_data.csv")

