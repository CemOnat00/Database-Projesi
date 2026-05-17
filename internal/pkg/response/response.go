package response

import (
	"net/http"

	"github.com/bscc/go-backend/internal/pkg/apperror"
	"github.com/gin-gonic/gin"
)

// envelope — tüm API cevaplarının standart formatı
// Frontend her zaman bu formatta cevap alır
//
// Başarılı: { "success": true,  "message": "...", "data": {...} }
// Hatalı:   { "success": false, "message": "...", "error": "..." }
type envelope struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// OK — 200, başarılı
func OK(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, envelope{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Created — 201, yeni kayıt oluşturuldu
func Created(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusCreated, envelope{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error — hata cevabı
// AppError ise kodunu kullan, değilse 500 döndür
func Error(c *gin.Context, err error) {
	var code int
	var msg string

	if appErr, ok := err.(*apperror.AppError); ok {
		code = appErr.Code
		msg = appErr.Message
	} else {
		code = http.StatusInternalServerError
		msg = "sunucu hatası"
	}

	c.JSON(code, envelope{
		Success: false,
		Message: "hata",
		Error:   msg,
	})
}

// ValidationError — 422, gelen veri hatalı
func ValidationError(c *gin.Context, msg string) {
	c.JSON(http.StatusUnprocessableEntity, envelope{
		Success: false,
		Message: "doğrulama hatası",
		Error:   msg,
	})
}
