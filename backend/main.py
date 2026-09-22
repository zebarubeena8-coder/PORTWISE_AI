from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import os
import sys
import numpy as np
import urllib.request
import json
import time


# ============================================================
# PROJECT PATH
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


# ============================================================
# FORECAST ENGINE
# ============================================================

from src.forecast import forecast_freight


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="PORTWISE AI API",
    description=(
        "Intelligent Freight Forecasting "
        "and Maritime Decision Support API"
    ),
    version="5.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# PORTWISE CONFIGURATION
# ============================================================

EAST_COAST_PORTS = [
    "Paradip",
    "Visakhapatnam",
    "Kakinada",
    "Chennai",
    "Krishnapatnam"
]

VESSEL_TYPES = [
    "Handysize",
    "Handymax",
    "Supramax",
    "Panamax",
    "Capesize"
]


# ============================================================
# PORT CONSTRAINT INTELLIGENCE
# ============================================================

PORT_CONSTRAINTS = {

    "Paradip": {
        "max_loa_m": 300,
        "max_beam_m": 46,
        "max_draft_m": 16.0,
        "constraint_source": "Paradip Port Authority",
        "source_status": "OFFICIAL_PORT_DATA",
    },

    "Visakhapatnam": {
        "max_loa_m": 240,
        "max_beam_m": 32,
        "max_draft_m": 14.5,
        "constraint_source": "Visakhapatnam Port Authority",
        "source_status": "OFFICIAL_PORT_DATA",
    },

    "Kakinada": {
        "max_loa_m": 295,
        "max_beam_m": 45,
        "max_draft_m": 14.0,
        "constraint_source": "Kakinada Seaports Ltd",
        "source_status": "OFFICIAL_PORT_DATA",
    },

    "Chennai": {
        "max_loa_m": None,
        "max_beam_m": None,
        "max_draft_m": 14.0,
        "constraint_source": "Chennai Port Authority",
        "source_status": "PARTIAL_OFFICIAL_DATA",
    },

    "Krishnapatnam": {
        "max_loa_m": 300,
        "max_beam_m": 50,
        "max_draft_m": 17.3,
        "constraint_source": "Published Krishnapatnam Port planning data",
        "source_status": "PLANNING_DATA",
    },
}


# Representative vessel planning profiles.
# These are screening profiles, NOT vessel certificates.
VESSEL_PROFILES = {

    "Handysize": {
        "loa_m": 190,
        "beam_m": 32,
        "draft_m": 10.5,
    },

    "Handymax": {
        "loa_m": 200,
        "beam_m": 32,
        "draft_m": 11.0,
    },

    "Supramax": {
        "loa_m": 200,
        "beam_m": 32,
        "draft_m": 12.0,
    },

    "Panamax": {
        "loa_m": 230,
        "beam_m": 32,
        "draft_m": 13.5,
    },

    "Capesize": {
        "loa_m": 290,
        "beam_m": 44,
        "draft_m": 16.0,
    },
}


def evaluate_port_constraint(
    port,
    vessel
):
    """
    Screen a representative vessel profile against
    published destination-port constraints.

    This is a planning screen, not a navigation,
    berth-allocation or safety clearance.
    """

    port_data = PORT_CONSTRAINTS.get(port)
    vessel_data = VESSEL_PROFILES.get(vessel)

    if not port_data or not vessel_data:
        return {
            "constraint_status": "CHECK REQUIRED",
            "constraint_score": 0,
            "constraint_reasons": [
                "Constraint data unavailable"
            ],
            "port_limits": {},
            "vessel_profile": {},
        }

    reasons = []
    checks = []
    unavailable_checks = []

    max_loa = port_data.get("max_loa_m")
    max_beam = port_data.get("max_beam_m")
    max_draft = port_data.get("max_draft_m")

    vessel_loa = vessel_data["loa_m"]
    vessel_beam = vessel_data["beam_m"]
    vessel_draft = vessel_data["draft_m"]

    # LOA check
    if max_loa is None:
        unavailable_checks.append("LOA")
    elif vessel_loa > max_loa:
        checks.append(False)
        reasons.append(
            f"LOA {vessel_loa}m exceeds "
            f"published limit {max_loa}m"
        )
    else:
        checks.append(True)

    # Beam check
    if max_beam is None:
        unavailable_checks.append("beam")
    elif vessel_beam > max_beam:
        checks.append(False)
        reasons.append(
            f"Beam {vessel_beam}m exceeds "
            f"published limit {max_beam}m"
        )
    else:
        checks.append(True)

    # Draft check
    if max_draft is None:
        unavailable_checks.append("draft")
    elif vessel_draft > max_draft:
        checks.append(False)
        reasons.append(
            f"Draft {vessel_draft}m exceeds "
            f"published limit {max_draft}m"
        )
    else:
        checks.append(True)

    # Hard incompatibility
    if False in checks:
        status = "LIMITED"

    # Missing published dimensions
    elif unavailable_checks:
        status = "CHECK REQUIRED"

    else:
        status = "SUITABLE"

    passed_checks = sum(
        1 for value in checks if value
    )

    total_available_checks = len(checks)

    if total_available_checks:
        score = round(
            (
                passed_checks /
                total_available_checks
            ) * 100
        )
    else:
        score = 0

    return {
        "constraint_status": status,
        "constraint_score": score,
        "constraint_reasons": reasons,
        "port_limits": {
            "max_loa_m": max_loa,
            "max_beam_m": max_beam,
            "max_draft_m": max_draft,
        },
        "vessel_profile": {
            "loa_m": vessel_loa,
            "beam_m": vessel_beam,
            "draft_m": vessel_draft,
        },
        "unavailable_checks":
            unavailable_checks,
        "constraint_source":
            port_data["constraint_source"],
        "source_status":
            port_data["source_status"],
    }
# ============================================================
# IDLE SCENARIO MANAGEMENT
# ============================================================

def evaluate_idle_scenario(
    demand_index,
    supply_index,
    change_percent,
    volatility
):
    """
    Operational screening for vessel employment risk.

    This combines model inputs and forecast behaviour to
    identify potential under-employment / idle-vessel risk.

    It is a decision-support heuristic, not a market forecast
    by itself.
    """

    demand = float(demand_index)
    supply = float(supply_index)
    change = float(change_percent)
    volatility_value = float(volatility)

    # --------------------------------------------------------
    # Demand-supply pressure
    # --------------------------------------------------------

    demand_supply_gap = demand - supply

    # --------------------------------------------------------
    # Idle-risk score
    # --------------------------------------------------------

    idle_score = 0

    # Weak demand
    if demand < 40:
        idle_score += 45
    elif demand < 55:
        idle_score += 25
    elif demand < 65:
        idle_score += 10

    # Excess available supply
    if supply > 75:
        idle_score += 30
    elif supply > 65:
        idle_score += 15

    # Negative freight movement
    if change <= -5:
        idle_score += 20
    elif change <= -2:
        idle_score += 10

    # Higher volatility increases employment uncertainty
    if volatility_value >= 5:
        idle_score += 15
    elif volatility_value >= 3:
        idle_score += 8

    idle_score = min(
        idle_score,
        100
    )

    # --------------------------------------------------------
    # Employment classification
    # --------------------------------------------------------

    if idle_score >= 70:

        status = "HIGH IDLE RISK"

        action = (
            "Prioritize alternate employment "
            "or vessel repositioning."
        )

        positioning = (
            "Evaluate nearby cargo opportunities "
            "before committing to a new spot voyage."
        )

    elif idle_score >= 40:

        status = "IDLE RISK"

        action = (
            "Review alternative cargo or "
            "short-term employment options."
        )

        positioning = (
            "Monitor demand and avoid unnecessary "
            "ballast positioning."
        )

    else:

        status = "EMPLOYMENT STABLE"

        action = (
            "Current demand conditions support "
            "normal vessel employment."
        )

        positioning = (
            "Maintain planned voyage positioning "
            "while monitoring market changes."
        )

    # --------------------------------------------------------
    # Supporting factors
    # --------------------------------------------------------

    factors = []

    if demand < 55:
        factors.append(
            "Demand index is below normal operating range"
        )

    if supply > 65:
        factors.append(
            "Available vessel supply is elevated"
        )

    if change <= -2:
        factors.append(
            "Forecast freight movement is declining"
        )

    if volatility_value >= 3:
        factors.append(
            "Freight volatility is elevated"
        )

    if not factors:
        factors.append(
            "No major idle-employment pressure detected"
        )

    return {

        "status":
            status,

        "idle_score":
            idle_score,

        "demand_supply_gap":
            round(
                demand_supply_gap,
                2
            ),

        "recommended_action":
            action,

        "positioning_guidance":
            positioning,

        "factors":
            factors
    }

# ============================================================
# FX RATE CACHE
# ============================================================

_fx_cache = {
    "rate": None,
    "timestamp": 0
}

FX_CACHE_SECONDS = 900


def get_usd_inr_rate():
    """
    USD -> INR conversion.

    Priority:
    1. PORTWISE_USDINR_RATE environment variable
    2. Public FX API
    3. Cached value
    4. Safe fallback

    The response explicitly identifies the source.
    """

    # --------------------------------------------------------
    # 1. Environment override
    # --------------------------------------------------------

    configured_rate = os.getenv(
        "PORTWISE_USDINR_RATE"
    )

    if configured_rate:

        try:
            rate = float(configured_rate)

            if rate > 0:
                return {
                    "rate": rate,
                    "source": "CONFIGURED",
                    "status": "CONFIGURED"
                }

        except ValueError:
            pass

    # --------------------------------------------------------
    # 2. Cached rate
    # --------------------------------------------------------

    current_time = time.time()

    if (
        _fx_cache["rate"] is not None
        and
        current_time - _fx_cache["timestamp"]
        < FX_CACHE_SECONDS
    ):

        return {
            "rate": _fx_cache["rate"],
            "source": "PUBLIC_FX_API_CACHE",
            "status": "LIVE_CACHE"
        }

    # --------------------------------------------------------
    # 3. Public FX API
    # --------------------------------------------------------

    try:

        url = (
            "https://open.er-api.com/v6/latest/USD"
        )

        request = urllib.request.Request(
            url,
            headers={
                "User-Agent":
                    "PORTWISE-AI/5.0"
            }
        )

        with urllib.request.urlopen(
            request,
            timeout=5
        ) as response:

            data = json.loads(
                response.read().decode("utf-8")
            )

        rate = float(
            data["rates"]["INR"]
        )

        if rate > 0:

            _fx_cache["rate"] = rate
            _fx_cache["timestamp"] = current_time

            return {
                "rate": rate,
                "source": "PUBLIC_FX_API",
                "status": "LIVE"
            }

    except Exception:
        pass

    # --------------------------------------------------------
    # 4. Safe fallback
    # --------------------------------------------------------

    return {
        "rate": 88.0,
        "source": "FALLBACK_CONFIGURATION",
        "status": "FALLBACK"
    }


# ============================================================
# FORECAST REQUEST
# ============================================================

class ForecastRequest(BaseModel):

    origin: str

    origin_port: Optional[str] = None

    destination_country: str = "India"

    destination: str

    cargo: str

    vessel: str

    quantity: float = Field(
        gt=0
    )

    horizon: int = Field(
        ge=1,
        le=90
    )

    # --------------------------------------------------------
    # Market variables
    # --------------------------------------------------------

    fuel_price: float = Field(
        default=650,
        gt=0
    )

    commodity_price: float = Field(
        default=120,
        gt=0
    )

    port_congestion: float = Field(
        default=40,
        ge=0,
        le=100
    )

    demand_index: float = Field(
        default=75,
        ge=0,
        le=100
    )

    supply_index: float = Field(
        default=60,
        ge=0,
        le=100
    )


# ============================================================
# WHAT-IF REQUEST
# ============================================================

class ScenarioRequest(ForecastRequest):

    # Values sent by the frontend sliders.
    #
    # These are multipliers:
    #
    # 1.00 = baseline
    # 1.10 = +10%
    # 0.90 = -10%
    #
    fuel_scenario: float = Field(
        default=1.0,
        ge=0.5,
        le=1.5
    )

    port_scenario: float = Field(
        default=1.0,
        ge=0.0,
        le=2.0
    )

    demand_scenario: float = Field(
        default=1.0,
        ge=0.5,
        le=1.5
    )


# ============================================================
# STATUS CALCULATION
# ============================================================

def calculate_status(
    change_percent,
    volatility
):

    if (
        change_percent <= -3
        and
        volatility < 3
    ):

        return {
            "label": "FREIGHT ADVANTAGE",
            "color": "green",
            "description": (
                "Forecast indicates a potentially "
                "more favorable freight environment."
            )
        }

    if (
        change_percent >= 3
        or
        volatility >= 5
    ):

        return {
            "label": "COST ALERT",
            "color": "red",
            "description": (
                "Forecast indicates rising freight "
                "cost pressure or elevated volatility."
            )
        }

    return {
        "label": "MARKET WATCH",
        "color": "yellow",
        "description": (
            "Forecast conditions are within "
            "a monitoring range."
        )
    }


# ============================================================
# COMMON FORECAST FUNCTION
# ============================================================

def run_forecast(request):

    forecast_df = forecast_freight(

        origin=request.origin,

        destination=request.destination,

        cargo=request.cargo,

        vessel_type=request.vessel,

        quantity_mt=request.quantity,

        fuel_price=request.fuel_price,

        commodity_price=request.commodity_price,

        port_congestion=request.port_congestion,

        demand_index=request.demand_index,

        supply_index=request.supply_index,

        days=request.horizon
    )

    if forecast_df.empty:

        raise ValueError(
            "Forecast engine returned no predictions."
        )

    forecast_values = (
        forecast_df[
            "predicted_freight_rate"
        ]
        .astype(float)
        .tolist()
    )

    current_rate = float(
        forecast_values[0]
    )

    forecast_rate = float(
        np.mean(forecast_values)
    )

    minimum_rate = float(
        np.min(forecast_values)
    )

    maximum_rate = float(
        np.max(forecast_values)
    )

    # --------------------------------------------------------
    # Forecast movement
    # --------------------------------------------------------

    if current_rate != 0:

        change_percent = (
            (
                forecast_rate
                -
                current_rate
            )
            /
            current_rate
        ) * 100

    else:

        change_percent = 0.0

    # --------------------------------------------------------
    # Volatility
    # --------------------------------------------------------

    if len(forecast_values) > 1:

        volatility = float(
            np.std(
                forecast_values,
                ddof=1
            )
        )

    else:

        volatility = 0.0

    if np.isnan(volatility):

        volatility = 0.0

    # --------------------------------------------------------
    # Decision
    # --------------------------------------------------------

    decision = calculate_status(
        change_percent,
        volatility
    )

    # --------------------------------------------------------
    # Exposure
    # --------------------------------------------------------

    forecast_total = (
        forecast_rate
        *
        request.quantity
    )

    first_day_total = (
        current_rate
        *
        request.quantity
    )

    exposure_difference = (
        forecast_total
        -
        first_day_total
    )

    # --------------------------------------------------------
    # USD forecast series
    # --------------------------------------------------------

    forecast_series = [

        {
            "date":
                row["date"].strftime(
                    "%Y-%m-%d"
                ),

            "rate":
                round(
                    float(
                        row[
                            "predicted_freight_rate"
                        ]
                    ),
                    2
                )
        }

        for _, row
        in forecast_df.iterrows()
    ]

    # --------------------------------------------------------
    # FX
    # --------------------------------------------------------

    fx = get_usd_inr_rate()

    usd_to_inr = fx["rate"]

    # --------------------------------------------------------
    # INR conversion
    # --------------------------------------------------------

    current_rate_inr = (
        current_rate
        *
        usd_to_inr
    )

    forecast_rate_inr = (
        forecast_rate
        *
        usd_to_inr
    )

    minimum_rate_inr = (
        minimum_rate
        *
        usd_to_inr
    )

    maximum_rate_inr = (
        maximum_rate
        *
        usd_to_inr
    )

    forecast_total_inr = (
        forecast_total
        *
        usd_to_inr
    )

    first_day_total_inr = (
        first_day_total
        *
        usd_to_inr
    )

    exposure_difference_inr = (
        exposure_difference
        *
        usd_to_inr
    )

    # --------------------------------------------------------
    # INR forecast series
    # --------------------------------------------------------

    forecast_series_inr = [

        {
            "date":
                item["date"],

            "rate":
                round(
                    item["rate"]
                    *
                    usd_to_inr,
                    2
                )
        }

        for item
        in forecast_series
    ]

    return {

        "forecast_df":
            forecast_df,

        "forecast_values":
            forecast_values,

        "current_rate":
            current_rate,

        "forecast_rate":
            forecast_rate,

        "minimum_rate":
            minimum_rate,

        "maximum_rate":
            maximum_rate,

        "change_percent":
            change_percent,

        "volatility":
            volatility,

        "decision":
            decision,

        "forecast_total":
            forecast_total,

        "first_day_total":
            first_day_total,

        "exposure_difference":
            exposure_difference,

        "forecast_series":
            forecast_series,

        "fx":
            fx,

        "current_rate_inr":
            current_rate_inr,

        "forecast_rate_inr":
            forecast_rate_inr,

        "minimum_rate_inr":
            minimum_rate_inr,

        "maximum_rate_inr":
            maximum_rate_inr,

        "forecast_total_inr":
            forecast_total_inr,

        "first_day_total_inr":
            first_day_total_inr,

        "exposure_difference_inr":
            exposure_difference_inr,

        "forecast_series_inr":
            forecast_series_inr
    }


# ============================================================
# FORWARD / FUTURES MARKET STATUS
# ============================================================

def get_forward_market_status():

    """
    PORTWISE never fabricates forward/futures prices.

    Real authenticated market data can be connected later
    through the PORTWISE market connector.
    """

    market_sources = {

        "Capesize":
            os.getenv(
                "PORTWISE_FFA_CAPESIZE"
            ),

        "Panamax":
            os.getenv(
                "PORTWISE_FFA_PANAMAX"
            ),

        "Supramax":
            os.getenv(
                "PORTWISE_FFA_SUPRAMAX"
            ),

        "Handysize":
            os.getenv(
                "PORTWISE_FFA_HANDYSIZE"
            )
    }

    available = {

        vessel: value

        for vessel, value
        in market_sources.items()

        if value
    }

    if available:

        return {

            "status":
                "CONFIGURED",

            "label":
                "FORWARD MARKET CONNECTED",

            "source":
                "Configured market feed",

            "prices":
                available,

            "message":
                (
                    "Forward market values supplied "
                    "through the PORTWISE market connector."
                )
        }

    return {

        "status":
            "NOT_CONNECTED",

        "label":
            "FORWARD MARKET NOT CONNECTED",

        "source":
            None,

        "prices":
            {},

        "message":
            (
                "No authenticated forward/futures "
                "market feed is connected. PORTWISE "
                "does not fabricate market prices."
            )
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "status":
            "online",

        "service":
            "PORTWISE AI",

        "version":
            "5.0.0",

        "model":
            "XGBoost",

        "forecast_engine":
            "active",

        "currency":
            "INR",

        "base_currency":
            "USD"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    fx = get_usd_inr_rate()

    return {

        "status":
            "healthy",

        "model":
            "XGBoost",

        "forecast_engine":
            "active",

        "currency":
            "INR",

        "fx_status":
            fx["status"],

        "fx_source":
            fx["source"]
    }


# ============================================================
# FORECAST
# ============================================================

@app.post("/api/forecast")
def generate_forecast(
    request: ForecastRequest
):

    try:

        result = run_forecast(
            request
        )

        return {

            "success":
                True,

            # ------------------------------------------------
            # ROUTE
            # ------------------------------------------------

            "route": {

                "origin_country":
                    request.origin,

                "origin_port":
                    request.origin_port,

                "destination_country":
                    request.destination_country,

                "destination_port":
                    request.destination,

                "region":
                    "East Coast India"
            },

            # ------------------------------------------------
            # CARGO
            # ------------------------------------------------

            "cargo": {

                "type":
                    request.cargo,

                "quantity":
                    request.quantity,

                "unit":
                    "MT"
            },

            "vessel":
                request.vessel,

            # ------------------------------------------------
            # FORECAST
            # ------------------------------------------------

            "forecast": {

                "current_rate":
                    round(
                        result["current_rate"],
                        2
                    ),

                "forecast_rate":
                    round(
                        result["forecast_rate"],
                        2
                    ),

                "minimum_rate":
                    round(
                        result["minimum_rate"],
                        2
                    ),

                "maximum_rate":
                    round(
                        result["maximum_rate"],
                        2
                    ),

                "current_rate_inr":
                    round(
                        result["current_rate_inr"],
                        2
                    ),

                "forecast_rate_inr":
                    round(
                        result["forecast_rate_inr"],
                        2
                    ),

                "minimum_rate_inr":
                    round(
                        result["minimum_rate_inr"],
                        2
                    ),

                "maximum_rate_inr":
                    round(
                        result["maximum_rate_inr"],
                        2
                    ),

                "change_percent":
                    round(
                        result["change_percent"],
                        2
                    ),

                "currency":
                    "USD",

                "display_currency":
                    "INR",

                "unit":
                    "MT",

                "fx_rate":
                    round(
                        result["fx"]["rate"],
                        4
                    ),

                "fx_source":
                    result["fx"]["source"],

                "fx_status":
                    result["fx"]["status"]
            },

            # ------------------------------------------------
            # RISK
            # ------------------------------------------------
"risk": {

    "volatility":
        round(
            result["volatility"],
            2
        ),

    "level":
        (
            "High"
            if (
                result["volatility"] >= 2
                or abs(result["change_percent"]) >= 4
                or request.port_congestion >= 85
                or request.demand_index <= 35
                or request.supply_index >= 85
            )

            else
            "Moderate"
            if (
                result["volatility"] >= 1
                or abs(result["change_percent"]) >= 2
                or request.port_congestion >= 70
                or request.demand_index <= 50
                or request.supply_index >= 75
            )

            else
            "Low"
        )
},
                        # ------------------------------------------------
            # IDLE SCENARIO MANAGEMENT
            # ------------------------------------------------

            "idle_scenario":
                evaluate_idle_scenario(
                    demand_index=
                        request.demand_index,

                    supply_index=
                        request.supply_index,

                    change_percent=
                        result["change_percent"],

                    volatility=
                        result["volatility"]
                ),

            # ------------------------------------------------
            # DECISION
            # ------------------------------------------------

            "decision": {

                "status":
                    result[
                        "decision"
                    ][
                        "label"
                    ],

                "color":
                    result[
                        "decision"
                    ][
                        "color"
                    ],

                "description":
                    result[
                        "decision"
                    ][
                        "description"
                    ]
            },

            # ------------------------------------------------
            # EXPOSURE
            # ------------------------------------------------

            "exposure": {

                "forecast_total":
                    round(
                        result[
                            "forecast_total"
                        ],
                        2
                    ),

                "first_day_total":
                    round(
                        result[
                            "first_day_total"
                        ],
                        2
                    ),

                "difference":
                    round(
                        result[
                            "exposure_difference"
                        ],
                        2
                    ),

                "forecast_total_inr":
                    round(
                        result[
                            "forecast_total_inr"
                        ],
                        2
                    ),

                "first_day_total_inr":
                    round(
                        result[
                            "first_day_total_inr"
                        ],
                        2
                    ),

                "difference_inr":
                    round(
                        result[
                            "exposure_difference_inr"
                        ],
                        2
                    ),

                "currency":
                    "USD",

                "display_currency":
                    "INR"
            },

            # ------------------------------------------------
            # MARKET INPUTS
            # ------------------------------------------------

            "market_inputs": {

                "fuel_price":
                    request.fuel_price,

                "commodity_price":
                    request.commodity_price,

                "port_congestion":
                    request.port_congestion,

                "demand_index":
                    request.demand_index,

                "supply_index":
                    request.supply_index
            },

            # ------------------------------------------------
            # MARKET LAYER
            # ------------------------------------------------

            "market": {

                "spot": {

                    "status":
                        "MODEL_BASED",

                    "rate_usd":
                        round(
                            result[
                                "current_rate"
                            ],
                            2
                        ),

                    "rate_inr":
                        round(
                            result[
                                "current_rate_inr"
                            ],
                            2
                        ),

                    "source":
                        "PORTWISE XGBoost"
                },

                "forward_futures":
                    get_forward_market_status()
            },

            # ------------------------------------------------
            # FORECAST GRAPH
            # ------------------------------------------------

            "forecast_series":
                result[
                    "forecast_series"
                ],

            "forecast_series_inr":
                result[
                    "forecast_series_inr"
                ]
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Forecast generation failed: "
                +
                str(error)
            )
        )


# ============================================================
# WHAT-IF SCENARIO
# ============================================================

@app.post("/api/forecast/scenario")
def forecast_scenario(
    request: ScenarioRequest
):

    try:

        # ----------------------------------------------------
        # Apply scenario multipliers
        # ----------------------------------------------------

        scenario_fuel_price = (
            request.fuel_price
            *
            request.fuel_scenario
        )

        scenario_port_congestion = (
            request.port_congestion
            *
            request.port_scenario
        )

        scenario_demand_index = (
            request.demand_index
            *
            request.demand_scenario
        )

        # Keep values inside model input limits.
        scenario_port_congestion = min(
            max(
                scenario_port_congestion,
                0
            ),
            100
        )

        scenario_demand_index = min(
            max(
                scenario_demand_index,
                0
            ),
            100
        )

        scenario_request = request.model_copy(
            update={
                "fuel_price":
                    scenario_fuel_price,

                "port_congestion":
                    scenario_port_congestion,

                "demand_index":
                    scenario_demand_index
            }
        )

        result = run_forecast(
            scenario_request
        )

        return {

            "success":
                True,

            "scenario": {

                "fuel_scenario":
                    request.fuel_scenario,

                "port_scenario":
                    request.port_scenario,

                "demand_scenario":
                    request.demand_scenario,

                "fuel_price":
                    round(
                        scenario_fuel_price,
                        2
                    ),

                "port_congestion":
                    round(
                        scenario_port_congestion,
                        2
                    ),

                "demand_index":
                    round(
                        scenario_demand_index,
                        2
                    )
            },

            "forecast": {

                "current_rate":
                    round(
                        result[
                            "current_rate"
                        ],
                        2
                    ),

                "forecast_rate":
                    round(
                        result[
                            "forecast_rate"
                        ],
                        2
                    ),

                "forecast_rate_inr":
                    round(
                        result[
                            "forecast_rate_inr"
                        ],
                        2
                    ),

                "minimum_rate":
                    round(
                        result[
                            "minimum_rate"
                        ],
                        2
                    ),

                "maximum_rate":
                    round(
                        result[
                            "maximum_rate"
                        ],
                        2
                    ),

                "change_percent":
                    round(
                        result[
                            "change_percent"
                        ],
                        2
                    )
            },

            "risk": {

    "volatility":
        round(
            result["volatility"],
            2
        ),

    "level":
        (
            "High"
            if (
                result["volatility"] >= 2
                or abs(result["change_percent"]) >= 4
                or request.port_congestion >= 85
                or request.demand_index <= 35
                or request.supply_index >= 85
            )

            else
            "Moderate"
            if (
                result["volatility"] >= 1
                or abs(result["change_percent"]) >= 2
                or request.port_congestion >= 70
                or request.demand_index <= 50
                or request.supply_index >= 75
            )

            else
            "Low"
        )
},

            "decision": {

                "status":
                    result[
                        "decision"
                    ][
                        "label"
                    ],

                "color":
                    result[
                        "decision"
                    ][
                        "color"
                    ],

                "description":
                    result[
                        "decision"
                    ][
                        "description"
                    ]
            },

            "forecast_series":
                result[
                    "forecast_series"
                ],

            "forecast_series_inr":
                result[
                    "forecast_series_inr"
                ]
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Scenario calculation failed: "
                +
                str(error)
            )
        )


# ============================================================
# VESSEL COMPARISON
# ============================================================

@app.post("/api/compare/vessels")
def compare_vessels(
    request: ForecastRequest
):

    results = []

    try:

        for vessel in VESSEL_TYPES:

            # -----------------------------------------
            # 1. Run freight forecast for this vessel
            # -----------------------------------------
            comparison_request = request.model_copy(
                update={
                    "vessel": vessel
                }
            )

            result = run_forecast(
                comparison_request
            )

            # -----------------------------------------
            # 2. Risk assessment
            # -----------------------------------------
            risk_level = (
                "High"
                if (
                    result["volatility"] >= 2
                    or abs(result["change_percent"]) >= 4
                    or request.port_congestion >= 85
                    or request.demand_index <= 35
                    or request.supply_index >= 85
                )
                else
                "Moderate"
                if (
                    result["volatility"] >= 1
                    or abs(result["change_percent"]) >= 2
                    or request.port_congestion >= 70
                    or request.demand_index <= 50
                    or request.supply_index >= 75
                )
                else
                "Low"
            )

            # -----------------------------------------
            # 3. Port infrastructure compatibility
            # -----------------------------------------
            port_result = evaluate_port_constraint(
                request.destination,
                vessel
            )

            port_fit = port_result.get(
                "constraint_status",
                "CHECK REQUIRED"
            )

            port_score = port_result.get(
                "constraint_score",
                0
            )

            port_reasons = port_result.get(
                "constraint_reasons",
                []
            )

            # -----------------------------------------
            # 4. Cargo suitability
            # -----------------------------------------
            # No vessel cargo-capacity data exists in
            # VESSEL_PROFILES, so do not invent a
            # capacity limit.
            #
            # Quantity is still passed into the XGBoost
            # forecast and therefore influences the
            # predicted freight rate.

            cargo_fit = "FORECAST COMPATIBLE"

            cargo_reason = (
                f"{format(request.quantity, ',')} MT "
                "is included in the freight forecast "
                "for this vessel scenario."
            )

            # -----------------------------------------
            # 5. Overall decision
            # -----------------------------------------
            if port_fit == "LIMITED":

                decision = "PORT LIMITED"

            elif port_fit == "CHECK REQUIRED":

                decision = "REVIEW REQUIRED"

            elif risk_level == "High":

                decision = "RISK REVIEW"

            else:

                decision = "SUITABLE"

            # -----------------------------------------
            # 6. Decision factors
            # -----------------------------------------
            factors = []

            factors.append(
                f"Forecast freight: "
                f"${result['forecast_rate']:.2f}/MT"
            )

            factors.append(
                f"Port fit: {port_fit}"
            )

            factors.append(
                f"Port constraint score: "
                f"{port_score}/100"
            )

            factors.append(
                f"Market risk: {risk_level}"
            )

            if port_reasons:

                factors.extend(
                    port_reasons
                )

            # -----------------------------------------
            # 7. Final comparison record
            # -----------------------------------------
            results.append({

                "type":
                    vessel,

                "vessel":
                    vessel,

                # Freight forecast
                "forecastRate":
                    round(
                        result["forecast_rate"],
                        2
                    ),

                "forecast_rate":
                    round(
                        result["forecast_rate"],
                        2
                    ),

                # Existing compatibility fields
                "forecastRateINR":
                    round(
                        result["forecast_rate_inr"],
                        2
                    ),

                "forecast_rate_inr":
                    round(
                        result["forecast_rate_inr"],
                        2
                    ),

                "minimum_rate":
                    round(
                        result["minimum_rate"],
                        2
                    ),

                "maximum_rate":
                    round(
                        result["maximum_rate"],
                        2
                    ),

                "change_percent":
                    round(
                        result["change_percent"],
                        2
                    ),

                "volatility":
                    round(
                        result["volatility"],
                        2
                    ),

                # Risk
                "riskLevel":
                    risk_level,

                "risk_level":
                    risk_level,

                # Cargo
                "cargo_fit":
                    cargo_fit,

                "cargo_reason":
                    cargo_reason,

                # Port intelligence
                "port_fit":
                    port_fit,

                "port_score":
                    port_score,

                "port_reasons":
                    port_reasons,

                "port_source_status":
                    port_result.get(
                        "source_status"
                    ),

                # Overall decision
                "decision":
                    decision,

                "factors":
                    factors,

                # Vessel dimensions
                "vessel_profile":
                    port_result.get(
                        "vessel_profile",
                        {}
                    )
            })

        return {

            "success":
                True,

            "currency":
                "USD",

            "display_currency":
                "INR",

            "results":
                results,

            "vessels":
                results
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Vessel comparison failed: "
                +
                str(error)
            )
        )
# ============================================================
# EAST COAST PORT COMPARISON
# ============================================================

@app.post("/api/compare/ports")
def compare_ports(
    request: ForecastRequest
):

    results = []

    try:

        for port in EAST_COAST_PORTS:

            comparison_request = request.model_copy(
                update={
                    "destination": port
                }
            )

            result = run_forecast(
                comparison_request
            )

            risk_level = (
                "High"
                if result["volatility"] >= 5
                else
                "Moderate"
                if result["volatility"] >= 3
                else
                "Low"
            )

            # ------------------------------------------------
            # PORT CONSTRAINT SCREENING
            # ------------------------------------------------

            constraint = evaluate_port_constraint(
                port=port,
                vessel=request.vessel
            )

            results.append({

                "port":
                    port,

                # Forecast values
                "forecastRate":
                    round(
                        result["forecast_rate"],
                        2
                    ),

                "forecastRateINR":
                    round(
                        result["forecast_rate_inr"],
                        2
                    ),

                "forecast_rate":
                    round(
                        result["forecast_rate"],
                        2
                    ),

                "forecast_rate_inr":
                    round(
                        result["forecast_rate_inr"],
                        2
                    ),

                "minimum_rate":
                    round(
                        result["minimum_rate"],
                        2
                    ),

                "maximum_rate":
                    round(
                        result["maximum_rate"],
                        2
                    ),

                "change_percent":
                    round(
                        result["change_percent"],
                        2
                    ),

                "volatility":
                    round(
                        result["volatility"],
                        2
                    ),

                # Risk
                "riskLevel":
                    risk_level,

                "risk_level":
                    risk_level,

                # ------------------------------------------------
                # PORT CONSTRAINT INTELLIGENCE
                # ------------------------------------------------

                "constraint_status":
                    constraint[
                        "constraint_status"
                    ],

                "constraint_score":
                    constraint[
                        "constraint_score"
                    ],

                "constraint_reasons":
                    constraint[
                        "constraint_reasons"
                    ],

                "port_limits":
                    constraint[
                        "port_limits"
                    ],

                "vessel_profile":
                    constraint[
                        "vessel_profile"
                    ],

                "unavailable_checks":
                    constraint[
                        "unavailable_checks"
                    ],

                "constraint_source":
                    constraint[
                        "constraint_source"
                    ],

                "source_status":
                    constraint[
                        "source_status"
                    ],
            })

        return {

            "success":
                True,

            "region":
                "East Coast India",

            "currency":
                "USD",

            "display_currency":
                "USD",

            "results":
                results,

            "ports":
                results
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Port comparison failed: "
                +
                str(error)
            )
        )


# ============================================================
# MARKET INFORMATION
# ============================================================

@app.get("/api/market")
def market_information():

    fx = get_usd_inr_rate()

    return {

        "success":
            True,

        "fx": {

            "usd_inr":
                round(
                    fx["rate"],
                    4
                ),

            "status":
                fx["status"],

            "source":
                fx["source"]
        },

        "forward_futures":
            get_forward_market_status(),

        "market_data_policy": {

            "live_data":
                (
                    "Only displayed when a connected "
                    "authenticated source provides it."
                ),

            "model_data":
                (
                    "Generated by PORTWISE "
                    "XGBoost model."
                ),

            "fabrication":
                (
                    "PORTWISE does not fabricate "
                    "forward/futures market prices."
                )
        }
    }


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )