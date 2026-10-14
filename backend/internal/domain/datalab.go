package domain

// Language is a language the Data Lab works with. Target languages are the
// ones volunteers contribute in; source languages are what they translate from.
type Language struct {
	Code            string   `json:"code"`
	Name            string   `json:"name"`
	NativeName      string   `json:"native_name"`
	Role            string   `json:"role"`
	Script          string   `json:"script"`
	ExtraCharacters []string `json:"extra_characters"`
}

const (
	LanguageRoleTarget = "target"
	LanguageRoleSource = "source"
)
