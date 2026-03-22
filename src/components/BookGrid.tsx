import type { Book } from '@/types';
import BookCard from './BookCard';

export default function BookGrid({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-warm-400 text-lg mb-1">Nenhum livro encontrado</p>
        <p className="text-warm-400/70 text-sm">Tente mudar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
