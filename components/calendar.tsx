"use client"

import { useState } from "react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import type { Habit, ConsumptionRecord } from "./habit-tracker"
import { format, isSameDay, startOfMonth, addMonths, subMonths, eachDayOfInterval, endOfMonth, getDay } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Flame } from "lucide-react"

interface CalendarProps {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  habits: Habit[]
  consumptionRecords: ConsumptionRecord[]
}

export default function Calendar({ selectedDate, setSelectedDate, habits, consumptionRecords }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(selectedDate))

  // Define the date range for the habit tracker (March 1, 2025 to March 19, 2026)
  const startDate = new Date(2025, 2, 1) // 1 de Marzo, 2025
  const endDate = new Date(2026, 2, 19) // March 19, 2026

  // Function to get habit completion percentage for a specific date
  const getHabitCompletionForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const dayOfWeek = getDay(date) // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Only count habits that are scheduled for this day
    const habitsForDay = habits.filter((habit) => habit.recurringDays.includes(dayOfWeek) && !habit.paused)

    const totalHabits = habitsForDay.length
    if (totalHabits === 0) return 0

    const completedHabits = habitsForDay.filter((habit) => habit.completed[dateStr]).length
    return (completedHabits / totalHabits) * 100
  }

  // Function to get consumption for a specific date
  const getConsumptionForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const record = consumptionRecords.find((r) => r.date === dateStr)
    return {
      cigarettes: record?.cigarettes || 0,
      joints: record?.joints || 0,
    }
  }

  // Function to check if a date has a streak
  const hasStreak = (date: Date) => {
    // Check if all habits scheduled for this day are completed
    const dateStr = format(date, "yyyy-MM-dd")
    const dayOfWeek = getDay(date)

    // Get habits that should be completed on this day of the week
    const habitsForDay = habits.filter((habit) => habit.recurringDays.includes(dayOfWeek) && !habit.paused)

    // Check if all applicable habits were completed on this day
    return habitsForDay.length > 0 && habitsForDay.every((habit) => habit.completed[dateStr])
  }

  // Calculate streaks for the current month
  const calculateMonthStreaks = () => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    })

    const streaks: Record<string, boolean> = {}

    daysInMonth.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      streaks[dateStr] = hasStreak(day)
    })

    return streaks
  }

  // Custom day rendering to show habit completion and consumption
  const renderDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd")
    const isSelected = isSameDay(day, selectedDate)
    const completion = getHabitCompletionForDate(day)
    const consumption = getConsumptionForDate(day)
    const hasActivity = completion > 0 || consumption.cigarettes > 0 || consumption.joints > 0
    const monthStreaks = calculateMonthStreaks()
    const hasStreakForDay = monthStreaks[dateStr]

    // Check if date is within the valid range
    const isInRange = day >= startDate && day <= endDate

    return (
      <div className={`relative w-full h-full min-h-9 p-2 ${isSelected ? "bg-primary/20 rounded-md" : ""}`}>
        <span className={`absolute top-1 left-1 text-xs ${isSelected ? "text-primary" : "text-foreground"}`}>
          {format(day, "d")}
        </span>

        {hasStreakForDay && (
          <span className="absolute top-1 right-1 text-xs text-amber-500">
            <Flame className="h-3 w-3" />
          </span>
        )}

        {isInRange && hasActivity && (
          <div className="absolute bottom-1 left-1 right-1 flex justify-center space-x-1">
            {completion > 0 && (
              <div
                className="h-1 rounded-full bg-green-500"
                style={{ width: `${Math.max(20, completion)}%` }}
                title={`${Math.round(completion)}% de hábitos completados`}
              />
            )}
            {consumption.cigarettes > 0 && (
              <div className="h-1 w-1 rounded-full bg-orange-500" title={`${consumption.cigarettes} cigarrillos`} />
            )}
            {consumption.joints > 0 && (
              <div className="h-1 w-1 rounded-full bg-purple-500" title={`${consumption.joints} porros`} />
            )}
          </div>
        )}
      </div>
    )
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1))
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base md:text-lg font-medium">Calendario</h2>
        <div className="flex space-x-1">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CalendarComponent
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        locale={es}
        disabled={{ before: startDate, after: endDate }}
        components={{
          Day: ({ date, ...props }) => <button {...props}>{renderDay(date)}</button>,
        }}
        className="rounded-md border"
      />

      <div className="flex flex-wrap justify-center gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Hábitos</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Cigarrillos</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Porros</span>
        </div>
        <div className="flex items-center space-x-1">
          <Flame className="h-3 w-3 text-amber-500" />
          <span>Racha</span>
        </div>
      </div>
    </div>
  )
}

