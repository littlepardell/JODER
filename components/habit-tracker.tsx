"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import HabitDashboard from "./habit-dashboard"
import ConsumptionTracker from "./consumption-tracker"
import Calendar from "./calendar"
import Stats from "./stats"
import PatternAnalysis from "./pattern-analysis"
import { format } from "date-fns"
import { useTheme } from "next-themes"
import { Bell, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Define types
export type HabitCategory = "salud" | "productividad" | "aprendizaje" | "social" | "otro"

export type Habit = {
  id: string
  name: string
  completed: Record<string, boolean>
  reminderTime?: string // Format: "HH:MM"
  reminderEnabled?: boolean
  category: HabitCategory
  recurringDays: number[] // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  paused: boolean // For travel mode
}

export type ConsumptionRecord = {
  date: string
  cigarettes: number
  joints: number
}

export type Note = {
  date: string
  content: string
}

export default function HabitTracker() {
  // Set dark theme
  const { setTheme } = useTheme()
  useEffect(() => {
    document.documentElement.classList.add("dark")
    setTheme("dark")
  }, [setTheme])

  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const formattedDate = format(selectedDate, "yyyy-MM-dd")

  // State for notification permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  // State for travel mode
  const [travelMode, setTravelMode] = useState<boolean>(false)

  // Initialize habits with default list
  const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window !== "undefined") {
      const savedHabits = localStorage.getItem("habits")
      if (savedHabits) {
        const parsedHabits = JSON.parse(savedHabits)
        // Add new properties if they don't exist (for backward compatibility)
        return parsedHabits.map((habit: any) => ({
          ...habit,
          category: habit.category || "otro",
          recurringDays: habit.recurringDays || [0, 1, 2, 3, 4, 5, 6], // Default to every day
          paused: habit.paused || false,
        }))
      }
    }

    return [
      {
        id: "1",
        name: "💻 Practicar Java",
        completed: {},
        reminderTime: "09:00",
        reminderEnabled: false,
        category: "aprendizaje",
        recurringDays: [1, 2, 3, 4, 5], // Weekdays only
        paused: false,
      },
      {
        id: "2",
        name: "📚 Leer 10 páginas",
        completed: {},
        reminderTime: "20:00",
        reminderEnabled: false,
        category: "aprendizaje",
        recurringDays: [0, 1, 2, 3, 4, 5, 6], // Every day
        paused: false,
      },
      {
        id: "3",
        name: "🏋️ Ejercicio durante 20 min",
        completed: {},
        reminderTime: "18:00",
        reminderEnabled: false,
        category: "salud",
        recurringDays: [1, 3, 5], // Monday, Wednesday, Friday
        paused: false,
      },
      {
        id: "4",
        name: "🧹 Ordenar habitación",
        completed: {},
        reminderTime: "10:00",
        reminderEnabled: false,
        category: "productividad",
        recurringDays: [6], // Saturday only
        paused: false,
      },
      {
        id: "5",
        name: "🐕 Sacar al perro 1r",
        completed: {},
        reminderTime: "08:00",
        reminderEnabled: false,
        category: "otro",
        recurringDays: [0, 1, 2, 3, 4, 5, 6], // Every day
        paused: false,
      },
      {
        id: "6",
        name: "🐕 Sacar al perro 2n",
        completed: {},
        reminderTime: "19:00",
        reminderEnabled: false,
        category: "otro",
        recurringDays: [0, 1, 2, 3, 4, 5, 6], // Every day
        paused: false,
      },
      {
        id: "7",
        name: "🚗 Test de conducir",
        completed: {},
        reminderTime: "11:00",
        reminderEnabled: false,
        category: "productividad",
        recurringDays: [1, 3], // Monday, Wednesday
        paused: false,
      },
    ]
  })

  // State for consumption records
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>(() => {
    if (typeof window !== "undefined") {
      const savedRecords = localStorage.getItem("consumptionRecords")
      if (savedRecords) return JSON.parse(savedRecords)
    }
    return []
  })

  // State for today's consumption
  const [todayCigarettes, setTodayCigarettes] = useState<number>(0)
  const [todayJoints, setTodayJoints] = useState<number>(0)

  // State for notes
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== "undefined") {
      const savedNotes = localStorage.getItem("notes")
      if (savedNotes) return JSON.parse(savedNotes)
    }
    return []
  })

  // Check notification permission on mount
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (typeof Notification !== "undefined") {
      try {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)

        if (permission === "granted") {
          toast({
            title: "Notificaciones activadas",
            description: "Ahora recibirás recordatorios para tus hábitos.",
          })
        } else {
          toast({
            title: "Notificaciones denegadas",
            description: "No podrás recibir recordatorios para tus hábitos.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error)
        toast({
          title: "Error",
          description: "No se pudo solicitar permiso para notificaciones.",
          variant: "destructive",
        })
      }
    }
  }

  // Set up notification checking interval
  useEffect(() => {
    if (notificationPermission !== "granted") return

    const checkForReminders = () => {
      const now = new Date()
      const currentTime = format(now, "HH:mm")
      const currentDateStr = format(now, "yyyy-MM-dd")
      const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      habits.forEach((habit) => {
        // Skip if habit is paused or not scheduled for today
        if (habit.paused || !habit.recurringDays.includes(currentDayOfWeek)) return

        if (habit.reminderEnabled && habit.reminderTime === currentTime) {
          // Check if the habit is already completed for today
          if (!habit.completed[currentDateStr]) {
            // Send notification
            const notification = new Notification("Recordatorio de hábito", {
              body: `Es hora de: ${habit.name}`,
              icon: "/icon.png",
            })

            // Handle notification click
            notification.onclick = () => {
              window.focus()
            }
          }
        }
      })
    }

    // Check every minute
    const intervalId = setInterval(checkForReminders, 60000)

    // Initial check
    checkForReminders()

    return () => clearInterval(intervalId)
  }, [habits, notificationPermission])

  // Load today's consumption on date change
  useEffect(() => {
    const record = consumptionRecords.find((r) => r.date === formattedDate)
    setTodayCigarettes(record?.cigarettes || 0)
    setTodayJoints(record?.joints || 0)
  }, [formattedDate, consumptionRecords])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits))
    localStorage.setItem("consumptionRecords", JSON.stringify(consumptionRecords))
    localStorage.setItem("notes", JSON.stringify(notes))
    localStorage.setItem("travelMode", JSON.stringify(travelMode))
  }, [habits, consumptionRecords, notes, travelMode])

  // Function to toggle habit completion
  const toggleHabit = (habitId: string) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              completed: {
                ...habit.completed,
                [formattedDate]: !habit.completed[formattedDate],
              },
            }
          : habit,
      ),
    )
  }

  // Function to add a new habit
  const addHabit = (name: string, category: HabitCategory, recurringDays: number[]) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      completed: {},
      reminderTime: "12:00",
      reminderEnabled: false,
      category,
      recurringDays,
      paused: false,
    }
    setHabits((prev) => [...prev, newHabit])
  }

  // Function to remove a habit
  const removeHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId))
  }

  // Function to update habit reminder
  const updateHabitReminder = (habitId: string, reminderTime: string, reminderEnabled: boolean) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              reminderTime,
              reminderEnabled,
            }
          : habit,
      ),
    )
  }

  // Function to update habit category
  const updateHabitCategory = (habitId: string, category: HabitCategory) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              category,
            }
          : habit,
      ),
    )
  }

  // Function to update habit recurring days
  const updateHabitRecurringDays = (habitId: string, recurringDays: number[]) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              recurringDays,
            }
          : habit,
      ),
    )
  }

  // Function to toggle habit paused state (for travel mode)
  const toggleHabitPaused = (habitId: string) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              paused: !habit.paused,
            }
          : habit,
      ),
    )
  }

  // Function to toggle travel mode
  const toggleTravelMode = () => {
    setTravelMode((prev) => !prev)

    // Show toast notification
    toast({
      title: travelMode ? "Modo viaje desactivado" : "Modo viaje activado",
      description: travelMode
        ? "Todos tus hábitos han vuelto a su estado normal."
        : "Puedes pausar hábitos que no puedas completar durante tu viaje.",
    })
  }

  // Function to update consumption
  const updateConsumption = (type: "cigarettes" | "joints", value: number) => {
    if (type === "cigarettes") {
      setTodayCigarettes(value)
    } else {
      setTodayJoints(value)
    }

    setConsumptionRecords((prev) => {
      const existingRecord = prev.find((r) => r.date === formattedDate)

      if (existingRecord) {
        return prev.map((r) =>
          r.date === formattedDate
            ? {
                ...r,
                [type]: value,
              }
            : r,
        )
      } else {
        return [
          ...prev,
          {
            date: formattedDate,
            cigarettes: type === "cigarettes" ? value : 0,
            joints: type === "joints" ? value : 0,
          },
        ]
      }
    })
  }

  // Function to save a note
  const saveNote = (content: string) => {
    setNotes((prev) => {
      const existingNote = prev.find((n) => n.date === formattedDate)

      if (existingNote) {
        return prev.map((n) => (n.date === formattedDate ? { ...n, content } : n))
      } else {
        return [...prev, { date: formattedDate, content }]
      }
    })
  }

  // Get current note for selected date
  const currentNote = notes.find((n) => n.date === formattedDate)?.content || ""

  // Get motivational quotes
  const motivationalQuotes = [
    "Cada día es una nueva oportunidad para cambiar tu vida.",
    "El éxito no es la clave de la felicidad. La felicidad es la clave del éxito.",
    "Los hábitos forman el carácter, y el carácter determina el destino.",
    "No cuentes los días, haz que los días cuenten.",
    "La disciplina es el puente entre metas y logros.",
    "Pequeños cambios diarios llevan a grandes resultados.",
    "El mejor momento para empezar fue ayer. El segundo mejor momento es ahora.",
    "La constancia vence a la intensidad.",
    "Tus hábitos de hoy determinan tu futuro.",
    "No busques el momento perfecto, haz el momento perfecto.",
  ]

  const randomQuoteIndex = Math.floor(Math.random() * motivationalQuotes.length)
  const todayQuote = motivationalQuotes[randomQuoteIndex]

  return (
    <div className="container mx-auto py-4 px-4 md:py-6 md:px-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left text-primary">Seguimiento de Hábitos</h1>

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 ${travelMode ? "bg-amber-500/20 border-amber-500 text-amber-500" : ""}`}
              >
                <Plane className="h-4 w-4" />
                Modo Viaje
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modo Viaje</DialogTitle>
                <DialogDescription>
                  Activa el modo viaje cuando estés fuera de tu rutina habitual. Podrás pausar temporalmente los hábitos
                  que no puedas completar.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between py-4">
                <span className="font-medium">Activar modo viaje</span>
                <Switch checked={travelMode} onCheckedChange={toggleTravelMode} />
              </div>

              {travelMode && (
                <div className="space-y-4">
                  <h4 className="font-medium">Pausar hábitos específicos:</h4>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {habits.map((habit) => (
                      <div key={habit.id} className="flex items-center justify-between">
                        <span className={habit.paused ? "text-muted-foreground line-through" : ""}>{habit.name}</span>
                        <Switch checked={!habit.paused} onCheckedChange={() => toggleHabitPaused(habit.id)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {notificationPermission !== "granted" && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={requestNotificationPermission}
            >
              <Bell className="h-4 w-4" />
              Activar notificaciones
            </Button>
          )}
        </div>
      </div>

      <div className="text-center text-muted-foreground italic text-sm md:text-base">"{todayQuote}"</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="habits" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="habits">Hábitos</TabsTrigger>
              <TabsTrigger value="consumption">Consumo</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              <TabsTrigger value="patterns">Patrones</TabsTrigger>
            </TabsList>

            <Card>
              <CardContent className="pt-4 md:pt-6">
                <TabsContent value="habits" className="mt-0">
                  <HabitDashboard
                    habits={habits}
                    selectedDate={selectedDate}
                    toggleHabit={toggleHabit}
                    addHabit={addHabit}
                    removeHabit={removeHabit}
                    updateHabitReminder={updateHabitReminder}
                    updateHabitCategory={updateHabitCategory}
                    updateHabitRecurringDays={updateHabitRecurringDays}
                    notificationPermission={notificationPermission}
                    travelMode={travelMode}
                  />
                </TabsContent>

                <TabsContent value="consumption" className="mt-0">
                  <ConsumptionTracker
                    cigarettes={todayCigarettes}
                    joints={todayJoints}
                    updateConsumption={updateConsumption}
                    consumptionRecords={consumptionRecords}
                  />
                </TabsContent>

                <TabsContent value="stats" className="mt-0">
                  <Stats habits={habits} consumptionRecords={consumptionRecords} selectedDate={selectedDate} />
                </TabsContent>

                <TabsContent value="patterns" className="mt-0">
                  <PatternAnalysis habits={habits} consumptionRecords={consumptionRecords} />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>

        <div className="order-first md:order-last">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <Calendar
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                habits={habits}
                consumptionRecords={consumptionRecords}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

