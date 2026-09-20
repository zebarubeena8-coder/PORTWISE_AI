
import pandas as pd
import joblib

from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from xgboost import XGBRegressor


# ==================================================
# 1. LOAD DATA
# ==================================================

df = pd.read_csv(
    "data/freight_data.csv"
)

df["date"] = pd.to_datetime(
    df["date"]
)

df = df.sort_values(
    "date"
).reset_index(drop=True)

print("Dataset loaded successfully!")
print("Total records:", len(df))

print(
    "Date range:",
    df["date"].min(),
    "to",
    df["date"].max()
)


# ==================================================
# 2. CREATE TIME FEATURES
# ==================================================

df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day_of_year"] = df["date"].dt.dayofyear
df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)

# Cyclic seasonal features
import numpy as np

df["month_sin"] = np.sin(
    2 * np.pi * df["month"] / 12
)

df["month_cos"] = np.cos(
    2 * np.pi * df["month"] / 12
)


# ==================================================
# 3. CREATE LAG FEATURES
# ==================================================

# Overall historical freight-rate signals
daily_rate = (
    df.groupby("date")["freight_rate"]
    .mean()
    .sort_index()
)

df["daily_average_rate"] = df["date"].map(
    daily_rate
)

daily_average_series = (
    daily_rate
    .reindex(
        pd.date_range(
            daily_rate.index.min(),
            daily_rate.index.max(),
            freq="D"
        )
    )
    .interpolate()
)

df["lag_1_rate"] = df["date"].map(
    daily_average_series.shift(1)
)

df["lag_7_rate"] = df["date"].map(
    daily_average_series.shift(7)
)

df["lag_14_rate"] = df["date"].map(
    daily_average_series.shift(14)
)

df["lag_30_rate"] = df["date"].map(
    daily_average_series.shift(30)
)


# ==================================================
# 4. ROLLING FEATURES
# ==================================================

df["rolling_7_rate"] = df["date"].map(
    daily_average_series
    .shift(1)
    .rolling(7)
    .mean()
)

df["rolling_30_rate"] = df["date"].map(
    daily_average_series
    .shift(1)
    .rolling(30)
    .mean()
)

df["rolling_30_volatility"] = df["date"].map(
    daily_average_series
    .shift(1)
    .rolling(30)
    .std()
)


# ==================================================
# 5. REMOVE INITIAL MISSING ROWS
# ==================================================

df = df.dropna().reset_index(
    drop=True
)

print(
    "Records after feature creation:",
    len(df)
)


# ==================================================
# 6. FEATURES
# ==================================================

categorical_columns = [
    "origin",
    "destination",
    "cargo",
    "vessel_type"
]

numerical_columns = [
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


# ==================================================
# 7. CHRONOLOGICAL TRAIN / TEST SPLIT
# ==================================================

split_date = pd.Timestamp(
    "2025-07-01"
)

train_df = df[
    df["date"] < split_date
].copy()

test_df = df[
    df["date"] >= split_date
].copy()

print(
    "Training records:",
    len(train_df)
)

print(
    "Testing records:",
    len(test_df)
)


# ==================================================
# 8. ENCODE CATEGORICAL DATA
# ==================================================

encoder = OneHotEncoder(
    handle_unknown="ignore"
)

X_train_cat = encoder.fit_transform(
    train_df[categorical_columns]
)

X_test_cat = encoder.transform(
    test_df[categorical_columns]
)

encoded_columns = (
    encoder
    .get_feature_names_out(
        categorical_columns
    )
)

X_train_cat = pd.DataFrame(
    X_train_cat.toarray(),
    columns=encoded_columns
)

X_test_cat = pd.DataFrame(
    X_test_cat.toarray(),
    columns=encoded_columns
)


# ==================================================
# 9. BUILD FINAL FEATURES
# ==================================================

X_train = pd.concat(
    [
        X_train_cat.reset_index(drop=True),
        train_df[
            numerical_columns
        ].reset_index(drop=True)
    ],
    axis=1
)

X_test = pd.concat(
    [
        X_test_cat.reset_index(drop=True),
        test_df[
            numerical_columns
        ].reset_index(drop=True)
    ],
    axis=1
)

y_train = train_df[
    "freight_rate"
]

y_test = test_df[
    "freight_rate"
]


# ==================================================
# 10. TRAIN XGBOOST
# ==================================================

model = XGBRegressor(
    n_estimators=600,
    learning_rate=0.05,
    max_depth=7,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    random_state=42
)

print("\nTraining forecasting model...")

model.fit(
    X_train,
    y_train
)

print(
    "Training completed!"
)


# ==================================================
# 11. EVALUATION
# ==================================================

predictions = model.predict(
    X_test
)

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = mean_squared_error(
    y_test,
    predictions
) ** 0.5

r2 = r2_score(
    y_test,
    predictions
)

print("\n========================================")
print("TIME-BASED MODEL PERFORMANCE")
print("========================================")

print(
    f"MAE  : {mae:.2f}"
)

print(
    f"RMSE : {rmse:.2f}"
)

print(
    f"R²   : {r2:.4f}"
)


# ==================================================
# 12. SAVE MODEL
# ==================================================

joblib.dump(
    model,
    "models/freight_forecasting_model.pkl"
)

joblib.dump(
    encoder,
    "models/freight_forecasting_encoder.pkl"
)

joblib.dump(
    numerical_columns,
    "models/forecast_numerical_columns.pkl"
)

print("\n========================================")
print("FORECASTING MODEL SAVED")
print("========================================")

print(
    "models/freight_forecasting_model.pkl"
)

print(
    "models/freight_forecasting_encoder.pkl"
)

print(
    "models/forecast_numerical_columns.pkl"
)

