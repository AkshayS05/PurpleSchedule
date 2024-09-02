import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useMemo, useState } from "react";
import "./DutyShuffler.css";

function WeekdayDutyShuffler() {
  const [data, setData] = useState([]);
  const [employeeStatus, setEmployeeStatus] = useState({});
  const [availableDuties, setAvailableDuties] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showStats, setShowStats] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected.");
      return;
    }

    console.log("File selected:", file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        console.log("File reading started...");
        const arrayBuffer = event.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        console.log("Workbook read:", workbook);

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        console.log("Sheet name:", sheetName);
        console.log("Sheet data:", sheet);

        let parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log("Parsed data (raw):", parsedData);

        if (parsedData.length === 0) {
          console.log("No data found in the sheet.");
          return;
        }

        // Detect headers by looking for the row that includes "NAME" or similar expected header
        let headerRowIndex = 0;
        for (let i = 0; i < parsedData.length; i++) {
          const row = parsedData[i];
          if (
            row.some(
              (cell) =>
                cell &&
                typeof cell === "string" &&
                cell.toUpperCase().includes("NAME")
            )
          ) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = parsedData[headerRowIndex].map((header) =>
          header.trim().toUpperCase()
        );
        console.log("Headers:", headers);

        const statusIndex = headers.indexOf("STATUS");
        const nameIndex = headers.indexOf("NAME");
        const mondayIndex = headers.indexOf("MONDAY");
        const tuesdayIndex = headers.indexOf("TUESDAY");
        const wednesdayIndex = headers.indexOf("WEDNESDAY");
        const thursdayIndex = headers.indexOf("THURSDAY");
        const fridayIndex = headers.indexOf("FRIDAY");

        console.log("Column indexes:", {
          statusIndex,
          nameIndex,
          mondayIndex,
          tuesdayIndex,
          wednesdayIndex,
          thursdayIndex,
          fridayIndex,
        });

        let cleanedData = parsedData.slice(headerRowIndex + 1).map((row) => ({
          Status: row[statusIndex]?.trim(),
          Name: row[nameIndex]?.trim(),
          Monday: row[mondayIndex]?.trim(),
          Tuesday: row[tuesdayIndex]?.trim(),
          Wednesday: row[wednesdayIndex]?.trim(),
          Thursday: row[thursdayIndex]?.trim(),
          Friday: row[fridayIndex]?.trim(),
        }));

        console.log("Cleaned data:", cleanedData);

        cleanedData = cleanedData.filter(
          (row) =>
            row.Name &&
            row.Name.trim() !== "" &&
            row.Monday &&
            row.Tuesday &&
            row.Wednesday &&
            row.Thursday &&
            row.Friday
        );

        console.log("Filtered data:", cleanedData);

        if (cleanedData.length === 0) {
          console.log("No valid data after filtering.");
          return;
        }

        const initialStatus = cleanedData.reduce((acc, row) => {
          acc[row.Name] = {
            Monday: row.Monday,
            Tuesday: row.Tuesday,
            Wednesday: row.Wednesday,
            Thursday: row.Thursday,
            Friday: row.Friday,
          };
          return acc;
        }, {});

        console.log("Initial employee status:", initialStatus);

        setEmployeeStatus(initialStatus);

        const allDuties = {};
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach(
          (day) => {
            allDuties[day] = [
              ...new Set(cleanedData.map((row) => row[day])),
            ].filter(Boolean);
          }
        );

        console.log("Available duties by day:", allDuties);

        setAvailableDuties(allDuties);
        setData(cleanedData);
      } catch (error) {
        console.error("Error processing file:", error);
      }
    };

    reader.onerror = (error) => {
      console.error("File Reader Error:", error);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDutyChange = (name, day, newDuty) => {
    if (newDuty === "HOLIDAY") {
      setEmployeeStatus((prevStatus) => {
        const updatedStatus = { ...prevStatus };
        Object.keys(updatedStatus).forEach((employee) => {
          updatedStatus[employee][day] = "HOLIDAY";
        });
        console.log(
          "Updated status after setting HOLIDAY for everyone:",
          updatedStatus
        );
        return updatedStatus;
      });
    } else if (newDuty === "Input") {
      setEmployeeStatus((prevStatus) => {
        const updatedStatus = { ...prevStatus };
        const oldDuty = prevStatus[name][day];

        console.log(`${name}'s old duty on ${day} was ${oldDuty}`);

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
        } else {
          console.log(`${name} is now doing ${newDuty}. No swap needed.`);
        }

        return updatedStatus;
      });
    }
  };

  const handleDownload = () => {
    // Sort data alphabetically by Name
    const sortedData = [...data]
      .map((row) => ({
        ...row,
        Monday: employeeStatus[row.Name]?.Monday || row.Monday,
        Tuesday: employeeStatus[row.Name]?.Tuesday || row.Tuesday,
        Wednesday: employeeStatus[row.Name]?.Wednesday || row.Wednesday,
        Thursday: employeeStatus[row.Name]?.Thursday || row.Thursday,
        Friday: employeeStatus[row.Name]?.Friday || row.Friday,
        Status: employeeStatus[row.Name]?.Status || row.Status, // Ensure Status is included
      }))
      .sort((a, b) => a.Name.localeCompare(b.Name)); // Sort names in ascending order

    // Create worksheet with Status column
    const worksheet = XLSX.utils.json_to_sheet(sortedData);

    // Set column widths
    const wscols = [
      { wch: 20 }, // Name column width
      { wch: 30 }, // Monday column width
      { wch: 30 }, // Tuesday column width
      { wch: 30 }, // Wednesday column width
      { wch: 30 }, // Thursday column width
      { wch: 30 }, // Friday column width
      { wch: 30 }, // Status column width
    ];

    worksheet["!cols"] = wscols;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weekday Duties");

    // Write to buffer and save file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, "weekday_duties.xlsx");
  };

  const calculateStats = (day) => {
    let pushingCount = 0;
    let loadingCount = 0;
    let inputCount = 0;

    Object.keys(employeeStatus).forEach((employee) => {
      const duty = employeeStatus[employee][day]?.trim().toLowerCase();
      console.log(`Employee: ${employee}, Duty on ${day}: '${duty}'`);

      if (duty.includes("push")) {
        pushingCount++;
      } else if (duty.includes("load")) {
        loadingCount++;
      } else if (duty === "input") {
        inputCount++;
      }
    });

    console.log(
      `Stats for ${day}: Pushing - ${pushingCount}, Loading - ${loadingCount}, Input - ${inputCount}`
    );

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
    return data
      .filter((row) =>
        row.Name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.Name.localeCompare(b.Name)); // Sort names in ascending order
  }, [data, searchTerm]);

  const currentDay = new Date().toLocaleString("en-us", { weekday: "long" });
  const quote =
    "Success is not final, failure is not fatal: It is the courage to continue that counts.";

  return (
    <div className="app-container">
      <h2 className="greeting-message">Happy {currentDay}!</h2>
      <p className="inspiring-quote">"{quote}"</p>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="file-input"
      />

      {data.length > 0 ? (
        <>
          <input
            type="text"
            placeholder="Search Employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="statistics">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
              (day) => {
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
              }
            )}
          </div>

          <div className="employee-list">
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <div key={row.Name} className="employee-card">
                  <h3>
                    {row.Name}{" "}
                    {employeeStatus[row.Name].Status &&
                      `(${employeeStatus[row.Name].Status})`}
                  </h3>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day) => (
                      <div key={day} className="day-select">
                        <span>{day}:</span>
                        <select
                          value={employeeStatus[row.Name][day]}
                          onChange={(e) =>
                            handleDutyChange(row.Name, day, e.target.value)
                          }
                          className="status-select"
                        >
                          <option value={employeeStatus[row.Name][day]}>
                            {employeeStatus[row.Name][day]}
                          </option>
                          {availableDuties[day].map((duty) => (
                            <option key={duty} value={duty}>
                              {duty}
                            </option>
                          ))}
                          <option value="HOLIDAY">HOLIDAY</option>
                        </select>
                      </div>
                    )
                  )}
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

export default WeekdayDutyShuffler;
