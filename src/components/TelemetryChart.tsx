import { Activity, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useId, useMemo } from 'react'
import type { MetricKey, TelemetryPoint } from '../types'
import './visualizations.css'

interface TelemetryChartProps {
  data: TelemetryPoint[]
  activeMetric: MetricKey
  compact?: boolean
}

interface MetricConfig {
  label: string
  shortLabel: string
  unit: string
}

interface PlotPoint {
  x: number
  y: number
  value: number
  timeLabel: string
  tick: number
}

interface ChartModel {
  points: PlotPoint[]
  linePath: string
  areaPath: string
  observedMin: number
  observedMax: number
  domainMin: number
  domainMax: number
  plotTop: number
  plotBottom: number
  plotLeft: number
  plotRight: number
  height: number
}

const CHART_WIDTH = 720
const HORIZONTAL_GRID = [0, 0.25, 0.5, 0.75, 1] as const
const VERTICAL_GRID = [0, 0.25, 0.5, 0.75, 1] as const

const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
  latency: { label: 'P95 latency', shortLabel: 'LATENCY', unit: 'ms' },
  errorRate: { label: 'Checkout error rate', shortLabel: 'ERROR RATE', unit: '%' },
  throughput: { label: 'Request throughput', shortLabel: 'THROUGHPUT', unit: 'req/s' },
  dbConnections: { label: 'Database connections', shortLabel: 'DB CONNECTIONS', unit: '' },
  cacheHitRate: { label: 'Cache hit rate', shortLabel: 'CACHE HIT', unit: '%' },
}

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function formatMetricValue(value: number, metric: MetricKey, includeUnit = true) {
  if (!Number.isFinite(value)) return '--'

  let formatted: string
  if (metric === 'throughput') {
    formatted = compactNumber.format(value)
  } else if (metric === 'errorRate' || metric === 'cacheHitRate') {
    formatted = value.toFixed(1)
  } else {
    formatted = Math.round(value).toLocaleString('en-US')
  }

  const unit = includeUnit ? METRIC_CONFIG[metric].unit : ''
  return unit ? `${formatted} ${unit}` : formatted
}

function buildSmoothPath(points: PlotPoint[]) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const controlX = (previous.x + point.x) / 2
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

function createChartModel(
  data: TelemetryPoint[],
  metric: MetricKey,
  compact: boolean,
): ChartModel | null {
  const samples = data.filter((point) => Number.isFinite(point[metric]))
  if (samples.length === 0) return null

  const height = compact ? 142 : 168
  const padding = compact
    ? { top: 28, right: 16, bottom: 24, left: 31 }
    : { top: 34, right: 20, bottom: 28, left: 58 }
  const plotLeft = padding.left
  const plotRight = CHART_WIDTH - padding.right
  const plotTop = padding.top
  const plotBottom = height - padding.bottom
  const values = samples.map((sample) => sample[metric])
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const rawRange = maximum - minimum
  const referenceRange = rawRange || Math.max(Math.abs(maximum) * 0.12, 1)
  const domainPadding = referenceRange * 0.14
  const domainMin = Math.max(0, minimum - domainPadding)
  const domainMax = maximum + domainPadding
  const domainRange = Math.max(domainMax - domainMin, 1)
  const plotWidth = plotRight - plotLeft
  const plotHeight = plotBottom - plotTop

  const points = samples.map((sample, index): PlotPoint => {
    const progress = samples.length === 1 ? 0.5 : index / (samples.length - 1)
    return {
      x: plotLeft + progress * plotWidth,
      y: plotTop + ((domainMax - sample[metric]) / domainRange) * plotHeight,
      value: sample[metric],
      timeLabel: sample.timeLabel,
      tick: sample.tick,
    }
  })

  const linePath = buildSmoothPath(points)
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const areaPath = `${linePath} L ${lastPoint.x} ${plotBottom} L ${firstPoint.x} ${plotBottom} Z`

  return {
    points,
    linePath,
    areaPath,
    observedMin: minimum,
    observedMax: maximum,
    domainMin,
    domainMax,
    plotTop,
    plotBottom,
    plotLeft,
    plotRight,
    height,
  }
}

export function TelemetryChart({
  data,
  activeMetric,
  compact = false,
}: TelemetryChartProps) {
  const instanceId = useId().replace(/:/g, '')
  const titleId = `${instanceId}-telemetry-title`
  const descriptionId = `${instanceId}-telemetry-description`
  const gradientId = `${instanceId}-telemetry-fill`
  const model = useMemo(
    () => createChartModel(data, activeMetric, compact),
    [activeMetric, compact, data],
  )
  const config = METRIC_CONFIG[activeMetric]

  const latestPoint = model?.points[model.points.length - 1]
  const previousPoint = model?.points[Math.max(0, model.points.length - 2)]
  const delta = latestPoint && previousPoint ? latestPoint.value - previousPoint.value : 0
  const stableDelta = Math.abs(delta) < 0.001 ? 0 : delta
  const TrendIcon = stableDelta > 0 ? TrendingUp : stableDelta < 0 ? TrendingDown : Minus
  const trendClass = stableDelta > 0 ? 'is-up' : stableDelta < 0 ? 'is-down' : 'is-flat'
  const trendLabel = stableDelta === 0 ? 'No change' : `${stableDelta > 0 ? 'Up' : 'Down'} ${formatMetricValue(Math.abs(stableDelta), activeMetric)}`
  const xLabelIndexes = model
    ? Array.from(new Set([0, Math.floor((model.points.length - 1) / 2), model.points.length - 1]))
    : []
  const pointStride = model ? Math.max(1, Math.ceil(model.points.length / 12)) : 1

  return (
    <section
      className={`telemetry-chart metric-${activeMetric}${compact ? ' telemetry-chart--compact' : ''}`}
      aria-label={`${config.label} telemetry`}
    >
      <h2 className="visual-sr-only" id={titleId}>{config.label}</h2>

      {model && latestPoint ? (
        <div className="telemetry-chart__plot">
          <div className="telemetry-chart__overlay">
            <span className="telemetry-chart__metric-label">
              <i aria-hidden="true" />
              {config.shortLabel}
            </span>
          <div className="telemetry-chart__reading">
            <strong>{formatMetricValue(latestPoint.value, activeMetric)}</strong>
            <span className={`telemetry-chart__trend ${trendClass}`} aria-label={trendLabel}>
              <TrendIcon size={13} strokeWidth={2.2} aria-hidden="true" />
              {stableDelta === 0
                ? 'steady'
                : `${stableDelta > 0 ? '+' : '-'}${formatMetricValue(Math.abs(stableDelta), activeMetric, false)}`}
            </span>
          </div>
          </div>
          <svg
            className="telemetry-chart__svg"
            viewBox={`0 0 ${CHART_WIDTH} ${model.height}`}
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
          >
            <title>{config.label} over time</title>
            <desc id={descriptionId}>
              {`${model.points.length} samples. Latest ${formatMetricValue(latestPoint.value, activeMetric)} at ${latestPoint.timeLabel}. Observed minimum ${formatMetricValue(model.observedMin, activeMetric)} and maximum ${formatMetricValue(model.observedMax, activeMetric)}.`}
            </desc>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="telemetry-chart__gradient-top" />
                <stop offset="100%" className="telemetry-chart__gradient-bottom" />
              </linearGradient>
            </defs>

            <g className="telemetry-chart__grid" aria-hidden="true">
              {HORIZONTAL_GRID.map((ratio) => {
                const y = model.plotTop + ratio * (model.plotBottom - model.plotTop)
                const value = model.domainMax - ratio * (model.domainMax - model.domainMin)
                return (
                  <g key={`horizontal-${ratio}`}>
                    <line x1={model.plotLeft} x2={model.plotRight} y1={y} y2={y} />
                    {!compact ? (
                      <text x={model.plotLeft - 9} y={y + 3} textAnchor="end">
                        {formatMetricValue(value, activeMetric, false)}
                      </text>
                    ) : null}
                  </g>
                )
              })}
              {VERTICAL_GRID.map((ratio) => {
                const x = model.plotLeft + ratio * (model.plotRight - model.plotLeft)
                return (
                  <line
                    key={`vertical-${ratio}`}
                    x1={x}
                    x2={x}
                    y1={model.plotTop}
                    y2={model.plotBottom}
                  />
                )
              })}
            </g>

            <path
              className="telemetry-chart__area"
              d={model.areaPath}
              fill={`url(#${gradientId})`}
            />
            <path
              className="telemetry-chart__line-shadow"
              d={model.linePath}
              pathLength="1"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="telemetry-chart__line"
              d={model.linePath}
              pathLength="1"
              vectorEffect="non-scaling-stroke"
            />

            <g className="telemetry-chart__samples" aria-hidden="true">
              {model.points.map((point, index) =>
                index % pointStride === 0 || index === model.points.length - 1 ? (
                  <circle
                    key={`${point.tick}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={index === model.points.length - 1 ? 0 : 2.2}
                  />
                ) : null,
              )}
            </g>

            <g className="telemetry-chart__latest" aria-hidden="true">
              <line
                x1={latestPoint.x}
                x2={latestPoint.x}
                y1={model.plotTop}
                y2={model.plotBottom}
              />
              <circle className="telemetry-chart__latest-halo" cx={latestPoint.x} cy={latestPoint.y} r="9" />
              <circle className="telemetry-chart__latest-point" cx={latestPoint.x} cy={latestPoint.y} r="4" />
            </g>

            <g className="telemetry-chart__x-axis" aria-hidden="true">
              {xLabelIndexes.map((index, labelPosition) => {
                const point = model.points[index]
                const textAnchor =
                  labelPosition === 0
                    ? 'start'
                    : labelPosition === xLabelIndexes.length - 1
                      ? 'end'
                      : 'middle'
                return (
                  <text
                    key={`${point.tick}-${index}`}
                    x={point.x}
                    y={model.plotBottom + 22}
                    textAnchor={textAnchor}
                  >
                    {point.timeLabel}
                  </text>
                )
              })}
            </g>
          </svg>

          <p className="visual-sr-only">
            {`Latest ${config.label}: ${formatMetricValue(latestPoint.value, activeMetric)}. Observed range ${formatMetricValue(model.observedMin, activeMetric)} to ${formatMetricValue(model.observedMax, activeMetric)}.`}
          </p>
        </div>
      ) : (
        <div className="telemetry-chart__empty" role="status">
          <span aria-hidden="true"><Activity size={22} /></span>
          <strong>Awaiting telemetry</strong>
          <small>No valid {config.shortLabel.toLowerCase()} samples received.</small>
        </div>
      )}

    </section>
  )
}
