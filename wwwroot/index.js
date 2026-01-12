let currentMode = null;
let selectedBooks = new Set();

function showMessage(text, type = 'success') {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
    setTimeout(() => {
        message.className = 'message';
    }, 3000);
}

function showCreateForm() {
    document.getElementById('formTitle').textContent = 'Створити нову книгу';
    document.getElementById('bookForm').classList.add('active');
    document.getElementById('booksContainer').classList.remove('active');
    document.getElementById('createUpdateForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('isAvailable').checked = true;
    currentMode = 'create';
    selectedBooks.clear();
}

function hideForm() {
    document.getElementById('bookForm').classList.remove('active');
    selectedBooks.clear();
    currentMode = null;
}

async function loadBooks() {
    try {
        const response = await fetch('/api/book');
        const books = await response.json();

        // СКИДАЄМО РЕЖИМ ТА ВИБРАНІ КНИГИ
        currentMode = null;
        selectedBooks.clear();

        document.getElementById('bookForm').classList.remove('active');
        document.getElementById('booksContainer').classList.add('active');
        document.getElementById('actionButtons').style.display = 'none';

        const grid = document.getElementById('booksGrid');
        grid.innerHTML = '';

        if (books.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6b7280;">Книг поки немає. Створіть першу книгу!</p>';
            return;
        }

        books.forEach(book => {
            const card = createBookCard(book);
            grid.appendChild(card);
        });

        showMessage(`Завантажено ${books.length} книг`);
    } catch (error) {
        showMessage('Помилка завантаження книг: ' + error.message, 'error');
    }
}

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.bookId = book.id;

    // ПОКАЗУЄМО CHECKBOX ТІЛЬКИ У ВІДПОВІДНОМУ РЕЖИМІ
    const checkbox = currentMode === 'update' || currentMode === 'delete'
        ? `<input type="checkbox" class="select-checkbox" onchange="toggleBookSelection(${book.id}, this.checked)">`
        : '';

    card.innerHTML = `
                ${checkbox}
                ${book.image ? `<img src="${book.image}" alt="${book.title}" class="book-image">` : '<div class="book-image"></div>'}
                <div class="book-title">${book.title}</div>
                <div class="book-author">Автор: ${book.author}</div>
                <div class="book-year">Рік: ${book.year}</div>
                <div class="book-description">${book.description || 'Опис відсутній'}</div>
                <span class="book-status ${book.isAvailable ? 'status-available' : 'status-unavailable'}">
                    ${book.isAvailable ? 'Доступна' : 'Недоступна'}
                </span>
            `;

    return card;
}

function toggleBookSelection(bookId, isChecked) {
    const card = document.querySelector(`.book-card[data-book-id="${bookId}"]`);

    if (isChecked) {
        selectedBooks.add(bookId);
        card.classList.add('selected');
    } else {
        selectedBooks.delete(bookId);
        card.classList.remove('selected');
    }

    // ПОКАЗУЄМО КНОПКИ ТІЛЬКИ ВІДПОВІДНО ДО РЕЖИМУ
    updateActionButtons();
}

function updateActionButtons() {
    const actionButtons = document.getElementById('actionButtons');

    if (selectedBooks.size === 0) {
        actionButtons.style.display = 'none';
        return;
    }

    actionButtons.style.display = 'flex';

    // ПОКАЗУЄМО ТІЛЬКИ ПОТРІБНІ КНОПКИ
    if (currentMode === 'update') {
        actionButtons.innerHTML = '<button class="btn-update" onclick="updateSelectedBook()">Оновити вибрану</button>';
    } else if (currentMode === 'delete') {
        actionButtons.innerHTML = '<button class="btn-delete" onclick="deleteSelectedBooks()">Видалити вибрані</button>';
    }
}

function enableUpdateMode() {
    currentMode = 'update';
    selectedBooks.clear();
    loadBooksInMode();
    showMessage('Виберіть книгу для оновлення', 'success');
}

function enableDeleteMode() {
    currentMode = 'delete';
    selectedBooks.clear();
    loadBooksInMode();
    showMessage('Виберіть книги для видалення', 'success');
}

// НОВА ФУНКЦІЯ ДЛЯ ЗАВАНТАЖЕННЯ КНИГ У РЕЖИМІ UPDATE/DELETE
async function loadBooksInMode() {
    try {
        const response = await fetch('/api/book');
        const books = await response.json();

        document.getElementById('bookForm').classList.remove('active');
        document.getElementById('booksContainer').classList.add('active');
        document.getElementById('actionButtons').style.display = 'none';

        const grid = document.getElementById('booksGrid');
        grid.innerHTML = '';

        if (books.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6b7280;">Книг поки немає. Створіть першу книгу!</p>';
            return;
        }

        books.forEach(book => {
            const card = createBookCard(book);
            grid.appendChild(card);
        });
    } catch (error) {
        showMessage('Помилка завантаження книг: ' + error.message, 'error');
    }
}

async function updateSelectedBook() {
    if (selectedBooks.size !== 1) {
        showMessage('Виберіть рівно одну книгу для оновлення', 'error');
        return;
    }

    const bookId = Array.from(selectedBooks)[0];

    try {
        const response = await fetch(`/api/book/${bookId}`);
        const book = await response.json();

        document.getElementById('formTitle').textContent = 'Оновити книгу';
        document.getElementById('bookId').value = book.id;
        document.getElementById('image').value = book.image || '';
        document.getElementById('title').value = book.title;
        document.getElementById('author').value = book.author;
        document.getElementById('year').value = book.year;
        document.getElementById('description').value = book.description || '';
        document.getElementById('isAvailable').checked = book.isAvailable;

        document.getElementById('booksContainer').classList.remove('active');
        document.getElementById('bookForm').classList.add('active');
        currentMode = 'update';
    } catch (error) {
        showMessage('Помилка завантаження книги: ' + error.message, 'error');
    }
}

async function deleteSelectedBooks() {
    if (selectedBooks.size === 0) {
        showMessage('Виберіть книги для видалення', 'error');
        return;
    }

    if (!confirm(`Ви впевнені, що хочете видалити ${selectedBooks.size} книг(и)?`)) {
        return;
    }

    try {
        const response = await fetch('/api/book', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Array.from(selectedBooks))
        });

        if (response.ok) {
            showMessage(`Успішно видалено ${selectedBooks.size} книг(и)`);
            selectedBooks.clear();
            loadBooksInMode();
        } else {
            showMessage('Помилка видалення книг', 'error');
        }
    } catch (error) {
        showMessage('Помилка: ' + error.message, 'error');
    }
}

async function submitForm(event) {
    event.preventDefault();

    const bookId = document.getElementById('bookId').value;
    const book = {
        id: bookId ? parseInt(bookId) : 0,
        image: document.getElementById('image').value,
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        year: parseInt(document.getElementById('year').value),
        description: document.getElementById('description').value,
        isAvailable: document.getElementById('isAvailable').checked
    };

    try {
        let response;
        if (bookId) {
            // Update
            response = await fetch(`/api/book/${bookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(book)
            });
        } else {
            // Create
            response = await fetch('/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(book)
            });
        }

        if (response.ok) {
            showMessage(bookId ? 'Книга успішно оновлена!' : 'Книга успішно створена!');
            hideForm();
        } else {
            showMessage('Помилка збереження книги', 'error');
        }
    } catch (error) {
        showMessage('Помилка: ' + error.message, 'error');
    }
}