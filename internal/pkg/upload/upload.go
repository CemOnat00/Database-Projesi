// Package upload — multipart dosyaları diske kaydeden yardımcı katman.
// Yüklenen görseller ./uploads/<altKlasor>/ altına yazılır; istemciye
// /uploads/... biçiminde public bir URL döner.
package upload

import (
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// UploadKoku — tüm yüklemelerin tutulduğu kök klasör (proje köküne göre).
const UploadKoku = "uploads"

// MaxDosyaBoyutu — tek bir görselin üst sınırı (5 MB).
const MaxDosyaBoyutu = 5 << 20

// gecerliUzantilar — kabul edilen görsel uzantıları.
var gecerliUzantilar = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true,
}

// GecerliMi — dosyanın boyut ve uzantı bakımından kabul edilebilir olup
// olmadığını bildirir.
func GecerliMi(dosya *multipart.FileHeader) (bool, string) {
	if dosya.Size > MaxDosyaBoyutu {
		return false, "dosya 5 MB sınırını aşıyor"
	}
	uzanti := strings.ToLower(filepath.Ext(dosya.Filename))
	if !gecerliUzantilar[uzanti] {
		return false, "yalnızca JPG, PNG, WebP veya GIF kabul edilir"
	}
	return true, ""
}

// Kaydet — bir multipart dosyasını ./uploads/<altKlasor>/ altına benzersiz
// bir adla yazar ve istemciye verilecek public URL'i döner.
func Kaydet(dosya *multipart.FileHeader, altKlasor string) (string, error) {
	src, err := dosya.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	klasor := filepath.Join(UploadKoku, altKlasor)
	if err := os.MkdirAll(klasor, 0o755); err != nil {
		return "", err
	}

	uzanti := strings.ToLower(filepath.Ext(dosya.Filename))
	if uzanti == "" {
		uzanti = ".jpg"
	}
	ad := fmt.Sprintf("%d-%d%s", time.Now().UnixNano(), rand.Intn(1_000_000), uzanti)
	tamYol := filepath.Join(klasor, ad)

	dst, err := os.Create(tamYol)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	// Public URL — örn. /uploads/eserler/12/169...-432.jpg
	return "/" + filepath.ToSlash(tamYol), nil
}

// Sil — bir public URL'e karşılık gelen dosyayı diskten kaldırır.
// Güvenlik: yalnızca uploads/ kökü altındaki dosyalara dokunur.
func Sil(publicURL string) error {
	yol := strings.TrimPrefix(publicURL, "/")
	if yol == "" || !strings.HasPrefix(yol, UploadKoku) {
		return nil
	}
	if err := os.Remove(yol); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
