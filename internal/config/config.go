package config

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config — uygulamanın ihtiyaç duyduğu tüm ayarlar
// .env dosyasından okunur
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
}

// ServerConfig — sunucu ayarları
type ServerConfig struct {
	Port    string // hangi portta çalışacak, örnek: "8080"
	GinMode string // "debug" geliştirme, "release" production
}

// DatabaseConfig — veritabanı bağlantı bilgileri
type DatabaseConfig struct {
	Host     string // veritabanı adresi
	Port     string // veritabanı portu
	User     string // kullanıcı adı
	Password string // şifre
	Name     string // veritabanı adı
	SSLMode  string
	Timezone string
}

// JWTConfig — token ayarları
type JWTConfig struct {
	Secret      string // token imzalama anahtarı
	ExpiryHours int    // token kaç saat geçerli
}

// DSN — GORM'un veritabanına bağlanmak için kullandığı bağlantı metni
func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
		d.Host, d.Port, d.User, d.Password, d.Name, d.SSLMode, d.Timezone,
	)
}

// Load — .env dosyasını okur ve Config struct'ını doldurur
// Program başlarken bir kez çağrılır
func Load() *Config {
	// .env dosyasını yükle
	// Production'da bu dosya olmaz, env variable'lar direkt set edilir
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  .env dosyası bulunamadı, sistem değişkenleri okunuyor")
	}

	cfg := &Config{
		Server: ServerConfig{
			Port:    getEnv("SERVER_PORT", "8080"),
			GinMode: getEnv("GIN_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: mustGetEnv("DB_PASSWORD"),
			Name:     mustGetEnv("DB_NAME"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
			Timezone: getEnv("DB_TIMEZONE", "Europe/Istanbul"),
		},
		JWT: JWTConfig{
			Secret:      mustGetEnv("JWT_SECRET"),
			ExpiryHours: getEnvInt("JWT_EXPIRY_HOURS", 24),
		},
	}

	return cfg
}

// getEnv — değişken varsa onu döndür, yoksa varsayılanı kullan
func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// mustGetEnv — zorunlu değişken, yoksa program durur
func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("❌ Zorunlu değişken eksik: %q", key)
	}
	return v
}

// getEnvInt — sayısal değişken okuma
func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		log.Fatalf("❌ %q sayı olmalı, şu an: %q", key, v)
	}
	return i
}
