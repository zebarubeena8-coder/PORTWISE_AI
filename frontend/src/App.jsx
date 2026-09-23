import React, { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

import {
  LayoutDashboard,
  TrendingUp,
  SlidersHorizontal,
  Ship,
  ShoppingCart,
  ShieldAlert,
  Anchor,
  Map,
  Target,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Gauge,
  Database,
  BrainCircuit,
  Fuel,
  Package,
  Factory,
  Globe2,
  MapPin,
  Boxes,
  Route,
} from "lucide-react";

const API_URL = "https://portwise-backend.onrender.com";

/* =========================================================
   NAVIGATION
========================================================= */

const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Freight Forecast", icon: TrendingUp },
  { name: "What-If Simulator", icon: SlidersHorizontal },
  { name: "CharterSense", icon: Ship },
  { name: "ProcureSense", icon: ShoppingCart },
  { name: "RiskRadar", icon: ShieldAlert },
  { name: "VesselMatch", icon: Anchor },
  { name: "Voyage Digital Twin", icon: Route },
  { name: "Port Intelligence", icon: Map },
  { name: "Decision Hub", icon: Target },
];

/* =========================================================
   OPTIONS
========================================================= */

const originOptions = [
  "Australia",
  "Indonesia",
  "South Africa",
  "Brazil",
  "Russia",
];

const originPortOptions = {
  Australia: [
    "Newcastle",
    "Hay Point",
    "Gladstone",
    "Port Hedland",
  ],

  Indonesia: [
    "Tanjung Bara",
    "Taboneo",
    "Muara Berau",
    "Balikpapan",
  ],

  "South Africa": [
    "Richards Bay",
    "Durban",
    "Saldanha Bay",
  ],

  Brazil: [
    "Tubarao",
    "Santos",
    "Itaguai",
    "Ponta da Madeira",
  ],

  Russia: [
    "Novorossiysk",
    "Vostochny",
    "Taman",
    "Murmansk",
  ],
};

const destinationOptions = [
  "Paradip",
  "Visakhapatnam",
  "Kakinada",
  "Chennai",
  "Krishnapatnam",
];

const cargoOptions = [
  "Coal",
  "Iron Ore",
  "Wheat",
  "Fertilizer",
  "Bauxite",
];

const vesselOptions = [
  "Handysize",
  "Handymax",
  "Supramax",
  "Panamax",
  "Capesize",
];

const horizonOptions = [7, 15, 30, 60, 90];

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(value) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `$${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `${Number(value).toFixed(2)}%`;
}

function getDecisionStatus(changePercent, riskLevel) {
  if (
    changePercent === null ||
    changePercent === undefined ||
    !Number.isFinite(Number(changePercent))
  ) {
    return {
      label: "AWAITING FORECAST",
      color: "#94a3b8",
      background: "rgba(148,163,184,0.08)",
      border: "rgba(148,163,184,0.20)",
    };
  }

  const change = Number(changePercent);

  const risk = String(riskLevel || "").toUpperCase();

  const elevatedRisk = [
    "HIGH",
    "CRITICAL",
    "VERY HIGH",
  ].includes(risk);

  // Elevated risk: caution against committing blindly
  if (elevatedRisk) {
    return {
      label: "COST ALERT",
      color: "#fb7185",
      background: "rgba(251,113,133,0.10)",
      border: "rgba(251,113,133,0.25)",
    };
  }

  // Forecast indicates a meaningful rate decline
  if (change <= -2) {
    return {
      label: "FREIGHT ADVANTAGE",
      color: "#4ade80",
      background: "rgba(74,222,128,0.10)",
      border: "rgba(74,222,128,0.25)",
    };
  }

  // Forecast indicates a meaningful rate increase
  if (change >= 2) {
    return {
      label: "RATES RISING",
      color: "#fb7185",
      background: "rgba(251,113,133,0.10)",
      border: "rgba(251,113,133,0.25)",
    };
  }

  // Small or mixed movement
  return {
    label: "MARKET WATCH",
    color: "#fbbf24",
    background: "rgba(251,191,36,0.10)",
    border: "rgba(251,191,36,0.25)",
  };
}
function getCharterPlanningSignal(horizon) {
  const days = Number(horizon);

  if (!Number.isFinite(days)) {
    return {
      type: "AWAITING INPUT",
      description:
        "Select a forecast horizon to determine the charter planning window.",
    };
  }

  if (days <= 30) {
    return {
      type: "SHORT-TERM CHARTER",
      description:
        "Forecast supports short-term charter planning over the selected horizon.",
    };
  }

  return {
    type: "MEDIUM-TERM CHARTER",
    description:
      "Forecast supports medium-term multi-voyage charter planning over the selected horizon.",
  };
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, rgba(17,28,45,0.96), rgba(10,19,32,0.96))",
        border: "1px solid rgba(73,94,122,0.35)",
        borderRadius: "18px",
        padding: "22px",
        boxShadow: "0 15px 40px rgba(0,0,0,0.18)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PageHeader({ title, description }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div
        style={{
          fontSize: "28px",
          fontWeight: "800",
          color: "#ffffff",
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "7px",
          color: "#8fa1bb",
          fontSize: "14px",
        }}
      >
        {description}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  positive,
}) {
  return (
    <Card style={{ minHeight: "145px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              color: "#8292aa",
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              color: "#ffffff",
              fontSize: "27px",
              fontWeight: "800",
              marginTop: "12px",
            }}
          >
            {value}
          </div>

          {subtitle && (
            <div
              style={{
                marginTop: "8px",
                color: "#8192ab",
                fontSize: "12px",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(56,189,248,0.10)",
            border: "1px solid rgba(56,189,248,0.20)",
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      {positive !== undefined && (
        <div
          style={{
            marginTop: "15px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            color: positive ? "#4ade80" : "#fb7185",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          {positive ? (
            <ArrowDownRight size={15} />
          ) : (
            <ArrowUpRight size={15} />
          )}

          {positive
            ? "Forecast decreasing"
            : "Forecast increasing"}
        </div>
      )}
    </Card>
  );
}

function EmptyChart({
  message = "Generate a forecast to view the model output.",
}) {
  return (
    <div
      style={{
        height: "330px",
        border: "1px dashed rgba(93,112,142,0.4)",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#788aa4",
        fontSize: "13px",
      }}
    >
      {message}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          color: "#8395ae",
          fontSize: "11px",
          fontWeight: "700",
          marginBottom: "7px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "#0c1727",
          color: "#ffffff",
          border: "1px solid #293b54",
          borderRadius: "9px",
          padding: "11px",
          outline: "none",
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          color: "#8395ae",
          fontSize: "11px",
          fontWeight: "700",
          marginBottom: "7px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#0c1727",
          color: "#ffffff",
          border: "1px solid #293b54",
          borderRadius: "9px",
          padding: "11px",
          outline: "none",
        }}
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}) {
  return (
    <div
      style={{
        padding: "17px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(82,102,130,0.25)",
        borderRadius: "13px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: "#9aaac0",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: "#7dd3fc",
            fontSize: "15px",
            fontWeight: "800",
          }}
        >
          {value}
          {unit}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          marginTop: "15px",
          accentColor: "#0ea5e9",
          cursor: "pointer",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#526681",
          fontSize: "10px",
          marginTop: "5px",
        }}
      >
        <span>
          {min}
          {unit}
        </span>

        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

function ScenarioSelector({
  icon: Icon,
  title,
  value,
  onChange,
  options,
}) {
  return (
    <div
      style={{
        padding: "17px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(82,102,130,0.25)",
        borderRadius: "13px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#9aaac0",
          fontSize: "12px",
          fontWeight: "700",
        }}
      >
        <Icon size={16} />
        {title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "7px",
          marginTop: "14px",
        }}
      >
        {options.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              style={{
                padding: "9px 5px",
                borderRadius: "8px",
                border: active
                  ? "1px solid rgba(56,189,248,0.45)"
                  : "1px solid rgba(82,102,130,0.25)",
                background: active
                  ? "rgba(14,116,144,0.20)"
                  : "rgba(255,255,255,0.02)",
                color: active
                  ? "#7dd3fc"
                  : "#7f91aa",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   ROUTE DISPLAY
========================================================= */

function RouteDisplay({ shipment }) {
  return (
    <Card
      style={{
        marginBottom: "20px",
        background:
          "linear-gradient(110deg, rgba(2,132,199,0.12), rgba(37,99,235,0.05), rgba(17,28,45,0.95))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: "#71849f",
              fontSize: "10px",
              fontWeight: "800",
              letterSpacing: "1.4px",
            }}
          >
            OCEAN FREIGHT ROUTE
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "9px",
              flexWrap: "wrap",
            }}
          >
            <Globe2 size={18} />

            <span style={{ fontWeight: "800" }}>
              {shipment.origin}
            </span>

            <span style={{ color: "#526681" }}>
              ·
            </span>

            <span style={{ color: "#9aaac0" }}>
              {shipment.originPort}
            </span>

            <span
              style={{
                color: "#38bdf8",
                fontSize: "20px",
              }}
            >
              →
            </span>

            <span
              style={{
                color: "#7dd3fc",
                fontWeight: "800",
              }}
            >
              India
            </span>

            <span style={{ color: "#526681" }}>
              ·
            </span>

            <span style={{ fontWeight: "800" }}>
              {shipment.destination}
            </span>
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "#71849f",
              fontSize: "11px",
            }}
          >
            Overseas origin → East Coast India
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#7dd3fc",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          <MapPin size={15} />
          East Coast India
        </div>
      </div>
    </Card>
  );
}

/* =========================================================
   FORECAST CHART
========================================================= */

function ForecastChart({ data, currentRate }) {
  if (!data || data.length === 0) {
    return <EmptyChart />;
  }

  const numericCurrentRate = Number(
  currentRate ??
    data?.[0]?.rate
);
  

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={data}
        margin={{
          top: 15,
          right: 20,
          left: 5,
          bottom: 5,
        }}
      >
        <defs>
          <linearGradient
            id="freightArea"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          opacity={0.12}
        />

        <XAxis
          dataKey="date"
          tick={{
            fill: "#8192aa",
            fontSize: 11,
          }}
          tickFormatter={(value) =>
            value ? value.slice(5) : ""
          }
        />

        <YAxis
  tick={{
    fill: "#8192aa",
    fontSize: 11,
  }}
  domain={["auto", "auto"]}
  tickFormatter={(value) =>
    `$${value}`
  }
/>

        <Tooltip
          contentStyle={{
            background: "#0c1626",
            border: "1px solid #30415b",
            borderRadius: "10px",
            color: "#ffffff",
          }}
          formatter={(value) => [
            `$${Number(value).toFixed(2)} / MT`,
            "Forecast Rate",
          ]}
          labelFormatter={(label) =>
            `Date: ${label}`
          }
        />

        {/* CURRENT RATE REFERENCE */}
        {Number.isFinite(
          numericCurrentRate
        ) && (
          <ReferenceLine
            y={numericCurrentRate}
            stroke="#fbbf24"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              value: `Current $${numericCurrentRate.toFixed(
                2
              )}`,
              position: "insideTopRight",
              fill: "#fbbf24",
              fontSize: 10,
            }}
          />
        )}

        <Area
          type="monotone"
          dataKey="rate"
          strokeWidth={3}
          fill="url(#freightArea)"
          dot={false}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* =========================================================
   BAR CHART
========================================================= */

function ComparisonBarChart({
  data,
  dataKey,
  label,
}) {
  if (!data || data.length === 0) {
    return <EmptyChart />;
  }

  return (
    <ResponsiveContainer width="100%" height={330}>
      <BarChart
        data={data}
        margin={{
          top: 15,
          right: 20,
          left: 5,
          bottom: 5,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          opacity={0.12}
        />

        <XAxis
          dataKey="name"
          tick={{
            fill: "#8192aa",
            fontSize: 11,
          }}
        />

        <YAxis
          tick={{
            fill: "#8192aa",
            fontSize: 11,
          }}
          tickFormatter={(value) => `$${value}`}
        />

        <Tooltip
          contentStyle={{
            background: "#0c1626",
            border: "1px solid #30415b",
            borderRadius: "10px",
          }}
          formatter={(value) => [
            `$${Number(value).toFixed(2)} / MT`,
            label,
          ]}
        />

        <Bar
          dataKey={dataKey}
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function DashboardPage({
  forecastData,
  shipment,
  onGenerate,
  loading,
}) {
  const status = getDecisionStatus(
    forecastData.changePercent,
    forecastData.riskLevel
  );

  return (
    <>
      <PageHeader
        title="Maritime Decision Intelligence"
        description="Forecast freight rates and support vessel chartering and bulk cargo procurement decisions."
      />

      <RouteDisplay shipment={shipment} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(190px,1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <MetricCard
          title="Current Freight"
          value={formatMoney(
            forecastData.currentRate
          )}
          subtitle="USD / MT"
          icon={Activity}
        />

        <MetricCard
          title="Forecast Rate"
          value={formatMoney(
            forecastData.forecastRate
          )}
          subtitle="Model forecast"
          icon={TrendingUp}
          positive={
            forecastData.changePercent !== null
              ? Number(
                  forecastData.changePercent
                ) < 0
              : undefined
          }
        />

        <MetricCard
          title="Market Risk"
          value={
            forecastData.riskLevel || "—"
          }
          subtitle={`Volatility ${
            forecastData.volatility !== null
              ? Number(
                  forecastData.volatility
                ).toFixed(2)
              : "—"
          }`}
          icon={ShieldAlert}
        />

        <MetricCard
          title="Freight Exposure"
          value={formatMoney(
            forecastData.forecastExposure
          )}
          subtitle="Quantity × forecast rate"
          icon={Target}
        />
            </div>

      {forecastData.idleScenario && (
        <Card style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <Activity size={21} />

            <div
              style={{
                fontSize: "17px",
                fontWeight: "750",
              }}
            >
              Idle Scenario Management
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  color: "#8192aa",
                  fontSize: "11px",
                }}
              >
                Employment Status
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "19px",
                  fontWeight: "800",
                  color:
                    forecastData.idleScenario.status ===
                    "HIGH IDLE RISK"
                      ? "#fb7185"
                      : forecastData.idleScenario.status ===
                        "IDLE RISK"
                      ? "#fbbf24"
                      : "#4ade80",
                }}
              >
                {forecastData.idleScenario.status}
              </div>
            </div>

            <div>
              <div
                style={{
                  color: "#8192aa",
                  fontSize: "11px",
                }}
              >
                Idle Risk Score
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "22px",
                  fontWeight: "800",
                }}
              >
                {forecastData.idleScenario.idle_score}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#8192aa",
                  }}
                >
                  {" "}
                  / 100
                </span>
              </div>
            </div>

            <div>
              <div
                style={{
                  color: "#8192aa",
                  fontSize: "11px",
                }}
              >
                Demand − Supply Gap
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "20px",
                  fontWeight: "800",
                }}
              >
                {forecastData.idleScenario.demand_supply_gap}
              </div>
            </div>

            <div>
              <div
                style={{
                  color: "#8192aa",
                  fontSize: "11px",
                }}
              >
                Recommended Action
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  color: "#d7e0ec",
                }}
              >
                {forecastData.idleScenario.recommended_action}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "15px",
              paddingTop: "13px",
              borderTop:
                "1px solid rgba(148,163,184,0.12)",
              color: "#8192aa",
              fontSize: "11px",
            }}
          >
            Positioning guidance:{" "}
            {forecastData.idleScenario.positioning_guidance}
          </div>
        </Card>
      )}

      {forecastData.forecastRate !== null && (
        <div
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            borderRadius: "15px",
            background: status.background,
            border: `1px solid ${status.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: status.color,
                fontWeight: "850",
                letterSpacing: "0.7px",
                fontSize: "15px",
              }}
            >
              {status.label}
            </div>

            <div
              style={{
                color: "#9aaac0",
                marginTop: "5px",
                fontSize: "12px",
              }}
            >
              Forecast movement:{" "}
              {formatPercent(
                forecastData.changePercent
              )}
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={loading}
            style={{
              border:
                "1px solid rgba(56,189,248,0.3)",
              background:
                "rgba(56,189,248,0.08)",
              color: "#7dd3fc",
              padding: "10px 15px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: loading
                  ? "spin 1s linear infinite"
                  : "none",
              }}
            />

            Refresh Forecast
          </button>
        </div>
      )}

      <Card>
        <div style={{ marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "750",
            }}
          >
            Freight Forecast Curve
          </div>

          <div
            style={{
              marginTop: "5px",
              color: "#8091aa",
              fontSize: "12px",
            }}
          >
            Dynamic XGBoost forecast for the
            selected route, cargo and vessel
            scenario.
          </div>
        </div>

        <ForecastChart
  data={forecastData.forecastSeries}
  currentRate={forecastData.currentRate}
/>
      </Card>
    </>
  );
}

/* =========================================================
   FREIGHT FORECAST
========================================================= */
function FreightForecastPage({
  forecastData,
  shipment,
  setShipment,
  onGenerate,
  loading,
}) {
  const originPorts =
    originPortOptions[shipment.origin] || [];
const entryWindow = (() => {
  const series = forecastData.forecastSeries || [];

  if (!Array.isArray(series) || series.length === 0) {
    return {
      status: "AWAITING FORECAST",
      description:
        "Generate a forecast to identify the projected market entry window.",
    };
  }

  const rates = series
    .map((item) => {
      if (typeof item === "number") {
        return Number(item);
      }

      return Number(item?.rate);
    })
    .filter(Number.isFinite);

  if (rates.length < 2) {
    return {
      status: "AWAITING FORECAST",
      description:
        "More forecast days are required to identify a future market entry window.",
    };
  }

  const currentRate = Number(forecastData.currentRate);

  const baseRate = Number.isFinite(currentRate)
    ? currentRate
    : rates[0];

  // Day 1 is the current/baseline forecast.
  // Only future forecast days are evaluated for entry timing.
  const futureRates = rates.slice(1);

  const minimumRate = Math.min(...futureRates);

  const futureMinimumIndex =
    futureRates.indexOf(minimumRate);

  const minimumDay =
    futureMinimumIndex + 2;

  const difference =
    ((minimumRate - baseRate) / baseRate) * 100;

  /*
   * A meaningful future entry opportunity exists
   * only when the projected future minimum is below
   * the current baseline.
   */
  if (difference <= -3) {
    return {
      status: `POTENTIAL ENTRY — DAY ${minimumDay}`,
      description:
        `The model projects a future freight opportunity around day ${minimumDay}, with the projected rate approximately ${Math.abs(
          difference
        ).toFixed(1)}% below the current rate.`,
      minimumRate,
      minimumDay,
    };
  }

  /*
   * Future rates are materially higher than the
   * current baseline.
   */
  if (difference >= 3) {
    return {
      status: "RISING MARKET — MONITOR ENTRY",
      description:
        `The lowest projected future rate is approximately ${difference.toFixed(
          1
        )}% above the current rate. Monitor the forecast before committing to a longer charter.`,
      minimumRate,
      minimumDay,
    };
  }

  /*
   * Future rates are close to the current baseline.
   */
  return {
    status: "STABLE ENTRY WINDOW",
    description:
      `No significant future rate advantage is projected. The lowest future rate is ${formatMoney(
        minimumRate
      )} around day ${minimumDay}, approximately ${Math.abs(
        difference
      ).toFixed(1)}% ${
        difference >= 0 ? "above" : "below"
      } the current rate.`,
    minimumRate,
    minimumDay,
  };
})();
  return (
    <>
      <PageHeader
        title="Freight Forecast"
        description="Configure an overseas-to-East-Coast-India shipment and generate a model forecast."
      />

      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            marginBottom: "18px",
          }}
        >
          <Route size={20} />

          <div
            style={{
              fontSize: "17px",
              fontWeight: "750",
            }}
          >
            Route & Cargo Configuration
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: "15px",
          }}
        >
          <SelectField
            label="Origin Country"
            value={shipment.origin}
            options={originOptions}
            onChange={(value) =>
              setShipment({
                ...shipment,
                origin: value,
                originPort:
                  originPortOptions[value][0],
              })
            }
          />

          <SelectField
            label="Origin Port"
            value={shipment.originPort}
            options={originPorts}
            onChange={(value) =>
              setShipment({
                ...shipment,
                originPort: value,
              })
            }
          />

          <SelectField
            label="Destination Country"
            value="India"
            options={["India"]}
            onChange={() => {}}
          />

          <SelectField
            label="East Coast Destination Port"
            value={shipment.destination}
            options={destinationOptions}
            onChange={(value) =>
              setShipment({
                ...shipment,
                destination: value,
              })
            }
          />

          <SelectField
            label="Cargo"
            value={shipment.cargo}
            options={cargoOptions}
            onChange={(value) =>
              setShipment({
                ...shipment,
                cargo: value,
              })
            }
          />

          <SelectField
            label="Vessel Type"
            value={shipment.vessel}
            options={vesselOptions}
            onChange={(value) =>
              setShipment({
                ...shipment,
                vessel: value,
              })
            }
          />

          <InputField
            label="Quantity (MT)"
            type="number"
            value={shipment.quantity}
            onChange={(value) =>
              setShipment({
                ...shipment,
                quantity: value,
              })
            }
          />

          <SelectField
            label="Forecast Horizon"
            value={shipment.horizon}
            options={horizonOptions}
            onChange={(value) =>
              setShipment({
                ...shipment,
                horizon: Number(value),
              })
            }
          />
        </div>

        <div
          style={{
            marginTop: "22px",
            paddingTop: "18px",
            borderTop:
              "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: "750",
              marginBottom: "14px",
            }}
          >
            Market Conditions
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: "15px",
            }}
          >
            <InputField
              label="Fuel Price"
              type="number"
              value={shipment.fuelPrice}
              onChange={(value) =>
                setShipment({
                  ...shipment,
                  fuelPrice: Number(value),
                })
              }
            />

            <InputField
              label="Commodity Price"
              type="number"
              value={shipment.commodityPrice}
              onChange={(value) =>
                setShipment({
                  ...shipment,
                  commodityPrice: Number(value),
                })
              }
            />

            <InputField
  label="Port Congestion — Market Assumption (%)"
  type="number"
  value={shipment.portCongestion}
  onChange={(value) =>
    setShipment({
      ...shipment,
      portCongestion: Number(value),
    })
  }
/>

            <InputField
              label="Demand Index"
              type="number"
              value={shipment.demandIndex}
              onChange={(value) =>
                setShipment({
                  ...shipment,
                  demandIndex: Number(value),
                })
              }
            />

            <InputField
              label="Supply Index"
              type="number"
              value={shipment.supplyIndex}
              onChange={(value) =>
                setShipment({
                  ...shipment,
                  supplyIndex: Number(value),
                })
              }
            />
          </div>
        </div>

        <div
          style={{
            marginTop: "18px",
            padding: "13px",
            borderRadius: "10px",
            background:
              "rgba(56,189,248,0.06)",
            border:
              "1px solid rgba(56,189,248,0.12)",
            color: "#9aaac0",
            fontSize: "12px",
          }}
        >
          <strong style={{ color: "#7dd3fc" }}>
            Route:
          </strong>{" "}
          {shipment.origin} ·{" "}
          {shipment.originPort}
          {" → "}
          India · {shipment.destination}
        </div>

        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "11px",
            background:
              "linear-gradient(90deg,#0284c7,#2563eb)",
            color: "#ffffff",
            fontWeight: "750",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {loading
            ? "Generating Forecast..."
            : "Predict Freight Rate"}
        </button>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(190px,1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        <MetricCard
          title="Current Rate"
          value={formatMoney(
            forecastData.currentRate
          )}
          subtitle="USD / MT"
          icon={Gauge}
        />

        <MetricCard
          title="Forecast Rate"
          value={formatMoney(
            forecastData.forecastRate
          )}
          subtitle="Average forecast"
          icon={TrendingUp}
        />

        <MetricCard
          title="Forecast Change"
          value={formatPercent(
            forecastData.changePercent
          )}
          subtitle="Current vs forecast"
          icon={Activity}
        />

        <MetricCard
          title="Risk"
          value={
            forecastData.riskLevel || "—"
          }
          subtitle={`Volatility ${
            forecastData.volatility !== null
              ? Number(
                  forecastData.volatility
                ).toFixed(2)
              : "—"
          }`}
          icon={ShieldAlert}
        />
      </div>

      {/* MARKET ENTRY WINDOW */}
      <Card style={{ marginTop: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <Target size={21} />

          <div
            style={{
              fontSize: "18px",
              fontWeight: "750",
            }}
          >
            Market Entry Window
          </div>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "11px",
            background:
              "rgba(56,189,248,0.06)",
            border:
              "1px solid rgba(56,189,248,0.14)",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color:
                entryWindow.status.startsWith(
                  "POTENTIAL ENTRY"
                )
                  ? "#4ade80"
                  : entryWindow.status.startsWith(
                      "RISING MARKET"
                    )
                  ? "#fb7185"
                  : entryWindow.status ===
                    "AWAITING FORECAST"
                  ? "#94a3b8"
                  : "#fbbf24",
            }}
          >
            {entryWindow.status}
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "#9aaac0",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          >
            {entryWindow.description}
          </div>

          {entryWindow.minimumRate !==
            undefined && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(160px,1fr))",
                gap: "15px",
                marginTop: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "11px",
                  }}
                >
                  Projected Minimum
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "18px",
                    fontWeight: "800",
                  }}
                >
                  {formatMoney(
                    entryWindow.minimumRate
                  )}
                </div>
              </div>
              <div
  style={{
    gridColumn: "1 / -1",
    marginTop: "4px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      color: "#8192aa",
      fontSize: "9px",
      marginBottom: "6px",
    }}
  >
    <span>FORECAST START</span>

    <span>
      DAY {forecastData.forecastSeries?.length || "—"}
    </span>
  </div>

  <div
  style={{
    height: "6px",
    borderRadius: "999px",
    background: "rgba(82,102,130,0.22)",
    overflow: "hidden",
    position: "relative",
  }}
>
  {/* Existing progress bar */}
  <div
    style={{
      width: `${
        forecastData.forecastSeries?.length &&
        entryWindow.minimumDay
          ? Math.min(
              100,
              Math.max(
                0,
                (
                  entryWindow.minimumDay /
                  forecastData.forecastSeries.length
                ) * 100
              )
            )
          : 0
      }%`,
      height: "100%",
      borderRadius: "999px",
      background:
        "linear-gradient(90deg,#38bdf8,#4ade80)",
    }}
  />

  {/* Predicted timing marker */}
  <div
    style={{
      position: "absolute",
      left: `${
        forecastData.forecastSeries?.length &&
        entryWindow.minimumDay
          ? Math.min(
              100,
              Math.max(
                0,
                (
                  entryWindow.minimumDay /
                  forecastData.forecastSeries.length
                ) * 100
              )
            )
          : 0
      }%`,
      top: "-2px",
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      background: "#ffffff",
      border: "2px solid #4ade80",
      transform: "translateX(-50%)",
      boxSizing: "border-box",
    }}
  />
</div>
  <div
  style={{
    marginTop: "6px",
    color: "#8192aa",
    fontSize: "9px",
    lineHeight: "1.5",
  }}
>
  Projected lowest future rate occurs around day{" "}
  <strong style={{ color: "#cbd5e1" }}>
    {entryWindow.minimumDay}
  </strong>{" "}
  of the forecast horizon.
  {" "}
  {entryWindow.status.startsWith("POTENTIAL ENTRY")
    ? "This indicates a potential lower-rate entry point."
    : entryWindow.status.startsWith("RISING MARKET")
    ? "Future rates remain above the current rate, so continued monitoring is indicated."
    : "The forecast does not show a significant future rate advantage."}
</div>
</div>

              <div>
                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "11px",
                  }}
                >
                  Projected Timing
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "18px",
                    fontWeight: "800",
                  }}
                >
                  Day {entryWindow.minimumDay}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

                  {/* CHARTER PLANNING SIGNAL */}
      {forecastData &&
        (() => {
          const charterSignal =
            getCharterPlanningSignal(
              shipment.horizon
            );

          return (
            <Card style={{ marginTop: "20px" }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "750",
                }}
              >
                Charter Planning Signal
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#8091aa",
                  fontSize: "12px",
                }}
              >
                Planning guidance based on the selected
                forecast horizon.
              </div>

              <div
                style={{
                  marginTop: "14px",
                  padding: "15px",
                  borderRadius: "11px",
                  background:
                    "rgba(56,189,248,0.05)",
                  border:
                    "1px solid rgba(56,189,248,0.14)",
                }}
              >
                <div
                  style={{
                    color: "#7dd3fc",
                    fontSize: "9px",
                    fontWeight: "800",
                    letterSpacing: "0.08em",
                  }}
                >
                  PLANNING HORIZON
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "20px",
                    fontWeight: "800",
                    color: "#ffffff",
                  }}
                >
                  {charterSignal.type}
                </div>

                <div
                  style={{
                    marginTop: "7px",
                    color: "#9aaac0",
                    fontSize: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  {charterSignal.description}
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    color: "#8192aa",
                    fontSize: "11px",
                  }}
                >
                  Forecast horizon:{" "}
                  <strong
                    style={{
                      color: "#cbd5e1",
                    }}
                  >
                    {shipment.horizon} days
                  </strong>
                </div>
              </div>
            </Card>
          );
        })()}

      {/* XGBOOST FREIGHT RATE FORECAST */}
      <Card style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "750",
            }}
          >
            XGBoost Freight Rate Forecast
          </div>

          <div
            style={{
              marginTop: "5px",
              color: "#8091aa",
              fontSize: "12px",
            }}
          >
            Predicted freight rate across the
            selected forecast horizon.
          </div>
        </div>

        <ForecastChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}
/* =========================================================
   WHAT-IF
========================================================= */

function WhatIfPage({
  forecastData,
  shipment,
  onScenario,
  loading,
}) {
  const [quantityMultiplier, setQuantityMultiplier] =
    useState(1);

  const [fuelScenario, setFuelScenario] =
    useState(0);

  const [portScenario, setPortScenario] =
    useState(0);

  const [demandScenario, setDemandScenario] =
    useState(0);

  const baseQuantity =
    Number(shipment.quantity) || 0;

  const scenarioQuantity =
    baseQuantity * quantityMultiplier;

  const scenarioResult =
    forecastData.scenarioResult;

  const baseRate =
    Number(forecastData.forecastRate) || 0;

  const scenarioRate =
  Number(
    scenarioResult?.forecast?.forecast_rate ??
    scenarioResult?.forecast_rate
  );

const finalScenarioRate = Number.isFinite(
  scenarioRate
)
  ? scenarioRate
  : baseRate;

const baseCost =
  baseQuantity * baseRate;

const scenarioCost =
  scenarioQuantity * finalScenarioRate;

const costDifference =
  scenarioCost - baseCost;

const savings =
  baseCost - scenarioCost;

const impactPercent =
  baseCost > 0
    ? (costDifference / baseCost) * 100
    : 0;

  function runScenario() {
    onScenario({
      quantity: scenarioQuantity,
      fuelScenario,
      portScenario,
      demandScenario,
    });
  }

  const scenarioSeries =
    scenarioResult?.forecast?.forecast_series ||
    scenarioResult?.forecast_series ||
    [];

  const scenarioVolatility = Number(
  scenarioResult?.risk?.volatility ??
  scenarioResult?.volatility
);

const scenarioRisk =
  !Number.isFinite(scenarioVolatility)
    ? "—"
    : scenarioVolatility >= 0.5
      ? "HIGH"
      : scenarioVolatility >= 0.2
        ? "MODERATE"
        : "LOW";

  return (
    <>
      <PageHeader
        title="What-If Simulator"
        description="Run alternative market conditions through the forecasting engine and compare freight exposure."
      />

      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <SlidersHorizontal size={22} />

          <div
            style={{
              fontSize: "18px",
              fontWeight: "800",
            }}
          >
            Scenario Controls
          </div>
        </div>

        <div
          style={{
            color: "#8192aa",
            fontSize: "12px",
            marginBottom: "20px",
          }}
        >
          These controls are designed to run through
          the PORTWISE forecasting API.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: "15px",
          }}
        >
          <SliderField
            label="Shipment Quantity"
            value={quantityMultiplier.toFixed(1)}
            min={0.5}
            max={2}
            step={0.1}
            unit="x"
            onChange={setQuantityMultiplier}
          />

          <ScenarioSelector
            icon={Fuel}
            title="Fuel Price"
            value={fuelScenario}
            onChange={setFuelScenario}
            options={[
              { value: -1, label: "Lower" },
              { value: 0, label: "Normal" },
              { value: 1, label: "Higher" },
            ]}
          />

          <ScenarioSelector
            icon={Factory}
            title="Port Congestion"
            value={portScenario}
            onChange={setPortScenario}
            options={[
              { value: -1, label: "Low" },
              { value: 0, label: "Normal" },
              { value: 1, label: "High" },
            ]}
          />

          <ScenarioSelector
            icon={TrendingUp}
            title="Market Demand"
            value={demandScenario}
            onChange={setDemandScenario}
            options={[
              { value: -1, label: "Weak" },
              { value: 0, label: "Normal" },
              { value: 1, label: "Strong" },
            ]}
          />
        </div>

        <button
          onClick={runScenario}
          disabled={loading}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "11px",
            background:
              "linear-gradient(90deg,#0284c7,#2563eb)",
            color: "#ffffff",
            fontWeight: "750",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {loading
            ? "Running Model Scenario..."
            : "Run XGBoost What-If Scenario"}
        </button>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(190px,1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        <MetricCard
          title="Base Cost"
          value={formatMoney(baseCost)}
          subtitle={`${formatNumber(
            baseQuantity
          )} MT`}
          icon={Database}
        />

        <MetricCard
          title="Scenario Cost"
          value={formatMoney(scenarioCost)}
          subtitle={`${formatNumber(
            scenarioQuantity
          )} MT`}
          icon={Package}
        />

        <MetricCard
          title="Cost Impact"
          value={formatMoney(
            Math.abs(costDifference)
          )}
          subtitle={`${
            impactPercent >= 0 ? "+" : ""
          }${impactPercent.toFixed(2)}%`}
          icon={
            costDifference <= 0
              ? ArrowDownRight
              : ArrowUpRight
          }
          positive={costDifference <= 0}
        />

        <MetricCard
          title="Scenario Risk"
          value={scenarioRisk || "—"}
          subtitle="Model-derived"
          icon={ShieldAlert}
        />
      </div>

      <Card style={{ marginTop: "20px" }}>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "750",
            marginBottom: "5px",
          }}
        >
          Scenario Freight Projection
        </div>

        <div
          style={{
            color: "#8091aa",
            fontSize: "12px",
            marginBottom: "18px",
          }}
        >
          Forecast generated from the selected
          scenario inputs.
        </div>

        <ForecastChart data={scenarioSeries} />
      </Card>

      <Card style={{ marginTop: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#8292aa",
                fontSize: "11px",
                textTransform: "uppercase",
                fontWeight: "700",
              }}
            >
              Base Forecast
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: "850",
                marginTop: "8px",
              }}
            >
              {formatMoney(baseRate)}
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#7dd3fc",
                fontSize: "11px",
                textTransform: "uppercase",
                fontWeight: "700",
              }}
            >
              Scenario Forecast
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: "850",
                marginTop: "8px",
              }}
            >
              {formatMoney(scenarioRate)}
            </div>
          </div>

          <div>
            <div
              style={{
                color:
                  savings >= 0
                    ? "#4ade80"
                    : "#fb7185",
                fontSize: "11px",
                textTransform: "uppercase",
                fontWeight: "700",
              }}
            >
              Exposure Difference
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: "850",
                marginTop: "8px",
              }}
            >
              {formatMoney(Math.abs(savings))}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

/* =========================================================
   CHARTERSENSE
========================================================= */

function CharterSensePage({
  forecastData,
}) {
  const status = getDecisionStatus(
    forecastData.changePercent,
    forecastData.riskLevel
  );

  return (
    <>
      <PageHeader
        title="CharterSense"
        description="Charter planning intelligence based on the selected freight forecast."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(230px,1fr))",
          gap: "18px",
        }}
      >
        <Card>
          <Ship size={22} />

          <div
            style={{
              marginTop: "15px",
              fontWeight: "750",
              fontSize: "17px",
            }}
          >
            Charter Market Signal
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "#8da0ba",
              fontSize: "13px",
            }}
          >
            Derived from forecast direction and
            risk.
          </div>

          <div
            style={{
              marginTop: "18px",
              fontSize: "24px",
              fontWeight: "800",
              color: status.color,
            }}
          >
            {status.label}
          </div>
        </Card>

        <Card>
          <Gauge size={22} />

          <div
            style={{
              marginTop: "15px",
              fontWeight: "750",
              fontSize: "17px",
            }}
          >
            Forecast Rate
          </div>

          <div
            style={{
              marginTop: "18px",
              fontSize: "24px",
              fontWeight: "800",
            }}
          >
            {formatMoney(
              forecastData.forecastRate
            )}
          </div>
        </Card>

        <Card>
          <Activity size={22} />

          <div
            style={{
              marginTop: "15px",
              fontWeight: "750",
              fontSize: "17px",
            }}
          >
            Forecast Movement
          </div>

          <div
            style={{
              marginTop: "18px",
              fontSize: "24px",
              fontWeight: "800",
            }}
          >
            {formatPercent(
              forecastData.changePercent
            )}
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: "20px" }}>
        <div
          style={{
            fontWeight: "750",
            fontSize: "17px",
            marginBottom: "18px",
          }}
        >
          Charter Decision Forecast
        </div>

        <ForecastChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}

/* =========================================================
   PROCURESENSE
========================================================= */

function ProcureSensePage({
  forecastData,
  shipment,
}) {
  const status = getDecisionStatus(
    forecastData.changePercent,
    forecastData.riskLevel
  );

  return (
    <>
      <PageHeader
        title="ProcureSense"
        description="Bulk cargo procurement intelligence connected to freight conditions."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "18px",
        }}
      >
        <Card>
          <ShoppingCart size={22} />

          <div
            style={{
              marginTop: "15px",
              fontWeight: "750",
            }}
          >
            Procurement Signal
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "800",
              marginTop: "15px",
              color: status.color,
            }}
          >
            {status.label}
          </div>
        </Card>

        <Card>
          <Database size={22} />

          <div
            style={{
              marginTop: "15px",
              fontWeight: "750",
            }}
          >
            Cargo Exposure
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: "800",
              marginTop: "15px",
            }}
          >
            {formatMoney(
              forecastData.forecastExposure
            )}
          </div>

          <div
            style={{
              color: "#8192aa",
              fontSize: "11px",
              marginTop: "5px",
            }}
          >
            {formatNumber(shipment.quantity)} MT
          </div>
        </Card>

        <Card>
  <Package size={22} />

  <div
    style={{
      marginTop: "15px",
      fontWeight: "750",
    }}
  >
    Forecast Horizon
  </div>

  <div
    style={{
      fontSize: "22px",
      fontWeight: "800",
      marginTop: "15px",
    }}
  >
    {forecastData.forecastSeries.length ||
      "—"}{" "}
    days
  </div>
</Card>

<Card>
  <Activity size={22} />

  <div
    style={{
      marginTop: "15px",
      fontWeight: "750",
    }}
  >
    Idle Scenario
  </div>

  <div
    style={{
      fontSize: "20px",
      fontWeight: "800",
      marginTop: "15px",
      color:
        forecastData.idleScenario?.status ===
        "HIGH IDLE RISK"
          ? "#fb7185"
          : forecastData.idleScenario?.status ===
            "IDLE RISK"
          ? "#fbbf24"
          : "#4ade80",
    }}
  >
    {forecastData.idleScenario?.status || "—"}
  </div>

  <div
    style={{
      color: "#8192aa",
      fontSize: "11px",
      marginTop: "7px",
    }}
  >
    Score:{" "}
    {forecastData.idleScenario?.idle_score ??
      "—"}
    /100
  </div>
  <div
  style={{
    marginTop: "14px",
    paddingTop: "13px",
    borderTop:
      "1px solid rgba(82,102,130,0.18)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      color: "#8192aa",
      fontSize: "10px",
    }}
  >
    <span>
      Demand–Supply Gap:{" "}
      <strong style={{ color: "#cbd5e1" }}>
        {forecastData.idleScenario
          ?.demand_supply_gap ?? "—"}
      </strong>
    </span>

    <span>
      Employment Signal:{" "}
      <strong
        style={{
          color:
            forecastData.idleScenario?.idle_score >= 70
              ? "#fb7185"
              : forecastData.idleScenario?.idle_score >= 40
              ? "#fbbf24"
              : "#4ade80",
        }}
      >
        {forecastData.idleScenario?.status || "—"}
      </strong>
    </span>
  </div>

  {Array.isArray(
    forecastData.idleScenario?.factors
  ) &&
    forecastData.idleScenario.factors.length > 0 && (
      <div
        style={{
          marginTop: "10px",
          color: "#9aaac0",
          fontSize: "10px",
          lineHeight: "1.6",
        }}
      >
        {forecastData.idleScenario.factors.map(
          (factor, index) => (
            <div key={index}>
              • {factor}
            </div>
          )
        )}
      </div>
    )}

  {forecastData.idleScenario?.recommended_action && (
    <div
      style={{
        marginTop: "11px",
        padding: "10px 11px",
        borderRadius: "9px",
        background:
          "rgba(56,189,248,0.05)",
        border:
          "1px solid rgba(56,189,248,0.12)",
        color: "#9fb0c7",
        fontSize: "10px",
        lineHeight: "1.5",
      }}
    >
      <strong style={{ color: "#7dd3fc" }}>
        Recommended action:
      </strong>{" "}
      {forecastData.idleScenario.recommended_action}
    </div>
  )}
</div>
</Card>
</div>

<Card style={{ marginTop: "20px" }}>
        <div
          style={{
            fontSize: "17px",
            fontWeight: "750",
            marginBottom: "18px",
          }}
        >
          Freight Trend
        </div>

        <ForecastChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}

/* =========================================================
   RISKRADAR
========================================================= */

function RiskRadarPage({ forecastData }) {
  const volatility =
    Number(forecastData.volatility) || 0;

  const change = Math.abs(
    Number(forecastData.changePercent) || 0
  );

  const riskScore = Math.min(
  100,
  Math.round(
    volatility * 25 +
    change * 10
  )
);

const riskLevel =
  riskScore >= 70
    ? "CRITICAL"
    : riskScore >= 50
    ? "HIGH"
    : riskScore >= 30
    ? "MODERATE"
    : "LOW";

  const chartData = [
    {
      factor: "Forecast Volatility",
      value: Math.min(
        Math.round(volatility * 12),
        100
      ),
    },
    {
      factor: "Rate Movement",
      value: Math.min(
        Math.round(change * 8),
        100
      ),
    },
    {
      factor: "Overall Risk",
      value: riskScore,
    },
  ];

  return (
    <>
      <PageHeader
        title="RiskRadar"
        description="Quantify forecast volatility and freight-rate exposure."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "18px",
        }}
      >
        <Card>
          <ShieldAlert size={24} />

          <div
            style={{
              marginTop: "14px",
              color: "#8da0ba",
              fontSize: "12px",
            }}
          >
            Risk Level
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              marginTop: "8px",
            }}
          >
            {forecastData.riskLevel || "—"}
          </div>
        </Card>

        <Card>
          <Activity size={24} />

          <div
            style={{
              marginTop: "14px",
              color: "#8da0ba",
              fontSize: "12px",
            }}
          >
            Forecast Volatility
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              marginTop: "8px",
            }}
          >
            {forecastData.volatility !== null
              ? volatility.toFixed(2)
              : "—"}
          </div>
        </Card>

        <Card>
          <Gauge size={24} />

          <div
            style={{
              marginTop: "14px",
              color: "#8da0ba",
              fontSize: "12px",
            }}
          >
            Risk Exposure Index
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              marginTop: "8px",
            }}
          >
            {forecastData.forecastRate !== null
              ? `${riskScore}/100`
              : "—"}
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: "20px" }}>
        <div
          style={{
            fontSize: "17px",
            fontWeight: "750",
            marginBottom: "18px",
          }}
        >
          Risk Indicator Overview
        </div>

        <ResponsiveContainer
          width="100%"
          height={320}
        >
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.12}
            />

            <XAxis
              dataKey="factor"
              tick={{
                fill: "#8192aa",
                fontSize: 11,
              }}
            />

            <YAxis
              domain={[0, 100]}
              tick={{
                fill: "#8192aa",
                fontSize: 11,
              }}
            />

            <Tooltip
              contentStyle={{
                background: "#0c1626",
                border: "1px solid #30415b",
                borderRadius: "10px",
              }}
            />

            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}

/* =========================================================
   VESSEL MATCH
========================================================= */

function VesselMatchPage({
  vesselComparison,
  loading,
  shipment,
  onCompare,
}) {
  return (
    <>
      <PageHeader
        title="VesselMatch"
        description="Compare vessel types using freight forecast, port compatibility and market risk."
      />

      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <Anchor size={21} />

          <div
            style={{
              fontSize: "17px",
              fontWeight: "800",
            }}
          >
            Vessel Intelligence
          </div>
        </div>

        <div
          style={{
            color: "#8192aa",
            fontSize: "12px",
            marginBottom: "20px",
          }}
        >
          PORTWISE compares each vessel against the current
          shipment route, forecast and destination-port constraints.
        </div>

        {/* CURRENT SHIPMENT */}
        <div
          style={{
            padding: "16px",
            borderRadius: "13px",
            background: "rgba(56,189,248,0.06)",
            border: "1px solid rgba(56,189,248,0.18)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#8192aa",
              marginBottom: "8px",
              letterSpacing: "0.08em",
            }}
          >
            CURRENT SHIPMENT
          </div>

          <div
            style={{
              fontSize: "15px",
              fontWeight: "800",
            }}
          >
            {shipment.origin} · {shipment.originPort}
            {" → "}
            {shipment.destinationCountry} ·{" "}
            {shipment.destination}
          </div>

          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              marginTop: "10px",
              color: "#9fb0c7",
              fontSize: "12px",
            }}
          >
            <span>
              Cargo: <strong>{shipment.cargo}</strong>
            </span>

            <span>
              Quantity:{" "}
              <strong>
                {formatNumber(shipment.quantity)} MT
              </strong>
            </span>

            <span>
              Horizon:{" "}
              <strong>{shipment.horizon} Days</strong>
            </span>
          </div>
        </div>
        {/* COMPARISON BASIS */}
<div
  style={{
    marginBottom: "18px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.02)",
    border:
      "1px solid rgba(82,102,130,0.18)",
    color: "#8192aa",
    fontSize: "10px",
    lineHeight: "1.6",
  }}
>
  <strong
    style={{
      color: "#9fb0c7",
    }}
  >
    COMPARISON BASIS
  </strong>

  {" · "}

  Forecast rate + market risk + destination-port
  infrastructure constraints are evaluated for each
  vessel type using the current shipment inputs.
</div>

        {/* ACTION */}
        <button
          type="button"
          onClick={onCompare}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: "10px",
            border: "1px solid rgba(56,189,248,0.35)",
            background: loading
              ? "rgba(56,189,248,0.08)"
              : "rgba(56,189,248,0.14)",
            color: "#7dd3fc",
            fontWeight: "800",
            cursor: loading
              ? "not-allowed"
              : "pointer",
            marginBottom: "22px",
          }}
        >
          {loading
            ? "CALCULATING VESSEL PREDICTIONS..."
            : "COMPARE ALL VESSEL TYPES"}
        </button>

        {/* RESULTS */}
{vesselComparison.length === 0 ? (
  <div
    style={{
      padding: "30px",
      textAlign: "center",
      borderRadius: "12px",
      border:
        "1px dashed rgba(82,102,130,0.35)",
      color: "#8192aa",
      fontSize: "12px",
    }}
  >
    Click <strong>Compare All Vessel Types</strong>{" "}
    to run the forecasting model for every vessel.
  </div>
) : (
  <div>
    {/* COMPARISON SUMMARY */}
    {(() => {
      const validVessels =
        vesselComparison.filter(
          (item) =>
            Number.isFinite(
              Number(item.forecast_rate)
            )
        );

      const lowestRateVessel =
        validVessels.length > 0
          ? validVessels.reduce(
              (lowest, current) =>
                Number(current.forecast_rate) <
                Number(lowest.forecast_rate)
                  ? current
                  : lowest
            )
          : null;

      const suitableCount =
        vesselComparison.filter(
          (item) =>
            String(item.port_fit || "")
              .toUpperCase() === "SUITABLE"
        ).length;

      const reviewCount =
        vesselComparison.filter(
          (item) =>
            String(item.decision || "")
              .toUpperCase() !== "SUITABLE"
        ).length;

      const elevatedRiskCount =
        vesselComparison.filter((item) => {
          const risk = String(
            item.risk_level ||
              item.riskLevel ||
              ""
          ).toUpperCase();

          return [
            "HIGH",
            "CRITICAL",
            "VERY HIGH",
          ].includes(risk);
        }).length;

      return (
        <div
          style={{
            marginBottom: "18px",
            padding: "16px",
            borderRadius: "13px",
            background:
              "linear-gradient(145deg, rgba(56,189,248,0.07), rgba(255,255,255,0.02))",
            border:
              "1px solid rgba(56,189,248,0.20)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#7dd3fc",
              fontWeight: "800",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            MODEL COMPARISON SUMMARY
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            {/* LOWEST FORECAST */}
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background:
                  "rgba(255,255,255,0.025)",
              }}
            >
              <div
                style={{
                  color: "#8192aa",
                  fontSize: "9px",
                }}
              >
                LOWEST FORECAST
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "16px",
                  fontWeight: "800",
                }}
              >
                {lowestRateVessel
                  ? formatMoney(
                      lowestRateVessel.forecast_rate
                    )
                  : "—"}
              </div>

              <div
                style={{
                  marginTop: "3px",
                  color: "#8192aa",
                  fontSize: "9px",
                }}
              >
                {lowestRateVessel
                  ? lowestRateVessel.vessel
                  : "No valid forecast"}
              </div>
            </div>

            {/* PORT COMPATIBILITY */}
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background:
                  "rgba(255,255,255,0.025)",
              }}
            >
              <div
                style={{
                  color: "#8192aa",
                  fontSize: "9px",
                }}
              >
                PORT COMPATIBLE
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "16px",
                  fontWeight: "800",
                  color: "#4ade80",
                }}
              >
                {suitableCount}/
                {vesselComparison.length}
              </div>

              <div
                style={{
                  marginTop: "3px",
                  color: "#8192aa",
                  fontSize: "9px",
                }}
              >
                Based on constraint screen
              </div>
            </div>

            {/* REVIEW REQUIRED */}
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background:
                  "rgba(255,255,255,0.025)",
              }}
            >
              <div
                style={{
                  color: "#8192aa",
                  fontSize: "9px",
                }}
              >
                REVIEW REQUIRED
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "16px",
                  fontWeight: "800",
                  color:
                    reviewCount > 0
                      ? "#fbbf24"
                      : "#4ade80",
                }}
              >
                {reviewCount}
              </div>

              <div
                style={{
                  marginTop: "3px",
                  color: "#8192aa",
                  fontSize: "9px",
                }}
              >
                Port or market conditions
              </div>
            </div>

            {/* RISK REVIEW */}
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background:
                  "rgba(255,255,255,0.025)",
              }}
            >
              <div
                style={{
                  color: "#8192aa",
                  fontSize: "9px",
                }}
              >
                ELEVATED RISK
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "16px",
                  fontWeight: "800",
                  color:
                    elevatedRiskCount > 0
                      ? "#fb7185"
                      : "#4ade80",
                }}
              >
                {elevatedRiskCount}
              </div>

              <div
                style={{
                  marginTop: "3px",
                  color: "#8192aa",
                  fontSize: "9px",
                }}
              >
                High / critical risk cases
              </div>
            </div>
          </div>
        </div>
      );
    })()}

    {/* VESSEL RESULTS */}
    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      {vesselComparison.map((vessel) => {
        const risk =
          vessel.risk_level ||
          vessel.riskLevel ||
          "—";

        const portFit =
          vessel.port_fit ||
          "CHECK REQUIRED";

        const decision =
          vessel.decision ||
          "REVIEW REQUIRED";

        const portScore =
          Number.isFinite(
            Number(vessel.port_score)
          )
            ? Number(vessel.port_score)
            : 0;

        const profile =
          vessel.vessel_profile || {};

        return (
          <div
            key={vessel.vessel}
            style={{
              padding: "17px",
              borderRadius: "13px",
              background:
                "rgba(255,255,255,0.025)",
              border:
                "1px solid rgba(82,102,130,0.25)",
            }}
          >
            {/* TOP ROW */}
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "15px",
                marginBottom: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "15px",
                  }}
                >
                  {vessel.vessel}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color: "#8192aa",
                    fontSize: "11px",
                  }}
                >
                  Vessel forecast scenario
                </div>
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  background:
                    decision ===
                    "SUITABLE"
                      ? "rgba(74,222,128,0.10)"
                      : "rgba(251,191,36,0.10)",
                  border:
                    decision ===
                    "SUITABLE"
                      ? "1px solid rgba(74,222,128,0.25)"
                      : "1px solid rgba(251,191,36,0.25)",
                  color:
                    decision ===
                    "SUITABLE"
                      ? "#4ade80"
                      : "#fbbf24",
                  fontSize: "10px",
                  fontWeight: "800",
                }}
              >
                {decision}
              </div>
            </div>

            {/* METRICS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              {/* FREIGHT */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background:
                    "rgba(255,255,255,0.025)",
                }}
              >
                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "9px",
                  }}
                >
                  FORECAST RATE
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "18px",
                    fontWeight: "800",
                  }}
                >
                  {formatMoney(
                    vessel.forecast_rate
                  )}
                </div>

                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "9px",
                    marginTop: "2px",
                  }}
                >
                  USD / MT
                </div>
              </div>
              <div
  style={{
    marginTop: "9px",
    height: "4px",
    borderRadius: "999px",
    background: "rgba(82,102,130,0.20)",
    overflow: "hidden",
  }}
>
  <div
    style={{
      width: `${
        (() => {
          const rates = vesselComparison
            .map((item) =>
              Number(item.forecast_rate)
            )
            .filter(Number.isFinite);

          if (
            rates.length === 0 ||
            !Number.isFinite(
              Number(vessel.forecast_rate)
            )
          ) {
            return 0;
          }

          const min = Math.min(...rates);
          const max = Math.max(...rates);

          if (max === min) {
            return 100;
          }

          return (
            25 +
            (
              (Number(vessel.forecast_rate) - min) /
              (max - min)
            ) *
              75
          );
        })()
      }%`,
      height: "100%",
      borderRadius: "999px",
      background:
        "linear-gradient(90deg, #38bdf8, #0ea5e9)",
    }}
  />
</div>

              {/* PORT FIT */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background:
                    "rgba(255,255,255,0.025)",
                }}
              >
                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "9px",
                  }}
                >
                  PORT FIT
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "14px",
                    fontWeight: "800",
                    color:
                      portFit ===
                      "SUITABLE"
                        ? "#4ade80"
                        : "#fbbf24",
                  }}
                >
                  {portFit}
                </div>

                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "9px",
                    marginTop: "3px",
                  }}
                >
                  Constraint {portScore}/100
                </div>
              </div>

              {/* RISK */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background:
                    "rgba(255,255,255,0.025)",
                }}
              >
                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "9px",
                  }}
                >
                  MARKET RISK
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "14px",
                    fontWeight: "800",
                    color:
                      risk === "Low"
                        ? "#4ade80"
                        : risk === "Moderate"
                        ? "#fbbf24"
                        : "#fb7185",
                  }}
                >
                  {risk}
                </div>

                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "9px",
                    marginTop: "3px",
                  }}
                >
                  Volatility{" "}
                  {Number(
                    vessel.volatility
                  ).toFixed(2)}
                </div>
              </div>

              {/* CHANGE */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background:
                    "rgba(255,255,255,0.025)",
                }}
              >
                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "9px",
                  }}
                >
                  FORECAST CHANGE
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "14px",
                    fontWeight: "800",
                  }}
                >
                  {Number(
                    vessel.change_percent
                  ) >= 0
                    ? "+"
                    : ""}
                  {Number(
                    vessel.change_percent
                  ).toFixed(2)}
                  %
                </div>

                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "9px",
                    marginTop: "3px",
                  }}
                >
                  vs current forecast
                </div>
              </div>
            </div>

            {/* VESSEL DIMENSIONS */}
            <div
              style={{
                display: "flex",
                gap: "18px",
                flexWrap: "wrap",
                marginTop: "13px",
                paddingTop: "12px",
                borderTop:
                  "1px solid rgba(82,102,130,0.18)",
                color: "#8192aa",
                fontSize: "10px",
              }}
            >
              <span>
                LOA:{" "}
                <strong>
                  {profile.loa_m ?? "—"} m
                </strong>
              </span>

              <span>
                Beam:{" "}
                <strong>
                  {profile.beam_m ?? "—"} m
                </strong>
              </span>

              <span>
                Draft:{" "}
                <strong>
                  {profile.draft_m ?? "—"} m
                </strong>
              </span>

              <span>
                Cargo:{" "}
                <strong>
                  {vessel.cargo_fit ||
                     "Included in forecast"}
                </strong>
              </span>
            </div>
            {/* CONSTRAINT CHECK */}
<div
  style={{
    marginTop: "9px",
    paddingTop: "9px",
    borderTop:
      "1px solid rgba(82,102,130,0.12)",
    color: "#8192aa",
    fontSize: "10px",
  }}
>
  <span>
    Infrastructure screen:{" "}
    <strong
      style={{
        color:
          portFit === "SUITABLE"
            ? "#4ade80"
            : "#fbbf24",
      }}
    >
      {portFit}
    </strong>
  </span>

  {Array.isArray(vessel.port_reasons) &&
    vessel.port_reasons.length > 0 && (
      <span>
        {" · "}
        {vessel.port_reasons.join(" · ")}
      </span>
    )}
</div>
            {/* DECISION FACTORS */}
{Array.isArray(vessel.factors) &&
  vessel.factors.length > 0 && (
    <div
      style={{
        marginTop: "12px",
        padding: "12px",
        borderRadius: "10px",
        background: "rgba(56,189,248,0.04)",
        border:
          "1px solid rgba(56,189,248,0.12)",
      }}
    >
      <div
        style={{
          color: "#7dd3fc",
          fontSize: "9px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          marginBottom: "7px",
        }}
      >
        DECISION FACTORS
      </div>

      <div
        style={{
          display: "grid",
          gap: "5px",
        }}
      >
        {vessel.factors.map(
          (factor, index) => (
            <div
              key={`${vessel.vessel}-factor-${index}`}
              style={{
                color: "#9aaac0",
                fontSize: "10px",
                lineHeight: "1.5",
              }}
            >
              • {factor}
            </div>
          )
        )}
      </div>
    </div>
  )}

            {/* PORT REASONS */}
            {Array.isArray(
              vessel.port_reasons
            ) &&
            vessel.port_reasons.length > 0 && (
              <div
                style={{
                  marginTop: "10px",
                  color: "#fbbf24",
                  fontSize: "10px",
                }}
              >
                {vessel.port_reasons.join(
                  " · "
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
      </Card>
    </>
  );
}

/* =========================================================
   VOYAGE DIGITAL TWIN
========================================================= */

function VoyageDigitalTwinPage({
  forecastData,
  shipment,
}) {
  return (
    <>
      <PageHeader
        title="Voyage Digital Twin"
        description="Digital representation of the selected voyage and its predicted freight exposure."
      />

      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: "20px",
          }}
        >
          <MetricCard
            title="Forecast Rate"
            value={formatMoney(
              forecastData.forecastRate
            )}
            subtitle="USD / MT"
            icon={Gauge}
          />

          <MetricCard
            title="Risk"
            value={
              forecastData.riskLevel || "—"
            }
            subtitle="Forecast risk"
            icon={ShieldAlert}
          />

          <MetricCard
            title="Cargo"
            value={`${formatNumber(
              shipment.quantity
            )} MT`}
            subtitle={shipment.cargo}
            icon={Boxes}
          />

          <MetricCard
            title="Freight Exposure"
            value={formatMoney(
              forecastData.forecastExposure
            )}
            subtitle="Forecast rate × quantity"
            icon={Target}
          />
        </div>
      </Card>
            {forecastData.idleScenario && (
        <Card style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <Activity size={21} />

            <div
              style={{
                fontSize: "17px",
                fontWeight: "750",
              }}
            >
              Idle Scenario Management
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ color: "#8192aa", fontSize: "11px" }}>
                Employment Status
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "19px",
                  fontWeight: "800",
                  color:
                    forecastData.idleScenario.status ===
                    "HIGH IDLE RISK"
                      ? "#fb7185"
                      : forecastData.idleScenario.status ===
                        "IDLE RISK"
                      ? "#fbbf24"
                      : "#4ade80",
                }}
              >
                {forecastData.idleScenario.status}
              </div>
            </div>

            <div>
              <div style={{ color: "#8192aa", fontSize: "11px" }}>
                Idle Risk Score
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "22px",
                  fontWeight: "800",
                }}
              >
                {forecastData.idleScenario.idle_score}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#8192aa",
                  }}
                >
                  {" "}
                  / 100
                </span>
              </div>
            </div>

            <div>
              <div style={{ color: "#8192aa", fontSize: "11px" }}>
                Demand − Supply Gap
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "20px",
                  fontWeight: "800",
                }}
              >
                {forecastData.idleScenario.demand_supply_gap}
              </div>
            </div>

            <div>
              <div style={{ color: "#8192aa", fontSize: "11px" }}>
                Recommended Action
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  color: "#d7e0ec",
                }}
              >
                {forecastData.idleScenario.recommended_action}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card style={{ marginTop: "20px" }}>
        <div
          style={{
            fontSize: "17px",
            fontWeight: "750",
            marginBottom: "18px",
          }}
        >
          Voyage Freight Projection
        </div>

        <ForecastChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}

/* =========================================================
   PORT INTELLIGENCE
========================================================= */

function PortIntelligencePage({
  portComparison,
  loading,
}) {
  const chartData = portComparison.map(
    (item) => ({
      name: item.port,
      rate: Number(item.forecast_rate) || 0,
    })
  );

  const getPortStatus = (port) => {
    const status =
      port.constraint_status ||
      port.port_status ||
      "CHECK REQUIRED";

    const normalized = String(status).toUpperCase();

    if (
      normalized === "CLEAR" ||
      normalized === "SUITABLE"
    ) {
      return {
        label: "SUITABLE",
        color: "#4ade80",
        background: "rgba(74,222,128,0.10)",
        border: "rgba(74,222,128,0.25)",
      };
    }

    if (
      normalized === "WARNING" ||
      normalized === "LIMITED"
    ) {
      return {
        label: "LIMITED",
        color: "#fbbf24",
        background: "rgba(251,191,36,0.10)",
        border: "rgba(251,191,36,0.25)",
      };
    }

    return {
      label: "CHECK REQUIRED",
      color: "#fb7185",
      background: "rgba(251,113,133,0.10)",
      border: "rgba(251,113,133,0.25)",
    };
  };

  return (
    <>
      <PageHeader
        title="Port Intelligence"
        description="Compare East Coast Indian destination ports using the same shipment scenario."
      />

      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            marginBottom: "8px",
          }}
        >
          <Map size={21} />

          <div
            style={{
              fontSize: "17px",
              fontWeight: "800",
            }}
          >
            East Coast Port Comparison
          </div>
        </div>

        <div
          style={{
            color: "#8192aa",
            fontSize: "12px",
            marginBottom: "20px",
          }}
        >
          Destination-port comparison is generated
          by rerunning the model for each available
          port.
        </div>

        {loading && (
          <div
            style={{
              color: "#7dd3fc",
              fontSize: "12px",
              marginBottom: "15px",
            }}
          >
            Calculating port scenarios...
          </div>
        )}

        {portComparison.length === 0 ? (
          <EmptyChart message="Generate a forecast first to compare East Coast ports." />
        ) : (
          <>
            <ComparisonBarChart
              data={chartData}
              dataKey="rate"
              label="Forecast Rate"
            />

            <div
              style={{
                display: "grid",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              {portComparison.map((port) => {
                const status = getPortStatus(port);

                return (
                  <div
                    key={port.port}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr 1fr 120px",
                      gap: "15px",
                      alignItems: "center",
                      padding: "14px",
                      borderRadius: "11px",
                      background:
                        "rgba(255,255,255,0.025)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "14px",
                        }}
                      >
                        {port.port}
                      </div>

                      <div
                        style={{
                          color: "#8192aa",
                          fontSize: "11px",
                          marginTop: "4px",
                        }}
                      >
                        East Coast India
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: "#8192aa",
                          fontSize: "10px",
                          marginBottom: "4px",
                        }}
                      >
                        FORECAST RATE
                      </div>

                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "15px",
                        }}
                      >
                        {formatMoney(
                          port.forecast_rate
                        )}{" "}
                        / MT
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: "#8192aa",
                          fontSize: "10px",
                          marginBottom: "4px",
                        }}
                      >
                        FORECAST RANGE
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        {formatMoney(
                          port.minimum_rate
                        )}
                        {" – "}
                        {formatMoney(
                          port.maximum_rate
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#8192aa",
                          marginBottom: "4px",
                        }}
                      >
                        CHANGE
                      </div>

                      <div
                        style={{
                          fontWeight: "800",
                          color:
                            Number(
                              port.change_percent
                            ) > 0
                              ? "#fb7185"
                              : "#4ade80",
                        }}
                      >
                        {formatPercent(
                          port.change_percent
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "24px",
                paddingTop: "18px",
                borderTop:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: "800",
                  marginBottom: "6px",
                }}
              >
                Port Constraint Intelligence
              </div>

              <div
                style={{
                  color: "#8192aa",
                  fontSize: "12px",
                  marginBottom: "15px",
                }}
              >
                Vessel suitability is checked against
                destination-port constraints before
                charter decisions are finalized.
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "10px",
                }}
              >
                {portComparison.map((port) => {
                  const status = getPortStatus(port);

                  return (
                    <div
                      key={`constraint-${port.port}`}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "15px",
                        padding: "13px 14px",
                        borderRadius: "11px",
                        background:
                          "rgba(255,255,255,0.025)",
                        border:
                          `1px solid ${status.border}`,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "750",
                            fontSize: "13px",
                          }}
                        >
                          {port.port}
                        </div>

                        <div
                          style={{
                            color: "#8192aa",
                            fontSize: "11px",
                            marginTop: "4px",
                          }}
                        >
                          Draft / LOA / beam /
                          cargo-handling check
                        </div>
                      </div>

                      <div
                        style={{
                          padding:
                            "6px 10px",
                          borderRadius: "8px",
                          color: status.color,
                          background:
                            status.background,
                          border:
                            `1px solid ${status.border}`,
                          fontSize: "10px",
                          fontWeight: "800",
                          letterSpacing:
                            "0.5px",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {status.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
/* =========================================================
   DECISION HUB
========================================================= */

function DecisionHubPage({
  forecastData,
  shipment,
}) {
  const status = getDecisionStatus(
    forecastData.changePercent,
    forecastData.riskLevel
  );

  return (
    <>
      <PageHeader
        title="Decision Hub"
        description="Consolidated decision-support view for freight, chartering and procurement."
      />

      <Card
        style={{
          border: `1px solid ${status.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <BrainCircuit size={28} />

          <div>
            <div
              style={{
                fontSize: "19px",
                fontWeight: "800",
              }}
            >
              Decision Intelligence
            </div>

            <div
              style={{
                marginTop: "5px",
                color: "#8292aa",
                fontSize: "12px",
              }}
            >
              {shipment.origin} ·{" "}
              {shipment.originPort} → India ·{" "}
              {shipment.destination}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            borderRadius: "12px",
            background: status.background,
            border:
              `1px solid ${status.border}`,
          }}
        >
          <div
            style={{
              color: status.color,
              fontSize: "15px",
              fontWeight: "850",
            }}
          >
            {status.label}
          </div>

          <div
            style={{
              color: "#9aaac0",
              fontSize: "12px",
              marginTop: "5px",
            }}
          >
            Forecast movement{" "}
            {formatPercent(
              forecastData.changePercent
            )}{" "}
            · Risk{" "}
            {forecastData.riskLevel || "—"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(190px,1fr))",
            gap: "15px",
            marginTop: "25px",
          }}
        >
          <MetricCard
            title="Freight Rate"
            value={formatMoney(
              forecastData.forecastRate
            )}
            subtitle="USD / MT"
            icon={Gauge}
          />

          <MetricCard
            title="Market Risk"
            value={
              forecastData.riskLevel || "—"
            }
            subtitle="Model-derived"
            icon={ShieldAlert}
          />

          <MetricCard
            title="Forecast Change"
            value={formatPercent(
              forecastData.changePercent
            )}
            subtitle="Current vs forecast"
            icon={Activity}
          />

          <MetricCard
            title="Freight Exposure"
            value={formatMoney(
              forecastData.forecastExposure
            )}
            subtitle="Total forecast exposure"
            icon={Target}
          />
        </div>
      </Card>

      <Card style={{ marginTop: "20px" }}>
        <div
          style={{
            fontSize: "17px",
            fontWeight: "750",
            marginBottom: "18px",
          }}
        >
          Decision Support Forecast
        </div>

        <ForecastChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [loading, setLoading] =
    useState(false);

  const [shipment, setShipment] =
    useState({
      origin: "Australia",
      originPort: "Newcastle",
      destinationCountry: "India",
      destination: "Paradip",
      cargo: "Coal",
      vessel: "Panamax",
      quantity: 75000,
      horizon: 30,

      /* Market inputs */
      fuelPrice: 650,
      commodityPrice: 120,
      portCongestion: 40,
      demandIndex: 75,
      supplyIndex: 60,
    });

  const [forecastData, setForecastData] =
    useState({
      currentRate: null,
      forecastRate: null,
      changePercent: null,
      volatility: null,
      riskLevel: null,
      forecastExposure: null,
      forecastSeries: [],
      idleScenario: null,
      scenarioResult: null,
    });
    

  const [vesselComparison, setVesselComparison] =
    useState([]);

  const [portComparison, setPortComparison] =
    useState([]);

  /* =======================================================
     MAIN FORECAST
  ======================================================= */

  async function generateForecast() {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/forecast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            origin: shipment.origin,
            origin_port: shipment.originPort,

            destination_country:
              shipment.destinationCountry,

            destination:
              shipment.destination,

            cargo: shipment.cargo,

            vessel: shipment.vessel,

            quantity: Number(
              shipment.quantity
            ),

            horizon: Number(
              shipment.horizon
            ),

            fuel_price: Number(
              shipment.fuelPrice
            ),

            commodity_price: Number(
              shipment.commodityPrice
            ),

            port_congestion: Number(
              shipment.portCongestion
            ),

            demand_index: Number(
              shipment.demandIndex
            ),

            supply_index: Number(
              shipment.supplyIndex
            ),
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `API error ${response.status}: ${errorText}`
        );
      }

      const data =
        await response.json();

      setForecastData({
        currentRate:
          data.forecast?.current_rate ??
          null,

        forecastRate:
          data.forecast?.forecast_rate ??
          null,

        changePercent:
          data.forecast?.change_percent ??
          null,

        volatility:
          data.risk?.volatility ??
          null,

        riskLevel:
          data.risk?.level ??
          null,

        forecastExposure:
          data.exposure?.forecast_total ??
          data.forecast_exposure ??
          null,

        forecastSeries:
  data.forecast_series || [],

idleScenario:
  data.idle_scenario || null,

scenarioResult: null,
      });

      setVesselComparison([]);
      setPortComparison([]);
    } catch (error) {
      console.error(
        "Forecast error:",
        error
      );

      alert(
        "Could not connect to PORTWISE AI backend. Make sure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     WHAT-IF SCENARIO
  ======================================================= */

  async function runScenario({
  quantity,
  fuelScenario,
  portScenario,
  demandScenario,
}) {
  try {
    setLoading(true);

    // Convert scenario selections (-1 / 0 / +1)
    // into actual market values.
    const fuelPrice =
      Number(shipment.fuelPrice) +
      Number(fuelScenario) * 50;

    const portCongestion =
      Math.max(
        0,
        Math.min(
          100,
          Number(shipment.portCongestion) +
            Number(portScenario) * 20
        )
      );

    const demandIndex =
      Math.max(
        0,
        Math.min(
          100,
          Number(shipment.demandIndex) +
            Number(demandScenario) * 15
        )
      );

    const requestBody = {
      origin: shipment.origin,

      origin_port:
        shipment.originPort,

      destination_country:
        shipment.destinationCountry,

      destination:
        shipment.destination,

      cargo: shipment.cargo,

      vessel: shipment.vessel,

      quantity: Number(quantity),

      horizon: Number(
        shipment.horizon
      ),

      fuel_price: fuelPrice,

      commodity_price: Number(
        shipment.commodityPrice
      ),

      port_congestion:
        portCongestion,

      demand_index:
        demandIndex,

      supply_index: Number(
        shipment.supplyIndex
      ),
    };

    console.log(
      "WHAT-IF REQUEST:",
      requestBody
    );

    const response = await fetch(
      `${API_URL}/api/forecast/scenario`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          requestBody
        ),
      }
    );

    const data =
      await response.json();

    console.log(
      "WHAT-IF RESPONSE:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data?.detail
          ? JSON.stringify(
              data.detail
            )
          : `Scenario API error ${response.status}`
      );
    }

    setForecastData(
      (previous) => ({
        ...previous,

        scenarioResult: data,
      })
    );
  } catch (error) {
    console.error(
      "Scenario error:",
      error
    );

    alert(
      `What-If scenario failed.\n\n${error.message}`
    );
  } finally {
    setLoading(false);
  }
}

  /* =======================================================
     VESSEL COMPARISON
  ======================================================= */

  async function loadVesselComparison() {
  try {
    setLoading(true);

    const response = await fetch(
      `${API_URL}/api/compare/vessels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: shipment.origin,
          origin_port: shipment.originPort,
          destination_country:
            shipment.destinationCountry,
          destination: shipment.destination,
          cargo: shipment.cargo,
          vessel: shipment.vessel,
          quantity: Number(shipment.quantity),
          horizon: Number(shipment.horizon),
          fuel_price: Number(shipment.fuelPrice),
          commodity_price: Number(shipment.commodityPrice),
          port_congestion: Number(shipment.portCongestion),
          demand_index: Number(shipment.demandIndex),
          supply_index: Number(shipment.supplyIndex),
        }),
      }
    );

    const data = await response.json();

    console.log("VESSEL COMPARISON RESPONSE:", data);

    if (!response.ok) {
      throw new Error(
        data?.detail
          ? JSON.stringify(data.detail)
          : `Vessel API error: ${response.status}`
      );
    }

    if (!Array.isArray(data.vessels)) {
      throw new Error(
        "Backend did not return a vessels array."
      );
    }

    setVesselComparison(data.vessels);
  } catch (error) {
    console.error(
      "Vessel comparison error:",
      error
    );

    setVesselComparison([]);

    alert(
      `Vessel comparison failed.\n\n${error.message}`
    );
  } finally {
    setLoading(false);
  }
}

  /* =======================================================
     PORT COMPARISON
  ======================================================= */

  async function loadPortComparison() {
  try {
    setLoading(true);

    const response = await fetch(
      `${API_URL}/api/compare/ports`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: shipment.origin,
          origin_port: shipment.originPort,
          destination_country:
            shipment.destinationCountry,
          destination: shipment.destination,
          cargo: shipment.cargo,
          vessel: shipment.vessel,
          quantity: Number(shipment.quantity),
          horizon: Number(shipment.horizon),
          fuel_price: Number(shipment.fuelPrice),
          commodity_price: Number(shipment.commodityPrice),
          port_congestion: Number(shipment.portCongestion),
          demand_index: Number(shipment.demandIndex),
          supply_index: Number(shipment.supplyIndex),
        }),
      }
    );

    const data = await response.json();

    console.log(
      "PORT COMPARISON RESPONSE:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data?.detail
          ? JSON.stringify(data.detail)
          : `Port API error: ${response.status}`
      );
    }

    if (!Array.isArray(data.ports)) {
      throw new Error(
        "Backend did not return a ports array."
      );
    }

    setPortComparison(data.ports);
  } catch (error) {
    console.error(
      "Port comparison error:",
      error
    );

    setPortComparison([]);

    alert(
      `Port comparison failed.\n\n${error.message}`
    );
  } finally {
    setLoading(false);
  }
}
  /* =======================================================
     PAGE RENDER
  ======================================================= */

  function renderActivePage() {
    switch (activePage) {
      case "Dashboard":
        return (
          <DashboardPage
            forecastData={forecastData}
            shipment={shipment}
            onGenerate={generateForecast}
            loading={loading}
          />
        );

      case "Freight Forecast":
        return (
          <FreightForecastPage
            forecastData={forecastData}
            shipment={shipment}
            setShipment={setShipment}
            onGenerate={generateForecast}
            loading={loading}
          />
        );

      case "What-If Simulator":
        return (
          <WhatIfPage
            forecastData={forecastData}
            shipment={shipment}
            onScenario={runScenario}
            loading={loading}
          />
        );

      case "CharterSense":
        return (
          <CharterSensePage
            forecastData={forecastData}
          />
        );

      case "ProcureSense":
        return (
          <ProcureSensePage
            forecastData={forecastData}
            shipment={shipment}
          />
        );

      case "RiskRadar":
        return (
          <RiskRadarPage
            forecastData={forecastData}
          />
        );

      case "VesselMatch":
  return (
    <VesselMatchPage
      vesselComparison={vesselComparison}
      loading={loading}
      shipment={shipment}
      onCompare={loadVesselComparison}
    />
  );

      case "Voyage Digital Twin":
        return (
          <VoyageDigitalTwinPage
            forecastData={forecastData}
            shipment={shipment}
          />
        );

      case "Port Intelligence":
        return (
          <PortIntelligencePage
            portComparison={
              portComparison
            }
            loading={loading}
          />
        );

      case "Decision Hub":
        return (
          <DecisionHubPage
            forecastData={forecastData}
            shipment={shipment}
          />
        );

      default:
        return null;
    }
  }

  /* =======================================================
     AUTOMATIC COMPARISON LOADING
  ======================================================= */

  useEffect(() => {
  if (activePage === "VesselMatch") {
    loadVesselComparison();
  }

  if (activePage === "Port Intelligence") {
    loadPortComparison();
  }
}, [activePage]);

  /* =======================================================
     APP UI
  ======================================================= */

  return (
    <div
      style={{
        minHeight: "100vh",

        background:
          "radial-gradient(circle at top right, rgba(14,116,144,0.12), transparent 30%), #07111f",

        color: "#ffffff",

        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #07111f;
          }

          button,
          input,
          select {
            font-family: inherit;
          }

          button:disabled {
            opacity: 0.6;
            cursor: not-allowed !important;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          ::-webkit-scrollbar {
            width: 7px;
          }

          ::-webkit-scrollbar-track {
            background: #07111f;
          }

          ::-webkit-scrollbar-thumb {
            background: #263852;
            border-radius: 10px;
          }

          @media (max-width: 850px) {
            main {
              padding: 20px !important;
            }

            aside {
              width: 220px !important;
            }
          }

          @media (max-width: 600px) {
            main {
              padding: 15px !important;
            }

            aside {
              display: none !important;
            }
          }
        `}
      </style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
        }}
      >
        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside
          style={{
            width: "260px",
            flexShrink: 0,
            borderRight:
              "1px solid rgba(74,95,124,0.25)",
            background:
              "linear-gradient(180deg,#091625,#07111f)",
            padding: "22px 14px",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding:
                "7px 12px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
              }}
            >
              <div
                style={{
                  width: "39px",
                  height: "39px",
                  borderRadius: "11px",
                  background:
                    "linear-gradient(135deg,#0284c7,#2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 8px 25px rgba(37,99,235,0.25)",
                }}
              >
                <Anchor size={21} />
              </div>

              <div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "850",
                  }}
                >
                  PORTWISE
                </div>

                <div
                  style={{
                    fontSize: "9px",
                    letterSpacing: "2px",
                    color: "#6f829e",
                    marginTop: "2px",
                  }}
                >
                  MARITIME INTELLIGENCE
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              color: "#526681",
              fontSize: "9px",
              letterSpacing: "1.5px",
              fontWeight: "800",
              padding:
                "0 12px 9px",
            }}
          >
            INTELLIGENCE
          </div>

          {sidebarItems.map((item) => {
            const Icon = item.icon;

            const active =
              activePage === item.name;

            return (
              <button
                key={item.name}
                onClick={() =>
                  setActivePage(item.name)
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "11px 12px",
                  marginBottom: "3px",
                  borderRadius: "9px",
                  border: active
                    ? "1px solid rgba(56,189,248,0.18)"
                    : "1px solid transparent",
                  background: active
                    ? "rgba(14,116,144,0.15)"
                    : "transparent",
                  color: active
                    ? "#7dd3fc"
                    : "#7f91aa",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "12px",
                  fontWeight: active
                    ? "700"
                    : "550",
                }}
              >
                <Icon size={17} />

                {item.name}
              </button>
            );
          })}

          <div
            style={{
              marginTop: "28px",
              padding:
                "15px 12px",
              borderRadius: "12px",
              background:
                "rgba(255,255,255,0.025)",
              border:
                "1px solid rgba(74,95,124,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                color: "#4ade80",
                fontSize: "11px",
                fontWeight: "750",
              }}
            >
              <CheckCircle2 size={14} />

              MODEL ONLINE
            </div>

            <div
              style={{
                color: "#687b96",
                fontSize: "10px",
                marginTop: "7px",
                lineHeight: "1.5",
              }}
            >
              XGBoost forecasting engine
            </div>
          </div>
        </aside>

        {/* =================================================
            MAIN
        ================================================= */}

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "32px",
            maxWidth: "1600px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "25px",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                color: "#526681",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "1px",
              }}
            >
              PORTWISE AI /{" "}
              {activePage.toUpperCase()}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#71849f",
                fontSize: "11px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background:
                    "#4ade80",
                  boxShadow:
                    "0 0 10px rgba(74,222,128,0.7)",
                }}
              />

              XGBOOST ENGINE
            </div>
          </div>

          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
