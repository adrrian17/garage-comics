package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Message struct {
	Text string `json:"text"`
}

func main() {
	http.HandleFunc("/api/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		message := Message{Text: "Hello world! 👋"}

		if err := json.NewEncoder(w).Encode(message); err != nil {
			log.Printf("Error encoding JSON: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
	})

	log.Println("🚀 Server running on http://localhost:1234")
	if err := http.ListenAndServe(":1234", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
