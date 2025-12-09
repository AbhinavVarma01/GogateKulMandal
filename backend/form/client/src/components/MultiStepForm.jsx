import { useMemo } from "react";
import PropTypes from "prop-types";
import FormSection from "./FormSection.jsx";

const progressVariant = {
  1: "w-1/6",
  2: "w-2/6",
  3: "w-3/6",
  4: "w-4/6",
  5: "w-5/6",
  6: "w-full",
};

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
  const progressWidth = useMemo(
    () => progressVariant[currentStep] ?? "w-0",
    [currentStep]
  );

  const currentSection = sections[currentStep - 1];

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
            <p className="text-sm font-medium text-primary-600">
              Step {currentStep} of {sections.length}
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {currentSection.title}
            </h2>
            <p className="text-sm text-slate-500">
              {currentSection.description}
            </p>
          </div>
          <span className="text-sm font-semibold text-primary-600">
            {Math.round((currentStep / sections.length) * 100)}% Complete
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all duration-500 ease-out ${progressWidth}`}
          />
        </div>
      </div>

      {sections.map((section, index) => (
        <FormSection
          key={section.id}
          sectionId={section.id}
          active={currentStep === index + 1}
        >
          {section.render({ register, control, watch, errors })}
        </FormSection>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 1}
          className="inline-flex items-center justify-center rounded-full border border-primary-200 px-6 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          aria-disabled={currentStep === 1}
        >
          Back
        </button>
        <div className="flex-1" />
        <button
          type={currentStep === sections.length ? "submit" : "button"}
          onClick={
            currentStep === sections.length
              ? undefined
              : (event) => {
                  event.preventDefault();
                  onNext();
                }
          }
          className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : currentStep === sections.length
            ? "Submit"
            : "Next"}
        </button>
      </div>
    </form>
  );
};

MultiStepForm.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      render: PropTypes.func.isRequired,
    })
  ).isRequired,
  currentStep: PropTypes.number.isRequired,
  register: PropTypes.func.isRequired,
  control: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
};

export default MultiStepForm;