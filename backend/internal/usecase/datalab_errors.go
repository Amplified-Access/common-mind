package usecase

import "errors"

// Data Lab errors. Handlers map them to HTTP statuses in one place
// (handlers/datalab_errors.go).
var (
	ErrNotOnboarded    = errors.New("volunteer has not completed onboarding")
	ErrConsentOutdated = errors.New("volunteer must accept the current consent")
	ErrInvalidInput    = errors.New("invalid input")
	ErrNotMember       = errors.New("volunteer is not a member of this language")
	ErrNoTasks         = errors.New("no tasks left in this language")
	ErrNotFound        = errors.New("not found")
	// ErrAlreadyContributed: the volunteer already submitted this item in this language.
	ErrAlreadyContributed = errors.New("already contributed")
	ErrNotReviewer        = errors.New("volunteer is not a reviewer in this language")
	ErrOwnContribution    = errors.New("volunteers cannot review their own contributions")
	ErrAlreadyReviewed    = errors.New("contribution has already been reviewed")
	ErrNoReviews          = errors.New("nothing to review in this language")
	// ErrVoiceUnavailable: object storage isn't configured, so nothing can be recorded.
	ErrVoiceUnavailable = errors.New("voice recording is not set up")
	// ErrVoiceConsentRequired: the volunteer hasn't agreed to record their voice.
	ErrVoiceConsentRequired = errors.New("volunteer must accept the voice consent")
)

// invalid wraps ErrInvalidInput with a message safe to show the volunteer.
func invalid(msg string) error {
	return &inputError{msg: msg}
}

type inputError struct{ msg string }

func (e *inputError) Error() string { return e.msg }
func (e *inputError) Unwrap() error { return ErrInvalidInput }
