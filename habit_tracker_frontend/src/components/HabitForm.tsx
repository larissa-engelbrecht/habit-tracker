import { useState } from "react";
import MaterialIcon from '../components/MaterialIcon';
import { iconOptions } from '../utils/iconOptions';
import habitService from '../services/habitService';
import type { FormErrors, HabitFormData, HabitWithProgress } from './Types';

export default function HabitFormModal({ 
  isOpen, 
  setIsOpen, 
  onHabitCreated 
}: { 
  isOpen: boolean; 
  setIsOpen: (open: boolean) => void;
  onHabitCreated: (habit: HabitWithProgress) => void;
}) {
  const [formData, setFormData] = useState<HabitFormData>({
    name: "",
    category: "Health",
    goal_description: "",
    periodicity: "daily",
    frequency: 1,
    specific_days: [],
    preferred_time: "",
    icon: "Favorite",
  });

  const getPeriodLabel = (periodicity: string) => {
    switch(periodicity) {
      case 'daily': return 'day';
      case 'weekly': return 'week';
      case 'monthly': return 'month';
      default: return periodicity;
    }
  };

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const categories = ["Health", "Work", "Personal", "Other"];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Habit name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Habit name must be at least 2 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.periodicity) {
      newErrors.periodicity = "Periodicity is required";
    }

    if (!formData.icon) {
      newErrors.icon = "Icon is required";
    }

    // Weekly habits should have specific days
    if (formData.periodicity === "weekly" && formData.specific_days.length === 0) {
      newErrors.periodicity = "Please select specific days for weekly habits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      specific_days: prev.specific_days.includes(day)
        ? prev.specific_days.filter(d => d !== day)
        : [...prev.specific_days, day],
    }));
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
    if (errors.icon) {
      setErrors(prev => ({ ...prev, icon: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the habit via your API
      const newHabit = await habitService.createHabit(formData);
      
      onHabitCreated(newHabit);
      setIsOpen(false);
      
      // Reset form
      setFormData({
        name: "",
        category: "Health",
        goal_description: "",
        periodicity: "daily",
        frequency: 1,
        specific_days: [],
        preferred_time: "",
        icon: "Favorite",
      });
       setErrors(prev => ({ ...prev, submit: "Failed to create habit. Please try again." }));
      
    } catch (error) {
      console.error("Error creating habit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg relative max-h-[90vh] overflow-y-auto scrollbar-hide">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 transition-all"
        >
          <MaterialIcon iconName="Close" fontSize="small" />
        </button>

        <h2 className="text-2xl font-semibold mb-6">Create New Habit</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Habit Name */}
          <div>
            <label className="block font-medium mb-1">Habit Name *</label>
            <input 
              type="text" 
              name="name" 
              placeholder="e.g., Morning Workout" 
              value={formData.name} 
              onChange={handleChange} 
              className={`w-full border rounded-lg p-3 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block font-medium mb-1">Category *</label>
            <select 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              className={`w-full border rounded-lg p-3 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-1">Goal Description</label>
            <textarea 
              name="goal_description" 
              placeholder="e.g., Exercise for 30 minutes" 
              value={formData.goal_description} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg p-3 h-20 resize-none"
            />
          </div>

          {/* Periodicity */}
          <div>
            <label className="block font-medium mb-1">How Often? *</label>
            <select 
              name="periodicity" 
              value={formData.periodicity} 
              onChange={handleChange} 
              className={`w-full border rounded-lg p-3 ${errors.periodicity ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            {errors.periodicity && <p className="text-red-500 text-sm mt-1">{errors.periodicity}</p>}
          </div>

          {/* Frequency */}
          <div>
            <label className="block font-medium mb-1">
              Times per {getPeriodLabel(formData.periodicity)}
            </label>
            <input 
              type="number" 
              name="frequency" 
              value={formData.frequency} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg p-3" 
              min="1" 
              max="10"
            />
          </div>

          {/* Specific Days (for weekly) */}
          {formData.periodicity === "weekly" && (
            <div>
              <label className="block font-medium mb-2">Which Days? *</label>
              <div className="flex gap-2 flex-wrap">
                {days.map(day => (
                  <button
                    type="button"
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                      formData.specific_days.includes(day) 
                        ? "bg-blue-500 text-white border-blue-500" 
                        : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Time */}
          <div>
            <label className="block font-medium mb-1">Preferred Time (Optional)</label>
            <input 
              type="time" 
              name="preferred_time" 
              value={formData.preferred_time} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block font-medium mb-2">Choose Icon *</label>
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {iconOptions.map(({ name, label }) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => handleIconSelect(name)}
                  title={label}
                  className={`p-2 rounded-lg border flex justify-center items-center hover:bg-gray-50 ${
                    formData.icon === name 
                      ? "bg-blue-500 text-white border-blue-500" 
                      : "bg-white border-gray-300"
                  }`}
                >
                  <MaterialIcon iconName={name} fontSize="medium" />
                </button>
              ))}
            </div>
            {errors.icon && <p className="text-red-500 text-sm mt-1">{errors.icon}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {isSubmitting ? "Creating Habit..." : "Create Habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}