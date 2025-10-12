import { useState, useEffect } from "react";
import MaterialIcon from '../components/MaterialIcon';
import { iconOptions } from '../utils/iconOptions';
import habitService from '../services/habitService';
import type { FormErrors, HabitFormData, HabitWithProgress } from './Types';

interface HabitFormModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onHabitCreated: (habit: HabitWithProgress) => void;
  onHabitUpdated?: (habit: HabitWithProgress) => void;
  habitToEdit?: HabitWithProgress | null;
}

export default function HabitFormModal({ 
  isOpen, 
  setIsOpen, 
  onHabitCreated,
  onHabitUpdated,
  habitToEdit
}: HabitFormModalProps) {
  
  const isEditMode = !!habitToEdit;
  
  // Track which duration method user is using
  const [durationType, setDurationType] = useState<'ongoing' | 'weeks' | 'date'>('ongoing');
  
  const [formData, setFormData] = useState<HabitFormData>({
    name: "",
    category: "Health",
    goal_description: "",
    periodicity: "daily",
    frequency: 1,
    specific_days: [],
    preferred_time: "",
    icon: "Favorite",
    duration_weeks: undefined,
  });

  const [endDateInput, setEndDateInput] = useState<string>("");

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

  // Calculate end date from duration_weeks
  const calculateEndDate = (weeks: number): string => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (weeks * 7));
    return endDate.toISOString().split('T')[0];
  };

  // Calculate duration_weeks from end date
  const calculateDurationWeeks = (endDateStr: string): number => {
    const today = new Date();
    const endDate = new Date(endDateStr);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / 7));
  };

  // Populate form when editing
  useEffect(() => {
    if (habitToEdit && isOpen) {
      setFormData({
        name: habitToEdit.name || "",
        category: habitToEdit.category || "Health",
        goal_description: habitToEdit.goal_description || "",
        periodicity: habitToEdit.periodicity || "daily",
        frequency: habitToEdit.frequency || 1,
        specific_days: habitToEdit.specific_days || [],
        preferred_time: habitToEdit.preferred_time || "",
        icon: habitToEdit.icon || "Favorite",
        duration_weeks: habitToEdit.duration_weeks,
      });
      
      // Determine duration type
      if (habitToEdit.duration_weeks) {
        setDurationType('weeks');
      } else {
        setDurationType('ongoing');
      }
      
      setErrors({});
    } else if (!habitToEdit && isOpen) {
      // Reset form when creating new habit
      setFormData({
        name: "",
        category: "Health",
        goal_description: "",
        periodicity: "daily",
        frequency: 1,
        specific_days: [],
        preferred_time: "",
        icon: "Favorite",
        duration_weeks: undefined,
      });
      setDurationType('ongoing');
      setEndDateInput("");
      setErrors({});
    }
  }, [habitToEdit, isOpen]);

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

    // Validate duration if specified
    if (durationType === 'weeks' && (!formData.duration_weeks || formData.duration_weeks < 1)) {
      newErrors.duration = "Duration must be at least 1 week";
    }

    if (durationType === 'date' && !endDateInput) {
      newErrors.duration = "Please select an end date";
    } else if (durationType === 'date' && endDateInput) {
      const selectedDate = new Date(endDateInput);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        newErrors.duration = "End date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    const processedValue = name === 'frequency' ? parseInt(value) : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear related error
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDurationTypeChange = (type: 'ongoing' | 'weeks' | 'date') => {
    setDurationType(type);
    
    if (type === 'ongoing') {
      setFormData(prev => ({ ...prev, duration_weeks: undefined }));
      setEndDateInput("");
    } else if (type === 'weeks' && !formData.duration_weeks) {
      setFormData(prev => ({ ...prev, duration_weeks: 12 })); // Default 12 weeks
    } else if (type === 'date' && !endDateInput) {
      // Default to 12 weeks from now
      setEndDateInput(calculateEndDate(12));
      setFormData(prev => ({ ...prev, duration_weeks: 12 }));
    }
    
    if (errors.duration) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.duration;
        return newErrors;
      });
    }
  };

  const handleDurationWeeksChange = (weeks: number) => {
    setFormData(prev => ({ ...prev, duration_weeks: weeks }));
    // Update end date display if in date mode
    if (durationType === 'date') {
      setEndDateInput(calculateEndDate(weeks));
    }
  };

  const handleEndDateChange = (dateStr: string) => {
    setEndDateInput(dateStr);
    // Calculate and update duration_weeks
    const weeks = calculateDurationWeeks(dateStr);
    setFormData(prev => ({ ...prev, duration_weeks: weeks }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => {
      const newSpecificDays = prev.specific_days.includes(day)
        ? prev.specific_days.filter(d => d !== day)
        : [...prev.specific_days, day];
      
      // Auto-update frequency based on selected days
      return {
        ...prev,
        specific_days: newSpecificDays,
        frequency: newSpecificDays.length > 0 ? newSpecificDays.length : 1
      };
    });
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
    if (errors.icon) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.icon;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const dataToSubmit = {
        ...formData,
        // If ongoing, set duration_weeks to null/undefined
        duration_weeks: durationType === 'ongoing' ? undefined : formData.duration_weeks,
      };

      if (isEditMode && habitToEdit) {
        const updatedHabit = await habitService.updateHabit(habitToEdit.id, dataToSubmit);
        if (onHabitUpdated) {
          onHabitUpdated(updatedHabit);
        }
      } else {
        const newHabit = await habitService.createHabit(dataToSubmit);
        onHabitCreated(newHabit);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting habit:', error);
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Failed to save habit. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal if clicking on backdrop (not on the modal content)
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-4 pr-8">
          {isEditMode ? 'Edit Habit' : 'Create New Habit'}
        </h2>

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

          {/* Frequency - Only show for Daily and Monthly */}
          {formData.periodicity !== 'weekly' && (
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
          )}

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
              {formData.specific_days.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {formData.specific_days.length} {formData.specific_days.length === 1 ? 'day' : 'days'} per week selected
                </p>
              )}
            </div>
          )}

          {/* Duration Section - NEW */}
          <div className="border-t pt-4">
            <label className="block font-medium mb-2">How long do you want to track this? *</label>
            
            {/* Duration Type Selection */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleDurationTypeChange('ongoing')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  durationType === 'ongoing'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                Ongoing
              </button>
              <button
                type="button"
                onClick={() => handleDurationTypeChange('weeks')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  durationType === 'weeks'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                Set Weeks
              </button>
              <button
                type="button"
                onClick={() => handleDurationTypeChange('date')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  durationType === 'date'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                Set Date
              </button>
            </div>

            {/* Ongoing - No additional input */}
            {durationType === 'ongoing' && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p>✨ Track this habit indefinitely. You can always update or stop tracking later.</p>
              </div>
            )}

            {/* Weeks Duration Input */}
            {durationType === 'weeks' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Number of weeks:</label>
                <input
                  type="number"
                  min="1"
                  max="104"
                  value={formData.duration_weeks || 12}
                  onChange={(e) => handleDurationWeeksChange(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  End date: {formData.duration_weeks ? calculateEndDate(formData.duration_weeks) : 'Not set'}
                </p>
              </div>
            )}

            {/* End Date Input */}
            {durationType === 'date' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Target completion date:</label>
                <input
                  type="date"
                  value={endDateInput}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg p-3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Duration: {formData.duration_weeks || 0} weeks
                </p>
              </div>
            )}

            {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
          </div>

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

          {/* Error message for submit failures */}
          {errors.submit && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {isSubmitting 
                ? (isEditMode ? "Updating Habit..." : "Creating Habit...") 
                : (isEditMode ? "Update Habit" : "Create Habit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}