package usecase

import "errors"

// Data Lab errors. Handlers map them to HTTP statuses in one place
// (handlers/datalab_errors.go).
var (
	ErrNotOnboarded    = errors.New("volunteer has not completed onboarding")
	ErrConsentOutdated = errors.New("volunteer must accept the current consent")
	ErrInvalidInput    = errors.New("invalid input")
)

// invalid wraps ErrInvalidInput with a message safe to show the volunteer.
func invalid(msg string) error {
	return &inputError{msg: msg}
}

type inputError struct{ msg string }

func (e *inputError) Error() string { return e.msg }
func (e *inputError) Unwrap() error { return ErrInvalidInput }
