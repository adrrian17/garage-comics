package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/pdfcpu/pdfcpu/pkg/api"
)

type Message struct {
	Text string `json:"text"`
}

type WatermarkRequest struct {
	Text      string  `json:"text,omitempty"`
	ImagePath string  `json:"imagePath,omitempty"`
	OnTop     bool    `json:"onTop"`
	Opacity   float64 `json:"opacity"`
	FontSize  int     `json:"fontSize"`
	Position  string  `json:"position"`
	Rotation  float64 `json:"rotation"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func watermarkPDFHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(500 << 20) // 500 MB max for multiple files

	if err != nil {
		log.Printf("Error parsing multipart form: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid form data"})
		return
	}

	files := r.MultipartForm.File["pdfs"]

	if len(files) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "At least one PDF file is required"})
		return
	}

	watermarkText := r.FormValue("email")
	reference := r.FormValue("reference")

	if watermarkText == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Email parameter is required"})
		return
	}

	if reference == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Reference parameter is required"})
		return
	}

	tmpDir := "tmp"

	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		log.Printf("Error creating tmp directory: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Internal server error"})
		return
	}

	timestamp := time.Now().Unix()
	zipPath := filepath.Join(tmpDir, fmt.Sprintf("%s_%d.zip", reference, timestamp))

	zipFile, err := os.Create(zipPath)

	if err != nil {
		log.Printf("Error creating zip file: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Internal server error"})
		return
	}

	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	watermarkDesc := "font:Helvetica, points:12, pos:bc, off:0 10, fillc:#808080, op:0.5, rot:0"

	var filesToCleanup []string

	for i, fileHeader := range files {
		if !strings.HasSuffix(strings.ToLower(fileHeader.Filename), ".pdf") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ErrorResponse{Error: fmt.Sprintf("File '%s' must be a PDF", fileHeader.Filename)})
			return
		}

		file, err := fileHeader.Open()

		if err != nil {
			log.Printf("Error opening file %s: %v", fileHeader.Filename, err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: fmt.Sprintf("Error processing file '%s'", fileHeader.Filename)})
			return
		}

		defer file.Close()

		inputPath := filepath.Join(tmpDir, fmt.Sprintf("input_%d_%d.pdf", timestamp, i))
		outputPath := filepath.Join(tmpDir, fmt.Sprintf("output_%d_%d.pdf", timestamp, i))

		filesToCleanup = append(filesToCleanup, inputPath, outputPath)

		inputFile, err := os.Create(inputPath)

		if err != nil {
			log.Printf("Error creating input file: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Internal server error"})
			return
		}

		_, err = io.Copy(inputFile, file)

		inputFile.Close()

		if err != nil {
			log.Printf("Error copying file: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Error processing file"})
			return
		}

		err = api.AddTextWatermarksFile(inputPath, outputPath, []string{}, true, watermarkText, watermarkDesc, nil)

		if err != nil {
			log.Printf("Error adding watermark to %s: %v", fileHeader.Filename, err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: fmt.Sprintf("Error adding watermark to '%s'", fileHeader.Filename)})
			return
		}

		outputFile, err := os.Open(outputPath)

		if err != nil {
			log.Printf("Error opening output file: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Error reading processed file"})
			return
		}

		zipEntry, err := zipWriter.Create(fileHeader.Filename)

		if err != nil {
			outputFile.Close()
			log.Printf("Error creating zip entry: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Error creating zip file"})
			return
		}

		_, err = io.Copy(zipEntry, outputFile)

		outputFile.Close()

		if err != nil {
			log.Printf("Error writing to zip: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Error creating zip file"})
			return
		}
	}

	zipWriter.Close()
	zipFile.Close()

	defer func() {
		for _, filePath := range filesToCleanup {
			os.Remove(filePath)
		}
		os.Remove(zipPath)
	}()

	finalZipFile, err := os.Open(zipPath)
	if err != nil {
		log.Printf("Error opening final zip file: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Error reading zip file"})
		return
	}
	defer finalZipFile.Close()

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.zip\"", reference))

	_, err = io.Copy(w, finalZipFile)
	if err != nil {
		log.Printf("Error sending zip file: %v", err)
	}
}

func main() {
	http.HandleFunc("/api/watermark", watermarkPDFHandler)

	log.Println("🚀 Server running on http://localhost:1234")
	log.Println("📄 Watermark endpoint available at: POST /api/watermark")
	if err := http.ListenAndServe(":1234", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
