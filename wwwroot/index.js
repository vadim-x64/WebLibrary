let currentView = localStorage.getItem('bookView') || 'grid';

function setView(view) {
    currentView = view;
    localStorage.setItem('bookView', view);

    const grid = document.getElementById('booksGrid');
    const buttons = document.querySelectorAll('.view-btn');

    buttons.forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (view === 'list') {
        grid.classList.add('list-view');
    } else {
        grid.classList.remove('list-view');
    }
}

let currentMode = null;
let selectedBooks = new Set();
let currentPage = 1;
const booksPerPage = 6;
let allBooks = [];

let currentFilters = {
    author: '',
    year: '',
    genre: '',
    language: '',
    pagesFrom: '',
    pagesTo: '',
    isAvailable: ''
};

function showMessage(text, type = 'success') {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;

    setTimeout(() => {
        message.classList.add('show');
    }, 10);

    setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => {
            message.className = 'message';
        }, 500);
    }, 5000);
}

function showCreateForm() {
    document.getElementById('bookForm').classList.add('active');
    document.getElementById('booksContainer').classList.remove('active');
    document.getElementById('sortingForm').classList.remove('active');
    document.getElementById('createUpdateForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('isAvailable').checked = true;
    document.getElementById('formTitle').textContent = 'Create new book';
    currentMode = 'create';
    selectedBooks.clear();
}

function hideForm() {
    document.getElementById('bookForm').classList.remove('active');
    selectedBooks.clear();
    currentMode = null;
}

function hideSortingForm() {
    document.getElementById('sortingForm').classList.remove('active');
    currentMode = null;
}

async function loadBooks() {
    try {
        const response = await fetch('/api/book');
        allBooks = await response.json();
        currentMode = null;
        selectedBooks.clear();
        currentPage = 1;

        currentFilters = {
            author: '',
            year: '',
            genre: '',
            isAvailable: ''
        };

        document.getElementById('bookForm').classList.remove('active');
        document.getElementById('sortingForm').classList.remove('active');
        document.getElementById('booksContainer').classList.add('active');
        document.getElementById('actionButtons').style.display = 'none';

        displayBooks();
        showMessage(`Uploaded ${allBooks.length} book(s)`);
    } catch (error) {
        showMessage('Error uploading books: ' + error.message, 'error');
    }
}

function displayBooks() {
    const grid = document.getElementById('booksGrid');
    const pagination = document.getElementById('pagination');
    const selectAllContainer = document.getElementById('selectAllContainer');
    grid.innerHTML = '';

    if (currentMode !== 'delete') {
        selectAllContainer.classList.remove('active');
    } else {
        selectAllContainer.classList.add('active');
    }

    if (allBooks.length === 0) {
        grid.innerHTML = '<p class="empty-message">Seems like there are no books yet. Create one!</p>';
        pagination.style.display = 'none';
        selectAllContainer.classList.remove('active');
        return;
    }

    const totalPages = Math.ceil(allBooks.length / booksPerPage);
    const startIndex = (currentPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const booksToShow = allBooks.slice(startIndex, endIndex);

    booksToShow.forEach(book => {
        const card = createBookCard(book);
        grid.appendChild(card);
    });

    setView(currentView);
    updateSelectAllCheckbox();

    if (totalPages > 1) {
        pagination.style.display = 'flex';
        renderPagination(totalPages);
    } else {
        pagination.style.display = 'none';
    }
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '<';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.onclick = () => changePage(i);
        pagination.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changePage(currentPage + 1);
    pagination.appendChild(nextBtn);
}

function changePage(page) {
    currentPage = page;
    displayBooks();
}

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.bookId = book.id;
    const isChecked = selectedBooks.has(book.id);

    const checkbox = currentMode === 'update' || currentMode === 'delete'
        ? `<input type="checkbox" class="select-checkbox" ${isChecked ? 'checked' : ''} onchange="toggleBookSelection(${book.id}, this.checked)">`
        : '';

    const description = book.description || 'There is no description.';
    const maxLength = currentView === 'list' ? 300 : 100;
    let descriptionHTML;

    if (description.length > maxLength) {
        const shortDescription = description.substring(0, maxLength);

        descriptionHTML = `
            <div class="book-description">
                <span class="description-short">${shortDescription}... </span>
                <span class="description-full" style="display: none;">${description} </span>
                <span class="toggle-text" onclick="toggleDescription(${book.id}, event)">more</span>
            </div>
        `;
    } else {
        descriptionHTML = `<div class="book-description">${description}</div>`;
    }

    const genreNames = {
        'Action': 'Action',
        'Adventure': 'Adventure',
        'Classic': 'Classic',
        'Contemporary': 'Contemporary',
        'Dystopian': 'Dystopian',
        'Fantasy': 'Fantasy',
        'Historical': 'Historical',
        'Horror': 'Horror',
        'Mystery': 'Mystery',
        'Thriller': 'Thriller',
        'Art': 'Art',
        'Biography': 'Biography',
        'History': 'History',
        'Philosophy': 'Philosophy',
        'Psychology': 'Psychology',
        'Science': 'Science',
        'Travel': 'Travel',
        'Poetry': 'Poetry',
        'Novel': 'Novel',
        'Narration': 'Narration',
        'Prose': 'Prose',
        'Fiction': 'Fiction'
    };

    const genreHTML = `<span class="book-genre-badge">${genreNames[book.genre] || book.genre}</span>`;

    const imageContainer = book.image
        ? `<div class="book-image-container"><img src="${book.image}" alt="${book.title}" class="book-image"></div>`
        : '<div class="book-image-container"><div class="book-image"></div></div>';

    card.innerHTML = `
        ${checkbox}
        ${imageContainer}
        <div class="book-info-block">
            <div class="book-title">${book.title}</div>
            <hr>
            <div class="book-author">Author: ${book.author}</div>
            <div class="book-year">Year: ${book.year}</div>
            <div class="book-info">Language: ${book.language || 'N/A'}</div>
            <div class="book-info">Pages: ${book.pages || 'N/A'}</div>
        </div>
        <div class="book-description-block">
            ${descriptionHTML}
        </div>
        <span class="book-status ${book.isAvailable ? 'status-available' : 'status-unavailable'}">
            ${book.isAvailable ? 'Available' : 'Unavailable'}
        </span>
        ${genreHTML}
    `;

    return card;
}

function toggleDescription(bookId, event) {
    event.stopPropagation();

    const card = document.querySelector(`.book-card[data-book-id="${bookId}"]`);
    const shortDesc = card.querySelector('.description-short');
    const fullDesc = card.querySelector('.description-full');
    const toggleText = card.querySelector('.toggle-text');

    if (fullDesc.style.display === 'none') {
        shortDesc.style.display = 'none';
        fullDesc.style.display = 'inline';
        toggleText.textContent = 'less';
    } else {
        shortDesc.style.display = 'inline';
        fullDesc.style.display = 'none';
        toggleText.textContent = 'more';
    }
}

function toggleSelectAll(isChecked) {
    if (isChecked) {
        allBooks.forEach(book => {
            selectedBooks.add(book.id);
        });
    } else {
        selectedBooks.clear();
    }

    const checkboxes = document.querySelectorAll('.select-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });

    updateActionButtons();
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');

    if (allBooks.length === 0) {
        selectAllCheckbox.checked = false;
        return;
    }

    const allSelected = allBooks.every(book => selectedBooks.has(book.id));
    selectAllCheckbox.checked = allSelected;
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

    updateActionButtons();
    updateSelectAllCheckbox();
}

function updateActionButtons() {
    const actionButtons = document.getElementById('actionButtons');

    if (selectedBooks.size === 0) {
        actionButtons.style.display = 'none';
        return;
    }

    actionButtons.style.display = 'flex';

    if (currentMode === 'update') {
        actionButtons.innerHTML = '<button class="btn-update" onclick="updateSelectedBook()">Update selected</button>';
    } else if (currentMode === 'delete') {
        actionButtons.innerHTML = '<button class="btn-delete" onclick="deleteSelectedBooks()">Delete selected</button>';
    }
}

function enableUpdateMode() {
    currentMode = 'update';
    selectedBooks.clear();
    loadBooksInMode();
    showMessage('Select a book to update', 'success');
}

function enableDeleteMode() {
    currentMode = 'delete';
    selectedBooks.clear();
    loadBooksInMode();
    document.getElementById('selectAllContainer').classList.add('active');
    showMessage('Select one or more books to delete', 'success');
}

async function enableSortingMode() {
    try {
        const response = await fetch('/api/book');
        allBooks = await response.json();

        if (allBooks.length === 0) {
            showMessage('Nothing to sort', 'success');
            return;
        }

        currentMode = 'sorting';
        selectedBooks.clear();
        document.getElementById('bookForm').classList.remove('active');
        document.getElementById('booksContainer').classList.remove('active');
        document.getElementById('sortingForm').classList.add('active');

        await loadFilterOptions();
        showMessage('Select filters to sort books', 'success');
    } catch (error) {
        showMessage('Error loading books: ' + error.message, 'error');
    }
}

async function loadFilterOptions() {
    try {
        const response = await fetch('/api/book/filters');
        const filters = await response.json();
        const authorSelect = document.getElementById('filterAuthor');
        authorSelect.innerHTML = '<option value="">All authors</option>';

        filters.authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            authorSelect.appendChild(option);
        });

        const yearSelect = document.getElementById('filterYear');
        yearSelect.innerHTML = '<option value="">All years</option>';

        filters.years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        const genreSelect = document.getElementById('filterGenre');
        genreSelect.innerHTML = '<option value="">All genres</option>';

        filters.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.value;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });

        const languageSelect = document.getElementById('filterLanguage');
        languageSelect.innerHTML = '<option value="">All languages</option>';

        filters.languages.forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            languageSelect.appendChild(option);
        });

        const pagesSelect = document.getElementById('filterPages');
        pagesSelect.innerHTML = '<option value="">All pages</option>';

        filters.pages.forEach(page => {
            const option = document.createElement('option');
            option.value = page;
            option.textContent = page;
            pagesSelect.appendChild(option);
        });
    } catch (error) {
        showMessage('Error loading filters: ' + error.message, 'error');
    }
}
async function applyFilters() {
    currentFilters.author = document.getElementById('filterAuthor').value;
    currentFilters.year = document.getElementById('filterYear').value;
    currentFilters.genre = document.getElementById('filterGenre').value;
    currentFilters.language = document.getElementById('filterLanguage').value;
    currentFilters.pagesFrom = document.getElementById('filterPagesFrom').value;
    currentFilters.pagesTo = document.getElementById('filterPagesTo').value;
    const availabilityRadio = document.querySelector('input[name="availability"]:checked');
    currentFilters.isAvailable = availabilityRadio.value;

    try {
        let url = '/api/book?';
        const params = [];

        if (currentFilters.author) params.push(`author=${encodeURIComponent(currentFilters.author)}`);
        if (currentFilters.year) params.push(`year=${currentFilters.year}`);
        if (currentFilters.genre) params.push(`genre=${encodeURIComponent(currentFilters.genre)}`);
        if (currentFilters.language) params.push(`language=${encodeURIComponent(currentFilters.language)}`);
        if (currentFilters.pagesFrom) params.push(`pagesFrom=${currentFilters.pagesFrom}`);
        if (currentFilters.pagesTo) params.push(`pagesTo=${currentFilters.pagesTo}`);
        if (currentFilters.isAvailable) params.push(`isAvailable=${currentFilters.isAvailable}`);

        url += params.join('&');

        const response = await fetch(url);
        allBooks = await response.json();
        currentPage = 1;

        document.getElementById('sortingForm').classList.remove('active');
        document.getElementById('booksContainer').classList.add('active');
        document.getElementById('actionButtons').style.display = 'none';

        displayBooks();
        showMessage(`Found ${allBooks.length} book(s)`);
    } catch (error) {
        showMessage('Error applying filters: ' + error.message, 'error');
    }
}

function resetFilters() {
    document.getElementById('filterAuthor').value = '';
    document.getElementById('filterYear').value = '';
    document.getElementById('filterGenre').value = '';
    document.getElementById('filterLanguage').value = '';
    document.getElementById('filterPagesFrom').value = '';
    document.getElementById('filterPagesTo').value = '';
    document.querySelector('input[name="availability"][value=""]').checked = true;

    currentFilters = {
        author: '',
        year: '',
        genre: '',
        language: '',
        pagesFrom: '',
        pagesTo: '',
        isAvailable: ''
    };
}

async function loadBooksInMode() {
    try {
        const response = await fetch('/api/book');
        allBooks = await response.json();

        document.getElementById('bookForm').classList.remove('active');
        document.getElementById('sortingForm').classList.remove('active');
        document.getElementById('booksContainer').classList.add('active');
        document.getElementById('actionButtons').style.display = 'none';

        displayBooks();
    } catch (error) {
        showMessage('Error uploading books: ' + error.message, 'error');
    }
}
async function updateSelectedBook() {
    if (selectedBooks.size !== 1) {
        showMessage('Select only one book to update', 'error');
        return;
    }

    const bookId = Array.from(selectedBooks)[0];

    try {
        const response = await fetch(`/api/book/${bookId}`);
        const book = await response.json();

        document.getElementById('formTitle').textContent = 'Update book';
        document.getElementById('bookId').value = book.id;
        document.getElementById('image').value = book.image || '';
        document.getElementById('title').value = book.title;
        document.getElementById('author').value = book.author;
        document.getElementById('year').value = book.year;
        document.getElementById('genre').value = book.genre;
        document.getElementById('language').value = book.language || '';
        document.getElementById('pages').value = book.pages || '';
        document.getElementById('description').value = book.description || '';
        document.getElementById('isAvailable').checked = book.isAvailable;
        document.getElementById('booksContainer').classList.remove('active');
        document.getElementById('bookForm').classList.add('active');
        currentMode = 'update';
    } catch (error) {
        showMessage('Error uploading books: ' + error.message, 'error');
    }
}
async function deleteSelectedBooks() {
    if (selectedBooks.size === 0) {
        showMessage('Select at least one book to delete', 'error');
        return;
    }

    if (!confirm(`Are you really sure to delete ${selectedBooks.size} item(s)?`)) {
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
            showMessage(`Successfully deleted ${selectedBooks.size} item(s)`);
            selectedBooks.clear();
            loadBooksInMode();
        } else {
            showMessage('Error deleting books', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}
async function submitForm(event) {
    event.preventDefault();

    const bookId = document.getElementById('bookId').value;
    const genreValue = document.getElementById('genre').value;

    const book = {
        id: bookId ? parseInt(bookId) : 0,
        image: document.getElementById('image').value,
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        year: parseInt(document.getElementById('year').value),
        genre: genreValue,
        language: document.getElementById('language').value,
        pages: parseInt(document.getElementById('pages').value),
        description: document.getElementById('description').value,
        isAvailable: document.getElementById('isAvailable').checked
    };

    try {
        let response;

        if (bookId) {
            response = await fetch(`/api/book/${bookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(book)
            });
        } else {
            response = await fetch('/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(book)
            });
        }

        if (response.ok) {
            showMessage(bookId ? 'The book has been updated successfully' : 'The book has been created successfully');
            hideForm();
        } else {
            showMessage('Error saving book', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}