'use client'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'


export function IconButton({ children, label }: { children: React.ReactNode; label: string }) {
return (
<Tooltip>
<TooltipTrigger asChild>
<Button variant="ghost" size="icon" aria-label={label}>{children}</Button>
</TooltipTrigger>
<TooltipContent>{label}</TooltipContent>
</Tooltip>
)
}