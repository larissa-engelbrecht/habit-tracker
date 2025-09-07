import { useState } from "react"
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function WeeklyCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  )

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const goToNextWeek = () => setWeekStart((prev) => addWeeks(prev, 1))
  const goToPrevWeek = () => setWeekStart((prev) => subWeeks(prev, 1))
  const goToToday = () => {
    const today = new Date()
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))
    setSelectedDate(today)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 w-full">
      {/* Week Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPrevWeek}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-semibold text-center flex-1">
          Week of {format(weekStart, "d MMM yyyy")}
        </h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={goToToday}
            className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-100"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days of the Week */}
     <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 w-full">
        {days.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate)
            return (
            <div
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`p-3 rounded-xl shadow text-center cursor-pointer transition 
                ${isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-gray-50 hover:bg-blue-100"}`}
            >
                <div className="font-semibold">{format(day, "EEE")}</div>
                <div>{format(day, "d")}</div>
            </div>
            )
        })}
      </div>
    </div>
  )
}
