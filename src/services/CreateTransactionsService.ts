import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionsService {
  public async execute({
    category: categoryTitle,
    title,
    type,
    value,
  }: TransactionDTO): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    let category = await categoryRepository.findOne({
      where: { title: categoryTitle },
    });

    if (!category) {
      category = categoryRepository.create({ title: categoryTitle });
      await categoryRepository.save(category);
    }

    const transactionRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const balance = await transactionRepository.getBalance();

      if (balance.total - value < 0) {
        throw new AppError(
          'You not have a income to complete this transaction!',
          400,
        );
      }
    }

    const transaction = transactionRepository.create({
      category_id: category.id,
      title,
      type,
      value,
    });

    await transactionRepository.save(transaction);

    transaction.category = category;
    delete transaction.category_id;

    return transaction;
  }
}

export default CreateTransactionsService;
