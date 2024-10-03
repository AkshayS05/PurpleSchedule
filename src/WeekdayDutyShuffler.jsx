import DutyShuffler from "./DutyShuffler";
import { useState } from "react";

import * as XLSX from "xlsx";

function WeekdayDutyShuffler() {
  const [employeeStatus, setEmployeeStatus] = useState({});
  const [availableDuties, setAvailableDuties] = useState({});
  const [error, setError] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        let parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (parsedData.length === 0) {
          console.log("No data found in the sheet.");
          return;
        }

        console.log("Parsed data:", parsedData);

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

        const requiredWeekdays = [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ];
        const missingWeekdays = requiredWeekdays.filter(
          (day) => !headers.includes(day)
        );

        if (missingWeekdays.length > 0) {
          setError(
            `Missing required weekdays: ${missingWeekdays.join(
              ", "
            )}. Please upload the correct sheet.`
          );
          return;
        } else {
          setError("");
        }

        const nameIndex = headers.indexOf("NAME");
        const daysIndexes = {
          Monday: headers.indexOf("MONDAY"),
          Tuesday: headers.indexOf("TUESDAY"),
          Wednesday: headers.indexOf("WEDNESDAY"),
          Thursday: headers.indexOf("THURSDAY"),
          Friday: headers.indexOf("FRIDAY"),
        };

        let cleanedData = parsedData.slice(headerRowIndex + 1).map((row) => ({
          Name: row[nameIndex]?.trim(),
          Monday: row[daysIndexes.Monday]?.trim(),
          Tuesday: row[daysIndexes.Tuesday]?.trim(),
          Wednesday: row[daysIndexes.Wednesday]?.trim(),
          Thursday: row[daysIndexes.Thursday]?.trim(),
          Friday: row[daysIndexes.Friday]?.trim(),
        }));

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

        console.log("Cleaned Data:", cleanedData);

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

        console.log("Initial Employee Status:", initialStatus);

        setEmployeeStatus(initialStatus);

        const allDuties = {};
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach(
          (day) => {
            allDuties[day] = [
              ...new Set(cleanedData.map((row) => row[day])),
            ].filter(Boolean);
          }
        );

        console.log("Available Duties:", allDuties);

        setAvailableDuties(allDuties);
      } catch (error) {
        console.error("Error processing file:", error);
        setError(
          "Error processing file. Please ensure it is the correct format."
        );
      }
    };

    reader.onerror = (error) => {
      console.error("File Reader Error:", error);
      setError("Failed to read the file. Please try again.");
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <DutyShuffler
      title="Weekday"
      dayNames={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}
      onFileUpload={handleFileUpload}
      availableDuties={availableDuties}
      employeeStatus={employeeStatus}
      setEmployeeStatus={setEmployeeStatus}
      error={error}
      setError={setError}
    />
  );
}

export default WeekdayDutyShuffler;
