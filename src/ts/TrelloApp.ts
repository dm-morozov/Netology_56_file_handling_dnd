// TrelloApp.ts
import { Card, Column } from "./interface";

export default class TrelloApp {
  private board: HTMLElement;
  private state: Column[];
  private placeholder: HTMLElement; // Добавляем динамический плейсхолдер по заданию
  private draggingCardHeight: number = 0;

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
      columnElement.append(columnTitle);

      // Добавляем контейнер для карточек
      const cardsContainer = document.createElement("div");
      cardsContainer.classList.add("cards-container");
      this.makeDropZone(cardsContainer, column.id);

      // Убираем статический плейсхолдер, делаем динамический
      if (column.cards.length === 0) {
        const emptyPlaceholder = document.createElement("div");
        emptyPlaceholder.classList.add("placeholder");
        emptyPlaceholder.textContent = "Перетащите карточку сюда";
        cardsContainer.append(emptyPlaceholder);
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
        cardElement.append(cardText);

        // кнопка удаления
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✖";
        deleteBtn.classList.add("delete-card");
        deleteBtn.addEventListener("click", (_) =>
          this.deleteCard(column.id, card.id),
        );
        cardElement.append(deleteBtn);

        // кнопка редактирования
        const editBtn = document.createElement("button");
        editBtn.textContent = "✎";
        editBtn.classList.add("edit-card");
        editBtn.addEventListener("click", (_) => {
          this.startCardEditing(cardElement, card);
        });
        cardElement.append(editBtn);

        // Двойной клик для редактирования
        cardElement.addEventListener("dblclick", () => {
          this.startCardEditing(cardElement, card);
        });

        // Drag события
        cardElement.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData(
            "text/plain",
            JSON.stringify({ cardId: card.id, from: column.id }),
          );
          cardElement.classList.add("dragging");

          // Сохраняем высоту перетаскиваемой области
          this.draggingCardHeight = cardElement.offsetHeight;
          this.placeholder.style.height = `${this.draggingCardHeight}px`;

          // нельзя прятать сразу,
          // браузер сначала делает снимок для ghost.
          // Поэтому используем setTimeout
          setTimeout(() => cardElement.classList.add("hide"), 0);
        });

        cardElement.addEventListener("dragend", () => {
          cardElement.classList.remove("dragging", "hide");
          this.removePlaceholder();

          // Сбрасываем высоту плейсхолдера после завершения перетаскивания
          this.placeholder.style.height = "";
        });

        cardsContainer.append(cardElement);
      });

      columnElement.append(cardsContainer);

      // кнопка добавления карточки
      const addCardButton = document.createElement("button");
      addCardButton.classList.add("add-card-button");
      addCardButton.textContent = "+ Добавить карточку";
      addCardButton.addEventListener("click", () =>
        this.showAddCardInput(columnElement, column.id),
      );
      columnElement.append(addCardButton);
      this.board.append(columnElement);
    });
  }

  private startCardEditing(cardElement: HTMLElement, card: Card) {
    const cardContent = cardElement.querySelector("span");
    if (!cardContent) return; // Проверка, что элемент существует

    // Отключаем перетаскивание
    cardElement.setAttribute("draggable", "false");

    const input = document.createElement("input");
    input.type = "text";
    input.value = card.text;
    input.classList.add("edit-input");

    // заменяем span на input
    cardElement.replaceChild(input, cardContent);
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
  }

  private showAddCardInput(columnElement: HTMLElement, columnId: string) {
    // находим кнопку добавления в нашей колонке
    const addCardButton = columnElement.querySelector(
      ".add-card-button",
    ) as HTMLElement;
    if (!addCardButton) return;

    // удаляем кнопку
    addCardButton.style.display = "none";

    // 1. создаю новый контейней для формы добавления карточки
    const newCardForm = document.createElement("div");
    newCardForm.classList.add("add-card-form");

    // 2. создаю поле ввода
    const inputForNewCard = document.createElement("input");
    inputForNewCard.type = "text";
    inputForNewCard.placeholder = "Введите текст карточки...";
    inputForNewCard.classList.add("input-for-new-card");

    // 3. создаем контейнер для кнопок
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("add-card-buttons-container");

    // 4. создаем кнопки add и cancel
    const addBtn = document.createElement("button");
    addBtn.textContent = "Добавить карточку";
    addBtn.classList.add("add-card-btn-ok");

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "✖";
    cancelBtn.classList.add("add-card-btn-cancel");

    // 5. Собираем элементы и добавляем в колонку
    buttonsContainer.append(addBtn, cancelBtn);
    newCardForm.append(inputForNewCard, buttonsContainer);
    columnElement.append(newCardForm);

    // 6. Чтобы сразу можно было печатать в поле ввода, нужно input дать фокус
    inputForNewCard.focus();

    // 7. создаем сброс нашей формы, она должна сбрасываться в пяти случаях
    const cleanup = () => {
      newCardForm.remove();
      addCardButton.style.display = "block";
    };

    // 8. Добавляем обработчики событий на кнопки и формы
    addBtn.addEventListener("click", () => {
      const cardText = inputForNewCard.value.trim();
      if (cardText) {
        console.log(`Создаем карточку с текстом: ${cardText}`);
        this.createAndAddCard(columnElement, cardText, columnId);
        cleanup();
      }
    });

    cancelBtn.addEventListener("click", () => {
      cleanup();
    });

    inputForNewCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const cardText = inputForNewCard.value.trim();
        if (cardText) {
          console.log(`Создаем карточку с текстом: ${cardText}`);
          this.createAndAddCard(columnElement, cardText, columnId);
          cleanup();
        }
      } else if (event.key === "Escape") {
        cleanup();
      }
    });
  }

  private createAndAddCard(
    columnElement: HTMLElement,
    cardText: string,
    columnId: string,
  ) {
    if (cardText) {
      const column = this.state.find((col) => col.id === columnId);
      console.log(column); // ок нашел то, что нужно

      // теперь нужно создать новый объект с карточкой и добавить его в колонку
      const newCard: Card = {
        id: Date.now().toString(),
        text: cardText,
      };

      // добавляем карточку в массив cards
      column?.cards.push(newCard);

      // рендерим и сохраняем в state
      this.render();
      this.saveState();
    }
  }

  // Метод для удаления плейсхолдера
  private removePlaceholder() {
    if (this.placeholder.parentElement) {
      this.placeholder.remove();
    }
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
