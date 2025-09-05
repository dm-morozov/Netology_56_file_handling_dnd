// TrelloApp.ts
import { Card, Column } from "./interface";

export default class TrelloApp {
  private board: HTMLElement;
  private state: Column[];
  private placeholder: HTMLElement; // Добавляем динамический плейсхолдер по заданию

  constructor(boardId: string = "board") {
    console.log("TrelloApp started");
    this.board = document.querySelector("#" + boardId) as HTMLElement;
    // console.log(this.board);

    const savedState = localStorage.getItem("trelloState");

    if (savedState) {
      this.state = JSON.parse(savedState);
    } else {
      this.state = [
        {
          id: "todo",
          title: "To do",
          cards: [
            { id: "1", text: "Сделать домашку" },
            { id: "2", text: "Купить продукты" },
            { id: "3", text: "Погулять перед сном" },
          ],
        },
        { id: "in-progress", title: "In progress", cards: [] },
        { id: "done", title: "Done", cards: [] },
      ];
    }

    // создаем плейсхолдер один раз
    this.placeholder = document.createElement("div");
    this.placeholder.classList.add("drag-placeholder");

    this.render();
  }

  private saveState() {
    localStorage.setItem("trelloState", JSON.stringify(this.state));
  }

  private render() {
    this.board.innerHTML = "";

    this.state.forEach((column) => {
      const columnElement = document.createElement("div");
      columnElement.classList.add("column");
      columnElement.dataset.id = column.id;

      const columnTitle = document.createElement("h3");
      columnTitle.textContent = column.title;
      columnElement.appendChild(columnTitle);

      // Добавляем контейнер для карточек
      const cardsContainer = document.createElement("div");
      cardsContainer.classList.add("cards-container");
      this.makeDropZone(cardsContainer, column.id);

      // Убираем статический плейсхолдер, делаем динамический
      if (column.cards.length === 0) {
        const emptyPlaceholder = document.createElement("div");
        emptyPlaceholder.classList.add("placeholder");
        emptyPlaceholder.textContent = "Перетащите карточку сюда";
        cardsContainer.appendChild(emptyPlaceholder);
      }

      column.cards.forEach((card) => {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");
        cardElement.setAttribute("draggable", "true");
        cardElement.dataset.index = column.cards.indexOf(card).toString();

        cardElement.addEventListener("dragover", (event) => {
          event.preventDefault();

          const draggingCard = document.querySelector(
            ".dragging",
          ) as HTMLElement;

          if (draggingCard !== cardElement) {
            // console.log("Если мы перетаскиваем не эту же карточку.");
            // Проверяем позицию курсора относительно карточки
            const boundingBox = cardElement.getBoundingClientRect();

            // нам нужно поделить карточку на половину и
            // определить верхняя либо нижняя половина
            // true - верхняя, false - нижняя
            const isBefore =
              event.clientY < boundingBox.y + boundingBox.height / 2;
            console.log(isBefore);

            // Вставляем плейсхолдер перед или после карточки
            const parentContainer = cardElement.parentElement;
            if (parentContainer) {
              // перед тем как вставлять новый плейсхолдер, удаляем старый
              // чтобы не было дублирования призрачных элементов
              this.removePlaceholder();
              if (isBefore) {
                parentContainer.insertBefore(this.placeholder, cardElement);
              } else {
                parentContainer.insertBefore(
                  this.placeholder,
                  cardElement.nextSibling,
                );
              }
            }
          }
        });

        // текст карточки
        const cardText = document.createElement("span");
        cardText.textContent = card.text;
        cardElement.appendChild(cardText);

        // кнопка удаления
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✖";
        deleteBtn.classList.add("delete-card");
        deleteBtn.addEventListener("click", (_) =>
          this.deleteCard(column.id, card.id),
        );
        cardElement.appendChild(deleteBtn);

        // кнопка редактирования
        const editBtn = document.createElement("button");
        editBtn.textContent = "✎";
        editBtn.classList.add("edit-card");
        editBtn.addEventListener("click", (_) =>
          this.editCard(column.id, card.id),
        );
        cardElement.appendChild(editBtn);

        // Двойной клик для редактирования
        cardElement.addEventListener("dblclick", () => {
          const input = document.createElement("input");
          input.type = "text";
          input.value = card.text;
          input.classList.add("edit-input");

          // заменяем span на input
          cardElement.replaceChild(input, cardText);
          input.focus();

          // при потере фокуса сохраняем
          const save = () => {
            const newText = input.value.trim();
            if (newText && newText !== card.text) {
              card.text = newText;
              this.saveState();
            }
            this.render();
          };

          input.addEventListener("blur", save);

          // при нажатии Enter сохраняем
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              save();
            }
            if (e.key === "Escape") {
              this.render();
            }
          });
        });

        // Drag события
        cardElement.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData(
            "text/plain",
            JSON.stringify({ cardId: card.id, from: column.id }),
          );
          cardElement.classList.add("dragging");

          // нельзя прятать сразу,
          // браузер сначала делает снимок для ghost.
          // Поэтому используем setTimeout
          setTimeout(() => cardElement.classList.add("hide"), 0);
        });

        cardElement.addEventListener("dragend", () => {
          cardElement.classList.remove("dragging", "hide");
          this.removePlaceholder();
        });

        cardsContainer.appendChild(cardElement);
      });

      columnElement.appendChild(cardsContainer);

      // кнопка добавления карточки
      const addCardButton = document.createElement("button");
      addCardButton.classList.add("add-card-button");
      addCardButton.textContent = "+ Добавить карточку";
      addCardButton.addEventListener("click", () => this.addCard(column.id));
      columnElement.appendChild(addCardButton);
      this.board.appendChild(columnElement);
    });
  }

  // Метод для удаления плейсхолдера
  private removePlaceholder() {
    if (this.placeholder.parentElement) {
      this.placeholder.parentElement.removeChild(this.placeholder);
    }
  }

  private addCard(columnID: string) {
    const text = prompt("Введите текст карточки");

    if (!text) return;

    const newCard: Card = {
      id: Date.now().toString(),
      text,
    };

    const column = this.state.find((col) => col.id === columnID)!;
    console.log(column);
    column.cards.push(newCard);

    this.render();
    this.saveState();
  }

  private deleteCard(columnId: string, cardId: string) {
    console.log(columnId, cardId);

    // нужно найти колонку и удалить карточку
    const column = this.state.find((col) => col.id === columnId);
    if (!column) return;
    column.cards = column.cards.filter((card) => card.id !== cardId);

    this.render();
    this.saveState();
  }

  private editCard(columnId: string, cardId: string) {
    const column = this.state.find((col) => col.id === columnId);
    if (!column) return;

    const card = column.cards.find((card) => card.id === cardId);
    if (!card) return;

    const newText = prompt("Введите новый текст карточки", card.text);
    if (!newText || newText === card.text || newText.trim() === "") return;

    card.text = newText;
    this.render();
    this.saveState();
  }

  private makeDropZone(dropzone: HTMLElement, columnId: string) {
    // Когда карточка находится над зоной
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    // Когда карточка уходит из зоны
    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    // Когда карточка роняется в зону
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");

      // Получаем данные
      const data = e.dataTransfer?.getData("text/plain");
      if (!data) return;

      const { cardId, from } = JSON.parse(data);
      // columnId - id колонки, в которую карточка переносится
      // from - id колонки, в которую карточка роняется

      // Если карточка роняется в ту же колонку - выходим
      // старый функционал, теперь мы его доработаем
      // if (from === columnId) return;

      // Находим старую колонку и карточку
      const fromCol = this.state.find((col) => col.id === from)!;
      const card = fromCol.cards.find((c) => c.id === cardId)!;

      // Удаляем карточку из старой колонки
      fromCol.cards = fromCol.cards.filter((c) => c.id !== cardId);

      // Находим целевую колонку
      const toCol = this.state.find((col) => col.id === columnId)!;

      // Определяем, куда вставить карточку.
      // колонка и контейнер, куда пользователь уронил карточку
      const targetContainer = this.board.querySelector(
        `.column[data-id="${columnId}"] .cards-container`,
      ) as HTMLDivElement;
      // Находим номер позиции плейсхолдера среди всех элементов
      const placeholderIndex = Array.from(targetContainer.children).indexOf(
        this.placeholder,
      );
      console.log(placeholderIndex);

      // Если плейсхолдер есть, то вставляем карточку на его место
      // Если indexOf вернул число (не -1), значит плейсхолдер реально стоит в колонке
      if (placeholderIndex !== -1) {
        // splice
        // индекс, с которого начинается изменение массива - placeholderIndex,
        // количество удаляемых элементов 0
        // элемент для добавления - card
        toCol.cards.splice(placeholderIndex, 0, card);
      } else {
        // Если плейсхолдер не был найден (например, бросили в пустую колонку),
        // добавляем карточку в конец.
        toCol.cards.push(card);
      }

      // Удаляем плейсхолдер
      this.removePlaceholder();

      // Перерисовываем интерфейс
      this.render();
      this.saveState();
    });
  }
}
