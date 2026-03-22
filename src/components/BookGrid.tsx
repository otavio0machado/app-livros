import type { Book } from '@/types';
import BookCard from './BookCard';

export default function BookGrid({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-gray-500 text-lg">Nenhum livro encontrado</p>
        <p className="text-gray-400 text-sm mt-1">Tente alterar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
