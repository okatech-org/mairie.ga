// Store global pour permettre à iAsted de remplir les formulaires
type FormFieldValue = string | boolean | File | null;

interface FormAssistantState {
  currentForm: 'registration_choice' | 'gabonais_registration' | 'foreigner_registration' | null;
  currentStep: number;
  formData: Record<string, FormFieldValue>;
  listeners: Set<() => void>;
}

const state: FormAssistantState = {
  currentForm: null,
  currentStep: 1,
  formData: {},
  listeners: new Set()
};

export const formAssistantStore = {
  // Getters
  getState: () => ({ ...state }),
  getCurrentForm: () => state.currentForm,
  getCurrentStep: () => state.currentStep,
  getFormData: () => ({ ...state.formData }),
  getField: (field: string) => state.formData[field],

  // Setters
  setCurrentForm: (form: FormAssistantState['currentForm']) => {
    state.currentForm = form;
    formAssistantStore.notifyListeners();
  },

  setCurrentStep: (step: number) => {
    state.currentStep = step;
    formAssistantStore.notifyListeners();
  },

  setField: (field: string, value: FormFieldValue) => {
    state.formData[field] = value;
    formAssistantStore.notifyListeners();
  },

  setMultipleFields: (fields: Record<string, FormFieldValue>) => {
    Object.assign(state.formData, fields);
    formAssistantStore.notifyListeners();
  },

  clearForm: () => {
    state.formData = {};
    state.currentStep = 1;
    formAssistantStore.notifyListeners();
  },

  // Subscription
  subscribe: (listener: () => void) => {
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
  },

  notifyListeners: () => {
    state.listeners.forEach(listener => listener());
  }
};

// Hook pour React
import { useSyncExternalStore } from 'react';

export function useFormAssistant() {
  const formState = useSyncExternalStore(
    formAssistantStore.subscribe,
    formAssistantStore.getState
  );

  return {
    ...formState,
    setField: formAssistantStore.setField,
    setMultipleFields: formAssistantStore.setMultipleFields,
    setCurrentStep: formAssistantStore.setCurrentStep,
    setCurrentForm: formAssistantStore.setCurrentForm,
    clearForm: formAssistantStore.clearForm,
    getField: formAssistantStore.getField
  };
}
