import {
  CreditCard,
  Database,
  Globe2,
  HardDrive,
  Shield,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'
import { useId, type KeyboardEvent } from 'react'
import type { ServiceId, ServiceLink, ServiceNode, SystemStatus } from '../types'
import './visualizations.css'

interface ServiceMapProps {
  services: ServiceNode[]
  links: ServiceLink[]
  selectedId?: ServiceId | null
  onSelect?: (id: ServiceId) => void
}

interface NodeLayout {
  x: number
  y: number
  icon: LucideIcon
}

const VIEWBOX_WIDTH = 920
const VIEWBOX_HEIGHT = 390
const NODE_WIDTH = 138
const NODE_HEIGHT = 84

const SERVICE_ORDER: ServiceId[] = [
  'edge',
  'gateway',
  'checkout',
  'payments',
  'cache',
  'database',
]

const NODE_LAYOUT: Record<ServiceId, NodeLayout> = {
  edge: { x: 90, y: 195, icon: Globe2 },
  gateway: { x: 270, y: 195, icon: Shield },
  checkout: { x: 450, y: 195, icon: ShoppingCart },
  payments: { x: 745, y: 90, icon: CreditCard },
  cache: { x: 620, y: 305, icon: HardDrive },
  database: { x: 835, y: 305, icon: Database },
}

const STATUS_ORDER: SystemStatus[] = ['nominal', 'degraded', 'critical', 'recovering']

const STATUS_LABEL: Record<SystemStatus, string> = {
  nominal: 'Nominal',
  degraded: 'Degraded',
  critical: 'Critical',
  recovering: 'Recovering',
}

function normalisePercent(value: number) {
  if (!Number.isFinite(value)) return 0
  const percent = value > 0 && value <= 1 ? value * 100 : value
  return Math.min(100, Math.max(0, percent))
}

function getLinkPath(from: NodeLayout, to: NodeLayout) {
  const halfWidth = NODE_WIDTH / 2
  const halfHeight = NODE_HEIGHT / 2
  const verticalDelta = to.y - from.y

  if (Math.abs(verticalDelta) < 32) {
    const startX = from.x + halfWidth
    const endX = to.x - halfWidth
    const controlX = (startX + endX) / 2
    return `M ${startX} ${from.y} C ${controlX} ${from.y}, ${controlX} ${to.y}, ${endX} ${to.y}`
  }

  if (verticalDelta > 0) {
    const startY = from.y + halfHeight
    const endX = to.x - halfWidth
    return `M ${from.x} ${startY} C ${from.x} ${startY + 48}, ${endX - 44} ${to.y}, ${endX} ${to.y}`
  }

  const startX = from.x + halfWidth
  const endX = to.x - halfWidth
  const controlX = (startX + endX) / 2
  return `M ${startX} ${from.y} C ${controlX} ${from.y}, ${controlX} ${to.y}, ${endX} ${to.y}`
}

function getLinkLabelPosition(from: NodeLayout, to: NodeLayout) {
  const verticalDelta = to.y - from.y
  return {
    x: (from.x + to.x) / 2 + (verticalDelta > 32 ? 10 : 0),
    y: (from.y + to.y) / 2 + (verticalDelta > 32 ? 12 : -10),
  }
}

function handleNodeKeyDown(
  event: KeyboardEvent<SVGGElement>,
  id: ServiceId,
  onSelect?: (id: ServiceId) => void,
) {
  if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return
  event.preventDefault()
  onSelect(id)
}

export function ServiceMap({ services, links, selectedId = null, onSelect }: ServiceMapProps) {
  const instanceId = useId().replace(/:/g, '')
  const serviceById = new Map(services.map((service) => [service.id, service]))
  const visibleServices = SERVICE_ORDER.flatMap((id) => {
    const service = serviceById.get(id)
    return service ? [service] : []
  })
  const visibleLinks = links.filter(
    (link) => serviceById.has(link.from) && serviceById.has(link.to),
  )

  return (
    <section className="service-map" aria-label="Live service topology">
      <div className="service-map__canvas">
        <svg
          className="service-map__svg"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          role="group"
          aria-label="Interactive map of production service dependencies"
        >
          <title>Production service dependency map</title>
          <desc>
            Traffic flows from Edge to Gateway, Checkout, and Payments. Checkout also
            connects through Cache to Database. Select a service for incident details.
          </desc>

          <defs>
            <pattern
              id={`${instanceId}-grid`}
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 28 0 L 0 0 0 28" className="service-map__grid-line" />
            </pattern>
            {STATUS_ORDER.map((status) => (
              <marker
                id={`${instanceId}-arrow-${status}`}
                key={status}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path
                  d="M 0 0 L 8 4 L 0 8 Z"
                  className={`service-link__arrow status-${status}`}
                />
              </marker>
            ))}
          </defs>

          <rect
            className="service-map__grid"
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            fill={`url(#${instanceId}-grid)`}
          />

          <g className="service-map__links" aria-hidden="true">
            {visibleLinks.map((link) => {
              const from = NODE_LAYOUT[link.from]
              const to = NODE_LAYOUT[link.to]
              const path = getLinkPath(from, to)
              const traffic = Math.round(normalisePercent(link.traffic))
              const labelPosition = getLinkLabelPosition(from, to)

              return (
                <g
                  className={`service-link status-${link.status}`}
                  key={`${link.from}-${link.to}`}
                >
                  <path className="service-link__rail" d={path} />
                  <path
                    className="service-link__flow"
                    d={path}
                    markerEnd={`url(#${instanceId}-arrow-${link.status})`}
                  />
                  <g
                    className="service-link__label"
                    transform={`translate(${labelPosition.x} ${labelPosition.y})`}
                  >
                    <rect x="-22" y="-9" width="44" height="18" rx="9" />
                    <text textAnchor="middle" dominantBaseline="central">
                      {traffic}%
                    </text>
                  </g>
                </g>
              )
            })}
          </g>

          <g className="service-map__nodes">
            {visibleServices.map((service) => {
              const { x, y, icon: Icon } = NODE_LAYOUT[service.id]
              const load = normalisePercent(service.load)
              const isSelected = service.id === selectedId
              const isInteractive = Boolean(onSelect)
              const accessibleLabel = `${service.label}, ${STATUS_LABEL[service.status]}. ${service.metricLabel}: ${service.metricValue}. Load ${Math.round(load)} percent.`

              return (
                <g
                  className={`service-node status-${service.status}${isSelected ? ' is-selected' : ''}`}
                  key={service.id}
                  transform={`translate(${x} ${y})`}
                  role={isInteractive ? 'button' : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  aria-label={accessibleLabel}
                  aria-pressed={isInteractive ? isSelected : undefined}
                  onClick={onSelect ? () => onSelect(service.id) : undefined}
                  onKeyDown={(event) => handleNodeKeyDown(event, service.id, onSelect)}
                >
                  <rect
                    className="service-node__pulse"
                    x={-NODE_WIDTH / 2 - 4}
                    y={-NODE_HEIGHT / 2 - 4}
                    width={NODE_WIDTH + 8}
                    height={NODE_HEIGHT + 8}
                    rx="15"
                  />
                  <rect
                    className="service-node__focus-outline"
                    x={-NODE_WIDTH / 2 - 6}
                    y={-NODE_HEIGHT / 2 - 6}
                    width={NODE_WIDTH + 12}
                    height={NODE_HEIGHT + 12}
                    rx="17"
                  />
                  <rect
                    className="service-node__shell"
                    x={-NODE_WIDTH / 2}
                    y={-NODE_HEIGHT / 2}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="12"
                  />
                  <circle className="service-node__icon-well" cx="-48" cy="-10" r="14" />
                  <Icon
                    className="service-node__icon"
                    x="-58"
                    y="-20"
                    width="20"
                    height="20"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <circle className="service-node__status-halo" cx="54" cy="-29" r="7" />
                  <circle className="service-node__status-dot" cx="54" cy="-29" r="3" />

                  <text className="service-node__label" x="-27" y="-14">
                    {service.label}
                  </text>
                  <text className="service-node__code" x="-27" y="1">
                    {service.code}
                  </text>
                  <line className="service-node__divider" x1="-55" x2="55" y1="12" y2="12" />
                  <text className="service-node__metric-label" x="-55" y="28">
                    {service.metricLabel}
                  </text>
                  <text
                    className="service-node__metric-value"
                    x="55"
                    y="28"
                    textAnchor="end"
                  >
                    {service.metricValue}
                  </text>
                  <rect className="service-node__load-track" x="-55" y="34" width="110" height="3" rx="1.5" />
                  <rect
                    className="service-node__load-value"
                    x="-55"
                    y="34"
                    width={1.1 * load}
                    height="3"
                    rx="1.5"
                  />
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      <footer className="service-map__footer">
        {onSelect ? (
          <>
            <span>
              <kbd>Tab</kbd> navigate
            </span>
            <span>
              <kbd>Enter</kbd> inspect service
            </span>
          </>
        ) : null}
        <span className="service-map__route">EDGE / GATEWAY / CHECKOUT / CORE</span>
      </footer>
    </section>
  )
}
