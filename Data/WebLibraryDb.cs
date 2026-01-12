using Microsoft.EntityFrameworkCore;
using WebLibrary.Entities;

namespace WebLibrary.Data
{
    public class WebLibraryDb : DbContext
    {
        public WebLibraryDb(DbContextOptions<WebLibraryDb> options)
        : base(options)
        {
        }

        public DbSet<Book> Books { get; set; }
    }
}