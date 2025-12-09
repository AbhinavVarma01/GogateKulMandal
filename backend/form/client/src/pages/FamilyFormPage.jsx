import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import MultiStepForm from "../components/MultiStepForm.jsx";
import ParentAutocomplete from "../components/ParentAutocomplete.jsx";
import { motion } from "framer-motion";

const VanshInputField = ({ field, error }) => {
  const inputRef = useRef(null);
  const [internalValue, setInternalValue] = useState(field.value ?? "");

  useEffect(() => {
    setInternalValue(field.value ?? "");
  }, [field.value]);

  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        inputElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setInternalValue(value);
      if (value === "") {
        field.onChange("");
      } else {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          field.onChange(num);
        }
      }
    },
    [field]
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Vansh
        <span className="text-red-500"> *</span>
      </label>
      <input
        ref={inputRef}
        type="number"
        min="1"
        max="110"
        value={internalValue}
        onChange={handleChange}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:ring-primary-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{ MozAppearance: 'textfield' }}
      />
      {error && (
        <p className="text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};

const initialFormValues = {
  personalDetails: {
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    confirmDateOfBirth: "",
    isAlive: "",
    dateOfDeath: "",
    confirmDateOfDeath: "",
    email: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    country: "",
    state: "",
    district: "",
    city: "",
    area: "",
    colonyStreet: "",
    flatPlotNumber: "",
    buildingNumber: "",
    pinCode: "",
    aboutYourself: "",
    qualifications: "",
    profession: "",
    profileImage: null,
    everMarried: "",
    vansh: "",
  },
  divorcedDetails: {
    description: "",
    spouseFirstName: "",
    spouseMiddleName: "",
    spouseLastName: "",
    dateOfDivorce: "",
    spouseProfileImage: null,
    marriageDate: "",
    everWidowed: "",
  },
  marriedDetails: {
    description: "",
    spouseFirstName: "",
    spouseMiddleName: "",
    spouseLastName: "",
    spouseGender: "",
    dateOfMarriage: "",
    spouseDateOfBirth: "",
    spouseProfileImage: null,
    spouseEmail: "",
    spouseMobileNumber: "",
    everDivorced: "",
  },
  remarriedDetails: {
    description: "",
    spouseFirstName: "",
    spouseMiddleName: "",
    spouseLastName: "",
    spouseGender: "",
    dateOfMarriage: "",
    spouseDateOfBirth: "",
    spouseEmail: "",
    spouseMobileNumber: "",
    spouseProfileImage: null,
  },
  widowedDetails: {
    description: "",
    spouseFirstName: "",
    spouseMiddleName: "",
    spouseLastName: "",
    spouseDateOfDeath: "",
    spouseGender: "",
    dateOfMarriage: "",
    spouseDateOfBirth: "",
    spouseEmail: "",
    spouseMobileNumber: "",
    spouseProfileImage: null,
    everRemarried: "",
  },
  parentsInformation: {
    description: "",
    fatherSerNo: null,
    fatherFirstName: "",
    fatherMiddleName: "",
    fatherLastName: "",
    fatherEmail: "",
    fatherMobileNumber: "",
    fatherDateOfBirth: "",
    fatherProfileImage: null,
    motherSerNo: null,
    motherFirstName: "",
    motherMiddleName: "",
    motherLastName: "",
    motherMobileNumber: "",
    motherDateOfBirth: "",
    motherProfileImage: null,
  },
};

const toFormData = (data) => {
  const formData = new FormData();

  const appendRecursive = (obj, prefix = "") => {
    Object.entries(obj).forEach(([key, value]) => {
      const formKey = prefix ? `${prefix}.${key}` : key;

      if (value instanceof FileList) {
        Array.from(value).forEach((file, index) => {
          formData.append(`${formKey}[${index}]`, file);
        });
      } else if (value instanceof File) {
        formData.append(formKey, value);
      } else if (value !== null && typeof value === "object") {
        appendRecursive(value, formKey);
      } else if (value !== undefined && value !== null && value !== "") {
        formData.append(formKey, value);
      }
    });
  };

  appendRecursive(data);
  return formData;
};

const FilePreviewInput = ({
  field,
  label,
  required,
  accept = "image/*",
  error,
  description,
  initialPreview = null,
}) => {
  const [preview, setPreview] = useState(() => {
    if (field.value instanceof File) {
      return null;
    }
    if (typeof field.value === "string" && field.value.startsWith("data:")) {
      return field.value;
    }
    if (initialPreview) {
      return initialPreview;
    }
    return field.value || null;
  });

  const handleChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);
        field.onChange(file);
      } else {
        setPreview(initialPreview || null);
        field.onChange(null);
      }
    },
    [field, initialPreview]
  );

  useEffect(() => {
    if (field.value instanceof File) {
      return;
    }

    if (typeof field.value === "string" && field.value.startsWith("data:")) {
      setPreview(field.value);
      return;
    }

    if (initialPreview) {
      setPreview(initialPreview);
      return;
    }

    if (!field.value) {
      setPreview(null);
    }
  }, [field.value, initialPreview]);

  const effectivePreview = preview;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          aria-describedby={description ? `${field.name}-description` : undefined}
          className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm transition hover:border-primary-400 hover:text-slate-800"
        />
        {effectivePreview ? (
          <motion.img
            src={effectivePreview}
            alt={`${label} preview`}
            className="h-16 w-16 rounded-full border border-slate-200 object-cover shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : null}
      </div>
      {description && (
        <p id={`${field.name}-description`} className="text-xs text-slate-500">
          {description}
        </p>
      )}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
};

const TextInput = ({ label, register, required, error, type = "text", disabled = false, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <input
      type={type}
      disabled={disabled}
      className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:ring-primary-500 ${
        disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
      }`}
      {...register}
      {...props}
    />
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
  </div>
);

const SelectInput = ({ label, register, options, required, error, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <select
      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:ring-primary-500"
      {...register}
      {...props}
    >
      <option value="">Select</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
  </div>
);

const TextAreaInput = ({ label, register, required, error, rows = 3, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <textarea
      rows={rows}
      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:ring-primary-500"
      {...register}
      {...props}
    />
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
  </div>
);

const radioOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const RadioGroup = ({ label, name, control, options, required, error }) => (
  <div className="space-y-2">
    <span className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </span>
    <div className="flex flex-wrap gap-4" role="radiogroup" aria-labelledby={`${name}-label`}>
      <Controller
        name={name}
        control={control}
        rules={{ required: required ? "This field is required" : false }}
        render={({ field }) => (
          <>
            {options.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  field.value === option.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-slate-300 bg-white text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  value={option.value}
                  checked={field.value === option.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  className="hidden"
                />
                {option.label}
              </label>
            ))}
          </>
        )}
      />
    </div>
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
  </div>
);

const StepSection = ({ title, children }) => (
  <section
    aria-label={title}
    className="rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-100"
  >
    <div className="space-y-6">
      {children}
    </div>
  </section>
);

const SECTION_IDS = {
  PERSONAL: "personal",
  MARRIED: "married",
  DIVORCED: "divorced",
  WIDOWED: "widowed",
  REMARRIED: "remarried",
  PARENTS: "parents",
};

export default function FamilyFormPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [fatherSelected, setFatherSelected] = useState(false);
  const [motherSelected, setMotherSelected] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: initialFormValues,
  });

  const formValues = watch();
  const [fatherPreview, setFatherPreview] = useState(null);
  const [motherPreview, setMotherPreview] = useState(null);

  useEffect(() => {
    const fatherImage = formValues.parentsInformation?.fatherProfileImage;

    if (fatherImage instanceof File) {
      setFatherPreview(null);
      return;
    }

    if (typeof fatherImage === "string" && fatherImage.startsWith("data:")) {
      setFatherPreview(fatherImage);
      return;
    }

    if (fatherImage && typeof fatherImage === "object" && fatherImage.data && fatherImage.mimeType) {
      setFatherPreview(`data:${fatherImage.mimeType};base64,${fatherImage.data}`);
      return;
    }

    if (!fatherImage) {
      setFatherPreview(null);
    }
  }, [formValues.parentsInformation?.fatherProfileImage]);

  useEffect(() => {
    const motherImage = formValues.parentsInformation?.motherProfileImage;

    if (motherImage instanceof File) {
      setMotherPreview(null);
      return;
    }

    if (typeof motherImage === "string" && motherImage.startsWith("data:")) {
      setMotherPreview(motherImage);
      return;
    }

    if (motherImage && typeof motherImage === "object" && motherImage.data && motherImage.mimeType) {
      setMotherPreview(`data:${motherImage.mimeType};base64,${motherImage.data}`);
      return;
    }

    if (!motherImage) {
      setMotherPreview(null);
    }
  }, [formValues.parentsInformation?.motherProfileImage]);

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const formData = toFormData(data);
      const response = await axios.post("/api/family/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setSubmitMessage("Family member added successfully!");
        reset();
        setCurrentStep(1);
        setFatherSelected(false);
        setMotherSelected(false);
        setFatherPreview(null);
        setMotherPreview(null);
      }
    } catch (error) {
      setSubmitMessage(
        error.response?.data?.message || "An error occurred while submitting the form"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldRequire = (fieldPath, formValuesData) => {
    const [section] = fieldPath.split(".");
    const reachable = getReachableSections(formValuesData);
    const sectionMap = {
      personalDetails: SECTION_IDS.PERSONAL,
      marriedDetails: SECTION_IDS.MARRIED,
      divorcedDetails: SECTION_IDS.DIVORCED,
      widowedDetails: SECTION_IDS.WIDOWED,
      remarriedDetails: SECTION_IDS.REMARRIED,
      parentsInformation: SECTION_IDS.PARENTS,
    };
    return reachable.has(sectionMap[section]);
  };

  const useSectionMetadata = useMemo(
    () => [
      {
        id: SECTION_IDS.PERSONAL,
        title: "Personal Details",
        description: "Share core information for the family member.",
        render: () => (
          <StepSection title="Personal Details">
            <div className="grid gap-6 md:grid-cols-2">
              <Controller
                name="personalDetails.vansh"
                control={control}
                rules={{
                  required: "Vansh is required",
                  min: { value: 1, message: "Vansh must be at least 1" },
                  max: { value: 110, message: "Vansh must not exceed 110" },
                }}
                render={({ field }) => (
                  <VanshInputField 
                    field={field} 
                    error={errors.personalDetails?.vansh?.message} 
                  />
                )}
              />
              <TextInput
                label="First Name"
                register={register("personalDetails.firstName", {
                  required: "First name is required",
                })}
                required
                error={errors.personalDetails?.firstName?.message}
              />
              <TextInput
                label="Middle Name"
                register={register("personalDetails.middleName")}
              />
              <TextInput
                label="Last Name"
                register={register("personalDetails.lastName", {
                  required: "Last name is required",
                })}
                required
                error={errors.personalDetails?.lastName?.message}
              />
              <SelectInput
                label="Gender"
                register={register("personalDetails.gender", {
                  required: "Gender is required",
                })}
                options={["Male", "Female", "Other"].map((option) => ({
                  value: option.toLowerCase(),
                  label: option,
                }))}
                required
                error={errors.personalDetails?.gender?.message}
              />
              <TextInput
                label="Date of Birth"
                type="date"
                register={register("personalDetails.dateOfBirth", {
                  required: "Date of birth is required",
                })}
                required
                error={errors.personalDetails?.dateOfBirth?.message}
              />
              <RadioGroup
                label="Confirm Date of Birth?"
                name="personalDetails.confirmDateOfBirth"
                control={control}
                options={radioOptions}
                required
                error={errors.personalDetails?.confirmDateOfBirth?.message}
              />
              <RadioGroup
                label="Is the person alive?"
                name="personalDetails.isAlive"
                control={control}
                options={radioOptions}
                required
                error={errors.personalDetails?.isAlive?.message}
              />
              {formValues.personalDetails?.isAlive === "no" && (
                <>
                  <TextInput
                    label="Date of Death"
                    type="date"
                    register={register("personalDetails.dateOfDeath", {
                      required: "Date of death is required when person is not alive",
                    })}
                    required
                    error={errors.personalDetails?.dateOfDeath?.message}
                  />
                  <RadioGroup
                    label="Confirm Date of Death?"
                    name="personalDetails.confirmDateOfDeath"
                    control={control}
                    options={radioOptions}
                    required
                    error={errors.personalDetails?.confirmDateOfDeath?.message}
                  />
                </>
              )}
              <TextInput
                label="Email"
                type="email"
                register={register("personalDetails.email", {
                  required: "Email is required",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Please enter a valid email",
                  },
                })}
                required
                error={errors.personalDetails?.email?.message}
              />
              <TextInput
                label="Mobile Number"
                type="tel"
                register={register("personalDetails.mobileNumber", {
                  required: "Mobile number is required",
                  minLength: { value: 10, message: "Minimum 10 digits required" },
                })}
                required
                error={errors.personalDetails?.mobileNumber?.message}
              />
              <TextInput
                label="Alternate Mobile Number"
                type="tel"
                register={register("personalDetails.alternateMobileNumber")}
              />
              <TextInput
                label="Country"
                register={register("personalDetails.country", {
                  required: "Country is required",
                })}
                required
                error={errors.personalDetails?.country?.message}
              />
              <TextInput
                label="State"
                register={register("personalDetails.state", {
                  required: "State is required",
                })}
                required
                error={errors.personalDetails?.state?.message}
              />
              <TextInput
                label="District"
                register={register("personalDetails.district", {
                  required: "District is required",
                })}
                required
                error={errors.personalDetails?.district?.message}
              />
              <TextInput
                label="City"
                register={register("personalDetails.city", {
                  required: "City is required",
                })}
                required
                error={errors.personalDetails?.city?.message}
              />
              <TextInput
                label="Area"
                register={register("personalDetails.area")}
              />
              <TextInput
                label="Colony/Street"
                register={register("personalDetails.colonyStreet")}
              />
              <TextInput
                label="Flat/Plot Number"
                register={register("personalDetails.flatPlotNumber")}
              />
              <TextInput
                label="Building Number"
                register={register("personalDetails.buildingNumber")}
              />
              <TextInput
                label="Pin Code"
                register={register("personalDetails.pinCode", {
                  required: "Pin code is required",
                })}
                required
                error={errors.personalDetails?.pinCode?.message}
              />
              <TextAreaInput
                label="About Yourself"
                register={register("personalDetails.aboutYourself")}
              />
              <TextInput
                label="Qualifications"
                register={register("personalDetails.qualifications")}
              />
              <TextInput
                label="Profession"
                register={register("personalDetails.profession")}
              />
              <Controller
                name="personalDetails.profileImage"
                control={control}
                rules={{ required: "Profile image is required" }}
                render={({ field }) => (
                  <FilePreviewInput
                    field={field}
                    label="Profile Image"
                    required
                    error={errors.personalDetails?.profileImage?.message}
                    description="Upload your profile image."
                  />
                )}
              />
              <RadioGroup
                label="Have you ever been married?"
                name="personalDetails.everMarried"
                control={control}
                options={radioOptions}
                required
                error={errors.personalDetails?.everMarried?.message}
              />
            </div>
          </StepSection>
        ),
      },
      {
        id: SECTION_IDS.MARRIED,
        title: "Married Details",
        description: "Provide details about your marriage.",
        render: () => (
          <StepSection title="Married Details">
            <TextAreaInput
              label="Description"
              register={register("marriedDetails.description")}
              rows={3}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <TextInput
                label="Spouse First Name"
                register={register("marriedDetails.spouseFirstName", {
                  validate: (value) => {
                    if (!shouldRequire("marriedDetails.spouseFirstName", formValues))
                      return true;
                    return value ? true : "First name is required";
                  },
                })}
                required={shouldRequire("marriedDetails.spouseFirstName", formValues)}
                error={errors.marriedDetails?.spouseFirstName?.message}
              />
              <TextInput
                label="Spouse Middle Name"
                register={register("marriedDetails.spouseMiddleName")}
              />
              <TextInput
                label="Spouse Last Name"
                register={register("marriedDetails.spouseLastName", {
                  validate: (value) => {
                    if (!shouldRequire("marriedDetails.spouseLastName", formValues))
                      return true;
                    return value ? true : "Last name is required";
                  },
                })}
                required={shouldRequire("marriedDetails.spouseLastName", formValues)}
                error={errors.marriedDetails?.spouseLastName?.message}
              />
              <SelectInput
                label="Spouse Gender"
                register={register("marriedDetails.spouseGender", {
                  validate: (value) => {
                    if (!shouldRequire("marriedDetails.spouseGender", formValues))
                      return true;
                    return value ? true : "Gender is required";
                  },
                })}
                options={["Male", "Female", "Other"].map((option) => ({
                  value: option.toLowerCase(),
                  label: option,
                }))}
                required={shouldRequire("marriedDetails.spouseGender", formValues)}
                error={errors.marriedDetails?.spouseGender?.message}
              />
              <TextInput
                label="Date of Marriage"
                type="date"
                register={register("marriedDetails.dateOfMarriage", {
                  validate: (value) => {
                    if (!shouldRequire("marriedDetails.dateOfMarriage", formValues))
                      return true;
                    return value ? true : "Date of marriage is required";
                  },
                })}
                required={shouldRequire("marriedDetails.dateOfMarriage", formValues)}
                error={errors.marriedDetails?.dateOfMarriage?.message}
              />
              <TextInput
                label="Spouse Date of Birth"
                type="date"
                register={register("marriedDetails.spouseDateOfBirth", {
                  validate: (value) => {
                    if (!shouldRequire("marriedDetails.spouseDateOfBirth", formValues))
                      return true;
                    return value ? true : "Date of birth is required";
                  },
                })}
                required={shouldRequire("marriedDetails.spouseDateOfBirth", formValues)}
                error={errors.marriedDetails?.spouseDateOfBirth?.message}
              />
              <TextInput
                label="Spouse Email"
                type="email"
                register={register("marriedDetails.spouseEmail")}
              />
              <TextInput
                label="Spouse Mobile Number"
                type="tel"
                register={register("marriedDetails.spouseMobileNumber")}
              />
              <Controller
                name="marriedDetails.spouseProfileImage"
                control={control}
                render={({ field }) => (
                  <FilePreviewInput
                    field={field}
                    label="Spouse Profile Image"
                    error={errors.marriedDetails?.spouseProfileImage?.message}
                    description="Upload spouse image if available."
                  />
                )}
              />
              <RadioGroup
                label="Have you ever been divorced?"
                name="marriedDetails.everDivorced"
                control={control}
                options={radioOptions}
                required
                error={errors.marriedDetails?.everDivorced?.message}
              />
            </div>
          </StepSection>
        ),
      },
      {
        id: SECTION_IDS.DIVORCED,
        title: "Divorced Details",
        description: "Provide details about your divorce.",
        render: () => (
          <StepSection title="Divorced Details">
            <TextAreaInput
              label="Description"
              register={register("divorcedDetails.description")}
              rows={3}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <TextInput
                label="Spouse First Name"
                register={register("divorcedDetails.spouseFirstName", {
                  validate: (value) => {
                    if (!shouldRequire("divorcedDetails.spouseFirstName", formValues))
                      return true;
                    return value ? true : "First name is required";
                  },
                })}
                required={shouldRequire("divorcedDetails.spouseFirstName", formValues)}
                error={errors.divorcedDetails?.spouseFirstName?.message}
              />
              <TextInput
                label="Spouse Middle Name"
                register={register("divorcedDetails.spouseMiddleName")}
              />
              <TextInput
                label="Spouse Last Name"
                register={register("divorcedDetails.spouseLastName", {
                  validate: (value) => {
                    if (!shouldRequire("divorcedDetails.spouseLastName", formValues))
                      return true;
                    return value ? true : "Last name is required";
                  },
                })}
                required={shouldRequire("divorcedDetails.spouseLastName", formValues)}
                error={errors.divorcedDetails?.spouseLastName?.message}
              />
              <TextInput
                label="Marriage Date"
                type="date"
                register={register("divorcedDetails.marriageDate")}
              />
              <TextInput
                label="Date of Divorce"
                type="date"
                register={register("divorcedDetails.dateOfDivorce", {
                  validate: (value) => {
                    if (!shouldRequire("divorcedDetails.dateOfDivorce", formValues))
                      return true;
                    return value ? true : "Date of divorce is required";
                  },
                })}
                required={shouldRequire("divorcedDetails.dateOfDivorce", formValues)}
                error={errors.divorcedDetails?.dateOfDivorce?.message}
              />
              <Controller
                name="divorcedDetails.spouseProfileImage"
                control={control}
                render={({ field }) => (
                  <FilePreviewInput
                    field={field}
                    label="Spouse Profile Image"
                    error={errors.divorcedDetails?.spouseProfileImage?.message}
                    description="Upload spouse image if available."
                  />
                )}
              />
              <RadioGroup
                label="Have you ever been widowed?"
                name="divorcedDetails.everWidowed"
                control={control}
                options={radioOptions}
                required
                error={errors.divorcedDetails?.everWidowed?.message}
              />
            </div>
          </StepSection>
        ),
      },
      {
        id: SECTION_IDS.WIDOWED,
        title: "Widowed Details",
        description: "Provide details about the spouse who passed away.",
        render: () => (
          <StepSection title="Widowed Details">
            <TextAreaInput
              label="Description"
              register={register("widowedDetails.description")}
              rows={3}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <TextInput
                label="Spouse First Name"
                register={register("widowedDetails.spouseFirstName", {
                  validate: (value) => {
                    if (!shouldRequire("widowedDetails.spouseFirstName", formValues))
                      return true;
                    return value ? true : "First name is required";
                  },
                })}
                required={shouldRequire("widowedDetails.spouseFirstName", formValues)}
                error={errors.widowedDetails?.spouseFirstName?.message}
              />
              <TextInput
                label="Spouse Middle Name"
                register={register("widowedDetails.spouseMiddleName")}
              />
              <TextInput
                label="Spouse Last Name"
                register={register("widowedDetails.spouseLastName", {
                  validate: (value) => {
                    if (!shouldRequire("widowedDetails.spouseLastName", formValues))
                      return true;
                    return value ? true : "Last name is required";
                  },
                })}
                required={shouldRequire("widowedDetails.spouseLastName", formValues)}
                error={errors.widowedDetails?.spouseLastName?.message}
              />
              <SelectInput
                label="Spouse Gender"
                register={register("widowedDetails.spouseGender", {
                  validate: (value) => {
                    if (!shouldRequire("widowedDetails.spouseGender", formValues))
                      return true;
                    return value ? true : "Gender is required";
                  },
                })}
                options={["Male", "Female", "Other"].map((option) => ({
                  value: option.toLowerCase(),
                  label: option,
                }))}
                required={shouldRequire("widowedDetails.spouseGender", formValues)}
                error={errors.widowedDetails?.spouseGender?.message}
              />
              <TextInput
                label="Date of Marriage"
                type="date"
                register={register("widowedDetails.dateOfMarriage")}
              />
              <TextInput
                label="Spouse Date of Birth"
                type="date"
                register={register("widowedDetails.spouseDateOfBirth")}
              />
              <TextInput
                label="Spouse Date of Death"
                type="date"
                register={register("widowedDetails.spouseDateOfDeath", {
                  validate: (value) => {
                    if (!shouldRequire("widowedDetails.spouseDateOfDeath", formValues))
                      return true;
                    return value ? true : "Date of death is required";
                  },
                })}
                required={shouldRequire("widowedDetails.spouseDateOfDeath", formValues)}
                error={errors.widowedDetails?.spouseDateOfDeath?.message}
              />
              <TextInput
                label="Spouse Email"
                type="email"
                register={register("widowedDetails.spouseEmail")}
              />
              <TextInput
                label="Spouse Mobile Number"
                type="tel"
                register={register("widowedDetails.spouseMobileNumber")}
              />
              <Controller
                name="widowedDetails.spouseProfileImage"
                control={control}
                render={({ field }) => (
                  <FilePreviewInput
                    field={field}
                    label="Spouse Profile Image"
                    error={errors.widowedDetails?.spouseProfileImage?.message}
                    description="Upload spouse image if available."
                  />
                )}
              />
              <RadioGroup
                label="Have you ever been remarried?"
                name="widowedDetails.everRemarried"
                control={control}
                options={radioOptions}
                required
                error={errors.widowedDetails?.everRemarried?.message}
              />
            </div>
          </StepSection>
        ),
      },
      {
        id: SECTION_IDS.REMARRIED,
        title: "Remarried Details",
        description: "Provide details about remarriage.",
        render: () => (
          <StepSection title="Remarried Details">
            <TextAreaInput
              label="Description"
              register={register("remarriedDetails.description")}
              rows={3}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <TextInput
                label="Spouse First Name"
                register={register("remarriedDetails.spouseFirstName", {
                  validate: (value) => {
                    if (!shouldRequire("remarriedDetails.spouseFirstName", formValues))
                      return true;
                    return value ? true : "First name is required";
                  },
                })}
                required={shouldRequire("remarriedDetails.spouseFirstName", formValues)}
                error={errors.remarriedDetails?.spouseFirstName?.message}
              />
              <TextInput
                label="Spouse Middle Name"
                register={register("remarriedDetails.spouseMiddleName")}
              />
              <TextInput
                label="Spouse Last Name"
                register={register("remarriedDetails.spouseLastName", {
                  validate: (value) => {
                    if (!shouldRequire("remarriedDetails.spouseLastName", formValues))
                      return true;
                    return value ? true : "Last name is required";
                  },
                })}
                required={shouldRequire("remarriedDetails.spouseLastName", formValues)}
                error={errors.remarriedDetails?.spouseLastName?.message}
              />
              <SelectInput
                label="Spouse Gender"
                register={register("remarriedDetails.spouseGender", {
                  validate: (value) => {
                    if (!shouldRequire("remarriedDetails.spouseGender", formValues))
                      return true;
                    return value ? true : "Gender is required";
                  },
                })}
                options={["Male", "Female", "Other"].map((option) => ({
                  value: option.toLowerCase(),
                  label: option,
                }))}
                required={shouldRequire("remarriedDetails.spouseGender", formValues)}
                error={errors.remarriedDetails?.spouseGender?.message}
              />
              <TextInput
                label="Date of Marriage"
                type="date"
                register={register("remarriedDetails.dateOfMarriage", {
                  validate: (value) => {
                    if (!shouldRequire("remarriedDetails.dateOfMarriage", formValues))
                      return true;
                    return value ? true : "Date of marriage is required";
                  },
                })}
                required={shouldRequire("remarriedDetails.dateOfMarriage", formValues)}
                error={errors.remarriedDetails?.dateOfMarriage?.message}
              />
              <TextInput
                label="Spouse Date of Birth"
                type="date"
                register={register("remarriedDetails.spouseDateOfBirth", {
                  validate: (value) => {
                    if (!shouldRequire("remarriedDetails.spouseDateOfBirth", formValues))
                      return true;
                    return value ? true : "Date of birth is required";
                  },
                })}
                required={shouldRequire("remarriedDetails.spouseDateOfBirth", formValues)}
                error={errors.remarriedDetails?.spouseDateOfBirth?.message}
              />
              <TextInput
                label="Spouse Email"
                type="email"
                register={register("remarriedDetails.spouseEmail")}
              />
              <TextInput
                label="Spouse Mobile Number"
                type="tel"
                register={register("remarriedDetails.spouseMobileNumber")}
              />
              <Controller
                name="remarriedDetails.spouseProfileImage"
                control={control}
                render={({ field }) => (
                  <FilePreviewInput
                    field={field}
                    label="Spouse Profile Image"
                    error={errors.remarriedDetails?.spouseProfileImage?.message}
                    description="Upload spouse image if available."
                  />
                )}
              />
            </div>
          </StepSection>
        ),
      },
      {
        id: SECTION_IDS.PARENTS,
        title: "Parents' Information",
        description: "Provide parents' contact and background details.",
        render: () => (
          <StepSection title="Parents' Information">
            <TextAreaInput
              label="Description"
              register={register("parentsInformation.description")}
              rows={3}
            />
            <div className="grid gap-6 md:grid-cols-2">
              {/* Father's Information Section */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Father's Information</h3>
              </div>

              {/* Father Autocomplete */}
              <div className="md:col-span-2">
                <ParentAutocomplete
                  label="Search Father by Name"
                  parentType="father"
                  vansh={formValues.personalDetails?.vansh}
                  onSelect={(data) => {
                    setFatherSelected(true);
                    setValue("parentsInformation.fatherSerNo", data.serNo || null, { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherFirstName", data.firstName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherMiddleName", data.middleName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherLastName", data.lastName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherEmail", data.email || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherMobileNumber", data.mobileNumber || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherDateOfBirth", data.dateOfBirth || "", { shouldValidate: true, shouldDirty: true });

                    if (data.profileImage) {
                      let imageString = "";
                      if (typeof data.profileImage === "string") {
                        imageString = data.profileImage;
                      } else if (data.profileImage.data && data.profileImage.mimeType) {
                        imageString = `data:${data.profileImage.mimeType};base64,${data.profileImage.data}`;
                      }

                      setFatherPreview(imageString || null);

                      if (imageString) {
                        setValue("parentsInformation.fatherProfileImage", imageString, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      } else {
                        setValue("parentsInformation.fatherProfileImage", null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    } else {
                      setFatherPreview(null);
                      setValue("parentsInformation.fatherProfileImage", null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  error={errors.parentsInformation?.fatherFirstName?.message}
                  firstNameValue={formValues.parentsInformation?.fatherFirstName}
                  middleNameValue={formValues.parentsInformation?.fatherMiddleName}
                  lastNameValue={formValues.parentsInformation?.fatherLastName}
                />
              </div>

              <TextInput
                label="Father's First Name"
                register={register("parentsInformation.fatherFirstName", {
                  required: "Father's first name is required",
                })}
                disabled={fatherSelected}
                required
                error={errors.parentsInformation?.fatherFirstName?.message}
              />
              <TextInput
                label="Father's Middle Name"
                register={register("parentsInformation.fatherMiddleName")}
                disabled={fatherSelected}
              />
              <TextInput
                label="Father's Last Name"
                register={register("parentsInformation.fatherLastName", {
                  required: "Father's last name is required",
                })}
                disabled={fatherSelected}
                required
                error={errors.parentsInformation?.fatherLastName?.message}
              />
              <TextInput
                label="Father's Email"
                type="email"
                register={register("parentsInformation.fatherEmail")}
                disabled={fatherSelected}
                error={errors.parentsInformation?.fatherEmail?.message}
              />
              <TextInput
                label="Father's Mobile Number"
                type="tel"
                register={register("parentsInformation.fatherMobileNumber", {
                  required: "Father's mobile number is required",
                  minLength: {
                    value: 10,
                    message: "Minimum 10 digits required",
                  },
                })}
                disabled={fatherSelected}
                required
                error={errors.parentsInformation?.fatherMobileNumber?.message}
              />
              <TextInput
                label="Father's Date of Birth"
                type="date"
                register={register("parentsInformation.fatherDateOfBirth", {
                  required: "Date of birth is required",
                })}
                disabled={fatherSelected}
                required
                error={errors.parentsInformation?.fatherDateOfBirth?.message}
              />
              <Controller
                name="parentsInformation.fatherProfileImage"
                control={control}
                render={({ field }) => (
                  <FilePreviewInput
                    field={{
                      ...field,
                      value: field.value instanceof File ? field.value : fatherPreview || field.value,
                    }}
                    label="Father's Profile Image"
                    error={errors.parentsInformation?.fatherProfileImage?.message}
                    description="Upload father's profile image (optional)."
                    initialPreview={fatherPreview || null}
                  />
                )}
              />

              {/* Mother's Information Section */}
              <div className="md:col-span-2 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Mother's Information</h3>
              </div>

              {/* Mother Autocomplete */}
              <div className="md:col-span-2">
                <ParentAutocomplete
                  label="Search Mother by Name"
                  parentType="mother"
                  vansh={formValues.personalDetails?.vansh}
                  onSelect={(data) => {
                    setMotherSelected(true);
                    setValue("parentsInformation.motherSerNo", data.serNo || null, { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.motherFirstName", data.firstName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.motherMiddleName", data.middleName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.motherLastName", data.lastName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.motherMobileNumber", data.mobileNumber || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.motherDateOfBirth", data.dateOfBirth || "", { shouldValidate: true, shouldDirty: true });

                    if (data.profileImage) {
                      let imageString = "";
                      if (typeof data.profileImage === "string") {
                        imageString = data.profileImage;
                      } else if (data.profileImage.data && data.profileImage.mimeType) {
                        imageString = `data:${data.profileImage.mimeType};base64,${data.profileImage.data}`;
                      }

                      setMotherPreview(imageString || null);

                      if (imageString) {
                        setValue("parentsInformation.motherProfileImage", imageString, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      } else {
                        setValue("parentsInformation.motherProfileImage", null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    } else {
                      setMotherPreview(null);
                      setValue("parentsInformation.motherProfileImage", null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  error={errors.parentsInformation?.motherFirstName?.message}
                  firstNameValue={formValues.parentsInformation?.motherFirstName}
                  middleNameValue={formValues.parentsInformation?.motherMiddleName}
                  lastNameValue={formValues.parentsInformation?.motherLastName}
                />
              </div>

              <TextInput
                label="Mother's First Name"
                register={register("parentsInformation.motherFirstName", {
                  required: "Mother's first name is required",
                })}
                disabled={motherSelected}
                required
                error={errors.parentsInformation?.motherFirstName?.message}
              />
              <TextInput
                label="Mother's Middle Name"
                register={register("parentsInformation.motherMiddleName")}
                disabled={motherSelected}
              />
              <TextInput
                label="Mother's Last Name"
                register={register("parentsInformation.motherLastName", {
                  required: "Mother's last name is required",
                })}
                disabled={motherSelected}
                required
                error={errors.parentsInformation?.motherLastName?.message}
              />
              <TextInput
                label="Mother's Mobile Number"
                type="tel"
                register={register("parentsInformation.motherMobileNumber")}
                disabled={motherSelected}
                error={errors.parentsInformation?.motherMobileNumber?.message}
              />
              <TextInput
                label="Mother's Date of Birth"
                type="date"
                register={register("parentsInformation.motherDateOfBirth", {
                  required: "Date of birth is required",
                })}
                disabled={motherSelected}
                required
                error={errors.parentsInformation?.motherDateOfBirth?.message}
              />
              <Controller
                name="parentsInformation.motherProfileImage"
                control={control}
                render={({ field }) => (
                  <FilePreviewInput
                    field={{
                      ...field,
                      value: field.value instanceof File ? field.value : motherPreview || field.value,
                    }}
                    label="Mother's Profile Image"
                    error={errors.parentsInformation?.motherProfileImage?.message}
                    description="Upload mother's profile image (optional)."
                    initialPreview={motherPreview || null}
                  />
                )}
              />
            </div>
          </StepSection>
        ),
      },
    ],
    [control, errors, register, formValues]
  );

  const SECTION_FLOW = {
    personal: (answers) =>
      answers.personalDetails?.everMarried === "yes" ? "married" : "parents",
    married: (answers) =>
      answers.marriedDetails?.everDivorced === "yes" ? "divorced" : "parents",
    divorced: (answers) =>
      answers.divorcedDetails?.everWidowed === "yes" ? "widowed" : "parents",
    widowed: (answers) =>
      answers.widowedDetails?.everRemarried === "yes" ? "remarried" : "parents",
    remarried: () => "parents",
    parents: () => null,
  };

  const getReachableSections = (formValuesData) => {
    const reachable = new Set(["personal", "parents"]);
    let currentSection = SECTION_FLOW.personal(formValuesData);

    while (currentSection && currentSection !== "parents") {
      reachable.add(currentSection);
      currentSection = SECTION_FLOW[currentSection]?.(formValuesData);
    }

    return reachable;
  };

  const getSectionIdFromIndex = (index) => {
    const sectionIds = [
      SECTION_IDS.PERSONAL,
      SECTION_IDS.MARRIED,
      SECTION_IDS.DIVORCED,
      SECTION_IDS.WIDOWED,
      SECTION_IDS.REMARRIED,
      SECTION_IDS.PARENTS,
    ];
    return sectionIds[index] || SECTION_IDS.PERSONAL;
  };

  const getVisibleSections = () => {
    const reachable = getReachableSections(formValues);
    return useSectionMetadata.filter((section) => {
      const sectionIdMap = {
        [SECTION_IDS.PERSONAL]: "personal",
        [SECTION_IDS.MARRIED]: "married",
        [SECTION_IDS.DIVORCED]: "divorced",
        [SECTION_IDS.WIDOWED]: "widowed",
        [SECTION_IDS.REMARRIED]: "remarried",
        [SECTION_IDS.PARENTS]: "parents",
      };
      return reachable.has(sectionIdMap[section.id]);
    });
  };

  const visibleSections = getVisibleSections();

  const handleNext = () => {
    if (currentStep < visibleSections.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-slate-900">Family Information Form</h1>
          <p className="mt-2 text-slate-600">
            Please fill in the family member details below
          </p>
        </motion.div>

        {submitMessage && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              submitMessage.includes("successfully")
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {submitMessage}
          </div>
        )}

        <MultiStepForm
          sections={visibleSections}
          currentStep={currentStep}
          register={register}
          control={control}
          watch={watch}
          errors={errors}
          onNext={handleNext}
          onBack={handleBack}
          onSubmit={handleSubmit(handleFormSubmit)}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}