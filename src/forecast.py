import pandas as pd
import numpy as np
import joblib


# ============================================================
# PORTWISE - FREIGHT FORECAST ENGINE
# ============================================================

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "freight_forecasting_model.pkl"
ENCODER_PATH = BASE_DIR / "models" / "freight_forecasting_encoder.pkl"
DATA_PATH = BASE_DIR / "data" / "freight_data.csv"


# ============================================================
# LOAD MODEL, ENCODER AND HISTORICAL DATA
# ============================================================

model = joblib.load(MODEL_PATH)

encoder = joblib.load(ENCODER_PATH)

df = pd.read_csv(DATA_PATH)

df["date"] = pd.to_datetime(df["date"])

df = (
    df.sort_values("date")
    .reset_index(drop=True)
)


# ============================================================
# MODEL FEATURE DEFINITIONS
# ============================================================

CATEGORICAL_COLUMNS = [
    "origin",
    "destination",
    "cargo",
    "vessel_type"
]

NUMERICAL_COLUMNS = [
    "quantity_mt",
    "fuel_price",
    "commodity_price",
    "port_congestion",
    "demand_index",
    "supply_index",
    "year",
    "month",
    "day_of_year",
    "week_of_year",
    "month_sin",
    "month_cos",
    "lag_1_rate",
    "lag_7_rate",
    "lag_14_rate",
    "lag_30_rate",
    "rolling_7_rate",
    "rolling_30_rate",
    "rolling_30_volatility"
]


# ============================================================
# VALIDATION HELPERS
# ============================================================

def _validate_inputs(
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
    if not origin:
        raise ValueError("Origin is required.")

    if not destination:
        raise ValueError("Destination is required.")

    if not cargo:
        raise ValueError("Cargo type is required.")

    if not vessel_type:
        raise ValueError("Vessel type is required.")

    if quantity_mt <= 0:
        raise ValueError("Quantity must be greater than 0.")

    if fuel_price <= 0:
        raise ValueError("Fuel price must be greater than 0.")

    if commodity_price <= 0:
        raise ValueError("Commodity price must be greater than 0.")

    if not 0 <= port_congestion <= 100:
        raise ValueError(
            "Port congestion must be between 0 and 100."
        )

    if not 0 <= demand_index <= 100:
        raise ValueError(
            "Demand index must be between 0 and 100."
        )

    if not 0 <= supply_index <= 100:
        raise ValueError(
            "Supply index must be between 0 and 100."
        )

    if days < 1:
        raise ValueError(
            "Forecast horizon must be at least 1 day."
        )

    if days > 90:
        raise ValueError(
            "Forecast horizon cannot exceed 90 days."
        )


# ============================================================
# HISTORICAL MARKET SERIES
# ============================================================

def _get_daily_rate_history():

    daily_rates = (
        df.groupby("date")["freight_rate"]
        .mean()
        .sort_index()
    )

    if daily_rates.empty:
        raise ValueError(
            "Historical freight-rate data is unavailable."
        )

    complete_dates = pd.date_range(
        daily_rates.index.min(),
        daily_rates.index.max(),
        freq="D"
    )

    daily_rates = (
        daily_rates
        .reindex(complete_dates)
        .interpolate()
        .ffill()
        .bfill()
    )

    return daily_rates


# ============================================================
# BUILD MODEL INPUT
# ============================================================

def _build_model_input(
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
    future_date,
    history
):

    # --------------------------------------------------------
    # Time features
    # --------------------------------------------------------

    year = future_date.year
    month = future_date.month
    day_of_year = future_date.dayofyear

    week_of_year = int(
        future_date.isocalendar().week
    )

    month_sin = np.sin(
        2 * np.pi * month / 12
    )

    month_cos = np.cos(
        2 * np.pi * month / 12
    )

    # --------------------------------------------------------
    # Lag features
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Rolling market features
    # --------------------------------------------------------

    recent_7 = history[-7:]

    recent_30 = history[-30:]

    rolling_7 = float(
        np.mean(recent_7)
    )

    rolling_30 = float(
        np.mean(recent_30)
    )

    rolling_30_volatility = float(
        np.std(recent_30)
    )

    # --------------------------------------------------------
    # Categorical features
    # --------------------------------------------------------

    categorical_data = pd.DataFrame([
        {
            "origin": origin,
            "destination": destination,
            "cargo": cargo,
            "vessel_type": vessel_type
        }
    ])

    encoded = encoder.transform(
        categorical_data[CATEGORICAL_COLUMNS]
    )

    encoded_df = pd.DataFrame(
        encoded.toarray(),
        columns=encoder.get_feature_names_out(
            CATEGORICAL_COLUMNS
        )
    )

    # --------------------------------------------------------
    # Numerical features
    # --------------------------------------------------------

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

            "week_of_year": week_of_year,

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

    # --------------------------------------------------------
    # Combine categorical + numerical features
    # --------------------------------------------------------

    final_input = pd.concat(
        [
            encoded_df.reset_index(drop=True),
            numerical_data.reset_index(drop=True)
        ],
        axis=1
    )

    # --------------------------------------------------------
    # Ensure exact training feature order
    # --------------------------------------------------------

    expected_columns = (
        list(
            encoder.get_feature_names_out(
                CATEGORICAL_COLUMNS
            )
        )
        + NUMERICAL_COLUMNS
    )

    final_input = final_input.reindex(
        columns=expected_columns,
        fill_value=0
    )

    return final_input


# ============================================================
# MAIN FORECAST FUNCTION
# ============================================================

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

    # --------------------------------------------------------
    # Validate request
    # --------------------------------------------------------

    _validate_inputs(
        origin=origin,
        destination=destination,
        cargo=cargo,
        vessel_type=vessel_type,
        quantity_mt=quantity_mt,
        fuel_price=fuel_price,
        commodity_price=commodity_price,
        port_congestion=port_congestion,
        demand_index=demand_index,
        supply_index=supply_index,
        days=days
    )

    # --------------------------------------------------------
    # Historical daily freight market
    # --------------------------------------------------------

    daily_rates = _get_daily_rate_history()

    # Keep last 30 historical observations
    history = list(
        daily_rates.values[-30:]
    )

    if len(history) < 1:
        raise ValueError(
            "Not enough historical freight data."
        )

    # Last known date
    last_date = daily_rates.index[-1]

    forecast_rows = []

    # ========================================================
    # RECURSIVE FUTURE FORECAST
    # ========================================================

    for day in range(1, days + 1):

        future_date = (
            last_date
            + pd.Timedelta(days=day)
        )

        # ----------------------------------------------------
        # Create model input
        # ----------------------------------------------------

        model_input = _build_model_input(
            origin=origin,
            destination=destination,
            cargo=cargo,
            vessel_type=vessel_type,
            quantity_mt=quantity_mt,
            fuel_price=fuel_price,
            commodity_price=commodity_price,
            port_congestion=port_congestion,
            demand_index=demand_index,
            supply_index=supply_index,
            future_date=future_date,
            history=history
        )

        # ----------------------------------------------------
        # XGBoost prediction
        # ----------------------------------------------------

        prediction = float(
            model.predict(model_input)[0]
        )

        # Freight rate cannot be negative
        prediction = max(
            0.0,
            prediction
        )

        # ----------------------------------------------------
        # Recursive forecasting
        #
        # Today's prediction becomes part of tomorrow's
        # historical sequence.
        # ----------------------------------------------------

        history.append(prediction)

        history = history[-30:]

        forecast_rows.append(
            {
                "date": future_date,
                "predicted_freight_rate": prediction
            }
        )

    # ========================================================
    # FORECAST DATAFRAME
    # ========================================================

    forecast_df = pd.DataFrame(
        forecast_rows
    )

    return forecast_df


# ============================================================
# SIMPLE MODEL INFORMATION
# ============================================================

def get_model_info():

    return {
        "model": "XGBoost",
        "model_file": MODEL_PATH,
        "encoder_file": ENCODER_PATH,
        "historical_records": int(len(df)),
        "historical_start":
            str(df["date"].min().date()),
        "historical_end":
            str(df["date"].max().date()),
        "forecast_max_days": 90,
        "categorical_features":
            CATEGORICAL_COLUMNS,
        "numerical_features":
            NUMERICAL_COLUMNS
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    print()
    print("============================================")
    print("PORTWISE")
    print("INTELLIGENT FREIGHT FORECAST ENGINE")
    print("============================================")

    print()
    print("Model:", get_model_info()["model"])

    print(
        "Historical records:",
        get_model_info()["historical_records"]
    )

    print(
        "Historical period:",
        get_model_info()["historical_start"],
        "to",
        get_model_info()["historical_end"]
    )

    # --------------------------------------------------------
    # Test forecast
    # --------------------------------------------------------

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
    print("============================================")
    print("30-DAY FREIGHT FORECAST")
    print("============================================")

    print(
        result.to_string(index=False)
    )

    print()
    print("============================================")
    print("FORECAST SUMMARY")
    print("============================================")

    print(
        "Average:",
        f"${result['predicted_freight_rate'].mean():.2f} / MT"
    )

    print(
        "Minimum:",
        f"${result['predicted_freight_rate'].min():.2f} / MT"
    )

    print(
        "Maximum:",
        f"${result['predicted_freight_rate'].max():.2f} / MT"
    )

    print(
        "Volatility:",
        f"${result['predicted_freight_rate'].std():.2f}"
    )

    print()
    print("============================================")
    print("Forecast engine completed successfully.")
    print("============================================")