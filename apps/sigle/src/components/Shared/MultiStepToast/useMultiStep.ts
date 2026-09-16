import { type MultiStepToastStep, useMultiStepToastStore } from "./store";

interface UseMultiStepOptions<T extends string> {
  steps: readonly { id: T; title: string; description?: string }[];
  onStepChange?: (stepId: T, status: MultiStepToastStep["status"]) => void;
}

interface UseMultiStepReturn<T extends string> {
  steps: MultiStepToastStep[];
  start: () => void;
  completeStep: (id: T) => void;
  setStepLoading: (id: T) => void;
  setStepError: (id: T, errorMessage: string) => void;
  setAllComplete: () => void;
  reset: () => void;
}

export function useMultiStep<T extends string>(
  options: UseMultiStepOptions<T>,
): UseMultiStepReturn<T> {
  const { steps: stepDefinitions, onStepChange } = options,
    { setSteps, updateStep, reset } = useMultiStepToastStore(),
    initializeSteps = (): MultiStepToastStep[] => {
      return stepDefinitions.map((step, index) => ({
        ...step,
        status: index === 0 ? ("pending" as const) : ("idle" as const),
      }));
    },
    start = () => {
      const initialSteps = initializeSteps();
      setSteps(initialSteps);
      onStepChange?.(stepDefinitions[0].id, "pending");
    },
    completeStep = (id: T) => {
      const { steps } = useMultiStepToastStore.getState(),
        currentIndex = steps.findIndex((s) => s.id === id),
        isLastStep = currentIndex === steps.length - 1;

      updateStep(id, { status: "success" });
      onStepChange?.(id, "success");

      if (isLastStep) {
        return;
      }

      if (currentIndex !== -1) {
        const nextStep = steps[currentIndex + 1];
        updateStep(nextStep.id, { status: "pending" });
        onStepChange?.(nextStep.id as T, "pending");
      }
    },
    setStepLoading = (id: T) => {
      updateStep(id, { status: "pending" });
      onStepChange?.(id, "pending");
    },
    setStepError = (id: T, errorMessage: string) => {
      updateStep(id, { status: "error", errorMessage });
      onStepChange?.(id, "error");
    },
    setAllComplete = () => {
      const allCompleteSteps = stepDefinitions.map((step) => ({
        ...step,
        status: "success" as const,
      }));
      setSteps(allCompleteSteps);
    },
    steps = useMultiStepToastStore((state) => state.steps);

  return {
    steps,
    start,
    completeStep,
    setStepLoading,
    setStepError,
    setAllComplete,
    reset,
  };
}
