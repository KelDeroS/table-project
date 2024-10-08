import React, { useEffect, useState } from 'react';
import data from './table.json';
import './style.css';

export const DataTable = () => {
  const [tablesData, setTablesData] = useState([]);
  const [tablesHeaders, setTablesHeaders] = useState([]);
  const [jsonCopy, setJsonCopy] = useState(JSON.parse(JSON.stringify(data)));

  useEffect(() => {
    const extractedTablesData = [];
    const extractedTablesHeaders = [];

    jsonCopy.partitionList.forEach((partition) => {
      partition.detailsSet.forEach((details) => {
        const extractedData = [];
        const headerList = details.neoHeaderList || [];

        const headerGrid = [];

        headerList.forEach(header => {
          const row = header.headerRow;
          const column = header.headerColumn;
          const rowSpan = header.rowSpan;
          const colSpan = header.colSpan;

          if (!headerGrid[row]) {
            headerGrid[row] = [];
          }

          for (let i = 0; i < rowSpan; i++) {
            for (let j = 0; j < colSpan; j++) {
              if (!headerGrid[row + i]) {
                headerGrid[row + i] = [];
              }
              headerGrid[row + i][column + j] = '#';
            }
          }
          headerGrid[row][column] = {
            value: header.value,
            colSpan,
            rowSpan,
            index: header.index
          };
        })

        //console.log(headerGrid);

        details.rowList.forEach(row => {
          let tableRow = {
            rowName: row.name,
            rowNumber: row.rowNumber,
            rowId: row.id,
          };
          let columnNames = [];

          Object.keys(row).forEach(key => {
            if (key !== 'indicatorList') {
              if (row[key] === null) {
                columnNames.push(key);
                tableRow[key] = null;
              }
            }
          });

          tableRow['columnNames'] = columnNames;

          row.indicatorList.forEach(indicator => {
            if (indicator.indicatorsClassifier !== null) {
              for (let i = 0; i < columnNames.length; i++) {
                if (columnNames[i] === indicator.name) {
                  tableRow[indicator.name] = indicator.value;
                }
              }
            } else {
              tableRow[indicator.name] = undefined;
            }
          });

          extractedData.push(tableRow);
        });

        extractedTablesData.push(extractedData);
        extractedTablesHeaders.push(headerGrid);
      });
    });

    setTablesData(extractedTablesData);
    setTablesHeaders(extractedTablesHeaders);
  }, [jsonCopy]);

  const handleInputChange = (tableIndex, rowIndex, event, columnName) => {
    const newData = [...tablesData[tableIndex]];
    const newValue = event.target.value;
    newData[rowIndex][columnName] = newValue;

    jsonCopy.partitionList.forEach(partition => {
      partition.detailsSet.forEach(details => {
        details.rowList.forEach(row => {
          console.log(row.id, newData[rowIndex].rowId);
          if (row.id === newData[rowIndex].rowId) {
            row.indicatorList.forEach(indicator => {
              if (indicator.name === columnName) {
                indicator.value = newValue;
              }
            });
          }
        });
      });
    });

    setTablesData(prev => {
      const updatedTables = [...prev];
      updatedTables[tableIndex] = newData;
      return updatedTables;
    });

    setJsonCopy(JSON.parse(JSON.stringify(jsonCopy)));
  }

  const downloadJSON = () => {
    const json = JSON.stringify(jsonCopy, null, 2); // Форматируем JSON
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'updatedData.json'; // Имя файла
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Освобождаем память
  };

  const renderTable = (tableData, headerGrid, tableIndex) => (
      <table>
        <thead>
        {headerGrid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((header, colIndex) => {
                if (header !== undefined) {
                  if (header !== '#') {
                    return (
                        <th
                            key={header.index}
                            colSpan={header.colSpan}
                            rowSpan={header.rowSpan}
                        >
                          {header.value}
                        </th>
                    )
                  }
                } else {
                  return (
                      <th key={colIndex}></th>
                  )
                }
              })}
            </tr>
        ))}
        </thead>
        <tbody>
        {tableData.map((item, rowIndex) => (
            <tr key={rowIndex}>
              <td>{item.rowName}</td>
              <td>{item.rowNumber}</td>
              {item.columnNames.map((columnName, nullIndex) => (
                  <td key={nullIndex}>
                    {(() => {
                      if (item[columnName] !== undefined) {
                        return (
                            <input
                                type="text"
                                value={item[columnName] || ''}
                                onChange={(event) => handleInputChange(tableIndex, rowIndex, event, columnName)}
                            />
                        );
                      } else {
                        return <span></span>;
                      }
                    })()}
                  </td>
              ))}
            </tr>
        ))}
        </tbody>
      </table>
  );

  return (
      <div>
        {tablesData.map((tableData, tableIndex) => (
            <div key={tableIndex}>
              <h2>Таблица {tableIndex + 1}</h2>
              {renderTable(tableData, tablesHeaders[tableIndex], tableIndex)}
            </div>
        ))}
        <button onClick={downloadJSON}>Скачать JSON</button>
      </div>
  );
};

export default DataTable;