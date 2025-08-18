package main

import (
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

	err := r.ParseMultipartForm(10 << 20) // 10 MB max

	if err != nil {
		log.Printf("Error parsing multipart form: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid form data"})
		return
	}

	file, handler, err := r.FormFile("pdf")

	if err != nil {
		log.Printf("Error getting form file: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "PDF file is required"})
		return
	}

	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(handler.Filename), ".pdf") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "File must be a PDF"})
		return
	}

	watermarkText := r.FormValue("text")

	if watermarkText == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Text parameter is required"})
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
	inputPath := filepath.Join(tmpDir, fmt.Sprintf("input_%d.pdf", timestamp))
	outputPath := filepath.Join(tmpDir, fmt.Sprintf("output_%d.pdf", timestamp))

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
		os.Remove(inputPath)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Error processing file"})
		return
	}

	watermarkDesc := "font:Helvetica, points:12, pos:bc, off:0 10, fillc:#808080, op:0.5, rot:0"

	err = api.AddTextWatermarksFile(inputPath, outputPath, []string{}, true, watermarkText, watermarkDesc, nil)
	if err != nil {
		log.Printf("Error adding watermark: %v", err)
		os.Remove(inputPath)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Error adding watermark to PDF"})
		return
	}

	defer func() {
		os.Remove(inputPath)
		os.Remove(outputPath)
	}()

	outputFile, err := os.Open(outputPath)

	if err != nil {
		log.Printf("Error opening output file: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Error reading processed file"})
		return
	}

	defer outputFile.Close()

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"watermarked_%s\"", handler.Filename))

	_, err = io.Copy(w, outputFile)

	if err != nil {
		log.Printf("Error sending file: %v", err)
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
