package main

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// IncomingMessage represents the structural payload from our React simulator
type IncomingMessage struct {
	Phone   string `json:"phone" binding:"required"`
	Message string `json:"message" binding:"required"`
	Sender  string `json:"sender" binding:"required"`
}

func main() {
	// Initialize Gin router
	r := gin.Default()

	// Simple health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// Simulated WhatsApp Webhook Ingestion Endpoint
	r.POST("/webhook", func(c *gin.Context) {
		var payload IncomingMessage

		// Bind and validate incoming JSON
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload structure"})
			return
		}

		// Log the ingestion metrics (Crucial talking point for scale in interviews)
		println("Successfully ingested message from: " + payload.Phone + " | Content: " + payload.Message)

		// TODO: In Phase 2, this payload goes straight into Redis Queue
		
		c.JSON(http.StatusAccepted, gin.H{
			"status":  "queued",
			"message": "Message received by Go engine safely",
		})
	})

	// Read port from environment variable or fallback to default 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}