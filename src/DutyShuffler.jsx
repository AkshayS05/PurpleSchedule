import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useState } from "react";
import "./DutyShuffler.css";

function DutyShuffler() {
  const [data, setData] = useState([]);
  const [weekendData, setWeekendData] = useState([]);
  const [employeeStatus, setEmployeeStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isWeekend, setIsWeekend] = useState(false);

  // Function to get the current day of the week
  const getCurrentDay = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const currentDate = new Date();
    return days[currentDate.getDay()];
  };

  // Function to get an inspiring quote
  const getInspiringQuote = () => {
    const quotes = [
      "The best way to predict the future is to create it.",
      "The only limit to our realization of tomorrow is our doubts of today.",
      "Don't watch the clock; do what it does. Keep going.",
      "Success is not final, failure is not fatal: It is the courage to continue that counts.",
      "Act as if what you do makes a difference. It does.",
      "What you get by achieving your goals is not as important as what you become by achieving your goals.",
      "Your time is limited, don’t waste it living someone else’s life.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      let parsedData = XLSX.utils.sheet_to_json(sheet);

      // Clean up the data
      parsedData = cleanData(parsedData);

      const sortedData = parsedData.sort((a, b) =>
        a["Employee Name"].localeCompare(b["Employee Name"])
      );
      isWeekend ? setWeekendData(sortedData) : setData(sortedData);
    };
    reader.readAsBinaryString(file);
  };

  const cleanData = (data) => {
    return data.map((row) => {
      const cleanedRow = {};
      for (const key in row) {
        if (row.hasOwnProperty(key)) {
          // Trim spaces and ensure there are no extra spaces around
          cleanedRow[key.trim()] =
            typeof row[key] === "string" ? row[key].trim() : row[key];
        }
      }
      return cleanedRow;
    });
  };

  const handleStatusChange = (employeeName, day, status) => {
    setEmployeeStatus((prevStatus) => ({
      ...prevStatus,
      [employeeName]: {
        ...prevStatus[employeeName],
        [day]: status,
      },
    }));
  };

  const shuffleDuties = (scheduleData) => {
    const weekdays = isWeekend
      ? ["Saturday", "Sunday"]
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const fixedDuties = [
      "OFF",
      "FORKLIFT",
      "BALDECK/INPUT",
      "BALDECK/LOAD",
      "LINE 3 ASSIST",
      "LINE 2 ASSIST",
      "LINE 1 ASSIST",
    ];

    const clonedData = JSON.parse(JSON.stringify(scheduleData));

    let allDuties = [];
    weekdays.forEach((day) => {
      clonedData.forEach((row) => {
        const duty = row[day];
        if (
          !fixedDuties.includes(duty) &&
          duty !== "" &&
          (!employeeStatus[row["Employee Name"]] ||
            employeeStatus[row["Employee Name"]][day] !== "Vacation")
        ) {
          allDuties.push(duty);
        }
      });
    });

    // Shuffle the duties
    for (let i = allDuties.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allDuties[i], allDuties[j]] = [allDuties[j], allDuties[i]];
    }

    let dutyIndex = 0;
    const shuffledData = clonedData.map((row) => {
      const shuffledRow = { ...row };
      let previousDuty = null;

      weekdays.forEach((day) => {
        const duty = row[day];
        if (
          employeeStatus[row["Employee Name"]] &&
          employeeStatus[row["Employee Name"]][day]
        ) {
          shuffledRow[day] = employeeStatus[row["Employee Name"]][day];
        } else if (fixedDuties.includes(duty)) {
          shuffledRow[day] = duty;
          previousDuty = duty; // Set the previous duty for fixed duties
        } else {
          // Ensure no same job is assigned on two consecutive days
          let newDuty = allDuties[dutyIndex++] || duty;
          if (newDuty === previousDuty) {
            // If the new duty is the same as the previous day, swap with the next one
            newDuty = allDuties[dutyIndex] || duty;
            [allDuties[dutyIndex - 1], allDuties[dutyIndex]] = [
              allDuties[dutyIndex],
              allDuties[dutyIndex - 1],
            ];
            dutyIndex++;
          }
          shuffledRow[day] = newDuty;
          previousDuty = newDuty; // Update previous duty
        }
      });

      return shuffledRow;
    });

    return shuffledData;
  };

  const handleDownload = () => {
    const scheduleData = isWeekend ? weekendData : data;
    const shuffledData = shuffleDuties(scheduleData);

    const worksheet = XLSX.utils.json_to_sheet(shuffledData);

    const columnWidths = [
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
    ];

    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      isWeekend ? "Weekend Duties" : "Weekday Duties"
    );
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, isWeekend ? "weekend_duties.xlsx" : "weekday_duties.xlsx");
  };

  const filteredData = (isWeekend ? weekendData : data).filter((row) => {
    const searchWords = searchTerm.toLowerCase().split(" ").filter(Boolean);
    return searchWords.every((word) =>
      row["Employee Name"].toLowerCase().includes(word)
    );
  });

  const currentDay = getCurrentDay();
  const quote = getInspiringQuote();

  return (
    <div className="app-container">
      <h2 className="greeting-message">Happy {currentDay}!</h2>
      <p className="inspiring-quote">"{quote}"</p>
      <h1 className="app-title">Purple Schedule by Akshay</h1>
      <div className="toggle-container">
        <label className="switch">
          <input
            type="checkbox"
            checked={isWeekend}
            onChange={() => setIsWeekend(!isWeekend)}
          />
          <span className="slider"></span>
        </label>
        <span className="toggle-label">
          {isWeekend ? "Weekend Schedule" : "Weekday Schedule"}
        </span>
      </div>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="file-input"
      />

      {data.length > 0 || weekendData.length > 0 ? (
        <>
          <input
            type="text"
            placeholder="Search Employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          {filteredData.length > 0 ? (
            <div className="employee-list">
              {filteredData.map((row, index) => (
                <div key={row["Employee Name"]} className="employee-card">
                  <strong>{row["Employee Name"]}</strong>
                  {(isWeekend
                    ? ["Saturday", "Sunday"]
                    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                  ).map((day) => (
                    <div key={day} className="day-select">
                      <label>{day}: </label>
                      {row[day] === "OFF" ? (
                        <span>{row[day]}</span>
                      ) : (
                        <select
                          onChange={(e) =>
                            handleStatusChange(
                              row["Employee Name"],
                              day,
                              e.target.value
                            )
                          }
                          defaultValue={
                            employeeStatus[row["Employee Name"]] &&
                            employeeStatus[row["Employee Name"]][day]
                              ? employeeStatus[row["Employee Name"]][day]
                              : ""
                          }
                          className="status-select"
                        >
                          <option value="">None</option>
                          <option value="Absent">Absent</option>
                          <option value="Vacation">Vacation</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-match">No match found for this search.</div>
          )}

          <button onClick={handleDownload} className="download-button">
            Shuffle Duties and Download
          </button>
        </>
      ) : (
        <div className="no-data">Please upload a schedule file to begin.</div>
      )}
    </div>
  );
}

export default DutyShuffler;
