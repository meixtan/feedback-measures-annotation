import Papa from 'papaparse';

export async function fetchCsv(filePath) {
  const response = await fetch(filePath);
  const csvText = await response.text();
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function sampleRows(data, sampleSize) {
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }