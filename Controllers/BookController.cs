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
            [FromQuery] string? genre = null,
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

            if (!string.IsNullOrEmpty(genre))
            {
                query = query.Where(b => b.Genre == genre);
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

            var genres = await _context.Books
                .Where(b => b.Genre != null)
                .Select(b => b.Genre)
                .Distinct()
                .OrderBy(g => g)
                .ToListAsync();

            return new
            {
                authors,
                years,
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