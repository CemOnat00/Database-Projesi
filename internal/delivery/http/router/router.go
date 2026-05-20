package router

import (
	"net/http"

	"github.com/bscc/go-backend/internal/delivery/http/handler"
	"github.com/bscc/go-backend/internal/delivery/http/middleware"
	"github.com/bscc/go-backend/internal/pkg/jwt"
	"github.com/gin-gonic/gin"
)

func Kur(
	jwtManager *jwt.Manager,
	authH *handler.AuthHandler,
	kullaniciH *handler.KullaniciHandler,
	eserH *handler.EserHandler,
	sanatciH *handler.SanatciHandler,
	etkinlikH *handler.EtkinlikHandler,
	rezervasyonH *handler.RezervasyonHandler,
	siparisH *handler.SiparisHandler,
	favoriH *handler.FavoriHandler,
	yorumH *handler.YorumHandler,
	destekH *handler.DestekHandler,
	destekMesajH *handler.DestekMesajHandler,
	karsilastirmaH *handler.KarsilastirmaHandler,
	istatistikH *handler.IstatistikHandler,
	kampanyaH *handler.KampanyaHandler,
	adminH *handler.AdminHandler,
) *gin.Engine {

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	// Sağlık kontrolü
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"durum": "çalışıyor"})
	})

	// Yüklenen görseller — statik sunum (admin'in yüklediği eser/etkinlik görselleri)
	r.Static("/uploads", "./uploads")

	api := r.Group("/api/v1")

	// ── Herkese açık ─────────────────────────────────────────────────────────
	auth := api.Group("/auth")
	{
		auth.POST("/kayit", authH.Kayit)
		auth.POST("/giris", authH.Giris)
	}

	eserler := api.Group("/eserler")
	{
		eserler.GET("", eserH.Listele)
		eserler.GET("/:id", eserH.DetayGetir)
	}

	sanatcilar := api.Group("/sanatcilar")
	{
		sanatcilar.GET("", sanatciH.Listele)
		sanatcilar.GET("/:id", sanatciH.DetayGetir)
	}

	etkinlikler := api.Group("/etkinlikler")
	{
		etkinlikler.GET("", etkinlikH.Listele)
		etkinlikler.GET("/:id", etkinlikH.DetayGetir)
	}

	yorumlar := api.Group("/yorumlar")
	{
		yorumlar.GET("/:id", yorumH.Listele)
	}

	// Kampanya — herkese açık
	kampanya := api.Group("/kampanya")
	{
		kampanya.GET("/eserler", kampanyaH.KampanyaliEserler)
	}

	// ── Giriş gerektiren ─────────────────────────────────────────────────────
	k := api.Group("")
	k.Use(middleware.GirisGerekli(jwtManager))
	{
		// Profil
		k.GET("/profil", kullaniciH.ProfilGetir)
		k.PUT("/profil", kullaniciH.ProfilGuncelle)
		k.PUT("/profil/sifre", kullaniciH.SifreDegistir)

		// Rezervasyonlar
		k.POST("/rezervasyonlar", rezervasyonH.Olustur)
		k.GET("/rezervasyonlar", rezervasyonH.Listele)
		k.PUT("/rezervasyonlar/:id", rezervasyonH.Guncelle)
		k.DELETE("/rezervasyonlar/:id", rezervasyonH.Iptal)

		// Siparişler
		k.POST("/siparisler", siparisH.Olustur)
		k.GET("/siparisler", siparisH.Listele)
		k.GET("/siparisler/:id", siparisH.DetayGetir)

		// Favoriler
		k.POST("/favoriler", favoriH.Ekle)
		k.GET("/favoriler", favoriH.Listele)
		k.DELETE("/favoriler/:id", favoriH.Kaldir)

		// Yorumlar
		k.POST("/yorumlar", yorumH.Ekle)
		k.POST("/yorumlar/:id/faydali", yorumH.FaydaliBul)
		k.POST("/yorumlar/:id/puan", yorumH.PuanVer)
		k.POST("/yorumlar/:id/yanit", yorumH.YanitEkle)

		// Destek
		k.POST("/destek", destekH.Olustur)
		k.GET("/destek", destekH.Listele)
		k.POST("/destek/:id/mesaj", destekMesajH.MesajGonder)
		k.GET("/destek/:id/mesaj", destekMesajH.MesajlariGetir)

		k.GET("/firsatlar", kampanyaH.OzelFirsatlar)

		// Karşılaştırma
		k.POST("/karsilastir/eserler", karsilastirmaH.EserleriKarsilastir)
		k.POST("/karsilastir/etkinlikler", karsilastirmaH.EtkinlikleriKarsilastir)
		// İstatistik
		k.GET("/istatistik/eser/:id", istatistikH.EserIstatistigi)
		k.GET("/istatistik/etkinlik/:id", istatistikH.EtkinlikIstatistigi)

		admin := api.Group("/admin")
		admin.Use(middleware.GirisGerekli(jwtManager))
		admin.Use(middleware.RolGerekli("admin"))
		{
			// Rapor
			admin.GET("/rapor", istatistikH.AdminRapor)

			// Yorum yanıtlama
			admin.POST("/yorumlar/:id/yanit", yorumH.YanitEkle)

			// Eser CRUD
			admin.POST("/eserler", eserH.Olustur)
			admin.PUT("/eserler/:id", eserH.Guncelle)
			admin.DELETE("/eserler/:id", eserH.Sil)
			// Eser çoklu görsel
			admin.POST("/eserler/:id/gorseller", eserH.GorselYukle)
			admin.DELETE("/eserler/:id/gorseller/:gid", eserH.GorselSil)

			// Etkinlik CRUD
			admin.POST("/etkinlikler", etkinlikH.Olustur)
			admin.PUT("/etkinlikler/:id", etkinlikH.Guncelle)
			admin.DELETE("/etkinlikler/:id", etkinlikH.Sil)
			// Etkinlik çoklu görsel
			admin.POST("/etkinlikler/:id/gorseller", etkinlikH.GorselYukle)
			admin.DELETE("/etkinlikler/:id/gorseller/:gid", etkinlikH.GorselSil)

			// Sanatçı CRUD
			admin.POST("/sanatcilar", sanatciH.Olustur)
			admin.PUT("/sanatcilar/:id", sanatciH.Guncelle)
			admin.DELETE("/sanatcilar/:id", sanatciH.Sil)

			// Admin listeleme
			admin.GET("/siparisler", adminH.TumSiparisleri)
			admin.GET("/rezervasyonlar", adminH.TumRezervasyonlari)
			admin.GET("/destek", adminH.TumDestekTaleplerini)
			admin.GET("/kullanicilar", adminH.TumKullanicilari)
		}
	}

	return r
}
