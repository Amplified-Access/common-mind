package handlers

import (
	"backend/internal/domain"
	"backend/internal/usecase"
)

// HealthStats is a type alias so swaggo can resolve domain.HealthStats
// from within this package for annotation purposes.
type HealthStats = domain.HealthStats

// FirebaseToken is a type alias so swaggo can resolve usecase.FirebaseToken
// from within this package for annotation purposes.
type FirebaseToken = usecase.FirebaseToken

// UserAlias is a type alias so swaggo can resolve domain.User
// from within this package for annotation purposes.
type UserAlias = domain.User

// LanguageAlias is a type alias so swaggo can resolve domain.Language.
type LanguageAlias = domain.Language

// VolunteerAlias is a type alias so swaggo can resolve domain.Volunteer.
type VolunteerAlias = domain.Volunteer

// TaskAlias is a type alias so swaggo can resolve domain.Task.
type TaskAlias = domain.Task

// ContributionAlias is a type alias so swaggo can resolve domain.Contribution.
type ContributionAlias = domain.Contribution
