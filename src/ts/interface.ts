// interface.ts

// Описание колонки
export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

// Описание карточки
export interface Card {
  id: string;
  text: string;
}
