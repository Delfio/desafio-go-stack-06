import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionRepository.findOne(id);

    if (!transaction) {
      throw new AppError('Transactions does not exists');
    }
    await transactionRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
