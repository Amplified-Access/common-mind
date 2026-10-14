package usecase

import "errors"

// Data Lab errors. Handlers map them to HTTP statuses in one place
// (handlers/datalab_errors.go).
var (
	ErrNotOnboarded    = errors.New("volunteer has not completed onboarding")
	ErrConsentOutdated = errors.New("volunteer must accept the current consent")
	ErrInvalidInput    = errors.New("invalid input")
	ErrNotMember       = errors.New("volunteer is not a member of this language")
	ErrLanguageClosed  = errors.New("language does not have enough reviewers yet")
	ErrNoTasks         = errors.New("no tasks left in this language")
	ErrNotFound        = errors.New("not found")
	// ErrAlreadyContributed: the volunteer already submitted this item in this language.
	ErrAlreadyContributed = errors.New("already contributed")
)

// invalid wraps ErrInvalidInput with a message safe to show the volunteer.
func invalid(msg string) error {
	return &inputError{msg: msg}
}

type inputError struct{ msg string }

func (e *inputError) Error() string { return e.msg }
func (e *inputError) Unwrap() error { return ErrInvalidInput }
