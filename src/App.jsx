import { useState } from "react";
import WeekendDutyShuffler from "./WeekendDutyShuffler";
import WeekdayDutyShuffler from "./WeekdayDutyShuffler";
import PSTDutyAssigner from "./PSTDutyAssigner";
import "./App.css";

function App() {
  const [isWeekend, setIsWeekend] = useState(false);
  const [showPST, setShowPST] = useState(false);
  const [excelUploaded, setExcelUploaded] = useState(false); // New state to track if an Excel sheet is uploaded

  const handleExcelUpload = (uploaded) => {
    setExcelUploaded(uploaded);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Purple Schedule by Akshay</h1>

      <div className="toggle-container">
        <label className="switch">
          <input
            type="checkbox"
            checked={isWeekend}
            onChange={() => {
              setIsWeekend(!isWeekend);
              setShowPST(false);
              setExcelUploaded(false); // Reset the uploaded state when toggling
            }}
          />
          <span className="slider"></span>
        </label>
        <span className="toggle-label">
          {isWeekend ? "Weekend Schedule" : "Weekday Schedule"}
        </span>
      </div>

      {isWeekend && excelUploaded && (
        <div className="pst-button-container">
          <button className="pst-button" onClick={() => setShowPST(true)}>
            Create PST Duties
          </button>
        </div>
      )}

      {showPST ? (
        <PSTDutyAssigner />
      ) : isWeekend ? (
        <WeekendDutyShuffler onExcelUpload={handleExcelUpload} />
      ) : (
        <WeekdayDutyShuffler onExcelUpload={handleExcelUpload} />
      )}
    </div>
  );
}

export default App;
