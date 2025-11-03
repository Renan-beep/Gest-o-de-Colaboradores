import * as React from "react"
import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export function MultiSelect({ options, selected, onChange, placeholder = "Selecionar..." }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([])
    } else {
      onChange([...options])
    }
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : selected.length === options.length ? (
            <span>Todos</span>
          ) : (
            <span>{selected.length} selecionado(s)</span>
          )}
          {selected.length > 0 && (
            <X
              className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-64 overflow-auto">
          <div className="p-2 border-b sticky top-0 bg-background">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleSelectAll}
            >
              <Checkbox
                checked={selected.length === options.length && options.length > 0}
                className="mr-2"
              />
              Selecionar Todos
            </Button>
          </div>
          <div className="p-2 space-y-1">
            {options.map((option) => (
              <Button
                key={option}
                variant="ghost"
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => handleToggle(option)}
              >
                <Checkbox
                  checked={selected.includes(option)}
                  className="mr-2"
                />
                {option}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
