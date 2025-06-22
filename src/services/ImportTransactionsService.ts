import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import CreateTransactionService from './CreateTransactionService';

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, filename);
    const readStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2, // Skip the header line
      trim: true,
      skip_empty_lines: true,
    });

    const parseCSV = readStream.pipe(parseStream);
    const lines = new Array<[string, 'outcome' | 'income', number, string]>();

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const createTransaction = new CreateTransactionService();

    const transactions = await Promise.all(
      lines.map(([title, type, value, category]) =>
        createTransaction.execute({
          title,
          type,
          value: Number(value),
          category,
        }),
      ),
    );

    return transactions;
  }
}

export default ImportTransactionsService;
