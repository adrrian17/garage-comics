# PDF Watermark API

A simple Go API service that adds text watermarks to PDF files and returns them as a compressed ZIP archive.

## Features

- Add text watermarks to one or multiple PDF files
- Process multiple files simultaneously
- Return watermarked files in a ZIP archive
- Support for large file uploads (up to 500 MB)
- CORS enabled for web applications

## Getting Started

### Prerequisites

- Go 1.19 or higher
- `pdfcpu` package for PDF processing

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   go mod tidy
   ```
3. Run the server:
   ```bash
   go run main.go
   ```

The server will start on `http://localhost:1234`

## API Endpoints

### POST /api/watermark

Adds text watermarks to PDF files.

#### Parameters

- `email` (string, required): Email address to use as watermark text
- `reference` (string, required): Reference ID for the processing request
- `pdfs` (file[], required): One or more PDF files to watermark

#### Response

Returns a ZIP file containing all processed PDFs with watermarks applied.

#### Watermark Configuration

- Font: Helvetica
- Size: 12 points
- Position: Bottom center
- Offset: 0x, 10y
- Color: Gray (#808080)
- Opacity: 0.5
- Rotation: 0 degrees

#### Example Request

```bash
curl -X POST http://localhost:1234/api/watermark \
  -F "email=user@example.com" \
  -F "reference=order_12345" \
  -F "pdfs=@document1.pdf" \
  -F "pdfs=@document2.pdf" \
  -o "watermarked_files.zip"
```

#### Error Responses

- `400 Bad Request`: Missing required parameters or invalid file format
- `500 Internal Server Error`: Server processing error

## File Limits

- Maximum upload size: 500 MB total
- Supported formats: PDF only
- Multiple files supported in single request

## Development

### Project Structure

```
.
├── main.go          # Main server implementation
├── tmp/             # Temporary files directory (auto-created)
└── README.md        # This file
```

### Key Components

- **Multipart Form Parsing**: Handles file uploads and form parameters
- **PDF Processing**: Uses pdfcpu library for watermark application
- **ZIP Archive Creation**: Packages multiple processed files
- **Temporary File Management**: Automatic cleanup of processing files
- **CORS Support**: Cross-origin request handling