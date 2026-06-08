import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, ArrowLeft } from "lucide-react";
import "./App.css";

type Step =
  | "closed"
  | "welcome"
  | "treatment"
  | "patientType"
  | "preferredTime"
  | "urgency"
  | "details"
  | "confirmation";

type ChatMessage = {
  id: number;
  type: "bot" | "user";
  text: string;
};

type FormData = {
  treatment: string;
  patientType: string;
  preferredTime: string;
  urgency: string;
  name: string;
  phone: string;
  email: string;
  postcode: string;
  message: string;
  consent: boolean;
};

type SitoraReceptionistConfig = {
  clinicId?: string;
  businessId?: string;
  clinicName?: string;
  businessName?: string;
  clinicEmail?: string;
  businessEmail?: string;
  apiUrl?: string;

  sector?: string;
  assistantLabel?: string;
  headerTitle?: string;
  bubbleText?: string;

  customerLabel?: string;
  businessLabel?: string;
  enquiryLabel?: string;

  services?: string[];
  customerTypes?: string[];
  preferredTimes?: string[];
  urgencyOptions?: string[];

  welcomeMessages?: string[];
  serviceQuestion?: string;
  customerTypeQuestion?: string;
  preferredTimeQuestion?: string;
  urgencyQuestion?: string;
  detailsQuestion?: string;

  safetyMessage?: string;
  appointmentDisclaimer?: string;
  consentText?: string;
  submitButtonText?: string;
  confirmationMessages?: string[];
  requiredFieldsMessage?: string;
};

declare global {
  interface Window {
    SitoraReceptionistConfig?: SitoraReceptionistConfig;
  }
}

const widgetConfig =
  typeof window !== "undefined" ? window.SitoraReceptionistConfig || {} : {};

const defaultServices = [
  "Check-up",
  "Emergency appointment",
  "Hygiene / clean",
  "Fillings",
  "Invisalign",
  "Braces",
  "Teeth whitening",
  "Composite bonding",
  "Crowns",
  "Veneers",
  "Implants",
  "Dentures",
  "Bridge",
  "Facial aesthetics",
  "NHS availability",
  "I'm not sure",
];

const clinicName =
  widgetConfig.clinicName || widgetConfig.businessName || "Demo Clinic";

const clinicConfig = {
  clinicId: widgetConfig.clinicId || widgetConfig.businessId || "demo-clinic",

  clinicName,

  clinicEmail:
    widgetConfig.clinicEmail ||
    widgetConfig.businessEmail ||
    "hello@sitora.co.uk",

  apiUrl:
    widgetConfig.apiUrl ||
    import.meta.env.VITE_SITORA_API_URL ||
    "http://localhost:3000/api/receptionist/enquiry",

  sector: widgetConfig.sector || "dental",

  assistantLabel: widgetConfig.assistantLabel || "Digital Receptionist",

  headerTitle: widgetConfig.headerTitle || "Enquiry",

  bubbleText: widgetConfig.bubbleText || "Need help?",

  customerLabel: widgetConfig.customerLabel || "patient",

  businessLabel: widgetConfig.businessLabel || "practice",

  enquiryLabel: widgetConfig.enquiryLabel || "enquiry",

  services:
    widgetConfig.services && widgetConfig.services.length > 0
      ? widgetConfig.services
      : defaultServices,

  customerTypes:
    widgetConfig.customerTypes && widgetConfig.customerTypes.length > 0
      ? widgetConfig.customerTypes
      : ["New patient", "Existing patient"],

  preferredTimes:
    widgetConfig.preferredTimes && widgetConfig.preferredTimes.length > 0
      ? widgetConfig.preferredTimes
      : ["Morning", "Afternoon", "After 5pm", "Anytime"],

  urgencyOptions:
    widgetConfig.urgencyOptions && widgetConfig.urgencyOptions.length > 0
      ? widgetConfig.urgencyOptions
      : ["Today / urgent", "This week", "Next week", "Flexible"],

  welcomeMessages:
    widgetConfig.welcomeMessages && widgetConfig.welcomeMessages.length > 0
      ? widgetConfig.welcomeMessages
      : [
          `Good afternoon, welcome to ${clinicName}.`,
          "I can help pass your enquiry to the team.",
          "This should only take around 60 seconds.",
        ],

  serviceQuestion: widgetConfig.serviceQuestion || "What do you need help with?",

  customerTypeQuestion:
    widgetConfig.customerTypeQuestion || "Are you a new or existing patient?",

  preferredTimeQuestion:
    widgetConfig.preferredTimeQuestion ||
    "When would you prefer the team to contact you or arrange an appointment?",

  urgencyQuestion: widgetConfig.urgencyQuestion || "How soon do you need help?",

  detailsQuestion:
    widgetConfig.detailsQuestion ||
    "Please leave your details so the team can contact you.",

  safetyMessage:
    widgetConfig.safetyMessage ||
    "If your symptoms become severe, or you have swelling affecting breathing or swallowing, uncontrolled bleeding, or serious trauma, please seek urgent medical help immediately.",

  appointmentDisclaimer:
    widgetConfig.appointmentDisclaimer ||
    "This is not a confirmed appointment. The team will contact you to confirm availability.",

  consentText:
    widgetConfig.consentText ||
    "I consent to the team contacting me about this enquiry.",

  submitButtonText: widgetConfig.submitButtonText || "Send enquiry",

  confirmationMessages:
    widgetConfig.confirmationMessages &&
    widgetConfig.confirmationMessages.length > 0
      ? widgetConfig.confirmationMessages
      : [
          "Your enquiry has been sent to the team.",
          "They will contact you to confirm the next available option.",
          "Please remember this is not a confirmed appointment until the team contacts you.",
        ],

  requiredFieldsMessage:
    widgetConfig.requiredFieldsMessage ||
    "Please add your name, a valid mobile number, a valid email address, and consent before sending.",
};

const initialFormData: FormData = {
  treatment: "",
  patientType: "",
  preferredTime: "",
  urgency: "",
  name: "",
  phone: "",
  email: "",
  postcode: "",
  message: "",
  consent: false,
};

export default function App() {
  const [step, setStep] = useState<Step>("closed");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [history, setHistory] = useState<Step[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const bodyRef = useRef<HTMLDivElement | null>(null);
  const messageIdRef = useRef(1);

  useEffect(() => {
    if (!bodyRef.current) return;

    bodyRef.current.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping, showOptions, step]);

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function addBotMessages(texts: string[]) {
    setShowOptions(false);

    for (const text of texts) {
      setIsTyping(true);
      await wait(450);
      setIsTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          id: messageIdRef.current++,
          type: "bot",
          text,
        },
      ]);

      await wait(220);
    }

    setShowOptions(true);
  }

  function addUserMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: messageIdRef.current++,
        type: "user",
        text,
      },
    ]);
  }

  function goToStep(nextStep: Step, botTexts: string[]) {
    setHistory((prev) => [...prev, step]);
    setStep(nextStep);
    addBotMessages(botTexts);
  }

  function goBack() {
    const previousStep = history[history.length - 1];

    if (!previousStep || previousStep === "closed") return;

    setHistory((prev) => prev.slice(0, -1));
    setStep(previousStep);
    setShowOptions(true);
  }

  function openWidget() {
    setStep("welcome");
    setMessages([]);
    setShowOptions(false);
    setHistory([]);
    setSubmitError("");
    messageIdRef.current = 1;

    addBotMessages(clinicConfig.welcomeMessages);
  }

  function closeWidget() {
    setStep("closed");
    setMessages([]);
    setShowOptions(false);
    setIsTyping(false);
    setHistory([]);
    setSubmitError("");
  }

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function selectTreatment(treatment: string) {
    updateField("treatment", treatment);
    addUserMessage(treatment);

    const urgentKeywords = ["emergency", "urgent", "pain", "injury", "accident"];
    const isUrgentService = urgentKeywords.some((keyword) =>
      treatment.toLowerCase().includes(keyword)
    );

    const introMessage = isUrgentService
      ? [
          "I’m sorry you’re dealing with that.",
          "I’ll ask a few quick questions so the team has the right information.",
        ]
      : [
          "Thank you.",
          "I’ll ask a few quick questions so the team can contact you properly.",
        ];

    goToStep("patientType", [
      ...introMessage,
      clinicConfig.customerTypeQuestion,
    ]);
  }

  function selectPatientType(patientType: string) {
    updateField("patientType", patientType);
    addUserMessage(patientType);

    goToStep("preferredTime", [
      clinicConfig.preferredTimeQuestion,
      clinicConfig.appointmentDisclaimer,
    ]);
  }

  function selectPreferredTime(time: string) {
    updateField("preferredTime", time);
    addUserMessage(time);

    goToStep("urgency", [clinicConfig.urgencyQuestion]);
  }

  function selectUrgency(urgency: string) {
    updateField("urgency", urgency);
    addUserMessage(urgency);

    const treatmentLower = formData.treatment.toLowerCase();
    const urgencyLower = urgency.toLowerCase();

    const shouldShowSafety =
      treatmentLower.includes("emergency") ||
      treatmentLower.includes("urgent") ||
      urgencyLower.includes("urgent") ||
      urgencyLower.includes("today");

    const warning = shouldShowSafety ? [clinicConfig.safetyMessage] : [];

    goToStep("details", [...warning, clinicConfig.detailsQuestion]);
  }

  function resetWidget() {
    setFormData(initialFormData);
    setMessages([]);
    setHistory([]);
    setSubmitError("");
    messageIdRef.current = 1;
    setStep("treatment");

    addBotMessages(["No problem. Let’s start again.", clinicConfig.serviceQuestion]);
  }

  async function submitEnquiry() {
    if (!canSubmit || isSubmitting) return;

    setSubmitError("");
    setIsSubmitting(true);

    const payload = {
      clinicId: clinicConfig.clinicId,
      clinicName: clinicConfig.clinicName,
      clinicEmail: clinicConfig.clinicEmail,
      sector: clinicConfig.sector,
      enquiryLabel: clinicConfig.enquiryLabel,
      customerLabel: clinicConfig.customerLabel,
      businessLabel: clinicConfig.businessLabel,
      treatment: formData.treatment,
      patientType: formData.patientType,
      preferredTime: formData.preferredTime,
      urgency: formData.urgency,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      postcode: formData.postcode.trim(),
      message: formData.message.trim(),
      consent: formData.consent,
      sourcePage: window.location.href,
      submittedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(clinicConfig.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("The enquiry could not be sent.");
      }

      addUserMessage("Enquiry submitted");

      setShowOptions(false);
      setStep("confirmation");

      addBotMessages([
        `Thank you, ${formData.name || "your enquiry has been received"}.`,
        ...clinicConfig.confirmationMessages,
      ]);
    } catch (error) {
      console.error(error);
      setSubmitError(
        "Sorry, your enquiry could not be sent. Please try again or contact the team directly."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStepNumber(currentStep: Step) {
    const stepMap: Record<string, number> = {
      treatment: 1,
      patientType: 2,
      preferredTime: 3,
      urgency: 4,
      details: 5,
    };

    return stepMap[currentStep] || 1;
  }

  function getProgressPercent(currentStep: Step) {
    return (getStepNumber(currentStep) / 5) * 100;
  }

  function getStepLabel(currentStep: Step) {
    const labelMap: Record<string, string> = {
      treatment: "Service",
      patientType: clinicConfig.customerLabel,
      preferredTime: "Preferred time",
      urgency: "Urgency",
      details: "Your details",
    };

    return labelMap[currentStep] || "Enquiry";
  }

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    formData.email.trim()
  );

  const phoneIsValid = formData.phone.replace(/\s/g, "").length >= 10;

  const canSubmit =
    formData.name.trim().length >= 2 &&
    phoneIsValid &&
    emailIsValid &&
    formData.consent;

  return (
    <>
      {step === "closed" && (
        <button className="sitora-bubble" onClick={openWidget}>
          <MessageCircle size={28} />
          <span>{clinicConfig.bubbleText}</span>
        </button>
      )}

      {step !== "closed" && (
        <div className="sitora-widget">
          <div className="sitora-header">
            <div className="header-left">
              {history.length > 0 && step !== "confirmation" && (
                <button className="back-button" onClick={goBack}>
                  <ArrowLeft size={18} />
                </button>
              )}

              <div>
                <p className="sitora-label">{clinicConfig.assistantLabel}</p>
                <h2>{clinicConfig.headerTitle}</h2>
              </div>
            </div>

            <button className="sitora-close" onClick={closeWidget}>
              <X size={20} />
            </button>
          </div>

          <div className="sitora-body" ref={bodyRef}>
            {step !== "welcome" && step !== "confirmation" && (
              <div className="progress-wrap">
                <div className="progress-top">
                  <span>{getStepLabel(step)}</span>
                  <span>{getStepNumber(step)} of 5</span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${getProgressPercent(step)}%` }}
                  />
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                {message.text}
              </div>
            ))}

            {isTyping && (
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            {step === "welcome" && showOptions && (
              <button
                className="primary-button"
                onClick={() =>
                  goToStep("treatment", [clinicConfig.serviceQuestion])
                }
              >
                Start enquiry
              </button>
            )}

            {step === "treatment" && showOptions && (
              <div className="option-grid">
                {clinicConfig.services.map((service) => (
                  <button
                    key={service}
                    className="option-button"
                    onClick={() => selectTreatment(service)}
                  >
                    {service}
                  </button>
                ))}
              </div>
            )}

            {step === "patientType" && showOptions && (
              <div className="option-grid two">
                {clinicConfig.customerTypes.map((customerType) => (
                  <button
                    key={customerType}
                    className="option-button"
                    onClick={() => selectPatientType(customerType)}
                  >
                    {customerType}
                  </button>
                ))}
              </div>
            )}

            {step === "preferredTime" && showOptions && (
              <div className="option-grid two">
                {clinicConfig.preferredTimes.map((time) => (
                  <button
                    key={time}
                    className="option-button"
                    onClick={() => selectPreferredTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}

            {step === "urgency" && showOptions && (
              <div className="option-grid two">
                {clinicConfig.urgencyOptions.map((urgency) => (
                  <button
                    key={urgency}
                    className="option-button"
                    onClick={() => selectUrgency(urgency)}
                  >
                    {urgency}
                  </button>
                ))}
              </div>
            )}

            {step === "details" && showOptions && (
              <>
                <div className="form-grid">
                  <input
                    placeholder="Full name"
                    value={formData.name}
                    autoComplete="name"
                    onChange={(e) => updateField("name", e.target.value)}
                  />

                  <input
                    placeholder="Mobile number"
                    value={formData.phone}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    onChange={(e) => updateField("phone", e.target.value)}
                  />

                  <input
                    placeholder="Email address"
                    value={formData.email}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    onChange={(e) => updateField("email", e.target.value)}
                  />

                  <input
                    placeholder="Postcode"
                    value={formData.postcode}
                    inputMode="text"
                    autoComplete="postal-code"
                    onChange={(e) => updateField("postcode", e.target.value)}
                  />

                  <textarea
                    placeholder="Anything else you would like the team to know? Optional."
                    value={formData.message}
                    onChange={(e) => updateField("message", e.target.value)}
                  />
                </div>

                <label className="consent-row">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => updateField("consent", e.target.checked)}
                  />
                  <span>{clinicConfig.consentText}</span>
                </label>

                <div className="summary-card">
                  <p className="summary-title">Enquiry summary</p>

                  <div className="summary-row">
                    <span>Service</span>
                    <strong>{formData.treatment || "Not selected"}</strong>
                  </div>

                  <div className="summary-row">
                    <span>{clinicConfig.customerLabel}</span>
                    <strong>{formData.patientType || "Not selected"}</strong>
                  </div>

                  <div className="summary-row">
                    <span>Preferred time</span>
                    <strong>{formData.preferredTime || "Not selected"}</strong>
                  </div>

                  <div className="summary-row">
                    <span>Urgency</span>
                    <strong>{formData.urgency || "Not selected"}</strong>
                  </div>
                </div>

                <div className="warning-box">
                  {clinicConfig.appointmentDisclaimer}
                </div>

                {!canSubmit && (
                  <p className="validation-note">
                    {clinicConfig.requiredFieldsMessage}
                  </p>
                )}

                {submitError && <p className="error-note">{submitError}</p>}

                <button
                  className="primary-button"
                  disabled={!canSubmit || isSubmitting}
                  onClick={submitEnquiry}
                >
                  {isSubmitting ? "Sending enquiry..." : clinicConfig.submitButtonText}
                </button>
              </>
            )}

            {step === "confirmation" && showOptions && (
              <>
                <div className="warning-box">{clinicConfig.safetyMessage}</div>

                <button className="primary-button" onClick={resetWidget}>
                  Start a new enquiry
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}