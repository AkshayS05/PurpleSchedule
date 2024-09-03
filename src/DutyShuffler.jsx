import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useMemo, useState } from "react";
import quotes from "./quotes";
import "./DutyShuffler.css";

function DutyShuffler({
  title,
  dayNames,
  onFileUpload,
  availableDuties,
  employeeStatus,
  setEmployeeStatus,
  error,
  setError,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showStats, setShowStats] = useState(
    dayNames.reduce((acc, day) => ({ ...acc, [day]: true }), {})
  );

  const randomQuote = useMemo(() => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, []);

  const handleFileUpload = (e) => {
    onFileUpload(e);
  };

  const handleDutyChange = (name, day, newDuty) => {
    if (newDuty === "HOLIDAY") {
      setEmployeeStatus((prevStatus) => {
        const updatedStatus = { ...prevStatus };
        Object.keys(updatedStatus).forEach((employee) => {
          updatedStatus[employee][day] = "HOLIDAY";
        });
        return updatedStatus;
      });
    } else if (newDuty === "Input") {
      setEmployeeStatus((prevStatus) => {
        const updatedStatus = { ...prevStatus };
        const oldDuty = prevStatus[name][day];

        const inputPeople = Object.keys(prevStatus)
          .filter(
            (employee) =>
              prevStatus[employee][day] === "Input" && employee !== name
          )
          .sort();

        if (inputPeople.length > 0) {
          const nextInputPerson = inputPeople[0];

          updatedStatus[name][day] = "Input";
          updatedStatus[nextInputPerson][day] = oldDuty;
        } else {
          updatedStatus[name][day] = "Input";
        }

        return updatedStatus;
      });
    } else {
      const oldDuty = employeeStatus[name][day];
      if (oldDuty === newDuty) {
        return;
      }

      setEmployeeStatus((prevStatus) => {
        const updatedStatus = {
          ...prevStatus,
          [name]: {
            ...prevStatus[name],
            [day]: newDuty,
          },
        };

        const affectedEmployee = Object.keys(updatedStatus).find(
          (employee) =>
            employee !== name && updatedStatus[employee][day] === newDuty
        );

        if (affectedEmployee) {
          updatedStatus[affectedEmployee][day] = oldDuty;
        }

        return updatedStatus;
      });
    }
  };

  const handleDownload = () => {
    const sortedData = Object.keys(employeeStatus)
      .map((name) => ({
        Name: name,
        ...employeeStatus[name],
      }))
      .sort((a, b) => a.Name.localeCompare(b.Name));

    const worksheet = XLSX.utils.json_to_sheet(sortedData);
    const wscols = [{ wch: 20 }, ...dayNames.map(() => ({ wch: 30 }))];

    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${title} Duties`);

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, `${title.toLowerCase().replace(/\s+/g, "_")}_duties.xlsx`);
  };

  const calculateStats = (day) => {
    let pushingCount = 0;
    let loadingCount = 0;
    let inputCount = 0;

    Object.keys(employeeStatus).forEach((employee) => {
      const duty = employeeStatus[employee][day]?.trim().toLowerCase();

      if (duty.includes("push")) {
        pushingCount++;
      } else if (duty.includes("load")) {
        loadingCount++;
      } else if (duty === "input") {
        inputCount++;
      }
    });

    return {
      pushing: pushingCount,
      loading: loadingCount,
      input: inputCount,
    };
  };

  const toggleStatsVisibility = (day) => {
    setShowStats((prevState) => ({
      ...prevState,
      [day]: !prevState[day],
    }));
  };

  const filteredData = useMemo(() => {
    return Object.keys(employeeStatus)
      .filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  }, [employeeStatus, searchTerm]);

  return (
    <div className="app-container">
      <h2 className="greeting-message">Duty Shuffler - {title}</h2>
      <p className="inspiring-quote">"{randomQuote}"</p>{" "}
      {/* Display the random quote */}
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="file-input"
      />
      {error && <div className="error-message">{error}</div>}
      {Object.keys(employeeStatus).length > 0 ? (
        <>
          <input
            type="text"
            placeholder="Search Employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="statistics">
            {dayNames.map((day) => {
              const stats = calculateStats(day);
              return (
                <div key={day} className="day-stats-container">
                  <button
                    className="toggle-stats-btn"
                    onClick={() => toggleStatsVisibility(day)}
                  >
                    {showStats[day] ? "−" : "+"} {day} Stats
                  </button>
                  {showStats[day] && (
                    <div className="day-stats">
                      <div className="stat-item">
                        <strong>Pushing:</strong> {stats.pushing}
                      </div>
                      <div className="stat-item">
                        <strong>Loading:</strong> {stats.loading}
                      </div>
                      <div className="stat-item">
                        <strong>Input:</strong> {stats.input}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="employee-list">
            {filteredData.length > 0 ? (
              filteredData.map((name) => (
                <div key={name} className="employee-card">
                  <h3>{name}</h3>
                  {dayNames.map((day) => (
                    <div key={day} className="day-select">
                      <span>{day}:</span>
                      <select
                        value={employeeStatus[name][day]}
                        onChange={(e) =>
                          handleDutyChange(name, day, e.target.value)
                        }
                        className="status-select"
                      >
                        <option value={employeeStatus[name][day]}>
                          {employeeStatus[name][day]}
                        </option>
                        {availableDuties[day]?.map((duty) => (
                          <option key={duty} value={duty}>
                            {duty}
                          </option>
                        ))}
                        <option value="Absent">Absent</option>
                        <option value="Vacation">Vacation</option>
                        <option value="HOLIDAY">HOLIDAY</option>
                      </select>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="no-match">
                No employees found matching "{searchTerm}"
              </div>
            )}
          </div>

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
