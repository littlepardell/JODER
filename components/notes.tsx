"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

interface NotesProps {
  selectedDate: Date
  note: string
  saveNote: (content: string) => void
}

export default function Notes({ selectedDate, note, saveNote }: NotesProps) {
  const [content, setContent] = useState(note)
  const displayDate = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })

  // Update content when note or selectedDate changes
  useEffect(() => {
    setContent(note)
  }, [note, selectedDate])

  const handleSave = () => {
    saveNote(content)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg md:text-xl font-semibold">Notas para {displayDate}</h2>

      <Textarea
        placeholder="Escribe tus notas aquí..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[150px] md:min-h-[200px]"
      />

      <Button onClick={handleSave} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        Guardar Nota
      </Button>
    </div>
  )
}

