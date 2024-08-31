import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useState } from "react";
import "./DutyShuffler.css";

function WeekendDutyShuffler({ onExcelUpload }) {
  // Receiving the onExcelUpload prop
  const [weekendData, setWeekendData] = useState([]);
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

      // Parse the sheet into JSON
      let parsedData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
      });

      // Extract headers
      const headers = parsedData[0];
      parsedData = parsedData.slice(1); // Remove the header row

      // Identify the indexes of relevant columns
      const nameIndex = headers.indexOf("Name");
      const saturdayIndex = headers.indexOf("Saturday");
      const sundayIndex = headers.indexOf("Sunday");

      // Process the data to create objects with the correct keys
      const weekendData = parsedData.map((row) => ({
        Name: row[nameIndex]?.trim(),
        Saturday: row[saturdayIndex]?.trim(),
        Sunday: row[sundayIndex]?.trim(),
      }));

      // Prepare the initial status state
      const initialStatus = weekendData.reduce((acc, row) => {
        acc[row.Name] = {
          Saturday: row.Saturday,
          Sunday: row.Sunday,
        };
        return acc;
      }, {});

      setEmployeeStatus(initialStatus);
      setWeekendData(weekendData);
      onExcelUpload(true); // Call the onExcelUpload function to notify the parent component
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
    const scheduleData = weekendData.map((row) => ({
      ...row,
      Saturday: employeeStatus[row.Name]?.Saturday || row.Saturday,
      Sunday: employeeStatus[row.Name]?.Sunday || row.Sunday,
    }));

    const unchangedDuties = [
      "HOLIDAY",
      "OFF",
      "FORKLIFT",
      "TRUCK COORDINATION",
      "BALLDECK/INPUT",
      "ASSIST LEAD 1/2",
      "BALLDECK/LOAD",
    ];

    const dutiesToShuffle = ["Saturday", "Sunday"];

    // Create a list of duties that need shuffling
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

    // Shuffle the duties within each day
    dutiesToShuffle.forEach((day) => {
      const shuffledDuties = shuffleArray(
        dutiesMap[day].map((item) => item.duty)
      );
      dutiesMap[day].forEach((item, i) => {
        scheduleData[item.index][day] = shuffledDuties[i];
      });
    });

    // Sort the shuffled data by employee names in ascending order
    const sortedData = scheduleData.sort((a, b) =>
      a.Name.localeCompare(b.Name)
    );

    const worksheet = XLSX.utils.json_to_sheet(sortedData);

    // Set the width of the columns
    const wscols = [
      { wch: 30 }, // Name column width
      { wch: 30 }, // Saturday column width
      { wch: 30 }, // Sunday column width
    ];

    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weekend Duties");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, "weekend_duties.xlsx");
  };

  const filteredData = weekendData
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

      {weekendData.length > 0 ? (
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
                  {["Saturday", "Sunday"].map((day) => (
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

export default WeekendDutyShuffler;
