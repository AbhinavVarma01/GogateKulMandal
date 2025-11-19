import { useMemo, useState, useEffect, useRef } from "react";
import FormSection from "./FormSection.jsx";

// removed fixed width variant mapping in favor of a smooth percentage-based progress

const MultiStepForm = ({
  sections,
  currentStep,
  register,
  control,
  watch,
  errors,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const [percent, setPercent] = useState(() => Math.round((currentStep / sections.length) * 100));
  const contentRef = useRef(null);

  const currentSection = sections[currentStep - 1];

  // Compute progress by checking how many inputs/selects/textareas in the
  // currently visible section have non-empty values. This gives a smoother,
  // field-aware progress instead of just step fractions.
  useEffect(() => {
    const el = contentRef.current;

    if (!el) {
      setPercent(Math.round((currentStep / sections.length) * 100));
      return;
    }

    // Query inputs within the rendered section (exclude file inputs and disabled/hidden)
    const inputs = Array.from(
      el.querySelectorAll('input, textarea, select')
    ).filter((i) => {
      if (i.type === 'file') return false;
      if (i.disabled) return false;
      if (i.getAttribute('aria-hidden') === 'true') return false;
      // exclude empty inputs that are not visible
      return true;
    });

    const total = inputs.length || 1; // avoid divide-by-zero

    const filled = inputs.reduce((acc, input) => {
      const val = input.value;
      if (val === null) return acc;
      if (typeof val === 'string' && val.trim() === '') return acc;
      return acc + 1;
    }, 0);

    const sectionFraction = Math.min(1, filled / total);

    const computed = Math.round(((currentStep - 1 + sectionFraction) / sections.length) * 100);
    setPercent(computed);
  }, [currentStep, sections, watch]);

  return (
    <form
      className="space-y-8"
      onSubmit={
        currentStep === sections.length
          ? onSubmit
          : (event) => {
              event.preventDefault();
              onNext();
            }
      }
      noValidate
    >
      <div className="space-y-3" aria-live="polite">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-600">Step {currentStep} of {sections.length}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{currentSection.title}</h2>
          </div>
          <div className="text-right text-sm text-slate-600">{percent}%</div>
        </div>

        {/* Progress Bar (percentage based) */}
        <div className="relative mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              style={{ width: `${percent}%` }}
              className={`h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 rounded-full`}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Step tick markers */}
          <div className="absolute left-0 top-0 h-2 w-full pointer-events-none">
            <div className="relative h-full">
              {sections.map((_, idx) => {
                const left = Math.round((idx / Math.max(1, sections.length - 1)) * 100);
                const active = idx + 1 <= currentStep;
                return (
                  <span
                    key={idx}
                    className={`absolute -translate-x-1/2 top-0 h-2 w-0 flex items-center justify-center`}
                    style={{ left: `${left}%` }}
                    aria-hidden
                  >
                    <span
                      className={`block h-2 w-2 rounded-full transform transition-colors duration-200 ${
                        active ? 'bg-amber-600 shadow-md' : 'bg-white border border-slate-200'
                      }`}
                    />
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <FormSection title={currentSection.title}>
        <div ref={contentRef}>
          {currentSection.render({ register, control, watch, errors })}
        </div>
      </FormSection>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 rounded-lg px-6 py-3 font-medium text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            isSubmitting
              ? "bg-amber-400 cursor-not-allowed opacity-60"
              : "bg-amber-500 hover:bg-amber-600"
          }`}
        >
          {isSubmitting
            ? "Processing..."
            : currentStep === sections.length
            ? "Submit"
            : "Next"}
        </button>
      </div>
    </form>
  );
};

export default MultiStepForm;