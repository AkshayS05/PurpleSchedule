import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useState } from "react";
import "./DutyShuffler.css";

function WeekdayDutyShuffler() {
  const [data, setData] = useState([]);
  const [employeeStatus, setEmployeeStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      let parsedData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
      });

      parsedData = parsedData.slice(1);

      const headers = parsedData[0];
      const statusIndex = headers.indexOf("NAME") - 1;
      const nameIndex = headers.indexOf("NAME");
      const mondayIndex = headers.indexOf("MONDAY");
      const tuesdayIndex = headers.indexOf("TUESDAY");
      const wednesdayIndex = headers.indexOf("WEDNESDAY");
      const thursdayIndex = headers.indexOf("THURSDAY");
      const fridayIndex = headers.indexOf("FRIDAY");

      let cleanedData = parsedData
        .slice(1)
        .map((row) => ({
          Status:
            row[statusIndex] && typeof row[statusIndex] === "string"
              ? row[statusIndex].trim()
              : undefined,
          Name:
            row[nameIndex] && typeof row[nameIndex] === "string"
              ? row[nameIndex].trim()
              : undefined,
          Monday:
            row[mondayIndex] && typeof row[mondayIndex] === "string"
              ? row[mondayIndex].trim()
              : undefined,
          Tuesday:
            row[tuesdayIndex] && typeof row[tuesdayIndex] === "string"
              ? row[tuesdayIndex].trim()
              : undefined,
          Wednesday:
            row[wednesdayIndex] && typeof row[wednesdayIndex] === "string"
              ? row[wednesdayIndex].trim()
              : undefined,
          Thursday:
            row[thursdayIndex] && typeof row[thursdayIndex] === "string"
              ? row[thursdayIndex].trim()
              : undefined,
          Friday:
            row[fridayIndex] && typeof row[fridayIndex] === "string"
              ? row[fridayIndex].trim()
              : undefined,
        }))
        .filter(
          (row) =>
            row.Name &&
            row.Name.trim() !== "" &&
            row.Monday &&
            row.Tuesday &&
            row.Wednesday &&
            row.Thursday &&
            row.Friday
        );

      console.log("Cleaned Data:", cleanedData);

      if (cleanedData.length === 0) {
        console.warn("No valid data found after filtering.");
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

      setEmployeeStatus(initialStatus);
      setData(cleanedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleStatusChange = (name, day, value) => {
    setEmployeeStatus((prevStatus) => ({
      ...prevStatus,
      [name]: {
        ...prevStatus[name],
        [day]: value,
      },
    }));
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleDownload = () => {
    const scheduleData = data.map((row) => ({
      ...row,
      Monday: employeeStatus[row.Name]?.Monday || row.Monday,
      Tuesday: employeeStatus[row.Name]?.Tuesday || row.Tuesday,
      Wednesday: employeeStatus[row.Name]?.Wednesday || row.Wednesday,
      Thursday: employeeStatus[row.Name]?.Thursday || row.Thursday,
      Friday: employeeStatus[row.Name]?.Friday || row.Friday,
    }));

    const unchangedDuties = [
      "HOLIDAY",
      "OFF",
      "FORKLIFT",
      "TRUCK COORDINATION",
      "BALLDECK/INPUT",
      "ASSIST LEAD 1/2",
      "ASSIST LEAD 3",
      "BALLDECK/LOAD",
      "LINE 1 ASSIST",
      "LINE 2 ASSIST",
      "LINE 3 ASSIST",
      "TRIPS",
    ];

    const dutiesToShuffle = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ];

    const dutiesMap = dutiesToShuffle.reduce((acc, day) => {
      acc[day] = scheduleData
        .map((row, index) => ({
          duty: row[day],
          index: index,
        }))
        .filter(
          (item) =>
            !unchangedDuties.includes(item.duty) &&
            item.duty !== "Absent" &&
            item.duty !== "Vacation"
        );
      return acc;
    }, {});

    dutiesToShuffle.forEach((day) => {
      const shuffledDuties = shuffleArray(
        dutiesMap[day].map((item) => item.duty)
      );

      // Ensure no employee gets the same duty two days in a row
      for (let i = 0; i < dutiesMap[day].length; i++) {
        const currentDuty = shuffledDuties[i];
        const previousDayIndex = dutiesToShuffle.indexOf(day) - 1;

        if (
          previousDayIndex >= 0 &&
          dutiesMap[dutiesToShuffle[previousDayIndex]].length > 0
        ) {
          const previousDayDuty =
            scheduleData[dutiesMap[day][i].index][
              dutiesToShuffle[previousDayIndex]
            ];

          // If the current duty matches the previous day's duty, reshuffle
          if (currentDuty === previousDayDuty) {
            let swapIndex = (i + 1) % shuffledDuties.length;
            [shuffledDuties[i], shuffledDuties[swapIndex]] = [
              shuffledDuties[swapIndex],
              shuffledDuties[i],
            ];
          }
        }

        scheduleData[dutiesMap[day][i].index][day] = shuffledDuties[i];
      }
    });

    const sortedData = scheduleData.sort((a, b) =>
      a.Name.localeCompare(b.Name)
    );

    const worksheet = XLSX.utils.json_to_sheet(sortedData);

    // Set the width of the columns
    const wscols = [
      { wch: 10 }, // Status column width
      { wch: 30 }, // Name column width
      { wch: 30 }, // Monday column width
      { wch: 30 }, // Tuesday column width
      { wch: 30 }, // Wednesday column width
      { wch: 30 }, // Thursday column width
      { wch: 30 }, // Friday column width
    ];

    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weekday Duties");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, "weekday_duties.xlsx");
  };

  const filteredData = data
    .filter((row) => row.Name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.Name.localeCompare(b.Name)); // Sorting by name in ascending order

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

          <div className="employee-list">
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <div key={row.Name} className="employee-card">
                  <h3>{row.Name}</h3>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day) => (
                      <div key={day} className="day-select">
                        <span>{day}:</span>
                        <select
                          value={employeeStatus[row.Name][day]}
                          onChange={(e) =>
                            handleStatusChange(row.Name, day, e.target.value)
                          }
                          className="status-select"
                        >
                          <option value={row[day]}>{row[day]}</option>
                          <option value="Absent">Absent</option>
                          <option value="Vacation">Vacation</option>
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
