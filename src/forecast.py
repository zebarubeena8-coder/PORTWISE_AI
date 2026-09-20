
import pandas as pd
import numpy as np
import joblib


# ==========================================
# LOAD MODEL AND DATA
# ==========================================

model = joblib.load(
    "models/freight_forecasting_model.pkl"
)

encoder = joblib.load(
    "models/freight_forecasting_encoder.pkl"
)

df = pd.read_csv(
    "data/freight_data.csv"
)

df["date"] = pd.to_datetime(
    df["date"]
)

df = df.sort_values(
    "date"
).reset_index(drop=True)


# ==========================================
# FORECAST FUNCTION
# ==========================================

def forecast_freight(
    origin,
    destination,
    cargo,
    vessel_type,
    quantity_mt,
    fuel_price,
    commodity_price,
    port_congestion,
    demand_index,
    supply_index,
    days
):

    # Calculate historical daily average
    daily_rates = (
        df.groupby("date")["freight_rate"]
        .mean()
        .sort_index()
    )

    # Keep recent history
    history = list(
        daily_rates.values[-30:]
    )

    # Last available date
    last_date = df["date"].max()

    forecast_rows = []

    # ==========================================
    # FUTURE FORECAST
    # ==========================================

    for day in range(1, days + 1):

        future_date = (
            last_date +
            pd.Timedelta(days=day)
        )

        year = future_date.year
        month = future_date.month
        day_of_year = future_date.dayofyear

        week_of_year = (
            future_date.isocalendar().week
        )

        month_sin = np.sin(
            2 * np.pi * month / 12
        )

        month_cos = np.cos(
            2 * np.pi * month / 12
        )

        # ======================================
        # LAG FEATURES
        # ======================================

        lag_1 = history[-1]

        lag_7 = (
            history[-7]
            if len(history) >= 7
            else history[0]
        )

        lag_14 = (
            history[-14]
            if len(history) >= 14
            else history[0]
        )

        lag_30 = (
            history[-30]
            if len(history) >= 30
            else history[0]
        )

        rolling_7 = np.mean(
            history[-7:]
        )

        rolling_30 = np.mean(
            history[-30:]
        )

        rolling_30_volatility = np.std(
            history[-30:]
        )

        # ======================================
        # CATEGORICAL DATA
        # ======================================

        future_data = pd.DataFrame([
            {
                "origin": origin,
                "destination": destination,
                "cargo": cargo,
                "vessel_type": vessel_type
            }
        ])

        categorical_columns = [
            "origin",
            "destination",
            "cargo",
            "vessel_type"
        ]

        encoded = encoder.transform(
            future_data[categorical_columns]
        )

        encoded_df = pd.DataFrame(
            encoded.toarray(),
            columns=encoder.get_feature_names_out(
                categorical_columns
            )
        )

        # ======================================
        # NUMERICAL FEATURES
        # ======================================

        numerical_data = pd.DataFrame([
            {
                "quantity_mt": quantity_mt,
                "fuel_price": fuel_price,
                "commodity_price": commodity_price,
                "port_congestion": port_congestion,
                "demand_index": demand_index,
                "supply_index": supply_index,

                "year": year,
                "month": month,
                "day_of_year": day_of_year,
                "week_of_year": int(week_of_year),

                "month_sin": month_sin,
                "month_cos": month_cos,

                "lag_1_rate": lag_1,
                "lag_7_rate": lag_7,
                "lag_14_rate": lag_14,
                "lag_30_rate": lag_30,

                "rolling_7_rate": rolling_7,
                "rolling_30_rate": rolling_30,
                "rolling_30_volatility":
                    rolling_30_volatility
            }
        ])

        # ======================================
        # FINAL MODEL INPUT
        # ======================================

        final_input = pd.concat(
            [
                encoded_df.reset_index(drop=True),
                numerical_data.reset_index(drop=True)
            ],
            axis=1
        )

        # ======================================
        # PREDICT
        # ======================================

        prediction = model.predict(
            final_input
        )[0]

        prediction = max(
            0,
            prediction
        )

        # Add prediction to history
        history.append(
            prediction
        )

        history = history[-30:]

        forecast_rows.append([
            future_date,
            prediction
        ])

    # ==========================================
    # RETURN FORECAST
    # ==========================================

    forecast_df = pd.DataFrame(
        forecast_rows,
        columns=[
            "date",
            "predicted_freight_rate"
        ]
    )

    return forecast_df


# ==========================================
# TEST FORECAST
# ==========================================

if __name__ == "__main__":

    print()
    print("========================================")
    print("PORTWISE AI - FREIGHT FORECAST ENGINE")
    print("========================================")

    result = forecast_freight(
        origin="Australia",
        destination="Paradip",
        cargo="Coal",
        vessel_type="Panamax",
        quantity_mt=75000,
        fuel_price=650,
        commodity_price=120,
        port_congestion=40,
        demand_index=75,
        supply_index=60,
        days=30
    )

    print()
    print("30-DAY FREIGHT FORECAST")
    print("========================================")

    print(result.to_string(index=False))

    print()
    print("========================================")
    print("AVERAGE FORECAST")
    print("========================================")

    print(
        f"${result['predicted_freight_rate'].mean():.2f} / MT"
    )

    print()
    print("Forecast engine completed successfully.")

