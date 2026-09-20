
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import sys
from pathlib import Path

# ============================================================
# PATH SETUP
# ============================================================

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from forecast import forecast_freight


# ============================================================
# PAGE CONFIG
# ============================================================

st.set_page_config(
    page_title="PORTWISE AI",
    page_icon="⚓",
    layout="wide",
    initial_sidebar_state="expanded"
)


# ============================================================
# PREMIUM UI STYLE
# ============================================================

st.markdown(
    """
    <style>

    .main {
        background-color: #f7f9fc;
    }

    .block-container {
        padding-top: 1.2rem;
        padding-bottom: 3rem;
        max-width: 1500px;
    }

    .hero {
        background:
            linear-gradient(
                135deg,
                #07111f 0%,
                #0b2545 55%,
                #123b63 100%
            );

        padding: 28px;
        border-radius: 20px;
        margin-bottom: 22px;
        color: white;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }

    .hero-title {
        font-size: 38px;
        font-weight: 800;
        margin-bottom: 4px;
    }

    .hero-subtitle {
        font-size: 16px;
        color: #cbd5e1;
    }

    .section-title {
        font-size: 25px;
        font-weight: 750;
        margin-top: 28px;
        margin-bottom: 12px;
        color: #0f172a;
    }

    .metric-card {
        background: white;
        border-radius: 16px;
        padding: 18px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 14px rgba(15,23,42,0.06);
        min-height: 120px;
    }

    .metric-label {
        color: #64748b;
        font-size: 13px;
        font-weight: 600;
    }

    .metric-value {
        color: #0f172a;
        font-size: 27px;
        font-weight: 800;
        margin-top: 8px;
    }

    .metric-caption {
        color: #64748b;
        font-size: 12px;
        margin-top: 4px;
    }

    .signal-card {
        background: white;
        border-radius: 15px;
        padding: 17px;
        margin-bottom: 10px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 3px 10px rgba(15,23,42,0.05);
    }

    .signal-title {
        font-weight: 750;
        color: #0f172a;
        margin-bottom: 5px;
    }

    .signal-text {
        color: #475569;
        font-size: 14px;
    }

    .decision-card {
        background:
            linear-gradient(
                135deg,
                #0f172a,
                #172554
            );
        color: white;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 10px 35px rgba(15,23,42,0.2);
    }

    .decision-score {
        font-size: 48px;
        font-weight: 850;
    }

    .decision-label {
        color: #cbd5e1;
        font-size: 14px;
    }

    .status-online {
        color: #16a34a;
        font-weight: 700;
    }

    .small-note {
        color: #64748b;
        font-size: 12px;
    }

    </style>
    """,
    unsafe_allow_html=True
)


# ============================================================
# SESSION STATE
# ============================================================

if "forecast_df" not in st.session_state:
    st.session_state.forecast_df = None

if "scenario_forecast" not in st.session_state:
    st.session_state.scenario_forecast = None

if "scenario_inputs" not in st.session_state:
    st.session_state.scenario_inputs = None


# ============================================================
# CONSTANTS
# ============================================================

ORIGINS = [
    "Australia",
    "Indonesia",
    "South Africa",
    "Brazil",
    "Russia"
]

DESTINATIONS = [
    "Paradip",
    "Visakhapatnam",
    "Kakinada",
    "Chennai",
    "Krishnapatnam"
]

CARGO_TYPES = [
    "Coal",
    "Iron Ore",
    "Wheat",
    "Fertilizer",
    "Bauxite"
]

VESSEL_TYPES = [
    "Handysize",
    "Handymax",
    "Supramax",
    "Panamax",
    "Capesize"
]

FORECAST_HORIZONS = [
    7,
    14,
    30,
    60,
    90
]


# ============================================================
# VESSEL DATABASE
# ============================================================

VESSEL_INFO = {

    "Handysize": {
        "min": 10000,
        "max": 40000,
        "speed": 13.0,
        "flexibility": 95,
        "port_access": 95,
        "fuel_day": 20,
        "cargo": [
            "Coal",
            "Wheat",
            "Fertilizer",
            "Bauxite"
        ]
    },

    "Handymax": {
        "min": 40000,
        "max": 65000,
        "speed": 13.5,
        "flexibility": 90,
        "port_access": 90,
        "fuel_day": 24,
        "cargo": [
            "Coal",
            "Wheat",
            "Fertilizer",
            "Bauxite",
            "Iron Ore"
        ]
    },

    "Supramax": {
        "min": 50000,
        "max": 70000,
        "speed": 14.0,
        "flexibility": 88,
        "port_access": 85,
        "fuel_day": 28,
        "cargo": [
            "Coal",
            "Iron Ore",
            "Wheat",
            "Fertilizer",
            "Bauxite"
        ]
    },

    "Panamax": {
        "min": 70000,
        "max": 100000,
        "speed": 14.5,
        "flexibility": 78,
        "port_access": 75,
        "fuel_day": 32,
        "cargo": [
            "Coal",
            "Iron Ore",
            "Wheat",
            "Bauxite"
        ]
    },

    "Capesize": {
        "min": 100000,
        "max": 200000,
        "speed": 15.0,
        "flexibility": 55,
        "port_access": 55,
        "fuel_day": 38,
        "cargo": [
            "Coal",
            "Iron Ore",
            "Bauxite"
        ]
    }
}


# ============================================================
# ROUTE DATABASE
# ============================================================

ROUTES = {

    ("Australia", "Paradip"): 6200,
    ("Australia", "Visakhapatnam"): 6000,
    ("Australia", "Kakinada"): 5900,
    ("Australia", "Chennai"): 5600,
    ("Australia", "Krishnapatnam"): 5500,

    ("Indonesia", "Paradip"): 4300,
    ("Indonesia", "Visakhapatnam"): 4100,
    ("Indonesia", "Kakinada"): 3900,
    ("Indonesia", "Chennai"): 3600,
    ("Indonesia", "Krishnapatnam"): 3500,

    ("South Africa", "Paradip"): 9000,
    ("South Africa", "Visakhapatnam"): 8800,
    ("South Africa", "Kakinada"): 8700,
    ("South Africa", "Chennai"): 8500,
    ("South Africa", "Krishnapatnam"): 8400,

    ("Brazil", "Paradip"): 13500,
    ("Brazil", "Visakhapatnam"): 13300,
    ("Brazil", "Kakinada"): 13200,
    ("Brazil", "Chennai"): 13000,
    ("Brazil", "Krishnapatnam"): 12900,

    ("Russia", "Paradip"): 10500,
    ("Russia", "Visakhapatnam"): 10300,
    ("Russia", "Kakinada"): 10100,
    ("Russia", "Chennai"): 9800,
    ("Russia", "Krishnapatnam"): 9700
}


# ============================================================
# PORT DATABASE
# ============================================================

PORT_INFO = {

    "Paradip": {
        "turn": 2.8,
        "berth": 82,
        "draft": 88,
        "bulk": 92,
        "connect": 85
    },

    "Visakhapatnam": {
        "turn": 2.6,
        "berth": 86,
        "draft": 91,
        "bulk": 94,
        "connect": 88
    },

    "Kakinada": {
        "turn": 2.4,
        "berth": 80,
        "draft": 84,
        "bulk": 88,
        "connect": 82
    },

    "Chennai": {
        "turn": 3.0,
        "berth": 78,
        "draft": 82,
        "bulk": 86,
        "connect": 96
    },

    "Krishnapatnam": {
        "turn": 2.3,
        "berth": 89,
        "draft": 93,
        "bulk": 91,
        "connect": 86
    }
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_trend(series):

    if len(series) < 2:
        return "STABLE"

    first = float(series.iloc[0])
    last = float(series.iloc[-1])

    difference = last - first

    if difference > 1.5:
        return "RISING"

    if difference < -1.5:
        return "DECLINING"

    return "STABLE"


def get_risk_level(score):

    if score >= 70:
        return "HIGH"

    if score >= 40:
        return "MODERATE"

    return "LOW"


def calculate_risk(
    fuel,
    congestion,
    demand,
    supply,
    volatility,
    forecast_range
):

    imbalance = abs(demand - supply)

    score = (
        0.18 * fuel
        + 0.22 * congestion
        + 0.20 * imbalance
        + 0.18 * volatility
        + 0.22 * forecast_range
    )

    return float(
        np.clip(score, 0, 100)
    )


def vessel_matching(
    quantity,
    cargo,
    congestion
):

    rows = []

    for name, info in VESSEL_INFO.items():

        midpoint = (
            info["min"] +
            info["max"]
        ) / 2

        if (
            info["min"]
            <= quantity
            <= info["max"]
        ):

            capacity_score = 100

        else:

            distance = (
                abs(quantity - midpoint)
                / max(midpoint, 1)
            )

            capacity_score = max(
                20,
                100 - distance * 100
            )

        cargo_score = (
            100
            if cargo in info["cargo"]
            else 35
        )

        port_score = max(
            20,
            info["port_access"]
            - 0.25 * congestion
        )

        utilization = min(
            100,
            quantity / info["max"] * 100
        )

        total = (
            0.35 * capacity_score
            + 0.25 * cargo_score
            + 0.20 * port_score
            + 0.20 * info["flexibility"]
        )

        rows.append({

            "Vessel": name,

            "Match Score":
                round(total, 1),

            "Capacity Fit":
                round(capacity_score, 1),

            "Cargo Fit":
                round(cargo_score, 1),

            "Port Access":
                round(port_score, 1),

            "Flexibility":
                info["flexibility"],

            "Utilization":
                round(utilization, 1)

        })

    return (
        pd.DataFrame(rows)
        .sort_values(
            "Match Score",
            ascending=False
        )
    )


def calculate_voyage(
    origin,
    destination,
    vessel,
    quantity,
    fuel_price,
    congestion,
    freight_rate
):

    distance = ROUTES.get(
        (origin, destination),
        8000
    )

    speed = VESSEL_INFO[vessel]["speed"]

    sailing_days = (
        distance /
        (speed * 24)
    )

    congestion_delay = (
        congestion / 100 * 4
    )

    operational_buffer = 1.5

    total_days = (
        sailing_days
        + congestion_delay
        + operational_buffer
    )

    fuel_per_day = (
        VESSEL_INFO[vessel]["fuel_day"]
    )

    fuel_mt = (
        fuel_per_day *
        sailing_days
    )

    fuel_cost = (
        fuel_mt *
        fuel_price
    )

    freight_cost = (
        freight_rate *
        quantity
    )

    total_exposure = (
        freight_cost +
        fuel_cost
    )

    return {

        "distance": distance,

        "sailing_days":
            sailing_days,

        "congestion_delay":
            congestion_delay,

        "buffer":
            operational_buffer,

        "total_days":
            total_days,

        "fuel_mt":
            fuel_mt,

        "fuel_cost":
            fuel_cost,

        "freight_cost":
            freight_cost,

        "total_exposure":
            total_exposure
    }


def procurement_analysis(
    average_rate,
    spot_percentage
):

    contract_percentage = (
        100 -
        spot_percentage
    )

    # Illustrative prototype assumption.
    contract_discount = 0.05

    spot_rate = average_rate

    contract_rate = (
        average_rate *
        (1 - contract_discount)
    )

    hybrid_rate = (
        spot_rate *
        spot_percentage / 100
        +
        contract_rate *
        contract_percentage / 100
    )

    return pd.DataFrame({

        "Strategy": [
            "Spot",
            "Contract",
            "Hybrid"
        ],

        "Estimated Rate": [
            spot_rate,
            contract_rate,
            hybrid_rate
        ],

        "Exposure %": [
            spot_percentage,
            contract_percentage,
            50
        ]

    })


# ============================================================
# HERO HEADER
# ============================================================

st.markdown(
    """
    <div class="hero">

        <div class="hero-title">
            ⚓ PORTWISE AI
        </div>

        <div class="hero-subtitle">
            Intelligent Freight Forecasting &
            Maritime Decision Intelligence
        </div>

    </div>
    """,
    unsafe_allow_html=True
)


# ============================================================
# SIDEBAR
# ============================================================

with st.sidebar:

    st.header("🚢 Shipment Scenario")

    origin = st.selectbox(
        "Origin",
        ORIGINS
    )

    destination = st.selectbox(
        "Destination",
        DESTINATIONS
    )

    cargo = st.selectbox(
        "Cargo",
        CARGO_TYPES
    )

    vessel = st.selectbox(
        "Vessel Type",
        VESSEL_TYPES
    )

    quantity = st.number_input(
        "Cargo Quantity (MT)",
        min_value=10000,
        max_value=200000,
        value=75000,
        step=5000
    )

    forecast_days = st.selectbox(
        "Forecast Horizon",
        FORECAST_HORIZONS,
        index=2
    )

    st.divider()

    st.header("📊 Market Conditions")

    fuel_price = st.slider(
        "Fuel Price ($/MT)",
        350,
        900,
        650,
        10
    )

    commodity_price = st.slider(
        "Commodity Price",
        60,
        200,
        120,
        5
    )

    port_congestion = st.slider(
        "Port Congestion Index",
        0,
        100,
        40
    )

    demand_index = st.slider(
        "Demand Index",
        0,
        100,
        75
    )

    supply_index = st.slider(
        "Supply Index",
        0,
        100,
        60
    )

    st.divider()

    run_forecast = st.button(
        "⚡ RUN AI FORECAST",
        use_container_width=True,
        type="primary"
    )


# ============================================================
# RUN FORECAST
# ============================================================

if run_forecast:

    with st.spinner(
        "Running PORTWISE AI forecasting engine..."
    ):

        result = forecast_freight(

            origin=origin,

            destination=destination,

            cargo=cargo,

            vessel_type=vessel,

            quantity_mt=quantity,

            fuel_price=fuel_price,

            commodity_price=commodity_price,

            port_congestion=port_congestion,

            demand_index=demand_index,

            supply_index=supply_index,

            days=forecast_days

        )

    st.session_state.forecast_df = result

    st.session_state.scenario_forecast = None


if st.session_state.forecast_df is None:

    st.info(
        "Configure your shipment scenario in the sidebar "
        "and click **RUN AI FORECAST**."
    )

    st.stop()


forecast_df = (
    st.session_state.forecast_df
)


# ============================================================
# FORECAST METRICS
# ============================================================

average_rate = float(
    forecast_df[
        "predicted_freight_rate"
    ].mean()
)

minimum_rate = float(
    forecast_df[
        "predicted_freight_rate"
    ].min()
)

maximum_rate = float(
    forecast_df[
        "predicted_freight_rate"
    ].max()
)

forecast_trend = get_trend(
    forecast_df[
        "predicted_freight_rate"
    ]
)


# ============================================================
# TOP KPI CARDS
# ============================================================

st.markdown(
    '<div class="section-title">'
    'Executive Snapshot'
    '</div>',
    unsafe_allow_html=True
)

k1, k2, k3, k4, k5 = st.columns(5)

k1.metric(
    "AI Avg Freight",
    f"${average_rate:,.2f}/MT"
)

k2.metric(
    "Forecast Low",
    f"${minimum_rate:,.2f}"
)

k3.metric(
    "Forecast High",
    f"${maximum_rate:,.2f}"
)

k4.metric(
    "Market Trend",
    forecast_trend
)

k5.metric(
    "Forecast Horizon",
    f"{forecast_days} days"
)


# ============================================================
# 1. AI FREIGHT FORECAST
# ============================================================

st.markdown(
    '<div class="section-title">'
    '🤖 AI Freight Forecast'
    '</div>',
    unsafe_allow_html=True
)

forecast_chart = px.line(
    forecast_df,
    x="date",
    y="predicted_freight_rate",
    markers=True,
    title="Predicted Freight Rate"
)

forecast_chart.update_layout(
    xaxis_title="Date",
    yaxis_title="Freight Rate ($/MT)",
    hovermode="x unified"
)

st.plotly_chart(
    forecast_chart,
    use_container_width=True
)

with st.expander(
    "View detailed forecast table"
):

    st.dataframe(
        forecast_df,
        use_container_width=True,
        hide_index=True
    )


# ============================================================
# 2. WHAT-IF SIMULATOR
# ============================================================

st.markdown(
    '<div class="section-title">'
    '🔮 What-If Voyage Simulator'
    '</div>',
    unsafe_allow_html=True
)

w1, w2, w3, w4, w5 = st.columns(5)

with w1:

    fuel_delta = st.slider(
        "Fuel Δ%",
        -30,
        30,
        0
    )

with w2:

    congestion_delta = st.slider(
        "Congestion Δ%",
        -30,
        30,
        0
    )

with w3:

    demand_delta = st.slider(
        "Demand Δ%",
        -30,
        30,
        0
    )

with w4:

    supply_delta = st.slider(
        "Supply Δ%",
        -30,
        30,
        0
    )

with w5:

    commodity_delta = st.slider(
        "Commodity Δ%",
        -30,
        30,
        0
    )


if st.button(
    "🧪 RUN WHAT-IF SCENARIO",
    use_container_width=True
):

    scenario_result = forecast_freight(

        origin,

        destination,

        cargo,

        vessel,

        quantity,

        fuel_price *
        (1 + fuel_delta / 100),

        commodity_price *
        (1 + commodity_delta / 100),

        np.clip(
            port_congestion +
            congestion_delta,
            0,
            100
        ),

        np.clip(
            demand_index +
            demand_delta,
            0,
            100
        ),

        np.clip(
            supply_index +
            supply_delta,
            0,
            100
        ),

        forecast_days
    )

    st.session_state.scenario_forecast = (
        scenario_result
    )


if st.session_state.scenario_forecast is not None:

    scenario_df = (
        st.session_state.scenario_forecast
    )

    scenario_average = float(
        scenario_df[
            "predicted_freight_rate"
        ].mean()
    )

    scenario_change = (
        scenario_average -
        average_rate
    )

    s1, s2, s3 = st.columns(3)

    s1.metric(
        "Base Forecast",
        f"${average_rate:.2f}/MT"
    )

    s2.metric(
        "Scenario Forecast",
        f"${scenario_average:.2f}/MT"
    )

    s3.metric(
        "Scenario Impact",
        f"${scenario_change:+.2f}/MT"
    )

    comparison = (
        forecast_df[
            ["date", "predicted_freight_rate"]
        ]
        .rename(
            columns={
                "predicted_freight_rate":
                "Base"
            }
        )
        .merge(

            scenario_df[
                ["date", "predicted_freight_rate"]
            ].rename(

                columns={
                    "predicted_freight_rate":
                    "Scenario"
                }

            ),

            on="date"

        )
    )

    comparison_long = comparison.melt(
        id_vars="date",
        value_vars=[
            "Base",
            "Scenario"
        ],
        var_name="Series",
        value_name="Freight Rate"
    )

    st.plotly_chart(

        px.line(
            comparison_long,
            x="date",
            y="Freight Rate",
            color="Series",
            markers=True,
            title="Base vs What-If Forecast"
        ),

        use_container_width=True
    )


# ============================================================
# 3. CHARTERSENSE
# ============================================================

st.markdown(
    '<div class="section-title">'
    '⚓ CharterSense'
    '</div>',
    unsafe_allow_html=True
)

market_pressure = (

    "HIGH"

    if demand_index - supply_index >= 15

    else "MODERATE"

    if demand_index - supply_index >= 5

    else "LOW"
)


if forecast_trend == "RISING":

    charter_signal = (
        "Forecast is rising. Review charter timing "
        "before market conditions become less favorable."
    )

elif forecast_trend == "DECLINING":

    charter_signal = (
        "Forecast is declining. The scenario indicates "
        "greater timing flexibility."
    )

else:

    charter_signal = (
        "Forecast is stable. Compare charter timing "
        "against operational constraints."
    )


c1, c2, c3 = st.columns(3)

c1.metric(
    "Market Pressure",
    market_pressure
)

c2.metric(
    "Forecast Trend",
    forecast_trend
)

c3.metric(
    "Selected Vessel",
    vessel
)

st.info(charter_signal)


# ============================================================
# 4. PROCURESENSE
# ============================================================

st.markdown(
    '<div class="section-title">'
    '📦 ProcureSense'
    '</div>',
    unsafe_allow_html=True
)

spot_percentage = st.slider(
    "Spot Exposure %",
    0,
    100,
    50,
    5
)

procurement_df = procurement_analysis(
    average_rate,
    spot_percentage
)

p1, p2, p3 = st.columns(3)

p1.metric(
    "Spot Estimate",
    f"${procurement_df.iloc[0]['Estimated Rate']:.2f}/MT"
)

p2.metric(
    "Contract Estimate",
    f"${procurement_df.iloc[1]['Estimated Rate']:.2f}/MT"
)

p3.metric(
    "Hybrid Estimate",
    f"${procurement_df.iloc[2]['Estimated Rate']:.2f}/MT"
)

st.plotly_chart(

    px.bar(
        procurement_df,
        x="Strategy",
        y="Estimated Rate",
        text_auto=".2f",
        title="Illustrative Procurement Strategy"
    ),

    use_container_width=True
)


# ============================================================
# 5. RISKRADAR
# ============================================================

st.markdown(
    '<div class="section-title">'
    '🚨 RiskRadar'
    '</div>',
    unsafe_allow_html=True
)

forecast_volatility = float(
    forecast_df[
        "predicted_freight_rate"
    ].std()
)

forecast_range_percent = (

    (
        maximum_rate -
        minimum_rate
    )
    /
    max(average_rate, 1)
    *
    100

)

volatility_score = np.clip(
    forecast_volatility * 10,
    0,
    100
)

range_score = np.clip(
    forecast_range_percent * 2,
    0,
    100
)

overall_risk_score = calculate_risk(

    fuel=min(
        100,
        fuel_price / 9
    ),

    congestion=port_congestion,

    demand=demand_index,

    supply=supply_index,

    volatility=volatility_score,

    forecast_range=range_score

)

risk_level = get_risk_level(
    overall_risk_score
)


risk_df = pd.DataFrame({

    "Risk": [
        "Fuel",
        "Congestion",
        "Demand/Supply",
        "Forecast Volatility",
        "Forecast Range"
    ],

    "Score": [

        min(
            100,
            fuel_price / 9
        ),

        port_congestion,

        abs(
            demand_index -
            supply_index
        ),

        volatility_score,

        range_score
    ]

})


r1, r2 = st.columns([1, 2])

with r1:

    st.metric(
        "Risk Score",
        f"{overall_risk_score:.1f}/100"
    )

    st.metric(
        "Risk Level",
        risk_level
    )

with r2:

    st.plotly_chart(

        px.bar(
            risk_df,
            x="Risk",
            y="Score",
            range_y=[0, 100],
            title="RiskRadar Components"
        ),

        use_container_width=True
    )


# ============================================================
# 6. VESSELMATCH
# ============================================================

st.markdown(
    '<div class="section-title">'
    '🚢 VesselMatch'
    '</div>',
    unsafe_allow_html=True
)

vessel_df = vessel_matching(
    quantity,
    cargo,
    port_congestion
)

st.dataframe(
    vessel_df,
    use_container_width=True,
    hide_index=True
)

selected_vessel_score = float(

    vessel_df.loc[
        vessel_df["Vessel"] == vessel,
        "Match Score"
    ].iloc[0]

)

st.metric(
    f"{vessel} Match Score",
    f"{selected_vessel_score:.1f}/100"
)


# ============================================================
# 7. VOYAGE DIGITAL TWIN
# ============================================================

st.markdown(
    '<div class="section-title">'
    '🌐 Voyage Digital Twin'
    '</div>',
    unsafe_allow_html=True
)

voyage = calculate_voyage(

    origin,

    destination,

    vessel,

    quantity,

    fuel_price,

    port_congestion,

    average_rate
)


v1, v2, v3, v4 = st.columns(4)

v1.metric(
    "Route Distance",
    f"{voyage['distance']:,} km"
)

v2.metric(
    "Sailing Time",
    f"{voyage['sailing_days']:.1f} days"
)

v3.metric(
    "Congestion Delay",
    f"{voyage['congestion_delay']:.1f} days"
)

v4.metric(
    "Total Journey",
    f"{voyage['total_days']:.1f} days"
)


voyage_cost_df = pd.DataFrame({

    "Component": [
        "Freight",
        "Fuel"
    ],

    "Cost": [
        voyage["freight_cost"],
        voyage["fuel_cost"]
    ]

})


st.plotly_chart(

    px.pie(
        voyage_cost_df,
        names="Component",
        values="Cost",
        title="Estimated Voyage Cost Exposure"
    ),

    use_container_width=True
)

st.metric(
    "Total Operational Exposure",
    f"${voyage['total_exposure']:,.0f}"
)


# ============================================================
# 8. PORT INTELLIGENCE
# ============================================================

st.markdown(
    '<div class="section-title">'
    '🏗️ Port Intelligence'
    '</div>',
    unsafe_allow_html=True
)

port = PORT_INFO[destination]

turnaround_time = (
    port["turn"]
    *
    (1 + port_congestion / 100)
)

berth_pressure = np.clip(

    100 -
    port["berth"] +
    port_congestion,

    0,
    100
)

port_efficiency = np.mean([

    port["berth"],
    port["draft"],
    port["bulk"],
    port["connect"]

])


pi1, pi2, pi3, pi4 = st.columns(4)

pi1.metric(
    "Estimated Turnaround",
    f"{turnaround_time:.1f} days"
)

pi2.metric(
    "Berth Pressure",
    f"{berth_pressure:.0f}/100"
)

pi3.metric(
    "Port Efficiency",
    f"{port_efficiency:.0f}/100"
)

pi4.metric(
    "Congestion",
    f"{port_congestion}/100"
)


port_df = pd.DataFrame({

    "Metric": [
        "Berth Efficiency",
        "Draft Suitability",
        "Bulk Handling",
        "Connectivity"
    ],

    "Score": [
        port["berth"],
        port["draft"],
        port["bulk"],
        port["connect"]
    ]

})


st.plotly_chart(

    px.bar(
        port_df,
        x="Metric",
        y="Score",
        range_y=[0, 100],
        title=f"{destination} Port Intelligence"
    ),

    use_container_width=True
)


# ============================================================
# 9. DECISION HUB
# ============================================================

st.markdown(
    '<div class="section-title">'
    '🧠 Decision Hub'
    '</div>',
    unsafe_allow_html=True
)

st.write(
    "An integrated executive view combining the freight forecast, "
    "market pressure, risk, vessel suitability, voyage exposure "
    "and port intelligence."
)


# ============================================================
# DECISION INDEX
# ============================================================

decision_index = np.clip(

    0.25 * selected_vessel_score

    +

    0.20 * (
        100 -
        overall_risk_score
    )

    +

    0.20 * port_efficiency

    +

    0.15 * (
        100 -
        min(
            100,
            forecast_range_percent * 2
        )
    )

    +

    0.20 * (
        100 -
        min(
            100,
            abs(
                demand_index -
                supply_index
            ) * 2
        )
    ),

    0,
    100

)


# ============================================================
# DECISION HUB HERO
# ============================================================

dh1, dh2 = st.columns([1, 2])

with dh1:

    st.markdown(

        f"""
        <div class="decision-card">

            <div class="decision-label">
                PORTWISE PROTOTYPE DECISION INDEX
            </div>

            <div class="decision-score">
                {decision_index:.0f}
                <span style="font-size:20px;">
                    /100
                </span>
            </div>

            <div class="decision-label">
                Integrated scenario indicator
            </div>

        </div>
        """,

        unsafe_allow_html=True
    )


with dh2:

    d1, d2, d3 = st.columns(3)

    d1.metric(
        "Freight",
        f"${average_rate:.2f}/MT"
    )

    d2.metric(
        "Risk",
        f"{overall_risk_score:.0f}/100"
    )

    d3.metric(
        "Vessel Fit",
        f"{selected_vessel_score:.0f}/100"
    )

    d4, d5, d6 = st.columns(3)

    d4.metric(
        "Port Efficiency",
        f"{port_efficiency:.0f}/100"
    )

    d5.metric(
        "Voyage",
        f"{voyage['total_days']:.1f} days"
    )

    d6.metric(
        "Market Pressure",
        market_pressure
    )


# ============================================================
# DECISION SIGNALS
# ============================================================

st.subheader(
    "🔎 Decision Signals"
)

signals = []


if forecast_trend == "RISING":

    signals.append(
        (
            "Freight Trend",
            "Forecast is rising under the selected assumptions."
        )
    )

elif forecast_trend == "DECLINING":

    signals.append(
        (
            "Freight Trend",
            "Forecast is declining under the selected assumptions."
        )
    )

else:

    signals.append(
        (
            "Freight Trend",
            "Forecast is relatively stable."
        )
    )


if market_pressure == "HIGH":

    signals.append(
        (
            "Market Pressure",
            "Demand is materially above supply in this scenario."
        )
    )

elif market_pressure == "MODERATE":

    signals.append(
        (
            "Market Pressure",
            "Demand/supply conditions indicate moderate pressure."
        )
    )

else:

    signals.append(
        (
            "Market Pressure",
            "Demand/supply conditions indicate comparatively lower pressure."
        )
    )


if selected_vessel_score >= 75:

    signals.append(
        (
            "Vessel Fit",
            f"{vessel} has a strong prototype fit for the selected shipment."
        )
    )

elif selected_vessel_score >= 55:

    signals.append(
        (
            "Vessel Fit",
            f"{vessel} has a moderate prototype fit for the selected shipment."
        )
    )

else:

    signals.append(
        (
            "Vessel Fit",
            f"{vessel} has a lower prototype fit for this shipment."
        )
    )


if berth_pressure >= 60:

    signals.append(
        (
            "Port Pressure",
            f"{destination} has elevated illustrative berth pressure."
        )
    )

else:

    signals.append(
        (
            "Port Pressure",
            f"{destination} has comparatively lower illustrative berth pressure."
        )
    )


if overall_risk_score >= 70:

    signals.append(
        (
            "Risk",
            "Multiple variables indicate elevated exposure."
        )
    )

elif overall_risk_score >= 40:

    signals.append(
        (
            "Risk",
            "The scenario shows moderate exposure."
        )
    )

else:

    signals.append(
        (
            "Risk",
            "The scenario is in the lower prototype risk band."
        )
    )


for title, message in signals:

    st.markdown(

        f"""
        <div class="signal-card">

            <div class="signal-title">
                {title}
            </div>

            <div class="signal-text">
                {message}
            </div>

        </div>
        """,

        unsafe_allow_html=True
    )


# ============================================================
# EXECUTIVE DECISION MATRIX
# ============================================================

st.subheader(
    "📋 Executive Decision Matrix"
)

decision_matrix = pd.DataFrame({

    "Dimension": [

        "Freight Forecast",
        "Market Pressure",
        "Risk",
        "Vessel Fit",
        "Port Efficiency",
        "Voyage Duration",
        "Operational Exposure",
        "Procurement Mix"

    ],

    "Current Value": [

        f"${average_rate:.2f}/MT",

        market_pressure,

        f"{overall_risk_score:.0f}/100",

        f"{selected_vessel_score:.0f}/100",

        f"{port_efficiency:.0f}/100",

        f"{voyage['total_days']:.1f} days",

        f"${voyage['total_exposure']:,.0f}",

        f"{spot_percentage:.0f}% spot"

    ],

    "Interpretation": [

        forecast_trend,

        "Demand vs Supply",

        risk_level,

        vessel,

        destination,

        "Sailing + delay + buffer",

        "Freight + fuel",

        "Illustrative procurement mix"

    ]

})


st.dataframe(
    decision_matrix,
    use_container_width=True,
    hide_index=True
)


# ============================================================
# WHAT-IF IMPACT INSIDE DECISION HUB
# ============================================================

if st.session_state.scenario_forecast is not None:

    st.subheader(
        "🧪 Scenario Impact"
    )

    scenario_average = float(

        st.session_state
        .scenario_forecast[
            "predicted_freight_rate"
        ]
        .mean()

    )

    impact = (
        scenario_average -
        average_rate
    )

    sc1, sc2, sc3 = st.columns(3)

    sc1.metric(
        "Base",
        f"${average_rate:.2f}/MT"
    )

    sc2.metric(
        "What-If",
        f"${scenario_average:.2f}/MT"
    )

    sc3.metric(
        "Impact",
        f"${impact:+.2f}/MT"
    )


# ============================================================
# EXPORT EXECUTIVE DATA
# ============================================================

st.subheader(
    "📥 Export"
)

executive_export = pd.DataFrame({

    "Metric": [

        "Origin",
        "Destination",
        "Cargo",
        "Vessel",
        "Quantity MT",
        "Forecast Horizon",
        "Average Freight Rate",
        "Forecast Trend",
        "Risk Score",
        "Risk Level",
        "Vessel Match Score",
        "Port Efficiency",
        "Voyage Duration",
        "Fuel Cost",
        "Freight Cost",
        "Total Operational Exposure",
        "Decision Index"

    ],

    "Value": [

        origin,
        destination,
        cargo,
        vessel,
        quantity,
        forecast_days,
        round(average_rate, 2),
        forecast_trend,
        round(overall_risk_score, 2),
        risk_level,
        round(selected_vessel_score, 2),
        round(port_efficiency, 2),
        round(voyage["total_days"], 2),
        round(voyage["fuel_cost"], 2),
        round(voyage["freight_cost"], 2),
        round(voyage["total_exposure"], 2),
        round(decision_index, 2)

    ]

})


export_csv = (
    executive_export
    .to_csv(index=False)
    .encode("utf-8")
)


st.download_button(

    "📊 Download Executive Decision Report",

    export_csv,

    "PORTWISE_AI_Decision_Hub.csv",

    "text/csv",

    use_container_width=True

)


# ============================================================
# SYSTEM STATUS
# ============================================================

st.divider()

st.subheader(
    "🛰️ PORTWISE AI System Status"
)

status1, status2, status3, status4 = st.columns(4)

status1.success(
    "Forecast Engine: ONLINE"
)

status2.success(
    "XGBoost Model: LOADED"
)

status3.success(
    "Scenario Engine: ONLINE"
)

status4.success(
    "Decision Hub: ONLINE"
)


# ============================================================
# FOOTER
# ============================================================

st.markdown(
    """
    <div style="
        text-align:center;
        color:#64748b;
        padding:25px;
        font-size:12px;
    ">

        PORTWISE AI • Intelligent Freight Forecasting
        & Maritime Decision Intelligence

        <br><br>

        Hackathon prototype — forecasting, port,
        vessel and cost assumptions are illustrative.

    </div>
    """,
    unsafe_allow_html=True
)
