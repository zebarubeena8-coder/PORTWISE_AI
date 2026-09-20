import React, { useMemo, useState } from "react";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  LayoutDashboard,
  TrendingUp,
  SlidersHorizontal,
  Ship,
  ShoppingCart,
  ShieldAlert,
  Anchor,
  Waves,
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
  AlertTriangle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Freight Forecast", icon: TrendingUp },
  { name: "What-If Simulator", icon: SlidersHorizontal },
  { name: "CharterSense", icon: Ship },
  { name: "ProcureSense", icon: ShoppingCart },
  { name: "RiskRadar", icon: ShieldAlert },
  { name: "VesselMatch", icon: Anchor },
  { name: "Voyage Digital Twin", icon: Waves },
  { name: "Port Intelligence", icon: Map },
  { name: "Decision Hub", icon: Target },
];

const originOptions = [
  "Australia",
  "Indonesia",
  "South Africa",
  "Brazil",
  "USA",
];

const destinationOptions = [
  "Paradip",
  "Visakhapatnam",
  "Chennai",
  "Krishnapatnam",
  "Kakinada",
];

const cargoOptions = [
  "Coal",
  "Iron Ore",
  "Limestone",
  "Grain",
  "Fertilizer",
];

const vesselOptions = [
  "Panamax",
  "Supramax",
  "Capesize",
  "Handysize",
];

function formatMoney(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "$0";
  }

  return `$${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

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
  message = "Generate a forecast to view the chart.",
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

function ForecastChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyChart />;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={data}
        margin={{ top: 15, right: 20, left: 5, bottom: 5 }}
      >
        <defs>
          <linearGradient
            id="freightArea"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopOpacity={0.35} />
            <stop offset="100%" stopOpacity={0.02} />
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
          tickFormatter={(value) => {
            if (!value) return "";
            return value.slice(5);
          }}
        />

        <YAxis
          tick={{
            fill: "#8192aa",
            fontSize: 11,
          }}
          domain={["auto", "auto"]}
          tickFormatter={(value) => `$${value}`}
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
            "Freight Rate",
          ]}
          labelFormatter={(label) => `Date: ${label}`}
        />

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

function FreightLineChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyChart />;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ top: 15, right: 20, left: 5, bottom: 5 }}
      >
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
          tickFormatter={(value) => value.slice(5)}
        />

        <YAxis
          tick={{
            fill: "#8192aa",
            fontSize: 11,
          }}
          domain={["auto", "auto"]}
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
            "Predicted Rate",
          ]}
        />

        <Line
          type="monotone"
          dataKey="rate"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ScenarioBarChart({
  baseCost,
  scenarioCost,
}) {
  const data = [
    {
      name: "Base",
      cost: Number(baseCost.toFixed(0)),
    },
    {
      name: "What-If",
      cost: Number(scenarioCost.toFixed(0)),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
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
            formatMoney(value),
            "Estimated Cost",
          ]}
        />

        <Bar
          dataKey="cost"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
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
        onChange={(e) =>
          onChange(e.target.value)
        }
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
          <option
            key={option}
            value={option}
          >
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
        onChange={(e) =>
          onChange(e.target.value)
        }
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
        background:
          "rgba(255,255,255,0.025)",
        border:
          "1px solid rgba(82,102,130,0.25)",
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
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
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

function InfoBlock({
  title,
  value,
}) {
  return (
    <div>
      <div
        style={{
          color: "#8292aa",
          fontSize: "11px",
          textTransform: "uppercase",
          fontWeight: "700",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "8px",
          color: "#ffffff",
          fontSize: "23px",
          fontWeight: "800",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DecisionItem({
  title,
  value,
}) {
  return (
    <div
      style={{
        padding: "17px",
        borderRadius: "12px",
        background:
          "rgba(255,255,255,0.025)",
        border:
          "1px solid rgba(82,102,130,0.25)",
      }}
    >
      <div
        style={{
          color: "#8292aa",
          fontSize: "11px",
          textTransform: "uppercase",
          fontWeight: "700",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "9px",
          fontSize: "21px",
          fontWeight: "800",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================
   DASHBOARD
========================= */

function DashboardPage({
  forecastData,
  onGenerate,
  loading,
}) {
  return (
    <>
      <PageHeader
        title="Maritime Decision Intelligence"
        description="Monitor freight markets, forecast rates, and optimize vessel chartering decisions."
      />

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
            forecastData.changePercent < 0
          }
        />

        <MetricCard
          title="Market Risk"
          value={forecastData.riskLevel}
          subtitle={`Volatility ${Number(
            forecastData.volatility || 0
          ).toFixed(2)}`}
          icon={ShieldAlert}
        />

        <MetricCard
          title="Savings Potential"
          value={formatMoney(
            forecastData.estimatedSavings
          )}
          subtitle="Estimated model output"
          icon={Target}
        />
      </div>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "750",
              }}
            >
              Freight Market Forecast
            </div>

            <div
              style={{
                marginTop: "5px",
                color: "#8091aa",
                fontSize: "12px",
              }}
            >
              Live forecast output from the XGBoost
              forecasting engine
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

        <ForecastChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}

/* =========================
   FREIGHT FORECAST
========================= */

function FreightForecastPage({
  forecastData,
  shipment,
  setShipment,
  onGenerate,
  loading,
}) {
  return (
    <>
      <PageHeader
        title="Freight Forecast"
        description="Generate route-specific freight rate forecasts using the XGBoost model."
      />

      <Card>
        <div
          style={{
            fontSize: "17px",
            fontWeight: "750",
            marginBottom: "18px",
          }}
        >
          Forecast Configuration
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
            label="Origin"
            value={shipment.origin}
            options={originOptions}
            onChange={(value) =>
              setShipment({
                ...shipment,
                origin: value,
              })
            }
          />

          <SelectField
            label="Destination"
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
            label="Vessel"
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
            options={[7, 15, 30, 60, 90]}
            onChange={(value) =>
              setShipment({
                ...shipment,
                horizon: Number(value),
              })
            }
          />
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
            : "Generate Forecast"}
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
          title="Change"
          value={`${Number(
            forecastData.changePercent || 0
          ).toFixed(2)}%`}
          subtitle="Current vs forecast"
          icon={Activity}
        />

        <MetricCard
          title="Risk"
          value={forecastData.riskLevel}
          subtitle={`Volatility ${Number(
            forecastData.volatility || 0
          ).toFixed(2)}`}
          icon={ShieldAlert}
        />
      </div>

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
            selected forecast horizon
          </div>
        </div>

        <FreightLineChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}

/* =========================
   WHAT IF SIMULATOR
========================= */

function WhatIfPage({
  forecastData,
  shipment,
  setShipment,
  onGenerate,
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

  const baseRate =
    Number(forecastData.forecastRate) || 0;

  /*
    These scenario factors are frontend decision-support
    adjustments.

    They do NOT claim that the current backend XGBoost
    model received these changed values.

    Later, we can connect them directly to the model.
  */

  const fuelImpact =
    fuelScenario === -1
      ? -0.025
      : fuelScenario === 1
      ? 0.035
      : 0;

  const portImpact =
    portScenario === -1
      ? -0.02
      : portScenario === 1
      ? 0.04
      : 0;

  const demandImpact =
    demandScenario === -1
      ? -0.025
      : demandScenario === 1
      ? 0.035
      : 0;

  const scenarioRate = Math.max(
    0,
    baseRate *
      (1 +
        fuelImpact +
        portImpact +
        demandImpact)
  );

  const baseCost =
    baseQuantity * baseRate;

  const scenarioCost =
    scenarioQuantity * scenarioRate;

  const costDifference =
    scenarioCost - baseCost;

  const savings =
    baseCost - scenarioCost;

  const impactPercent =
    baseCost > 0
      ? (costDifference / baseCost) * 100
      : 0;

  const scenarioRisk =
    Math.abs(
      fuelImpact +
        portImpact +
        demandImpact
    ) > 0.06
      ? "High"
      : Math.abs(
          fuelImpact +
            portImpact +
            demandImpact
        ) > 0.025
      ? "Moderate"
      : forecastData.riskLevel;

  const scenarioSeries = useMemo(() => {
    if (
      !forecastData.forecastSeries ||
      forecastData.forecastSeries.length === 0
    ) {
      return [];
    }

    const adjustment =
      1 +
      fuelImpact +
      portImpact +
      demandImpact;

    return forecastData.forecastSeries.map(
      (point) => ({
        ...point,
        rate: Number(
          (Number(point.rate) * adjustment).toFixed(
            2
          )
        ),
      })
    );
  }, [
    forecastData.forecastSeries,
    fuelImpact,
    portImpact,
    demandImpact,
  ]);

  function runScenario() {
    setShipment({
      ...shipment,
      quantity: scenarioQuantity,
    });

    setTimeout(() => {
      onGenerate();
    }, 100);
  }

  return (
    <>
      <PageHeader
        title="What-If Simulator"
        description="Stress-test shipment assumptions and compare a base voyage with an alternative scenario."
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
          Adjust the operating assumptions and
          immediately see the estimated financial
          impact.
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
              {
                value: -1,
                label: "Lower",
              },
              {
                value: 0,
                label: "Normal",
              },
              {
                value: 1,
                label: "Higher",
              },
            ]}
          />

          <ScenarioSelector
            icon={Factory}
            title="Port Congestion"
            value={portScenario}
            onChange={setPortScenario}
            options={[
              {
                value: -1,
                label: "Low",
              },
              {
                value: 0,
                label: "Normal",
              },
              {
                value: 1,
                label: "High",
              },
            ]}
          />

          <ScenarioSelector
            icon={TrendingUp}
            title="Market Demand"
            value={demandScenario}
            onChange={setDemandScenario}
            options={[
              {
                value: -1,
                label: "Weak",
              },
              {
                value: 0,
                label: "Normal",
              },
              {
                value: 1,
                label: "Strong",
              },
            ]}
          />
        </div>

        <button
          onClick={runScenario}
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
          Run What-If Scenario
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
          subtitle={`${impactPercent >= 0 ? "+" : ""}${impactPercent.toFixed(
            2
          )}%`}
          icon={
            costDifference <= 0
              ? ArrowDownRight
              : ArrowUpRight
          }
          positive={costDifference <= 0}
        />

        <MetricCard
          title="Scenario Risk"
          value={scenarioRisk}
          subtitle="Scenario assessment"
          icon={ShieldAlert}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(280px,1fr))",
          gap: "18px",
          marginTop: "20px",
        }}
      >
        <Card>
          <div
            style={{
              color: "#8192aa",
              fontSize: "11px",
              textTransform: "uppercase",
              fontWeight: "700",
            }}
          >
            Base Scenario
          </div>

          <div
            style={{
              fontSize: "29px",
              fontWeight: "850",
              marginTop: "10px",
            }}
          >
            {formatMoney(baseRate)}
          </div>

          <div
            style={{
              marginTop: "6px",
              color: "#8192aa",
              fontSize: "12px",
            }}
          >
            Forecast rate / MT
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "13px",
              borderRadius: "10px",
              background:
                "rgba(255,255,255,0.025)",
            }}
          >
            Quantity:{" "}
            <strong>
              {formatNumber(baseQuantity)} MT
            </strong>
          </div>
        </Card>

        <Card
          style={{
            border:
              "1px solid rgba(56,189,248,0.35)",
          }}
        >
          <div
            style={{
              color: "#7dd3fc",
              fontSize: "11px",
              textTransform: "uppercase",
              fontWeight: "700",
            }}
          >
            What-If Scenario
          </div>

          <div
            style={{
              fontSize: "29px",
              fontWeight: "850",
              marginTop: "10px",
            }}
          >
            {formatMoney(scenarioRate)}
          </div>

          <div
            style={{
              marginTop: "6px",
              color: "#8192aa",
              fontSize: "12px",
            }}
          >
            Adjusted scenario rate / MT
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "13px",
              borderRadius: "10px",
              background:
                "rgba(56,189,248,0.07)",
            }}
          >
            Quantity:{" "}
            <strong>
              {formatNumber(scenarioQuantity)} MT
            </strong>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "750",
              }}
            >
              Scenario Cost Comparison
            </div>

            <div
              style={{
                marginTop: "5px",
                color: "#8091aa",
                fontSize: "12px",
              }}
            >
              Estimated total freight cost under
              each scenario
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color:
                savings >= 0
                  ? "#4ade80"
                  : "#fb7185",
              fontWeight: "750",
              fontSize: "13px",
            }}
          >
            {savings >= 0 ? (
              <ArrowDownRight size={17} />
            ) : (
              <ArrowUpRight size={17} />
            )}

            {savings >= 0
              ? `${formatMoney(savings)} potential savings`
              : `${formatMoney(
                  Math.abs(savings)
                )} additional cost`}
          </div>
        </div>

        <ScenarioBarChart
          baseCost={baseCost}
          scenarioCost={scenarioCost}
        />
      </Card>

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
          Base forecast adjusted for the selected
          scenario assumptions.
        </div>

        <ForecastChart data={scenarioSeries} />
      </Card>

      <Card
        style={{
          marginTop: "20px",
          border:
            "1px solid rgba(251,191,36,0.18)",
          background:
            "linear-gradient(145deg, rgba(36,30,18,0.7), rgba(15,22,32,0.96))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <AlertTriangle
            size={21}
            style={{
              flexShrink: 0,
              marginTop: "2px",
            }}
          />

          <div>
            <div
              style={{
                fontWeight: "750",
                fontSize: "14px",
              }}
            >
              Scenario Analysis Note
            </div>

            <div
              style={{
                marginTop: "7px",
                color: "#9aaac0",
                fontSize: "12px",
                lineHeight: "1.6",
              }}
            >
              The current XGBoost API uses its existing
              internal market inputs. Fuel, congestion
              and demand controls on this screen are
              scenario-analysis adjustments and are not
              yet direct model inputs.
            </div>
          </div>
        </div>
      </Card>
    </>
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
        background:
          "rgba(255,255,255,0.025)",
        border:
          "1px solid rgba(82,102,130,0.25)",
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
          gridTemplateColumns:
            "repeat(3,1fr)",
          gap: "7px",
          marginTop: "14px",
        }}
      >
        {options.map((option) => {
          const active =
            value === option.value;

          return (
            <button
              key={option.value}
              onClick={() =>
                onChange(option.value)
              }
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

/* =========================
   CHARTERSENSE
========================= */

function CharterSensePage({
  forecastData,
}) {
  return (
    <>
      <PageHeader
        title="CharterSense"
        description="Charter planning intelligence based on freight market conditions."
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
            Charter Signal
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "#8da0ba",
              fontSize: "13px",
            }}
          >
            Based on the current forecast trajectory.
          </div>

          <div
            style={{
              marginTop: "18px",
              fontSize: "24px",
              fontWeight: "800",
            }}
          >
            {forecastData.changePercent < 0
              ? "Monitor"
              : "Review"}
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
            Market Rate
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
      </div>

      <Card style={{ marginTop: "20px" }}>
        <div
          style={{
            fontWeight: "750",
            fontSize: "17px",
            marginBottom: "18px",
          }}
        >
          Forecast Supporting Charter Decision
        </div>

        <ForecastChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}

/* =========================
   PROCURESENSE
========================= */

function ProcureSensePage({
  forecastData,
}) {
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
              fontSize: "25px",
              fontWeight: "800",
              marginTop: "15px",
            }}
          >
            {forecastData.changePercent < 0
              ? "Favorable"
              : "Watch"}
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
            Forecast Horizon
          </div>

          <div
            style={{
              fontSize: "25px",
              fontWeight: "800",
              marginTop: "15px",
            }}
          >
            {forecastData.forecastSeries.length}{" "}
            days
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

        <FreightLineChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}

/* =========================
   RISKRADAR
========================= */

function RiskRadarPage({
  forecastData,
}) {
  const volatility =
    Number(forecastData.volatility) || 0;

  const chartData = [
    {
      factor: "Volatility",
      value: Math.min(
        volatility * 10,
        100
      ),
    },
    {
      factor: "Market",
      value:
        forecastData.changePercent < 0
          ? 35
          : 65,
    },
    {
      factor: "Demand",
      value: 55,
    },
    {
      factor: "Port",
      value: 40,
    },
  ];

  return (
    <>
      <PageHeader
        title="RiskRadar"
        description="Monitor forecast volatility and major maritime risk indicators."
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
            {forecastData.riskLevel}
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
            Volatility
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              marginTop: "8px",
            }}
          >
            {volatility.toFixed(2)}
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

/* =========================
   VESSELMATCH
========================= */

function VesselMatchPage() {
  const vessels = [
    {
      vessel: "MV Ocean Star",
      type: "Panamax",
      score: 92,
      status: "Available",
    },
    {
      vessel: "MV Eastern Wind",
      type: "Supramax",
      score: 87,
      status: "Available",
    },
    {
      vessel: "MV Pacific Dawn",
      type: "Capesize",
      score: 81,
      status: "Review",
    },
  ];

  return (
    <>
      <PageHeader
        title="VesselMatch"
        description="Compare vessel options against the current shipment scenario."
      />

      <div style={{ display: "grid", gap: "15px" }}>
        {vessels.map((vessel) => (
          <Card key={vessel.vessel}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "750",
                  }}
                >
                  {vessel.vessel}
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    color: "#8192aa",
                    fontSize: "13px",
                  }}
                >
                  {vessel.type}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: "#8192aa",
                    fontSize: "11px",
                  }}
                >
                  MATCH SCORE
                </div>

                <div
                  style={{
                    fontSize: "25px",
                    fontWeight: "800",
                    marginTop: "5px",
                  }}
                >
                  {vessel.score}%
                </div>
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "20px",
                  background:
                    "rgba(74,222,128,0.08)",
                  color: "#4ade80",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {vessel.status}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* =========================
   VOYAGE DIGITAL TWIN
========================= */

function VoyageDigitalTwinPage({
  forecastData,
}) {
  return (
    <>
      <PageHeader
        title="Voyage Digital Twin"
        description="Digital representation of the planned voyage and forecast conditions."
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
          <InfoBlock
            title="Forecast Rate"
            value={formatMoney(
              forecastData.forecastRate
            )}
          />

          <InfoBlock
            title="Risk"
            value={forecastData.riskLevel}
          />

          <InfoBlock
            title="Model Score"
            value={`${forecastData.confidence}%`}
          />

          <InfoBlock
            title="Savings"
            value={formatMoney(
              forecastData.estimatedSavings
            )}
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
          Voyage Freight Projection
        </div>

        <ForecastChart
          data={forecastData.forecastSeries}
        />
      </Card>
    </>
  );
}

/* =========================
   PORT INTELLIGENCE
========================= */

function PortIntelligencePage() {
  const ports = [
    {
      port: "Paradip",
      congestion: 40,
      status: "Normal",
    },
    {
      port: "Visakhapatnam",
      congestion: 52,
      status: "Moderate",
    },
    {
      port: "Chennai",
      congestion: 61,
      status: "Watch",
    },
    {
      port: "Kakinada",
      congestion: 34,
      status: "Normal",
    },
  ];

  return (
    <>
      <PageHeader
        title="Port Intelligence"
        description="Monitor port congestion indicators for East Coast routing decisions."
      />

      <div style={{ display: "grid", gap: "14px" }}>
        {ports.map((port) => (
          <Card key={port.port}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr 120px",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  fontWeight: "750",
                }}
              >
                {port.port}
              </div>

              <div>
                <div
                  style={{
                    color: "#8292aa",
                    fontSize: "11px",
                    marginBottom: "7px",
                  }}
                >
                  CONGESTION INDEX
                </div>

                <div
                  style={{
                    height: "7px",
                    background: "#1c2a3e",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${port.congestion}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg,#38bdf8,#2563eb)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  textAlign: "right",
                  color: "#8fa1bb",
                  fontSize: "12px",
                }}
              >
                {port.status}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* =========================
   DECISION HUB
========================= */

function DecisionHubPage({
  forecastData,
}) {
  return (
    <>
      <PageHeader
        title="Decision Hub"
        description="Consolidated decision-support view for chartering and procurement."
      />

      <Card>
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
              Consolidated output from the current
              forecast scenario.
            </div>
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
          <DecisionItem
            title="Freight Rate"
            value={formatMoney(
              forecastData.forecastRate
            )}
          />

          <DecisionItem
            title="Market Risk"
            value={forecastData.riskLevel}
          />

          <DecisionItem
            title="Forecast Change"
            value={`${Number(
              forecastData.changePercent || 0
            ).toFixed(2)}%`}
          />

          <DecisionItem
            title="Estimated Savings"
            value={formatMoney(
              forecastData.estimatedSavings
            )}
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

/* =========================
   MAIN APP
========================= */

export default function App() {
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [loading, setLoading] =
    useState(false);

  const [shipment, setShipment] =
    useState({
      origin: "Australia",
      destination: "Paradip",
      cargo: "Coal",
      vessel: "Panamax",
      quantity: 75000,
      horizon: 30,
    });

  const [forecastData, setForecastData] =
    useState({
      currentRate: 24.8,
      forecastRate: 23.1,
      changePercent: -6.85,
      volatility: 18.6,
      riskLevel: "Moderate",
      confidence: 87.4,
      estimatedSavings: 127500,
      forecastSeries: [],
    });

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
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API error: ${response.status}`
        );
      }

      const data =
        await response.json();

      setForecastData({
        currentRate:
          data.forecast.current_rate,

        forecastRate:
          data.forecast.forecast_rate,

        changePercent:
          data.forecast.change_percent,

        volatility:
          data.risk.volatility,

        riskLevel:
          data.risk.level,

        confidence:
          data.confidence,

        estimatedSavings:
          data.estimated_savings,

        forecastSeries:
          data.forecast_series || [],
      });
    } catch (error) {
      console.error(
        "Forecast error:",
        error
      );

      alert(
        "Could not connect to the PORTWISE AI backend. Make sure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderActivePage() {
    switch (activePage) {
      case "Dashboard":
        return (
          <DashboardPage
            forecastData={forecastData}
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
            setShipment={setShipment}
            onGenerate={generateForecast}
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
          />
        );

      case "RiskRadar":
        return (
          <RiskRadarPage
            forecastData={forecastData}
          />
        );

      case "VesselMatch":
        return <VesselMatchPage />;

      case "Voyage Digital Twin":
        return (
          <VoyageDigitalTwinPage
            forecastData={forecastData}
          />
        );

      case "Port Intelligence":
        return <PortIntelligencePage />;

      case "Decision Hub":
        return (
          <DecisionHubPage
            forecastData={forecastData}
          />
        );

      default:
        return null;
    }
  }

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
          }

          @media (max-width: 600px) {
            main {
              padding: 15px !important;
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
                  padding:
                    "11px 12px",
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
              <CheckCircle2
                size={14}
              />

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
              connected
            </div>
          </div>
        </aside>

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

              SYSTEM OPERATIONAL
            </div>
          </div>

          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}