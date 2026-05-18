package handler

import (
	"strconv"

	"github.com/bscc/go-backend/internal/domain/dto"
	domainsvc "github.com/bscc/go-backend/internal/domain/service"
	"github.com/bscc/go-backend/internal/pkg/apperror"
	"github.com/bscc/go-backend/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

// ── Auth Handler ──────────────────────────────────────────────────────────────

type AuthHandler struct{ svc domainsvc.AuthService }

func NewAuthHandler(svc domainsvc.AuthService) *AuthHandler { return &AuthHandler{svc} }

func (h *AuthHandler) Kayit(c *gin.Context) {
	var req dto.KayitIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	result, err := h.svc.Kayit(&req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, "kayıt başarılı", result)
}

func (h *AuthHandler) Giris(c *gin.Context) {
	var req dto.GirisIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	result, err := h.svc.Giris(&req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "giriş başarılı", result)
}

// ── Kullanıcı Handler ─────────────────────────────────────────────────────────

type KullaniciHandler struct{ svc domainsvc.KullaniciService }

func NewKullaniciHandler(svc domainsvc.KullaniciService) *KullaniciHandler {
	return &KullaniciHandler{svc}
}

func (h *KullaniciHandler) ProfilGetir(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	profil, err := h.svc.ProfilGetir(id.(uint))
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "profil getirildi", profil)
}

func (h *KullaniciHandler) ProfilGuncelle(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	var req dto.ProfilGuncelleIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	profil, err := h.svc.ProfilGuncelle(id.(uint), &req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "profil güncellendi", profil)
}

func (h *KullaniciHandler) SifreDegistir(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	var req dto.SifreDegistirIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	if err := h.svc.SifreDegistir(id.(uint), &req); err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "şifre değiştirildi", nil)
}

// ── Eser Handler ──────────────────────────────────────────────────────────────

type EserHandler struct{ svc domainsvc.EserService }

func NewEserHandler(svc domainsvc.EserService) *EserHandler { return &EserHandler{svc} }

func (h *EserHandler) Listele(c *gin.Context) {
	eserler, err := h.svc.Listele()
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "eserler getirildi", gin.H{"adet": len(eserler), "eserler": eserler})
}

func (h *EserHandler) DetayGetir(c *gin.Context) {
	id, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	eser, err := h.svc.DetayGetir(id)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "eser getirildi", eser)
}

// ── Sanatçı Handler ───────────────────────────────────────────────────────────

type SanatciHandler struct{ svc domainsvc.SanatciService }

func NewSanatciHandler(svc domainsvc.SanatciService) *SanatciHandler { return &SanatciHandler{svc} }

func (h *SanatciHandler) Listele(c *gin.Context) {
	sanatcilar, err := h.svc.Listele()
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "sanatçılar getirildi", gin.H{"adet": len(sanatcilar), "sanatcilar": sanatcilar})
}

func (h *SanatciHandler) DetayGetir(c *gin.Context) {
	id, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	sanatci, err := h.svc.DetayGetir(id)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "sanatçı getirildi", sanatci)
}

// ── Etkinlik Handler ──────────────────────────────────────────────────────────

type EtkinlikHandler struct{ svc domainsvc.EtkinlikService }

func NewEtkinlikHandler(svc domainsvc.EtkinlikService) *EtkinlikHandler {
	return &EtkinlikHandler{svc}
}

func (h *EtkinlikHandler) Listele(c *gin.Context) {
	etkinlikler, err := h.svc.Listele()
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "etkinlikler getirildi", gin.H{"adet": len(etkinlikler), "etkinlikler": etkinlikler})
}

func (h *EtkinlikHandler) DetayGetir(c *gin.Context) {
	id, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	etkinlik, err := h.svc.DetayGetir(id)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "etkinlik getirildi", etkinlik)
}

// ── Rezervasyon Handler ───────────────────────────────────────────────────────

type RezervasyonHandler struct{ svc domainsvc.RezervasyonService }

func NewRezervasyonHandler(svc domainsvc.RezervasyonService) *RezervasyonHandler {
	return &RezervasyonHandler{svc}
}

func (h *RezervasyonHandler) Olustur(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	var req dto.RezervasyonOlusturIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	rez, err := h.svc.Olustur(id.(uint), &req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, "rezervasyon oluşturuldu", rez)
}

func (h *RezervasyonHandler) Listele(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	liste, err := h.svc.Listele(id.(uint))
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "rezervasyonlar getirildi", liste)
}

func (h *RezervasyonHandler) Guncelle(c *gin.Context) {
	kullaniciID, _ := c.Get("kullaniciID")
	rezervasyonID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	var req dto.RezervasyonGuncelleIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	rez, err := h.svc.Guncelle(kullaniciID.(uint), rezervasyonID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "rezervasyon güncellendi", rez)
}

func (h *RezervasyonHandler) Iptal(c *gin.Context) {
	kullaniciID, _ := c.Get("kullaniciID")
	rezervasyonID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	if err := h.svc.Iptal(kullaniciID.(uint), rezervasyonID); err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "rezervasyon iptal edildi", nil)
}

// ── Sipariş Handler ───────────────────────────────────────────────────────────

type SiparisHandler struct{ svc domainsvc.SiparisService }

func NewSiparisHandler(svc domainsvc.SiparisService) *SiparisHandler { return &SiparisHandler{svc} }

func (h *SiparisHandler) Olustur(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	var req dto.SiparisOlusturIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	siparis, err := h.svc.Olustur(id.(uint), &req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, "sipariş oluşturuldu", siparis)
}

func (h *SiparisHandler) Listele(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	liste, err := h.svc.Listele(id.(uint))
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "siparişler getirildi", liste)
}

func (h *SiparisHandler) DetayGetir(c *gin.Context) {
	kullaniciID, _ := c.Get("kullaniciID")
	siparisID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	siparis, err := h.svc.DetayGetir(kullaniciID.(uint), siparisID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "sipariş getirildi", siparis)
}

// ── Favori Handler ────────────────────────────────────────────────────────────

type FavoriHandler struct{ svc domainsvc.FavoriService }

func NewFavoriHandler(svc domainsvc.FavoriService) *FavoriHandler { return &FavoriHandler{svc} }

func (h *FavoriHandler) Ekle(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	var req dto.FavoriEkleIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	if err := h.svc.Ekle(id.(uint), &req); err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, "favoriye eklendi", nil)
}

func (h *FavoriHandler) Kaldir(c *gin.Context) {
	kullaniciID, _ := c.Get("kullaniciID")
	eserID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	if err := h.svc.Kaldir(kullaniciID.(uint), eserID); err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "favoriden çıkarıldı", nil)
}

func (h *FavoriHandler) Listele(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	liste, err := h.svc.Listele(id.(uint))
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "favoriler getirildi", liste)
}

// ── Yorum Handler ─────────────────────────────────────────────────────────────

type YorumHandler struct{ svc domainsvc.YorumService }

func NewYorumHandler(svc domainsvc.YorumService) *YorumHandler { return &YorumHandler{svc} }

func (h *YorumHandler) Ekle(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	var req dto.YorumEkleIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	yorum, err := h.svc.Ekle(id.(uint), &req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, "yorum eklendi", yorum)
}

func (h *YorumHandler) Listele(c *gin.Context) {
	referansID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	tip := c.Query("tip")
	if tip == "" {
		tip = "eser"
	}
	siralama := c.Query("siralama")
	if siralama == "" {
		siralama = "en_yeni"
	}
	yorumlar, err := h.svc.Listele(referansID, tip, siralama)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "yorumlar getirildi", yorumlar)
}

func (h *YorumHandler) FaydaliBul(c *gin.Context) {
	yorumID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	if err := h.svc.FaydaliBul(yorumID); err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "oy verildi", nil)
}

func (h *YorumHandler) PuanVer(c *gin.Context) {
	kullaniciID, _ := c.Get("kullaniciID")
	yorumID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	var req dto.YorumPuanIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	if err := h.svc.PuanVer(yorumID, kullaniciID.(uint), &req); err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "puan verildi", nil)
}

func (h *YorumHandler) YanitEkle(c *gin.Context) {
	yoneticiID, _ := c.Get("kullaniciID")
	yorumID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	var req dto.YanitEkleIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	if err := h.svc.YanitEkle(yoneticiID.(uint), yorumID, &req); err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, "yanıt eklendi", nil)
}

// ── Destek Handler ────────────────────────────────────────────────────────────

type DestekHandler struct{ svc domainsvc.DestekService }

func NewDestekHandler(svc domainsvc.DestekService) *DestekHandler { return &DestekHandler{svc} }

func (h *DestekHandler) Olustur(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	var req dto.DestekTalebiOlusturIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	talep, err := h.svc.Olustur(id.(uint), &req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, "destek talebi oluşturuldu", talep)
}

func (h *DestekHandler) Listele(c *gin.Context) {
	id, _ := c.Get("kullaniciID")
	liste, err := h.svc.Listele(id.(uint))
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "destek talepleri getirildi", liste)
}

// ── Yardımcı ──────────────────────────────────────────────────────────────────

func paramID(c *gin.Context) (uint, error) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return 0, apperror.BadRequest("geçersiz ID")
	}
	return uint(id), nil
}

// ── Destek Mesaj Handler ──────────────────────────────────────────────────────

type DestekMesajHandler struct{ svc domainsvc.DestekMesajService }

func NewDestekMesajHandler(svc domainsvc.DestekMesajService) *DestekMesajHandler {
	return &DestekMesajHandler{svc}
}

func (h *DestekMesajHandler) MesajGonder(c *gin.Context) {
	kullaniciID, _ := c.Get("kullaniciID")
	talepID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}

	var req dto.DestekMesajGonderIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	mesaj, err := h.svc.MesajGonder(kullaniciID.(uint), talepID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, "mesaj gönderildi", mesaj)
}

func (h *DestekMesajHandler) MesajlariGetir(c *gin.Context) {
	talepID, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}

	mesajlar, err := h.svc.MesajlariGetir(talepID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.OK(c, "mesajlar getirildi", mesajlar)
}

// ── Karşılaştırma Handler ─────────────────────────────────────────────────────

type KarsilastirmaHandler struct {
	svc domainsvc.KarsilastirmaService
}

func NewKarsilastirmaHandler(svc domainsvc.KarsilastirmaService) *KarsilastirmaHandler {
	return &KarsilastirmaHandler{svc}
}

func (h *KarsilastirmaHandler) EserleriKarsilastir(c *gin.Context) {
	kullaniciID, _ := c.Get("kullaniciID")
	var req dto.EserKarsilastirIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	sonuc, err := h.svc.EserleriKarsilastir(kullaniciID.(uint), &req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "eserler karşılaştırıldı", sonuc)
}

func (h *KarsilastirmaHandler) EtkinlikleriKarsilastir(c *gin.Context) {
	kullaniciID, _ := c.Get("kullaniciID")
	var req dto.EtkinlikKarsilastirIstegi
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}
	sonuc, err := h.svc.EtkinlikleriKarsilastir(kullaniciID.(uint), &req)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "etkinlikler karşılaştırıldı", sonuc)
}

// ── İstatistik Handler ────────────────────────────────────────────────────────

type IstatistikHandler struct{ svc domainsvc.IstatistikService }

func NewIstatistikHandler(svc domainsvc.IstatistikService) *IstatistikHandler {
	return &IstatistikHandler{svc}
}

func (h *IstatistikHandler) EserIstatistigi(c *gin.Context) {
	id, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	sonuc, err := h.svc.EserIstatistigi(id)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "eser istatistikleri getirildi", sonuc)
}

func (h *IstatistikHandler) EtkinlikIstatistigi(c *gin.Context) {
	id, err := paramID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	sonuc, err := h.svc.EtkinlikIstatistigi(id)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "etkinlik istatistikleri getirildi", sonuc)
}

func (h *IstatistikHandler) AdminRapor(c *gin.Context) {
	sonuc, err := h.svc.AdminRapor()
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "admin raporu getirildi", sonuc)
}

// ── Kampanya Handler ──────────────────────────────────────────────────────────

type KampanyaHandler struct{ svc domainsvc.KampanyaService }

func NewKampanyaHandler(svc domainsvc.KampanyaService) *KampanyaHandler {
	return &KampanyaHandler{svc}
}

func (h *KampanyaHandler) KampanyaliEserler(c *gin.Context) {
	eserler, err := h.svc.KampanyaliEserleriListele()
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "kampanyalı eserler getirildi", eserler)
}

func (h *KampanyaHandler) OzelFirsatlar(c *gin.Context) {
	kullaniciID, _ := c.Get("kullaniciID")
	firsatlar, err := h.svc.KullaniciyaOzelFirsatlar(kullaniciID.(uint))
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, "özel fırsatlar getirildi", firsatlar)
}
