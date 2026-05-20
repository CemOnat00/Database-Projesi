package database

import (
	"log"

	"github.com/bscc/go-backend/internal/config"
	"github.com/bscc/go-backend/internal/domain/entity"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Baglan(cfg *config.Config) *gorm.DB {
	logLevel := logger.Info
	if cfg.Server.GinMode == "release" {
		logLevel = logger.Silent
	}

	db, err := gorm.Open(postgres.Open(cfg.Database.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("❌ Veritabanı bağlantısı başarısız: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("❌ sql.DB alınamadı: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	log.Println("✅ Veritabanı bağlantısı başarılı")

	migrate(db)
	return db
}

func migrate(db *gorm.DB) {
	log.Println("🔄 Migration başlıyor...")
	err := db.AutoMigrate(
		&entity.User{},
		&entity.Sanatci{},
		&entity.Eser{},
		&entity.EserGorseli{},
		&entity.Etkinlik{},
		&entity.EtkinlikGorseli{},
		&entity.Rezervasyon{},
		&entity.Siparis{},
		&entity.SiparisDetay{},
		&entity.Favori{},
		&entity.Yorum{},
		&entity.YorumYaniti{},
		&entity.Kupon{},
		&entity.KarsilastirmaListesi{},
		&entity.KarsilastirmaOgesi{},
		&entity.DestekTalebi{},
		&entity.DestekMesaj{},
	)
	if err != nil {
		log.Fatalf("❌ Migration başarısız: %v", err)
	}
	log.Println("✅ Migration tamamlandı")
}
