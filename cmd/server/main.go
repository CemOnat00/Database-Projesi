package main

import (
	"log"

	"github.com/bscc/go-backend/internal/config"
	"github.com/bscc/go-backend/internal/delivery/http/handler"
	"github.com/bscc/go-backend/internal/delivery/http/router"
	"github.com/bscc/go-backend/internal/infrastructure/database"
	infrarepo "github.com/bscc/go-backend/internal/infrastructure/repository"
	infrasvc "github.com/bscc/go-backend/internal/infrastructure/service"
	"github.com/bscc/go-backend/internal/pkg/jwt"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Ayarları yükle
	cfg := config.Load()
	gin.SetMode(cfg.Server.GinMode)
	log.Printf("🚀 Sunucu başlatılıyor — port: %s", cfg.Server.Port)

	// 2. Veritabanına bağlan
	db := database.Baglan(cfg)

	// 3. JWT manager
	jwtManager := jwt.NewManager(cfg.JWT.Secret, cfg.JWT.ExpiryHours)

	// 4. Repository'ler
	kullaniciRepo := infrarepo.NewKullaniciRepo(db)
	eserRepo := infrarepo.NewEserRepo(db)
	sanatciRepo := infrarepo.NewSanatciRepo(db)
	etkinlikRepo := infrarepo.NewEtkinlikRepo(db)
	rezervasyonRepo := infrarepo.NewRezervasyonRepo(db)
	siparisRepo := infrarepo.NewSiparisRepo(db)
	favoriRepo := infrarepo.NewFavoriRepo(db)
	yorumRepo := infrarepo.NewYorumRepo(db)
	kuponRepo := infrarepo.NewKuponRepo(db)
	destekRepo := infrarepo.NewDestekRepo(db)
	destekMesajRepo := infrarepo.NewDestekMesajRepo(db)
	karsilastirmaRepo := infrarepo.NewKarsilastirmaRepo(db)
	adminRepo := infrarepo.NewAdminRepo(db)

	// 5. Service'ler
	authSvc := infrasvc.NewAuthService(kullaniciRepo, jwtManager)
	kullaniciSvc := infrasvc.NewKullaniciService(kullaniciRepo)
	eserSvc := infrasvc.NewEserService(eserRepo)
	sanatciSvc := infrasvc.NewSanatciService(sanatciRepo)
	etkinlikSvc := infrasvc.NewEtkinlikService(etkinlikRepo)
	rezervasyonSvc := infrasvc.NewRezervasyonService(rezervasyonRepo, etkinlikRepo, siparisRepo)
	siparisSvc := infrasvc.NewSiparisService(siparisRepo, eserRepo, kuponRepo)
	favoriSvc := infrasvc.NewFavoriService(favoriRepo, eserRepo)
	yorumSvc := infrasvc.NewYorumService(yorumRepo, rezervasyonRepo, siparisRepo)
	destekSvc := infrasvc.NewDestekService(destekRepo)
	destekMesajSvc := infrasvc.NewDestekMesajService(destekMesajRepo, destekRepo)
	karsilastirmaSvc := infrasvc.NewKarsilastirmaService(eserRepo, etkinlikRepo, karsilastirmaRepo)
	istatistikSvc := infrasvc.NewIstatistikService(db)
	kampanyaSvc := infrasvc.NewKampanyaService(db, kuponRepo)
	adminSvc := infrasvc.NewAdminService(adminRepo)

	// 6. Handler'lar
	authH := handler.NewAuthHandler(authSvc)
	kullaniciH := handler.NewKullaniciHandler(kullaniciSvc)
	eserH := handler.NewEserHandler(eserSvc)
	sanatciH := handler.NewSanatciHandler(sanatciSvc)
	etkinlikH := handler.NewEtkinlikHandler(etkinlikSvc)
	rezervasyonH := handler.NewRezervasyonHandler(rezervasyonSvc)
	siparisH := handler.NewSiparisHandler(siparisSvc)
	favoriH := handler.NewFavoriHandler(favoriSvc)
	yorumH := handler.NewYorumHandler(yorumSvc)
	destekH := handler.NewDestekHandler(destekSvc)
	destekMesajH := handler.NewDestekMesajHandler(destekMesajSvc)
	karsilastirmaH := handler.NewKarsilastirmaHandler(karsilastirmaSvc)
	istatistikH := handler.NewIstatistikHandler(istatistikSvc)
	kampanyaH := handler.NewKampanyaHandler(kampanyaSvc)
	adminH := handler.NewAdminHandler(adminSvc)

	// 7. Router'ı kur ve başlat
	r := router.Kur(
		jwtManager,
		authH, kullaniciH, eserH, sanatciH, etkinlikH,
		rezervasyonH, siparisH, favoriH, yorumH, destekH,
		destekMesajH, karsilastirmaH, istatistikH, kampanyaH, adminH,
	)

	addr := ":" + cfg.Server.Port
	log.Printf("✅ Sunucu çalışıyor → http://localhost%s", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("❌ Sunucu başlatılamadı: %v", err)
	}
}
