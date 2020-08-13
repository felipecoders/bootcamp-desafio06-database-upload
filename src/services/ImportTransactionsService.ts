import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';

import Transaction from '../models/Transaction';

import CreateTransactionsService from './CreateTransactionsService';

interface ImportTransactionDTO {
  filename: string;
}

interface CSVLine {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: ImportTransactionDTO): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: CSVLine[] = [];

    parseCSV.on('data', ([title, type, value, category]) => {
      lines.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const createTransactionsService = new CreateTransactionsService();

    const transactions: Transaction[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const line of lines) {
      const transaction = await createTransactionsService.execute(line);
      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
