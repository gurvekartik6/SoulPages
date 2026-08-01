import { BookSpine } from './BookSpine';

const ROW_SIZE = 10;

function chunk(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export function BookshelfView({ books }) {
  const rows = chunk(books, ROW_SIZE);

  return (
    <div className="space-y-8">
      {rows.map((row, i) => (
        <div key={i}>
          <div className="flex flex-wrap items-end gap-2 px-2 pb-1">
            {row.map((book) => (
              <BookSpine key={book.id} book={book} />
            ))}
          </div>
          <div className="h-2 rounded-b-sm bg-gradient-to-b from-brass-deep/40 to-brass-deep/10" />
        </div>
      ))}
    </div>
  );
}
