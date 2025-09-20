'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Paperclip, Send } from 'lucide-react'


export function Composer({ draft, setDraft, onSend }: { draft: string; setDraft: (v: string)=>void; onSend: ()=>void }) {
return (
<div className="p-2 md:p-3 border-t bg-background">
<div className="flex items-end gap-2">
<Tooltip>
<TooltipTrigger asChild>
<Button variant="ghost" size="icon" className="self-center" aria-label="Вложить"><Paperclip className="h-5 w-5" /></Button>
</TooltipTrigger>
<TooltipContent>Вложить</TooltipContent>
</Tooltip>
<Input
placeholder="Напишите сообщение"
value={draft}
onChange={(e) => setDraft(e.target.value)}
onKeyDown={(e) => {
if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
}}
className="rounded-2xl min-h-[44px]"
/>
<Tooltip>
<TooltipTrigger asChild>
<Button onClick={onSend} size="icon" className="rounded-full" aria-label="Отправить"><Send className="h-5 w-5" /></Button>
</TooltipTrigger>
<TooltipContent>Отправить</TooltipContent>
</Tooltip>
</div>
</div>
)
}