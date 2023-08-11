import { Tooltip } from "./tooltipFabric";

export class DomAndEvents {
  constructor() {
    this.tooltip = new Tooltip();
    this.actualMessages = [];
    this.url = new URL("http://localhost:8081");
  }

  async _fetchFullTicket(id) {
    const urlForGetTicketFull = new URL(this.url);
    const params = { method: "ticketById", id: id };
    Object.keys(params).forEach((key) =>
      urlForGetTicketFull.searchParams.append(key, params[key]),
    );

    return await fetch(urlForGetTicketFull)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((ticketFull) => {
        if (typeof ticketFull === "object" && ticketFull !== null) {
          return ticketFull;
        }
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  }

  _dateConverter(created) {
    const date = new Date(created);

    const formatter = new Intl.DateTimeFormat("ru", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return formatter.format(date);
  }

  onLoadPage() {
    document.addEventListener("DOMContentLoaded", () => {
      const urlForDownload = new URL(this.url);
      const params = { method: "allTickets" };
      Object.keys(params).forEach((key) =>
        urlForDownload.searchParams.append(key, params[key]),
      );

      fetch(urlForDownload)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((listOfTickets) => {
          if (Array.isArray(listOfTickets)) {
            document.querySelector(".table");
            for (const ticket of listOfTickets) {
              const item = document.createElement("tr");

              const created = this._dateConverter(ticket.created);

              item.classList.add("table_row");
              item.dataset.id = ticket.id;

              item.innerHTML = `
          <td class="item">${ticket.name}</td>
          <td class="price">${created}</td>
          <td>
            <button class="update">✎</button>
            <button class="remove">X</button>
          </td>`;

              document.querySelector(".table").appendChild(item);
            }
          }
        })
        .catch((error) => {
          console.log("Error:", error);
        });
    });
  }

  onClickCreateButton() {
    document
      .querySelector(".button_add")
      ?.addEventListener("click", (event) => {
        event.preventDefault();
        if (!document.querySelector(".popup_window.shown")) {
          this.popupCreator();
        }
      });
  }

  async onClickUpdateButton() {
    const updateButtonHandler = async (event) => {
      event.preventDefault();
      if (
        event.target.classList.contains("update") &&
        event.target.closest(".table_row").dataset.id
      ) {
        const targetItem = await this._fetchFullTicket(
          event.target.closest(".table_row").dataset.id,
        );
        this.popupCreator(
          event.target.closest(".table_row").dataset.id,
          targetItem.name,
          targetItem.description,
        );
      }
    };

    document
      .querySelector(".table")
      ?.addEventListener("click", await updateButtonHandler);
  }

  onClickRemoveButton() {
    const removeButtonHandler = (event) => {
      event.preventDefault();
      if (
        event.target.classList.contains("remove") &&
        event.target.closest(".table_row").dataset.id
      ) {
        this.deletePopup(event.target.closest(".table_row"));
      }
    };

    document
      .querySelector(".table")
      ?.addEventListener("click", removeButtonHandler);
  }

  popupOnSubmit(event, id = null) {
    if (id) {
      const ticketDataForUpdate = {
        id: id,
        name: event.target["item"].value,
        description: event.target.price.value,
      };

      const urlForUpdate = new URL(this.url);
      const params = { method: "editTicket", id: id };
      Object.keys(params).forEach((key) =>
        urlForUpdate.searchParams.append(key, params[key]),
      );

      fetch(urlForUpdate, {
        method: "PATCH",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketDataForUpdate),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((ticketObj) => {
          if (typeof ticketObj === "object" && ticketObj !== null) {
            const item = document.querySelector(`[data-id="${id}"]`);
            item.querySelector(".item").textContent = ticketObj.name;
          }
        })
        .catch((error) => {
          console.log("Error:", error);
        });
    } else {
      const ticketData = {
        name: event.target["item"].value,
        description: event.target.price.value,
        status: true,
      };

      const urlForCreate = new URL(this.url);
      const params = { method: "createTicket" };
      Object.keys(params).forEach((key) =>
        urlForCreate.searchParams.append(key, params[key]),
      );

      fetch(urlForCreate, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((ticketObj) => {
          if (typeof ticketObj === "object" && ticketObj !== null) {
            const item = document.createElement("tr");

            item.classList.add("table_row");
            item.dataset.id = ticketObj.id;

            item.innerHTML = `
          <td class="item">${ticketObj.name}</td>
          <td class="price">${this._dateConverter(ticketObj.created)}</td>
          <td>
            <button class="update">✎</button>
            <button class="remove">X</button>
          </td>`;

            document.querySelector(".table").appendChild(item);
          }
        })
        .catch((error) => {
          console.log("Error:", error);
        });
    }
    event.target["item"].value = "";
    event.target.price.value = "";

    this.popupCreator();
  }

  popupCreator(id = null, name = null, price = null) {
    const popupWindow = document.querySelector(".popup_window");

    if (!popupWindow) {
      const popupWindow = document.createElement("div");
      popupWindow.classList.add("popup_window", "shown");
      popupWindow.innerHTML = `
      <form class="form" novalidate>
      <div class="form-header"><h2>Добавить тикет</h2></div>
        <h2>Краткое описание</h2>
        <input type="text" name="item" required>
        <h2>Подробное описание</h2>
        <textarea name="price" required></textarea>
        <div class="form_buttons">
          <button class="cancel-bnt" type="button">Отмена</button>
          <button class="submit-btn" type="submit">Ok</button>
        </div>
      </form>`;
      document.body.appendChild(popupWindow);
    } else {
      popupWindow.classList.toggle("shown");
    }

    if (document.querySelector(".popup_window")?.classList.contains("shown")) {
      document.querySelector("input[name='item']").focus();
      const formHeader = document.querySelector(".form-header");
      if (id) {
        document.querySelector("input[name='item']").value = name;
        document.querySelector("textarea[name='price']").value = price;
        formHeader.textContent = "Изменить тикет";
        this.tooltipLogic(id);
      } else {
        formHeader.textContent === "Изменить тикет" &&
          (formHeader.textContent = "Добавить тикет");
        this.tooltipLogic();
      }
    }
  }

  deletePopupOnSubmit(itemForDelete) {
    const deletePopupElement = document.querySelector(".form-delete");
    const cancelDeleteButton = deletePopupElement.querySelector(".cancel-bnt");

    const popupWindowHandler = (event) => {
      event.preventDefault();

      if (itemForDelete) {
        const ticketDataForDelete = {
          id: itemForDelete.dataset.id,
        };

        const urlForDeleteTicketFull = new URL(this.url);
        const params = {
          method: "deleteTicketById",
          id: itemForDelete.dataset.id,
        };
        Object.keys(params).forEach((key) =>
          urlForDeleteTicketFull.searchParams.append(key, params[key]),
        );

        fetch(urlForDeleteTicketFull, {
          method: "DELETE",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ticketDataForDelete),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          })
          .catch((error) => {
            console.log("Error:", error);
          });

        itemForDelete.remove();
      }

      this.deletePopup();

      deletePopupElement.removeEventListener("submit", popupWindowHandler);
      cancelDeleteButton.removeEventListener("click", deletePopupCancelHandler);
    };

    const deletePopupCancelHandler = (event) => {
      event.preventDefault();
      if (event.target === deletePopupElement.querySelector(".cancel-bnt")) {
        this.deletePopup();
        cancelDeleteButton.removeEventListener(
          "click",
          deletePopupCancelHandler,
        );
        deletePopupElement.removeEventListener("submit", popupWindowHandler);
      }
    };

    deletePopupElement.addEventListener("submit", popupWindowHandler);
    cancelDeleteButton.addEventListener("click", deletePopupCancelHandler);
  }

  deletePopup(itemForDelete) {
    const popupDelete = document.querySelector(".popup_delete");
    if (!popupDelete) {
      const popupWindow = document.createElement("div");
      popupWindow.classList.add("popup_delete", "shown");
      popupWindow.innerHTML = `
      <form class="form-delete">
        <div class="form-header"><h2>Удалить тикет</h2></div>
        <h2>Вы уверены, что хотите удалить этот тикет? Это действие необходимо.</h2>
        <div class="form_buttons">
          <button class="cancel-bnt" type="button">Отмена</button>
          <button class="submit-btn" type="submit">Ok</button>
        </div>
      </form>`;
      document.body.appendChild(popupWindow);
    } else {
      popupDelete.classList.toggle("shown");
    }
    if (itemForDelete) {
      this.deletePopupOnSubmit(itemForDelete);
    }
  }

  tooltipLogic(elementID = null) {
    const form = document.querySelector(".form");
    const cancelButton = form.querySelector(".cancel-bnt");

    const errors = {
      item: {
        valueMissing: "Нам потребуется название...",
      },
      price: {
        valueMissing: "Нам потребуется стоимость...",
      },
    };

    const showTooltip = (message, el) => {
      this.actualMessages.push({
        name: el.name,
        id: this.tooltip.showTooltip(message, el),
      });
    };

    const getError = (el) => {
      const errorKey = Object.keys(ValidityState.prototype).find((key) => {
        if (!el.name) return;
        if (key === "valid") return;

        return el.validity[key];
      });

      if (!errorKey) return;

      return errors[el.name][errorKey];
    };

    const popupCancelHandler = (event) => {
      event.preventDefault();
      if (event.target === document.querySelector(".cancel-bnt")) {
        document.querySelector("input[name='item']").value = "";
        document.querySelector("textarea[name='price']").value = "";
        this.popupCreator();

        this.actualMessages.forEach((message) =>
          this.tooltip.removeTooltip(message.id),
        );
        this.actualMessages = [];

        cancelButton.removeEventListener("click", popupCancelHandler);
        form.removeEventListener("submit", formSubmitEventHandler);
      }
    };

    cancelButton.addEventListener("click", popupCancelHandler);

    const formSubmitEventHandler = (e) => {
      e.preventDefault();

      this.actualMessages.forEach((message) =>
        this.tooltip.removeTooltip(message.id),
      );
      this.actualMessages = [];

      const elements = form.elements;

      Array.from(elements).some((elem) => {
        const error = getError(elem);

        if (error) {
          showTooltip(error, elem);
          return true;
        }
        return false;
      });

      if (form.checkValidity()) {
        console.log("valid");
        console.log("submit");

        this.popupOnSubmit(e, elementID);
        cancelButton.removeEventListener("click", popupCancelHandler);
        form.removeEventListener("submit", formSubmitEventHandler);
        Array.from(form.elements).forEach((el) =>
          el.removeEventListener("focus", elementBlurCallback),
        );
      }
    };

    form.addEventListener("submit", formSubmitEventHandler);

    const elementOnBlur = (e) => {
      const el = e.target;

      const error = getError(el);

      const currentErrorMessage = this.actualMessages.find(
        (item) => item.name === el.name,
      );

      if (error) {
        if (!currentErrorMessage) {
          showTooltip(error, el);
        }
      } else {
        if (currentErrorMessage) {
          this.tooltip.removeTooltip(currentErrorMessage.id);
          this.actualMessages.splice(
            this.actualMessages.indexOf(currentErrorMessage.id),
            1,
          );
        }
      }
    };

    const elementBlurCallback = (el) =>
      el.addEventListener("blur", elementOnBlur);

    Array.from(form.elements).forEach((el) =>
      el.addEventListener("focus", elementBlurCallback(el)),
    );
  }
}
