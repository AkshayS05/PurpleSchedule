import { useState } from "react";
import DutyShuffler from "./DutyShuffler";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function WeekendDutyShuffler() {
  const [employeeStatus, setEmployeeStatus] = useState({});
  const [availableDuties, setAvailableDuties] = useState({});
  const [error, setError] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      let parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = parsedData[0];
      parsedData = parsedData.slice(1);

      const nameIndex = headers.indexOf("Name");
      const days = ["Saturday", "Sunday"];
      const dayIndices = days.map((day) => headers.indexOf(day));

      const weekendData = parsedData.map((row) => {
        const dayData = {};
        days.forEach((day, idx) => {
          dayData[day] = row[dayIndices[idx]]?.trim();
        });
        return { Name: row[nameIndex]?.trim(), ...dayData };
      });

      const initialStatus = weekendData.reduce((acc, row) => {
        acc[row.Name] = row;
        return acc;
      }, {});

      setEmployeeStatus(initialStatus);
      setAvailableDuties(initialStatus); // Adjust this as per the actual requirement

      // Generate PST duties Excel sheet
      generatePSTDutiesSheet(Object.keys(initialStatus));
    };
    reader.readAsBinaryString(file);
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const generatePSTDutiesSheet = (names) => {
    const shuffledNames = shuffleArray([...names]);

    const balldeckPST = shuffledNames.slice(0, 3).map((name) => ({
      Name: name,
      Duty: "Balldeck PST",
    }));

    const floorPST = shuffledNames.slice(3, 6).map((name) => ({
      Name: name,
      Duty: "Floor PST",
    }));

    const blankRow = { Name: "", Duty: "" }; // Blank row for spacing

    // Order: Balldeck PST, blank row, Floor PST
    const pstData = [...balldeckPST, blankRow, ...floorPST];

    const worksheet = XLSX.utils.json_to_sheet(pstData);
    const wscols = [{ wch: 20 }, { wch: 20 }];

    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PST Duties");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, "PST_Duties.xlsx");
  };

  return (
    <DutyShuffler
      title="Weekend"
      dayNames={["Saturday", "Sunday"]}
      onFileUpload={handleFileUpload}
      availableDuties={availableDuties}
      employeeStatus={employeeStatus}
      setEmployeeStatus={setEmployeeStatus}
      error={error}
      setError={setError}
    />
  );
}

export default WeekendDutyShuffler;
