import { useState } from "react";

const messages = [
  "Learn React ⚛️",
  "Apply for jobs 💼",
  "Invest your new income 🤑",
];

const App = () => {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(true);

  function handlePrevious() {
    if (step > 1) {
      setStep((step) => step - 1);
    }
  }
  function handleNext() {
    if (step < 3) {
      setStep((step) => step + 1);
      // setStep((step) => step + 1);
    }
  }

  return (
    <>
      <button className="close" onClick={() => setIsOpen((is) => !is)}>
        &times;
      </button>
      {isOpen && (
        <div className="steps">
          <div className="numbers">
            <div className={`${step >= 1 && step < 2 ? "active" : ""}`}>1</div>
            <div className={`${step >= 2 && step < 3 ? "active" : ""}`}>2</div>
            <div className={`${step >= 3 ? "active" : ""}`}>3</div>
          </div>
          <StepMessage step={step}>{messages[step - 1]}</StepMessage>
          <div className="buttons">
            <Button
              backgroundColor={"#7950f2"}
              textColor={"#fff"}
              onClick={handlePrevious}
            >
              <span>👈</span>Previous
            </Button>

            <Button
              backgroundColor={"#7950f2"}
              textColor={"#fff"}
              onClick={handleNext}
            >
              Next<span>👉</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

function StepMessage({ step, children }) {
  return <div className="message">{children}</div>;
}

function Button({ textColor, backgroundColor, onClick, children }) {
  return (
    <button
      style={{ backgroundColor: backgroundColor, color: textColor }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default App;
