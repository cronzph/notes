# 📝 CronzPh NotesHub

A beautiful, lightweight, and professional notes management application that allows you to create, manage, and share notes with ease - **no account login required!**

![License](https://ibb.co/xqxS3gky"><img src="https://i.ibb.co/XxcZV5Q9/Screenshot-2026-01-20-115231.jpg)

## ✨ Features

### Core Functionality
- 📌 **No Login Required** - Start taking notes immediately without creating an account
- 🎨 **Beautiful UI** - Modern, clean interface with smooth animations
- 🖼️ **Image Support** - Add multiple images to your notes with automatic compression
- 🔍 **Smart Search** - Search notes by title or content in real-time
- 📅 **Date Filters** - Filter notes by Today, This Week, This Month, or This Year
- 🔄 **Multiple Sort Options** - Sort by newest, oldest, or alphabetically
- 📱 **Fully Responsive** - Works perfectly on desktop, tablet, and mobile devices
- 🚀 **Fast & Lightweight** - Optimized performance with minimal dependencies

### Notes Management
- ✍️ Create notes with title, text content, and images
- 👁️ View notes in a beautiful modal interface
- ✏️ Edit existing notes
- 🗑️ Delete notes with confirmation
- 📋 Copy note content to clipboard
- 💾 Download images from notes
- 🖼️ Image compression for optimal storage

### Search & Organization
- 🔎 Real-time search across titles and content
- 📆 Filter by date ranges
- 🔤 Sort alphabetically or by date
- 📊 Results counter showing filtered notes

## 🚀 Quick Start

### Prerequisites
- A [Supabase](https://supabase.com/) account (free tier works great!)
- Basic knowledge of HTML/CSS/JavaScript
- A web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cronzph/notes.git
   cd notes
   ```

2. **Set up Supabase**
   
   a. Create a new project on [Supabase](https://supabase.com/)
   
   b. Create a `notes` table with the following schema:
   -- Step 1: Drop the existing table if you want to start fresh
-- (Skip this if you have important data you want to keep)
DROP TABLE IF EXISTS notes;

-- Step 2: Create the notes table with all required fields
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    text TEXT,
    images JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policy to allow all operations (for public access)
CREATE POLICY "Allow all operations" ON notes
FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Create storage bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-images', 'note-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Set up storage policies for the bucket
-- Allow public access to read images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'note-images' );

-- Allow anyone to upload images
CREATE POLICY "Allow Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'note-images' );

-- Allow anyone to delete images
CREATE POLICY "Allow Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'note-images' );

-- Step 7: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create trigger to auto-update updated_at
CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
   ```
   
   c. Create a storage bucket named `note-images`:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `note-images`
   - Make it public (or configure policies as needed)

3. **Configure the application**
   
   Open `script.js` and replace the Supabase configuration:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   
   You can find these values in your Supabase project settings under API.

4. **Run the application**
   
   Simply open `index.html` in your web browser, or use a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with http-server)
   npx http-server
   ```
   
   Then navigate to `http://localhost:8000`

## 📁 Project Structure

```
cronzph-noteshub/
│
├── index.html          # Main HTML file
├── styles.css          # All styling and responsive design
├── script.js           # Application logic and Supabase integration
└── README.md           # This file
```

## 🎯 Usage

### Creating a Note
1. Click the "New Note" button in the header
2. Enter a title (required)
3. Add text content (optional)
4. Upload images (optional, supports multiple files)
5. Click "Save Note"

### Searching & Filtering
1. Use the search bar to find notes by title or content
2. Select a date filter to view notes from specific time periods
3. Choose a sort option to organize your notes
4. Click the ✕ button to clear your search

### Viewing & Editing
1. Click on any note card to view it in full
2. Click "Edit" to modify the note
3. Click "Copy Text" to copy the content to clipboard
4. Click on images to view them full-size
5. Hover over images to download them

### Deleting Notes
1. Click the "Delete" button on any note card
2. Confirm the deletion
3. The note and its images will be permanently removed

## 🔒 Privacy & Security

- **No Account Required** - Your notes are stored in your Supabase instance
- **Public or Private** - Configure Supabase Row Level Security policies as needed
- **Image Compression** - Images are automatically compressed to save storage
- **Secure Storage** - All data is stored in Supabase's secure infrastructure

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Storage)
- **Libraries**: 
  - Supabase JS Client
  - Native File API for image handling
  - Canvas API for image compression

## 🎨 Customization

### Changing Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #4F46E5;
    --primary-dark: #4338CA;
    --primary-light: #EEF2FF;
    /* ... more variables ... */
}
```

### Modifying Image Compression
Adjust the compression settings in `script.js`:
```javascript
const maxSize = 1920; // Maximum image dimension
canvas.toBlob((blob) => {
    // ...
}, 'image/jpeg', 0.9); // Quality: 0.0 to 1.0
```

## 📱 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 CronzPh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Built with ❤️ by CronzPh
- Powered by [Supabase](https://supabase.com/)
- Icons inspiration from modern design systems

## 📧 Support

If you have any questions or run into issues:
- Open an issue on GitHub
- Check existing issues for solutions
- Fork and submit improvements

## 🚀 Future Enhancements

- [ ] Categories/Tags for notes
- [ ] Export notes to PDF/Markdown
- [ ] Dark mode toggle
- [ ] Rich text editor
- [ ] Voice notes support
- [ ] Collaborative editing
- [ ] Note templates
- [ ] Archive functionality

## ⭐ Show Your Support

If you find this project useful, please consider giving it a star on GitHub!

---

**Made with ❤️ for easy note-taking and sharing**
