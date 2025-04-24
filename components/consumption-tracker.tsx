"use client"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { ConsumptionRecord } from "./habit-tracker"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ConsumptionTrackerProps {
  cigarettes: number
  joints: number
  updateConsumption: (type: "cigarettes" | "joints", value: number) => void
  consumptionRecords: ConsumptionRecord[]
}

export default function ConsumptionTracker({
  cigarettes,
  joints,
  updateConsumption,
  consumptionRecords,
}: ConsumptionTrackerProps) {
  // Calculate totals
  const totalCigarettes = consumptionRecords.reduce((sum, record) => sum + record.cigarettes, 0)
  const totalJoints = consumptionRecords.reduce((sum, record) => sum + record.joints, 0)

  // Sort records by date (newest first)
  const sortedRecords = [...consumptionRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-3">
          <h3 className="text-base md:text-lg font-medium">Cigarrillos (Pitis)</h3>
          <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-card">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateConsumption("cigarettes", Math.max(0, cigarettes - 1))}
              disabled={cigarettes <= 0}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl md:text-2xl font-bold">{cigarettes}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateConsumption("cigarettes", cigarettes + 1)}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-base md:text-lg font-medium">Porros (Petas)</h3>
          <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-card">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateConsumption("joints", Math.max(0, joints - 1))}
              disabled={joints <= 0}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl md:text-2xl font-bold">{joints}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateConsumption("joints", joints + 1)}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base md:text-lg font-medium">Historial de Consumo</h3>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableCaption>
              Total: {totalCigarettes} cigarrillos y {totalJoints} porros
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Día</TableHead>
                <TableHead className="text-right">Cigarrillos</TableHead>
                <TableHead className="text-right">Porros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.map((record) => (
                <TableRow key={record.date}>
                  <TableCell>{format(parseISO(record.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{format(parseISO(record.date), "EEEE", { locale: es })}</TableCell>
                  <TableCell className="text-right">{record.cigarettes}</TableCell>
                  <TableCell className="text-right">{record.joints}</TableCell>
                </TableRow>
              ))}
              {sortedRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay registros de consumo
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

