import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface IrequetDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    category,
    title,
    type,
    value,
  }: IrequetDTO): Promise<Transaction> {
    try {
      const TransactionRepo = getCustomRepository(TransactionRepository);
      const categoryRepository = getRepository(Category);
      const { total } = await TransactionRepo.getBalance();

      if (type === 'outcome' && total < value) {
        throw new AppError('limite indisponível para operação');
      }

      let transactionCategory = await categoryRepository.findOne({
        where: {
          title: category,
        },
      });

      if (!transactionCategory) {
        transactionCategory = categoryRepository.create({
          title: category,
        });

        await categoryRepository.save(transactionCategory);
      }

      const transaction = TransactionRepo.create({
        title,
        type,
        value,
        category: transactionCategory,
      });

      await TransactionRepo.save(transaction);

      return transaction;
    } catch (err) {
      throw new AppError('erro');
    }
  }
}

export default CreateTransactionService;
