package apperror

import (
	"fmt"
	"net/http"
)

// AppError — uygulama hatası
// Her hata bir HTTP kodu ve kullanıcıya gösterilecek mesaj taşır
type AppError struct {
	Code    int    // HTTP kodu: 400, 401, 404, 500 gibi
	Message string // kullanıcıya gösterilecek mesaj
	Err     error  // teknik hata detayı (log için, kullanıcı görmez)
}

// Error — hata mesajını döndürür
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

// ── Hazır hata tipleri ────────────────────────────────────────────

// BadRequest — 400, kullanıcı yanlış bir şey gönderdi
func BadRequest(msg string) *AppError {
	return &AppError{Code: http.StatusBadRequest, Message: msg}
}

// Unauthorized — 401, giriş yapılmamış
func Unauthorized(msg string) *AppError {
	return &AppError{Code: http.StatusUnauthorized, Message: msg}
}

// Forbidden — 403, yetkisi yok
func Forbidden(msg string) *AppError {
	return &AppError{Code: http.StatusForbidden, Message: msg}
}

// NotFound — 404, bulunamadı
func NotFound(msg string) *AppError {
	return &AppError{Code: http.StatusNotFound, Message: msg}
}

// Conflict — 409, çakışma (örnek: email zaten kayıtlı)
func Conflict(msg string) *AppError {
	return &AppError{Code: http.StatusConflict, Message: msg}
}

// Internal — 500, sunucu hatası
func Internal(msg string, err error) *AppError {
	return &AppError{Code: http.StatusInternalServerError, Message: msg, Err: err}
}
