import type { ComponentType } from "react"
import {
  Activity,
  BarChart3,
  Binary,
  BookOpen,
  Blend,
  Braces,
  CalendarDays,
  Calculator,
  CaseUpper,
  Clock,
  Code,
  Code2,
  Copy,
  Crop,
  Dices,
  DollarSign,
  Eye,
  ExternalLink,
  FileCheck,
  FileCode,
  FileImage,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FileType,
  FileType2,
  Files,
  Fingerprint,
  GitBranch,
  GitCompare,
  GitCompareArrows,
  Globe,
  Grid3X3,
  Hash,
  Image,
  ImageIcon,
  Info,
  Key,
  KeyRound,
  KeySquare,
  Languages,
  Layers,
  Link,
  List,
  Lock,
  MapPin,
  Maximize,
  Minimize,
  Music,
  Palette,
  Pipette,
  QrCode,
  RefreshCw,
  Radius,
  ScanLine,
  Scissors,
  Search,
  Server,
  Shield,
  SquareFunction,
  Shuffle,
  Smartphone,
  Split,
  Table,
  Table2,
  Timer,
  Type,
  UserCheck,
  WholeWord,
  Workflow,
} from "lucide-react"

const iconRegistry: Record<string, ComponentType> = {
  Activity,
  BarChart3,
  Binary,
  BookOpen,
  Blend,
  Braces,
  CalendarDays,
  Calculator,
  CaseUpper,
  Clock,
  Code,
  Code2,
  Copy,
  Crop,
  Dices,
  DollarSign,
  Eye,
  ExternalLink,
  FileCheck,
  FileCode,
  FileImage,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FileType,
  FileType2,
  Files,
  Fingerprint,
  Function: SquareFunction,
  GitBranch,
  GitCompare,
  GitCompareArrows,
  Globe,
  Grid3X3,
  Hash,
  Image,
  ImageIcon,
  Info,
  Key,
  KeyRound,
  KeySquare,
  Languages,
  Layers,
  Link,
  List,
  Lock,
  MapPin,
  Maximize,
  Minimize,
  Music,
  Palette,
  Pipette,
  QrCode,
  RefreshCw,
  RoundedCorner: Radius,
  ScanLine,
  Scissors,
  Search,
  Server,
  Shield,
  Shadow: Layers,
  Shuffle,
  Smartphone,
  Split,
  Table,
  Table2,
  Timer,
  Type,
  UserCheck,
  WholeWord,
  Workflow,
}

const iconCache = new Map<string, ComponentType<any> | null>()

export function getLoadedIconComponent(iconName: string): ComponentType<any> | null {
  return iconCache.get(iconName) ?? null
}

export async function loadIconComponent(iconName: string): Promise<ComponentType<any> | null> {
  if (!iconName) {
    return Promise.resolve(null)
  }

  // Check cache first
  if (iconCache.has(iconName)) {
    return Promise.resolve(iconCache.get(iconName) ?? null)
  }

  const IconComponent = iconRegistry[iconName]

  if (IconComponent) {
    iconCache.set(iconName, IconComponent)
    return Promise.resolve(IconComponent)
  }

  // Icon not found, cache null to prevent retrying
  iconCache.set(iconName, null)
  return Promise.resolve(null)
}

export function preloadIcons(iconNames: string[]) {
  iconNames.forEach((iconName) => {
    loadIconComponent(iconName).catch(() => null)
  })
}
