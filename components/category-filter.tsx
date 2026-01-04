"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { categories } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="bg-background/50 backdrop-blur-sm">
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 px-4 py-2">
          {categories.map((category) => {
            const isSelected = selectedCategory === category

            return (
              <button
                key={category}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap",
                  isSelected
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground border border-border/60 hover:border-foreground/30"
                )}
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-0" />
      </ScrollArea>
    </div>
  )
}
