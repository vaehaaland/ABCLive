import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CompanyBadgeProps {
  company: { name: string; slug: string } | null | undefined
  size?: 'sm' | 'xs'
  className?: string
}

export function CompanyBadge({ company, size = 'sm', className }: CompanyBadgeProps) {
  if (!company) return null

  const isAlvsvag = company.slug === 'alvsvag-as'

  return (
    <Badge
      variant={isAlvsvag ? 'cold' : 'default'}
      className={cn(size === 'xs' && 'type-micro px-1.5', className)}
    >
      {company.name}
    </Badge>
  )
}
