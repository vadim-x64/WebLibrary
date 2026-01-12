using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebLibrary.Data;
using WebLibrary.Entities;

namespace WebLibrary.Controllers
{
    [ApiController]
    [Route("api/book")]
    public class BookController : ControllerBase
    {
        private readonly WebLibraryDb _context;

        public BookController(WebLibraryDb context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Book>>> GetBooks(
    [FromQuery] string? author = null,
    [FromQuery] int? year = null,
    [FromQuery] Genre? genre = null,
    [FromQuery] string? language = null,
    [FromQuery] int? pagesFrom = null,
    [FromQuery] int? pagesTo = null,
    [FromQuery] bool? isAvailable = null)
        {
            var query = _context.Books.AsQueryable();

            if (!string.IsNullOrEmpty(author))
            {
                query = query.Where(b => b.Author == author);
            }

            if (year.HasValue)
            {
                query = query.Where(b => b.Year == year.Value);
            }

            if (genre.HasValue)
            {
                query = query.Where(b => b.Genre == genre.Value);
            }

            if (!string.IsNullOrEmpty(language))
            {
                query = query.Where(b => b.Language == language);
            }

            if (pagesFrom.HasValue)
            {
                query = query.Where(b => b.Pages >= pagesFrom.Value);
            }

            if (pagesTo.HasValue)
            {
                query = query.Where(b => b.Pages <= pagesTo.Value);
            }

            if (isAvailable.HasValue)
            {
                query = query.Where(b => b.IsAvailable == isAvailable.Value);
            }

            return await query.ToListAsync();
        }

        [HttpGet("filters")]
        public async Task<ActionResult<object>> GetFilters()
        {
            var authors = await _context.Books
                .Select(b => b.Author)
                .Distinct()
                .OrderBy(a => a)
                .ToListAsync();

            var years = await _context.Books
                .Select(b => b.Year)
                .Distinct()
                .OrderByDescending(y => y)
                .ToListAsync();

            var languages = await _context.Books
                .Select(b => b.Language)
                .Distinct()
                .OrderBy(l => l)
                .ToListAsync();

            var genres = Enum.GetValues(typeof(Genre))
                .Cast<Genre>()
                .Select(g => new { value = (int)g, name = g.ToString() })
                .ToList();

            return new
            {
                authors,
                years,
                languages,
                genres
            };
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Book>> GetBook(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
            {
                return NotFound();
            }
            return book;
        }

        [HttpPost]
        public async Task<ActionResult<Book>> CreateBook(Book book)
        {
            try
            {
                _context.Books.Add(book);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetBook), new { id = book.Id }, book);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBook(int id, Book book)
        {
            if (id != book.Id)
            {
                return BadRequest();
            }

            _context.Entry(book).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteBooks([FromBody] List<int> ids)
        {
            var books = await _context.Books.Where(b => ids.Contains(b.Id)).ToListAsync();
            if (books.Count == 0)
            {
                return NotFound();
            }

            _context.Books.RemoveRange(books);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BookExists(int id)
        {
            return _context.Books.Any(e => e.Id == id);
        }
    }
}