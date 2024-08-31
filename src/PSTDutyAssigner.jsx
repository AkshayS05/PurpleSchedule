import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function PSTDutyAssigner({ weekendData }) {
  const [pstDuties, setPstDuties] = useState([]);

  useEffect(() => {
    console.log("Processed Weekend Data:", weekendData);
  }, [weekendData]);

  const generatePSTDuties = () => {
    // Ensure weekendData is an array of objects with the required fields
    if (!Array.isArray(weekendData) || weekendData.length < 6) {
      console.warn("Not enough employees to assign PST duties.");
      return;
    }

    // Filter out rows that don't have the required properties
    const validData = weekendData.filter(
      (row) => row.Name && row.Saturday && row.Sunday
    );

    if (validData.length < 6) {
      console.warn("Not enough valid employees to assign PST duties.");
      return;
    }

    // Shuffle the array to randomize selection
    const shuffledData = [...validData].sort(() => 0.5 - Math.random());

    // Select 3 for Floor PST and 3 for Balldeck PST
    const floorPST = shuffledData.slice(0, 3);
    const balldeckPST = shuffledData.slice(3, 6);

    // Format the PST duties
    const formattedDuties = [
      { PST: "Floor PST", Employees: floorPST.map((d) => d.Name) },
      { PST: "Balldeck PST", Employees: balldeckPST.map((d) => d.Name) },
    ];

    setPstDuties(formattedDuties);
  };

  const handleDownload = () => {
    if (pstDuties.length === 0) {
      console.warn("PST duties have not been generated yet.");
      return;
    }

    const worksheetData = pstDuties.flatMap((pst) => [
      { PST: pst.PST, Employee: "" },
      ...pst.Employees.map((name) => ({ PST: "", Employee: name })),
    ]);

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, {
      header: ["PST", "Employee"],
    });

    // Set the width of the columns
    const wscols = [
      { wch: 20 }, // PST column width
      { wch: 30 }, // Employee column width
    ];

    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PST Duties");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, "pst_duties.xlsx");
  };

  return (
    <div className="pst-container">
      <button onClick={generatePSTDuties} className="generate-pst-button">
        Generate PST Duties
      </button>

      {pstDuties.length > 0 && (
        <div className="pst-duties">
          {pstDuties.map((pst, index) => (
            <div key={index} className="pst-duty">
              <h3>{pst.PST}</h3>
              <ul>
                {pst.Employees.map((employee, i) => (
                  <li key={i}>{employee}</li>
                ))}
              </ul>
            </div>
          ))}
          <button onClick={handleDownload} className="download-button">
            Download PST Duties
          </button>
        </div>
      )}
    </div>
  );
}

export default PSTDutyAssigner;
