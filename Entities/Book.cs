namespace WebLibrary.Entities
{
    public class Book
    {
        public int Id { get; set; }
        public string? Image { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public int Year { get; set; }
        public string? Genre { get; set; }
        public string? Description { get; set; }
        public bool IsAvailable { get; set; } = true;
    }
}