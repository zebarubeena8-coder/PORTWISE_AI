
import pandas as pd
import joblib

from options import (
    ORIGINS,
    DESTINATIONS,
    CARGO_TYPES,
    VESSEL_TYPES
)


# ==========================================
# 1. LOAD TRAINED MODEL
# ==========================================

model = joblib.load(
    "models/freight_model.pkl"
)

encoder = joblib.load(
    "models/freight_encoder.pkl"
)


# ==========================================
# 2. HELPER FUNCTION
# ==========================================

def choose_option(title, options):

    print(f"\n{title}")

    for number, option in enumerate(options, start=1):
        print(f"{number}. {option}")

    while True:

        try:
            choice = int(input("Select option number: "))

            if 1 <= choice <= len(options):
                return options[choice - 1]

            print("Please select a valid number.")

        except ValueError:
            print("Please enter a number.")


# ==========================================
# 3. USER SELECTIONS
# ==========================================

print("\n========================================")
print("        PORTWISE AI FREIGHT ENGINE")
print("========================================")

origin = choose_option(
    "Select Origin:",
    ORIGINS
)

destination = choose_option(
    "Select Destination:",
    DESTINATIONS
)

cargo = choose_option(
    "Select Cargo:",
    CARGO_TYPES
)

vessel = choose_option(
    "Select Vessel Type:",
    VESSEL_TYPES
)


# ==========================================
# 4. NUMERICAL INPUTS
# ==========================================

while True:

    try:
        quantity = float(
            input("\nEnter Cargo Quantity (MT): ")
        )

        if quantity > 0:
            break

        print("Quantity must be greater than zero.")

    except ValueError:
        print("Please enter a valid number.")


while True:

    try:
        fuel_price = float(
            input("Enter Fuel Price: ")
        )

        if fuel_price > 0:
            break

        print("Fuel price must be greater than zero.")

    except ValueError:
        print("Please enter a valid number.")


while True:

    try:
        commodity_price = float(
            input("Enter Commodity Price: ")
        )

        if commodity_price > 0:
            break

        print("Commodity price must be greater than zero.")

    except ValueError:
        print("Please enter a valid number.")


while True:

    try:
        port_congestion = float(
            input("Enter Port Congestion (0-100): ")
        )

        if 0 <= port_congestion <= 100:
            break

        print("Enter a value between 0 and 100.")

    except ValueError:
        print("Please enter a valid number.")


while True:

    try:
        demand_index = float(
            input("Enter Demand Index (0-100): ")
        )

        if 0 <= demand_index <= 100:
            break

        print("Enter a value between 0 and 100.")

    except ValueError:
        print("Please enter a valid number.")


while True:

    try:
        supply_index = float(
            input("Enter Supply Index (0-100): ")
        )

        if 0 <= supply_index <= 100:
            break

        print("Enter a value between 0 and 100.")

    except ValueError:
        print("Please enter a valid number.")


# ==========================================
# 5. CREATE SHIPMENT DATA
# ==========================================

shipment = pd.DataFrame([
    {
        "origin": origin,
        "destination": destination,
        "cargo": cargo,
        "vessel_type": vessel,
        "quantity_mt": quantity,
        "fuel_price": fuel_price,
        "commodity_price": commodity_price,
        "port_congestion": port_congestion,
        "demand_index": demand_index,
        "supply_index": supply_index
    }
])


# ==========================================
# 6. ENCODE CATEGORICAL DATA
# ==========================================

encoded = encoder.transform(
    shipment[
        [
            "origin",
            "destination",
            "cargo",
            "vessel_type"
        ]
    ]
)

encoded_df = pd.DataFrame(
    encoded.toarray(),
    columns=encoder.get_feature_names_out(
        [
            "origin",
            "destination",
            "cargo",
            "vessel_type"
        ]
    )
)


# ==========================================
# 7. COMBINE FEATURES
# ==========================================

final_input = pd.concat(
    [
        encoded_df.reset_index(drop=True),

        shipment[
            [
                "quantity_mt",
                "fuel_price",
                "commodity_price",
                "port_congestion",
                "demand_index",
                "supply_index"
            ]
        ].reset_index(drop=True)
    ],
    axis=1
)


# ==========================================
# 8. AI PREDICTION
# ==========================================

prediction = model.predict(
    final_input
)[0]


# ==========================================
# 9. DISPLAY RESULT
# ==========================================

print("\n========================================")
print("           AI FORECAST RESULT")
print("========================================")

print(f"Origin          : {origin}")
print(f"Destination     : {destination}")
print(f"Cargo           : {cargo}")
print(f"Vessel Type     : {vessel}")
print(f"Quantity        : {quantity:,.0f} MT")

print("----------------------------------------")

print(
    f"Predicted Freight Rate: ${prediction:.2f} / MT"
)

print("========================================")

