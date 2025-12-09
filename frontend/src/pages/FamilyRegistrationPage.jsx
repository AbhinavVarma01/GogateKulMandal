import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import MultiStepForm from "../components/MultiStepForm.jsx";
import ParentAutocomplete from "../components/ParentAutocomplete.jsx";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";
import api from "../utils/api";

// Image compression utility
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File object with the compressed blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

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
    serNo: null,
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
    async (event) => {
      const file = event.target.files?.[0];
      if (file) {
        try {
          // Compress the image before processing
          const compressedFile = await compressImage(file);
          
          const reader = new FileReader();
          reader.onload = () => setPreview(reader.result);
          reader.readAsDataURL(compressedFile);
          field.onChange(compressedFile);
        } catch (error) {
          console.error('Image compression failed:', error);
          // Fallback to original file if compression fails
          const reader = new FileReader();
          reader.onload = () => setPreview(reader.result);
          reader.readAsDataURL(file);
          field.onChange(file);
        }
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
  const fileInputRef = useRef(null);

  const handleChangePhotoClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          aria-describedby={description ? `${field.name}-description` : undefined}
          className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm transition hover:border-primary-400 hover:text-slate-800"
        />
        {effectivePreview ? (
          <div className="flex flex-col items-center gap-2">
            <motion.img
              src={effectivePreview}
              alt={`${label} preview`}
              className="h-16 w-16 rounded-full border border-slate-200 object-cover shadow-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
            <button
              type="button"
              onClick={handleChangePhotoClick}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Change Photo
            </button>
          </div>
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
    <div className="flex flex-wrap gap-3" role="group" aria-labelledby={`${name}-label`}>
      <Controller
        name={name}
        control={control}
        rules={{ required: required ? "This field is required" : false }}
        render={({ field }) => (
          <>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => field.onChange(option.value)}
                className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                  field.value === option.value
                    ? "border-amber-500 bg-amber-500 text-white shadow-md hover:bg-amber-600 hover:border-amber-600"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {option.label}
              </button>
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
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [fatherSelected, setFatherSelected] = useState(false);
  const [motherSelected, setMotherSelected] = useState(false);

  // Scroll to top immediately whenever the step changes (and on mount)
  useEffect(() => {
    // Small timeout to allow layout updates before scrolling
    const t = setTimeout(() => {
      // Immediate jump to top so the new step is visible without animation
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, 50);
    return () => clearTimeout(t);
  }, [currentStep]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: initialFormValues,
  });

  const formValues = watch();
  const [fatherPreview, setFatherPreview] = useState(null);
  const [motherPreview, setMotherPreview] = useState(null);

  // Autofill vansh from logged-in user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}');
    if (user && user.personalDetails && user.personalDetails.vansh) {
      setValue('personalDetails.vansh', user.personalDetails.vansh);
    }
  }, [setValue]);

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
      const response = await api.post("/api/family/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 15000, // 15 second timeout (reduced from 30s)
      });

      if (response.data.success) {
        // Show success modal instead of message
        setShowSuccessModal(true);
        reset();
        setCurrentStep(1);
        setFatherSelected(false);
        setMotherSelected(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const friendlyMessage =
        error.response?.data?.message || error.message || "An error occurred while submitting the form";
      setSubmitMessage(friendlyMessage);
      setErrorModalMessage(friendlyMessage);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalOk = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
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
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "First name must contain only letters"
                  }
                })}
                required
                error={errors.personalDetails?.firstName?.message}
              />
              <TextInput
                label="Middle Name"
                register={register("personalDetails.middleName", {
                  pattern: {
                    value: /^[A-Za-z\s]*$/,
                    message: "Middle name must contain only letters"
                  }
                })}
              />
              <TextInput
                label="Last Name"
                register={register("personalDetails.lastName", {
                  required: "Last name is required",
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "Last name must contain only letters"
                  }
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
                    register={register("personalDetails.dateOfDeath")}
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
                  pattern: {
                    value: /^[0-9]{10,15}$/,
                    message: "Mobile number must be 10-15 digits"
                  }
                })}
                required
                error={errors.personalDetails?.mobileNumber?.message}
              />
              <TextInput
                label="Alternate Mobile Number"
                type="tel"
                register={register("personalDetails.alternateMobileNumber", {
                  pattern: {
                    value: /^[0-9]{0,15}$/,
                    message: "Mobile number must contain only digits (max 15)"
                  }
                })}
                error={errors.personalDetails?.alternateMobileNumber?.message}
              />
              <TextInput
                label="Country"
                register={register("personalDetails.country", {
                  required: "Country is required",
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "Country must contain only letters"
                  }
                })}
                required
                error={errors.personalDetails?.country?.message}
              />
              <TextInput
                label="State"
                register={register("personalDetails.state", {
                  required: "State is required",
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "State must contain only letters"
                  }
                })}
                required
                error={errors.personalDetails?.state?.message}
              />
              <TextInput
                label="District"
                register={register("personalDetails.district", {
                  required: "District is required",
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "District must contain only letters"
                  }
                })}
                required
                error={errors.personalDetails?.district?.message}
              />
              <TextInput
                label="City"
                register={register("personalDetails.city", {
                  required: "City is required",
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "City must contain only letters"
                  }
                })}
                required
                error={errors.personalDetails?.city?.message}
              />
              <TextInput
                label="Area"
                register={register("personalDetails.area", {
                  pattern: {
                    value: /^[A-Za-z\s]*$/,
                    message: "Area must contain only letters"
                  }
                })}
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
                type="text"
                register={register("personalDetails.pinCode", {
                  required: "Pin code is required"
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
                    if (!value) return "First name is required";
                    if (!/^[A-Za-z\s]+$/.test(value)) return "First name must contain only letters";
                    return true;
                  },
                })}
                required={shouldRequire("marriedDetails.spouseFirstName", formValues)}
                error={errors.marriedDetails?.spouseFirstName?.message}
              />
              <TextInput
                label="Spouse Middle Name"
                register={register("marriedDetails.spouseMiddleName", {
                  validate: (value) => {
                    if (!value) return true;
                    if (!/^[A-Za-z\s]*$/.test(value)) return "Middle name must contain only letters";
                    return true;
                  },
                })}
              />
              <TextInput
                label="Spouse Last Name"
                register={register("marriedDetails.spouseLastName", {
                  validate: (value) => {
                    if (!shouldRequire("marriedDetails.spouseLastName", formValues))
                      return true;
                    if (!value) return "Last name is required";
                    if (!/^[A-Za-z\s]+$/.test(value)) return "Last name must contain only letters";
                    return true;
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
                error={errors.marriedDetails?.spouseEmail?.message}
              />
              <TextInput
                label="Spouse Mobile Number"
                type="tel"
                register={register("marriedDetails.spouseMobileNumber", {
                  pattern: {
                    value: /^[0-9]{0,15}$/,
                    message: "Mobile number must contain only digits (max 15)"
                  }
                })}
                error={errors.marriedDetails?.spouseMobileNumber?.message}
              />
              <Controller
                name="marriedDetails.spouseProfileImage"
                control={control}
                render={({ field }) => (
                  <FilePreviewInput
                    field={field}
                    label="Spouse Profile Image"
                    error={errors.marriedDetails?.spouseProfileImage?.message}
                    description="Upload spouse's profile image (optional)."
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
                    if (!value) return "First name is required";
                    if (!/^[A-Za-z\s]+$/.test(value)) return "First name must contain only letters";
                    return true;
                  },
                })}
                required={shouldRequire("divorcedDetails.spouseFirstName", formValues)}
                error={errors.divorcedDetails?.spouseFirstName?.message}
              />
              <TextInput
                label="Spouse Middle Name"
                register={register("divorcedDetails.spouseMiddleName", {
                  validate: (value) => {
                    if (!value) return true;
                    if (!/^[A-Za-z\s]*$/.test(value)) return "Middle name must contain only letters";
                    return true;
                  },
                })}
              />
              <TextInput
                label="Spouse Last Name"
                register={register("divorcedDetails.spouseLastName", {
                  validate: (value) => {
                    if (!shouldRequire("divorcedDetails.spouseLastName", formValues))
                      return true;
                    if (!value) return "Last name is required";
                    if (!/^[A-Za-z\s]+$/.test(value)) return "Last name must contain only letters";
                    return true;
                  },
                })}
                required={shouldRequire("divorcedDetails.spouseLastName", formValues)}
                error={errors.divorcedDetails?.spouseLastName?.message}
              />
              <TextInput
                label="Marriage Date"
                type="date"
                register={register("divorcedDetails.marriageDate", {
                  validate: (value) => {
                    if (!shouldRequire("divorcedDetails.marriageDate", formValues))
                      return true;
                    return value ? true : "Marriage date is required";
                  },
                })}
                required={shouldRequire("divorcedDetails.marriageDate", formValues)}
                error={errors.divorcedDetails?.marriageDate?.message}
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
                    label="Ex-Spouse Profile Image"
                    error={errors.divorcedDetails?.spouseProfileImage?.message}
                    description="Upload ex-spouse's profile image (optional)."
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
        description: "Provide details about your late spouse.",
        render: () => (
          <StepSection title="Widowed Details">
            <TextAreaInput
              label="Description"
              register={register("widowedDetails.description")}
              rows={3}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <TextInput
                label="Late Spouse First Name"
                register={register("widowedDetails.spouseFirstName", {
                  validate: (value) => {
                    if (!shouldRequire("widowedDetails.spouseFirstName", formValues))
                      return true;
                    if (!value) return "First name is required";
                    if (!/^[A-Za-z\s]+$/.test(value)) return "First name must contain only letters";
                    return true;
                  },
                })}
                required={shouldRequire("widowedDetails.spouseFirstName", formValues)}
                error={errors.widowedDetails?.spouseFirstName?.message}
              />
              <TextInput
                label="Late Spouse Middle Name"
                register={register("widowedDetails.spouseMiddleName", {
                  validate: (value) => {
                    if (!value) return true;
                    if (!/^[A-Za-z\s]*$/.test(value)) return "Middle name must contain only letters";
                    return true;
                  },
                })}
              />
              <TextInput
                label="Late Spouse Last Name"
                register={register("widowedDetails.spouseLastName", {
                  validate: (value) => {
                    if (!shouldRequire("widowedDetails.spouseLastName", formValues))
                      return true;
                    if (!value) return "Last name is required";
                    if (!/^[A-Za-z\s]+$/.test(value)) return "Last name must contain only letters";
                    return true;
                  },
                })}
                required={shouldRequire("widowedDetails.spouseLastName", formValues)}
                error={errors.widowedDetails?.spouseLastName?.message}
              />
              <SelectInput
                label="Late Spouse Gender"
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
                register={register("widowedDetails.dateOfMarriage", {
                  validate: (value) => {
                    if (!shouldRequire("widowedDetails.dateOfMarriage", formValues))
                      return true;
                    return value ? true : "Date of marriage is required";
                  },
                })}
                required={shouldRequire("widowedDetails.dateOfMarriage", formValues)}
                error={errors.widowedDetails?.dateOfMarriage?.message}
              />
              <TextInput
                label="Late Spouse Date of Birth"
                type="date"
                register={register("widowedDetails.spouseDateOfBirth", {
                  validate: (value) => {
                    if (!shouldRequire("widowedDetails.spouseDateOfBirth", formValues))
                      return true;
                    return value ? true : "Date of birth is required";
                  },
                })}
                required={shouldRequire("widowedDetails.spouseDateOfBirth", formValues)}
                error={errors.widowedDetails?.spouseDateOfBirth?.message}
              />
              <TextInput
                label="Late Spouse Date of Death"
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
                label="Late Spouse Email"
                type="email"
                register={register("widowedDetails.spouseEmail")}
                error={errors.widowedDetails?.spouseEmail?.message}
              />
              <TextInput
                label="Late Spouse Mobile Number"
                type="tel"
                register={register("widowedDetails.spouseMobileNumber", {
                  pattern: {
                    value: /^[0-9]{0,15}$/,
                    message: "Mobile number must contain only digits (max 15)"
                  }
                })}
                error={errors.widowedDetails?.spouseMobileNumber?.message}
              />
              <Controller
                name="widowedDetails.spouseProfileImage"
                control={control}
                render={({ field }) => (
                  <FilePreviewInput
                    field={field}
                    label="Late Spouse Profile Image"
                    error={errors.widowedDetails?.spouseProfileImage?.message}
                    description="Upload late spouse's profile image (optional)."
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
        description: "Provide details about your current marriage.",
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
                    if (!value) return "First name is required";
                    if (!/^[A-Za-z\s]+$/.test(value)) return "First name must contain only letters";
                    return true;
                  },
                })}
                required={shouldRequire("remarriedDetails.spouseFirstName", formValues)}
                error={errors.remarriedDetails?.spouseFirstName?.message}
              />
              <TextInput
                label="Spouse Middle Name"
                register={register("remarriedDetails.spouseMiddleName", {
                  validate: (value) => {
                    if (!value) return true;
                    if (!/^[A-Za-z\s]*$/.test(value)) return "Middle name must contain only letters";
                    return true;
                  },
                })}
              />
              <TextInput
                label="Spouse Last Name"
                register={register("remarriedDetails.spouseLastName", {
                  validate: (value) => {
                    if (!shouldRequire("remarriedDetails.spouseLastName", formValues))
                      return true;
                    if (!value) return "Last name is required";
                    if (!/^[A-Za-z\s]+$/.test(value)) return "Last name must contain only letters";
                    return true;
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
                label="Date of Remarriage"
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
                error={errors.remarriedDetails?.spouseEmail?.message}
              />
              <TextInput
                label="Spouse Mobile Number"
                type="tel"
                register={register("remarriedDetails.spouseMobileNumber", {
                  pattern: {
                    value: /^[0-9]{0,15}$/,
                    message: "Mobile number must contain only digits (max 15)"
                  }
                })}
                error={errors.remarriedDetails?.spouseMobileNumber?.message}
              />
              <Controller
                name="remarriedDetails.spouseProfileImage"
                control={control}
                render={({ field }) => (
                  <FilePreviewInput
                    field={field}
                    label="Spouse Profile Image"
                    error={errors.remarriedDetails?.spouseProfileImage?.message}
                    description="Upload spouse's profile image (optional)."
                  />
                )}
              />
            </div>
          </StepSection>
        ),
      },
      {
        id: SECTION_IDS.PARENTS,
        title: "Parents Information",
        description: "Provide details about your parents.",
        render: () => (
          <StepSection title="Parents Information">
            <TextAreaInput
              label="Description"
              register={register("parentsInformation.description")}
              rows={3}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <ParentAutocomplete
                  label="Father"
                  vansh={formValues.personalDetails?.vansh}
                  onSelect={(data) => {
                    setValue("parentsInformation.fatherSerNo", data.serNo, { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherFirstName", data.firstName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherMiddleName", data.middleName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherLastName", data.lastName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherEmail", data.email || "", { shouldValidate: true, shouldDirty: true });
                    // Mask mobile number - show only last 4 digits
                    const maskedFatherMobile = data.mobileNumber ? data.mobileNumber.slice(-4).padStart(data.mobileNumber.length, '*') : "";
                    setValue("parentsInformation.fatherMobileNumber", maskedFatherMobile, { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.fatherDateOfBirth", data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "", { shouldValidate: true, shouldDirty: true });

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
                    setFatherSelected(true);
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
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "Father's first name must contain only letters"
                  }
                })}
                required
                error={errors.parentsInformation?.fatherFirstName?.message}
                disabled={fatherSelected}
              />
              <TextInput
                label="Father's Middle Name"
                register={register("parentsInformation.fatherMiddleName", {
                  pattern: {
                    value: /^[A-Za-z\s]*$/,
                    message: "Father's middle name must contain only letters"
                  }
                })}
                disabled={fatherSelected}
              />
              <TextInput
                label="Father's Last Name"
                register={register("parentsInformation.fatherLastName", {
                  required: "Father's last name is required",
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "Father's last name must contain only letters"
                  }
                })}
                required
                error={errors.parentsInformation?.fatherLastName?.message}
                disabled={fatherSelected}
              />
              <TextInput
                label="Father's Email"
                type="email"
                register={register("parentsInformation.fatherEmail")}
                error={errors.parentsInformation?.fatherEmail?.message}
                disabled={fatherSelected}
              />
              <TextInput
                label="Father's Mobile Number"
                type="tel"
                register={register("parentsInformation.fatherMobileNumber", {
                  pattern: {
                    value: /^[0-9*]{0,15}$/,
                    message: "Invalid mobile number format"
                  }
                })}
                error={errors.parentsInformation?.fatherMobileNumber?.message}
                disabled={fatherSelected}
              />
              <TextInput
                label="Father's Date of Birth"
                type="date"
                register={register("parentsInformation.fatherDateOfBirth", {
                  required: "Date of birth is required",
                })}
                required
                error={errors.parentsInformation?.fatherDateOfBirth?.message}
                disabled={fatherSelected}
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

              <div>
                <ParentAutocomplete
                  label="Mother"
                  vansh={formValues.personalDetails?.vansh}
                  onSelect={(data) => {
                    setValue("parentsInformation.motherSerNo", data.serNo, { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.motherFirstName", data.firstName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.motherMiddleName", data.middleName || "", { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.motherLastName", data.lastName || "", { shouldValidate: true, shouldDirty: true });
                    // Mask mobile number - show only last 4 digits
                    const maskedMotherMobile = data.mobileNumber ? data.mobileNumber.slice(-4).padStart(data.mobileNumber.length, '*') : "";
                    setValue("parentsInformation.motherMobileNumber", maskedMotherMobile, { shouldValidate: true, shouldDirty: true });
                    setValue("parentsInformation.motherDateOfBirth", data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "", { shouldValidate: true, shouldDirty: true });

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
                    setMotherSelected(true);
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
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "Mother's first name must contain only letters"
                  }
                })}
                required
                error={errors.parentsInformation?.motherFirstName?.message}
                disabled={motherSelected}
              />
              <TextInput
                label="Mother's Middle Name"
                register={register("parentsInformation.motherMiddleName", {
                  pattern: {
                    value: /^[A-Za-z\s]*$/,
                    message: "Mother's middle name must contain only letters"
                  }
                })}
                disabled={motherSelected}
              />
              <TextInput
                label="Mother's Last Name"
                register={register("parentsInformation.motherLastName", {
                  required: "Mother's last name is required",
                  pattern: {
                    value: /^[A-Za-z\s]+$/,
                    message: "Mother's last name must contain only letters"
                  }
                })}
                required
                error={errors.parentsInformation?.motherLastName?.message}
                disabled={motherSelected}
              />
              <TextInput
                label="Mother's Mobile Number"
                type="tel"
                register={register("parentsInformation.motherMobileNumber", {
                  pattern: {
                    value: /^[0-9*]{0,15}$/,
                    message: "Invalid mobile number format"
                  }
                })}
                error={errors.parentsInformation?.motherMobileNumber?.message}
                disabled={motherSelected}
              />
              <TextInput
                label="Mother's Date of Birth"
                type="date"
                register={register("parentsInformation.motherDateOfBirth", {
                  required: "Date of birth is required",
                })}
                required
                disabled={motherSelected}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Commenting out unused function to avoid ESLint warning
  // const getSectionIdFromIndex = (index) => {
  //   const sectionIds = [
  //     SECTION_IDS.PERSONAL,
  //     SECTION_IDS.MARRIED,
  //     SECTION_IDS.DIVORCED,
  //     SECTION_IDS.WIDOWED,
  //     SECTION_IDS.REMARRIED,
  //     SECTION_IDS.PARENTS,
  //   ];
  //   return sectionIds[index] || SECTION_IDS.PERSONAL;
  // };

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

  const handleNext = async () => {
    // Get the current section ID
    const currentSectionId = visibleSections[currentStep - 1]?.id;
    
    // Trigger validation for the current section
    let isValid = false;
    
    if (currentSectionId === SECTION_IDS.PERSONAL) {
      isValid = await trigger("personalDetails");
    } else if (currentSectionId === SECTION_IDS.MARRIED) {
      isValid = await trigger("marriedDetails");
    } else if (currentSectionId === SECTION_IDS.DIVORCED) {
      isValid = await trigger("divorcedDetails");
    } else if (currentSectionId === SECTION_IDS.WIDOWED) {
      isValid = await trigger("widowedDetails");
    } else if (currentSectionId === SECTION_IDS.REMARRIED) {
      isValid = await trigger("remarriedDetails");
    } else if (currentSectionId === SECTION_IDS.PARENTS) {
      isValid = await trigger("parentsInformation");
    }
    
    // If validation fails, show error and scroll to top
    if (!isValid) {
      setSubmitMessage("Please fill in all required fields marked with * before proceeding");
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }
    
    // Move to next step if validation passes
    if (currentStep < visibleSections.length) {
      setCurrentStep(currentStep + 1);
      setSubmitMessage(""); // Clear any previous messages
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
          <LoadingSpinner />
          <p className="mt-4 text-white text-lg font-medium">Submitting your registration...</p>
          <p className="mt-2 text-white text-sm">Please wait, this may take a moment</p>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        {/* Back to Home Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Back to Login
          </button>
        </motion.div>

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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg 
                  className="h-8 w-8 text-green-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Registration Submitted Successfully!
              </h3>
              
              {/* Message */}
              <p className="text-slate-600 mb-6 leading-relaxed">
                Thank you for registering with GogateKulMandal. Your application has been submitted for review. 
                You will receive an email notification once your registration is approved by our admin team.
              </p>
              
              {/* OK Button */}
              <button
                onClick={handleModalOk}
                className="w-full bg-amber-500 text-white font-medium py-3 px-6 rounded-lg shadow hover:bg-amber-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
              >
                OK
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Please review your submission
              </h3>

              <p className="text-slate-600 mb-6 leading-relaxed">
                {errorModalMessage || "Fill all the important credentials before submitting the form."}
              </p>

              <button
                onClick={handleErrorModalClose}
                className="w-full bg-red-500 text-white font-medium py-3 px-6 rounded-lg shadow hover:bg-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              >
                OK
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
