import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import transactionRepository from '../repositories/TransactionsRepository';
import CategoryModel from '../models/Category';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

// const FILE_PADRAO = path.resolve(__dirname, '..', '..', 'tmp', 'file.csv');

interface CSVtransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {

    const TranscationRepository = getCustomRepository(transactionRepository)
    const categoryModelRepository = getRepository(CategoryModel)

    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      from_line: 2,
    });

    const transactions: CSVtransaction[] = [];
    const categorys: string[] = [];

    const parseCSV = contactsReadStream.pipe(parsers);

    parseCSV.on('data', async (line) => {
      const [title, type, value, category] = line.map((cell:string) => cell.trim());

      if (!title || !type || !value){
        return;
      }
      categorys.push(category);

      transactions.push({
        title,
        type,
        value,
        category
      });

    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categorysExists = await categoryModelRepository.find({
      where: {
        title: In(categorys)
      }
    });

    const titleExits = categorysExists.map((category: Category) => category.title);

    const addCategoryTitles = categorys.filter(category =>
      !titleExits.includes(category)
    ).filter((values, index, self) => self.indexOf(values) === index);

    const newCategories = categoryModelRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoryModelRepository.save(newCategories);

    const finalCategorys = [...newCategories, ...categorysExists];

    const createdTransactions = TranscationRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategorys.find(
          category => category.title === transaction.category
        )
      }))
    );

    await TranscationRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
