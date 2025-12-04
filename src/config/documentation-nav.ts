import {
  BookOpen,
  Rocket,
  Layers,
  Brain,
  Database,
  Cloud,
  Server,
  Cpu,
  GitBranch,
  FileText,
} from "lucide-react"

export interface DocNavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string
}

export interface DocNavSection {
  title: string
  items: DocNavItem[]
}

export const documentationNav: DocNavSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "What is Banking Agent ID?",
        href: "/documentation",
        icon: BookOpen,
      },
      {
        title: "Getting Started",
        href: "/documentation/getting-started",
        icon: Rocket,
      },
      {
        title: "About the Project",
        href: "/documentation/about",
        icon: FileText,
      },
    ],
  },
  {
    title: "Architecture",
    items: [
      {
        title: "Overview",
        href: "/documentation/architecture/overview",
        icon: Layers,
      },
      {
        title: "AI & Machine Learning",
        href: "/documentation/architecture/ai",
        icon: Brain,
      },
      {
        title: "Database",
        href: "/documentation/architecture/database",
        icon: Database,
      },
    ],
  },
  {
    title: "Deployment",
    items: [
      {
        title: "AWS Deployment",
        href: "/documentation/deployment/aws",
        icon: Cloud,
      },
      {
        title: "EC2 & nginx",
        href: "/documentation/deployment/ec2-nginx",
        icon: Server,
      },
    ],
  },
  {
    title: "Integration",
    items: [
      {
        title: "Hardware Integration",
        href: "/documentation/integration/hardware",
        icon: Cpu,
      },
      {
        title: "Database Integration",
        href: "/documentation/integration/database",
        icon: Database,
      },
    ],
  },
  {
    title: "Diagrams",
    items: [
      {
        title: "Deployment Diagram",
        href: "/documentation/diagrams/deployment",
        icon: GitBranch,
      },
      {
        title: "Components",
        href: "/documentation/diagrams/components",
        icon: Layers,
      },
      {
        title: "Data Flow",
        href: "/documentation/diagrams/data-flow",
        icon: GitBranch,
      },
    ],
  },
]

export const findDocByHref = (href: string): DocNavItem | null => {
  for (const section of documentationNav) {
    const item = section.items.find((item) => item.href === href)
    if (item) return item
  }
  return null
}

export const getPreviousNextDocs = (
  currentHref: string
): { previous: DocNavItem | null; next: DocNavItem | null } => {
  const allDocs: DocNavItem[] = documentationNav.flatMap(
    (section) => section.items
  )

  const currentIndex = allDocs.findIndex((doc) => doc.href === currentHref)

  return {
    previous: currentIndex > 0 ? allDocs[currentIndex - 1] : null,
    next:
      currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null,
  }
}

