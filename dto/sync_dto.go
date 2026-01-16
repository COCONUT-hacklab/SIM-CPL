package dto

// Ini menyesuaikan dengan JSON output dari Smart RPS
type SmartRpsCourse struct {
	ID       string         `json:"id"`
	Code     string         `json:"code"`
	Title    string         `json:"title"`
	Credits  *int           `json:"credits"`
	Semester *int           `json:"semester"`
	CPMKs    []SmartRpsCPMK `json:"cpmks"` // Nested object
}

type SmartRpsCPMK struct {
	ID          string            `json:"id"`
	CPMKNumber  int               `json:"cpmk_number"`
	Description string            `json:"description"`
	Bobot       *float64          `json:"bobot"`
	SubCPMKs    []SmartRpsSubCPMK `json:"sub_cpmks"`
}

type SmartRpsSubCPMK struct {
	ID            string   `json:"id"`
	SubCPMKNumber int      `json:"sub_cpmk_number"`
	Description   string   `json:"description"`
	Bobot         *float64 `json:"bobot"`
}
