package jwt

import (
	"errors"
	"time"

	gojwt "github.com/golang-jwt/jwt/v5"
)

// Claims — token'ın içinde saklanan bilgiler
// Kullanıcı her istek attığında bu bilgiler token'dan okunur
type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	gojwt.RegisteredClaims
}

// Manager — token üretme ve doğrulama işlemlerini yönetir
type Manager struct {
	secret []byte        // token imzalama anahtarı
	expiry time.Duration // token geçerlilik süresi
}

// NewManager — yeni bir Manager oluşturur
// main.go'da bir kez çağrılır
func NewManager(secret string, expiryHours int) *Manager {
	return &Manager{
		secret: []byte(secret),
		expiry: time.Duration(expiryHours) * time.Hour,
	}
}

// Generate — kullanıcı için JWT token üretir
// Giriş yapınca veya kayıt olunca çağrılır
func (m *Manager) Generate(userID uint, email, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: gojwt.RegisteredClaims{
			ExpiresAt: gojwt.NewNumericDate(time.Now().Add(m.expiry)),
			IssuedAt:  gojwt.NewNumericDate(time.Now()),
			Issuer:    "go-backend",
		},
	}

	token := gojwt.NewWithClaims(gojwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// Validate — gelen token'ı doğrular
// Her korumalı endpoint'e istek geldiğinde çağrılır
func (m *Manager) Validate(tokenStr string) (*Claims, error) {
	token, err := gojwt.ParseWithClaims(
		tokenStr,
		&Claims{},
		func(t *gojwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*gojwt.SigningMethodHMAC); !ok {
				return nil, errors.New("geçersiz imzalama metodu")
			}
			return m.secret, nil
		},
	)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("geçersiz token")
	}
	return claims, nil
}
